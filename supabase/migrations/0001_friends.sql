-- Grip It 0001: friends see each other's workouts.
-- Ports the people, exercises/workouts and groups sections of replica/schema.sql, trimmed to what
-- sync needs now. Forward-only: later migrations add, never drop.
--
-- Differences from replica/schema.sql, on purpose:
-- - Accounts are Supabase anonymous sign-ins made silently on each phone (no email to type).
-- - profiles.dots_score: the owner's powerlifting score, computed on their phone, so group-mates
--   can rank it without ever receiving body weight. Body stats stay on the phone.
-- - workouts.client_key / lifted_kg: the phone's own workout id (for idempotent saves and restores)
--   and its volume including body weight on body-weight moves (body weight itself never leaves).
-- - exercises.client_key: the phone's exercise id (built-in slug or "custom-<uuid>").
-- - groups.invite_code: 6 easy-to-read characters, so it can be typed if a link can't be used.
-- - One group per person for now: joining a group leaves the previous one.
--
-- Security: RLS on every table. Every security-definer function rejects a null auth.uid() and is
-- revoked from anon/public.

create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- people

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  goal text not null default 'hypertrophy',
  experience text not null default 'beginner',
  sex text check (sex in ('male','female')),
  sessions_per_week smallint not null default 3 check (sessions_per_week between 1 and 7),
  dots_score numeric(6,1) check (dots_score between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- ---------------------------------------------------------------- exercises and workouts

create table exercises (
  id uuid primary key default gen_random_uuid(),
  client_key text not null,                         -- slug for built-ins, "custom-<uuid>" for custom
  name text not null check (char_length(name) between 1 and 60),
  primary_muscle text not null check (primary_muscle in (
    'chest','front_delts','side_delts','rear_delts','biceps','triceps','forearms',
    'upper_back','lats','lower_back','abs','glutes','quads','hamstrings','calves','adductors')),
  secondary_muscles text[] not null default '{}',
  equipment text not null default 'other'
    check (equipment in ('barbell','dumbbell','machine','cable','bodyweight','smith','kettlebell','band','other')),
  created_by uuid references profiles(id) on delete cascade,  -- null = built-in
  created_at timestamptz not null default now()
);
create unique index exercises_builtin_key on exercises (client_key) where created_by is null;
create unique index exercises_custom_key on exercises (created_by, client_key) where created_by is not null;

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  client_key text not null check (char_length(client_key) between 1 and 80),
  title text not null default 'Workout' check (char_length(title) <= 60),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  is_private boolean not null default false,
  lifted_kg integer not null default 0 check (lifted_kg >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_key),
  constraint ends_after_start check (ended_at >= started_at)
);
create index on workouts (user_id, started_at desc);
create trigger workouts_updated before update on workouts for each row execute function set_updated_at();

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position smallint not null,
  unique (workout_id, position)
);
create index on workout_exercises (exercise_id);

create table sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  position smallint not null,
  kg numeric(6,2) not null check (kg between 0 and 1000),
  reps smallint not null check (reps between 0 and 1000),
  rir smallint check (rir between 0 and 10),
  set_type text not null default 'normal' check (set_type in ('normal','warmup','drop','failure')),
  unique (workout_exercise_id, position)
);

-- ---------------------------------------------------------------- groups

-- 6 characters without look-alikes (no 0/O, 1/I/L), e.g. "K7QMXA": easy to read out or type.
create or replace function gen_invite_code() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(gen_random_bytes(1), 0) % 31), 1), '')
  from generate_series(1, 6);
$$;

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique default gen_invite_code(),
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger groups_updated before update on groups for each row execute function set_updated_at();

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on group_members (user_id);

-- ---------------------------------------------------------------- access helpers

create or replace function shares_group_with(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members a
    join group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function is_group_member(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

create or replace function can_see_workout(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workouts
    where id = w and (user_id = auth.uid() or (not is_private and shares_group_with(user_id)))
  );
$$;

-- ---------------------------------------------------------------- row level security

alter table profiles enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table sets enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;

create policy profiles_read on profiles for select using (id = auth.uid() or shares_group_with(id));
create policy profiles_insert on profiles for insert with check (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy exercises_read on exercises for select using (
  created_by is null or created_by = auth.uid() or shares_group_with(created_by)
);

-- Workouts are written only through save_workout()/delete_workout(); reads follow sharing.
create policy workouts_read on workouts for select using (
  user_id = auth.uid() or (not is_private and shares_group_with(user_id))
);
create policy we_read on workout_exercises for select using (can_see_workout(workout_id));
create policy sets_read on sets for select using (
  can_see_workout((select workout_id from workout_exercises where id = workout_exercise_id))
);

create policy groups_read on groups for select using (is_group_member(id));
create policy members_read on group_members for select using (is_group_member(group_id));
create policy members_leave on group_members for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------- functions

-- Signed-in only. Raises for a null auth.uid() (anon key without a session).
create or replace function require_user() returns uuid
language plpgsql stable as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  return u;
end $$;

-- The caller's group (or nothing): id, name, invite code and their role.
create or replace function my_group() returns table (id uuid, name text, invite_code text, role text)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.invite_code, m.role
  from group_members m join groups g on g.id = m.group_id
  where m.user_id = require_user()
  order by m.joined_at desc
  limit 1;
$$;

-- Creates a group owned by the caller (leaving any other group) and returns it.
create or replace function create_group(group_name text)
returns table (id uuid, name text, invite_code text, role text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare u uuid := require_user(); g groups;
begin
  delete from group_members where user_id = u;
  insert into groups (name, created_by) values (left(coalesce(nullif(trim(group_name), ''), 'Grip It crew'), 40), u)
    returning * into g;
  insert into group_members (group_id, user_id, role) values (g.id, u, 'owner');
  return query select g.id, g.name, g.invite_code, 'owner'::text;
end $$;

-- Joins a group by invite code (case and spaces ignored), leaving any other group.
create or replace function join_group(code text)
returns table (id uuid, name text, invite_code text, role text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare u uuid := require_user(); g groups;
begin
  select * into g from groups where invite_code = upper(regexp_replace(code, '\s', '', 'g'));
  if g.id is null then raise exception 'invalid_invite' using errcode = 'P0002'; end if;
  delete from group_members where user_id = u and group_id <> g.id;
  insert into group_members (group_id, user_id) values (g.id, u) on conflict do nothing;
  return query select g.id, g.name, g.invite_code,
    (select m.role from group_members m where m.group_id = g.id and m.user_id = u);
end $$;

-- Saves (inserts or replaces) one workout from the phone, idempotent on its client_key.
-- payload: { key, title, started_at, ended_at, is_private, lifted_kg,
--            exercises: [{ key, name, primary, secondary[], equipment, custom, sets: [{kg, reps, rir, type}] }] }
create or replace function save_workout(payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  u uuid := require_user();
  w uuid;
  ex jsonb;
  st jsonb;
  ex_id uuid;
  we_id uuid;
  i int := 0;
  j int;
begin
  if jsonb_array_length(coalesce(payload->'exercises', '[]')) > 60 then
    raise exception 'too_many_exercises' using errcode = '22023';
  end if;
  insert into workouts (user_id, client_key, title, started_at, ended_at, is_private, lifted_kg)
  values (u, payload->>'key', left(coalesce(nullif(payload->>'title', ''), 'Workout'), 60),
          (payload->>'started_at')::timestamptz, (payload->>'ended_at')::timestamptz,
          coalesce((payload->>'is_private')::boolean, false), greatest(0, coalesce((payload->>'lifted_kg')::numeric, 0))::int)
  on conflict (user_id, client_key) do update set
    title = excluded.title, started_at = excluded.started_at, ended_at = excluded.ended_at,
    is_private = excluded.is_private, lifted_kg = excluded.lifted_kg
  returning id into w;

  delete from workout_exercises where workout_id = w;

  for ex in select * from jsonb_array_elements(coalesce(payload->'exercises', '[]')) loop
    -- Built-ins are shared rows keyed by slug; custom exercises belong to the caller.
    if coalesce((ex->>'custom')::boolean, false) then
      insert into exercises (client_key, name, primary_muscle, secondary_muscles, equipment, created_by)
      values (ex->>'key', left(ex->>'name', 60), ex->>'primary',
              array(select jsonb_array_elements_text(coalesce(ex->'secondary', '[]'))), coalesce(ex->>'equipment', 'other'), u)
      on conflict (created_by, client_key) where created_by is not null do update set
        name = excluded.name, primary_muscle = excluded.primary_muscle,
        secondary_muscles = excluded.secondary_muscles, equipment = excluded.equipment
      returning id into ex_id;
    else
      insert into exercises (client_key, name, primary_muscle, secondary_muscles, equipment)
      values (ex->>'key', left(ex->>'name', 60), ex->>'primary',
              array(select jsonb_array_elements_text(coalesce(ex->'secondary', '[]'))), coalesce(ex->>'equipment', 'other'))
      on conflict (client_key) where created_by is null do nothing;
      select id into ex_id from exercises where client_key = ex->>'key' and created_by is null;
    end if;

    insert into workout_exercises (workout_id, exercise_id, position) values (w, ex_id, i) returning id into we_id;
    j := 0;
    for st in select * from jsonb_array_elements(coalesce(ex->'sets', '[]')) loop
      insert into sets (workout_exercise_id, position, kg, reps, rir, set_type)
      values (we_id, j, (st->>'kg')::numeric, (st->>'reps')::int,
              case when st->>'rir' is null then null else least(10, greatest(0, (st->>'rir')::int)) end,
              coalesce(st->>'type', 'normal'));
      j := j + 1;
    end loop;
    i := i + 1;
  end loop;
  return w;
end $$;

create or replace function delete_workout(key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from workouts where user_id = require_user() and client_key = key;
end $$;

-- ---------------------------------------------------------------- grants

revoke all on function shares_group_with(uuid), is_group_member(uuid), can_see_workout(uuid),
  require_user(), my_group(), create_group(text), join_group(text), save_workout(jsonb), delete_workout(text)
  from public, anon;
grant execute on function shares_group_with(uuid), is_group_member(uuid), can_see_workout(uuid),
  require_user(), my_group(), create_group(text), join_group(text), save_workout(jsonb), delete_workout(text)
  to authenticated;

revoke all on profiles, exercises, workouts, workout_exercises, sets, groups, group_members from anon;
grant select, insert, update on profiles to authenticated;
grant select on exercises, workouts, workout_exercises, sets, groups to authenticated;
grant select, delete on group_members to authenticated;
