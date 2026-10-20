-- Grip It: first migration (Supabase Postgres).
-- Access rules: Postgres row level security on every table. The browser talks to
-- Supabase with the user's JWT, so RLS is the only thing standing between users.
-- Times are timestamptz (UTC). Calendar days are `date` in the user's own timezone.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- people
-- ---------------------------------------------------------------------------

-- Public face of a user: anyone in a shared group may read it.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  timezone text not null default 'Europe/London',
  goal text not null default 'hypertrophy'
    check (goal in ('hypertrophy','strength','fat_loss')),
  experience text not null default 'beginner'
    check (experience in ('beginner','intermediate','advanced')),
  rir_enabled boolean not null default false,
  sessions_per_week smallint not null default 3 check (sessions_per_week between 1 and 7),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private body stats: owner only, ever. Leaderboards that need body weight
-- (DOTS) read it through a security-definer function that returns scores only.
create table body_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  height_cm numeric(5,1) not null check (height_cm between 100 and 250),
  sex text not null check (sex in ('male','female')),  -- needed by BMR/DOTS formulas
  birth_year smallint not null check (birth_year between 1900 and 2015),
  body_fat_pct numeric(4,1) check (body_fat_pct between 3 and 60),
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary','light','moderate','active','very_active')),
  target_weight_kg numeric(5,1) check (target_weight_kg between 30 and 300),
  target_date date,
  share_weight boolean not null default false,
  share_nutrition boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Snapshot of computed targets (history kept so we can show changes).
create table targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kcal integer not null check (kcal between 1000 and 6000),
  protein_g integer not null check (protein_g between 30 and 400),
  method text not null check (method in ('katch_mcardle','mifflin_st_jeor')),
  weekly_rate_kg numeric(4,2) not null,          -- planned change per week, signed
  projected_date date,                            -- when target weight is reached
  citation_keys text[] not null default '{}',     -- keys into lib/science/citations.ts
  created_at timestamptz not null default now()
);
create index on targets (user_id, created_at desc);

create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  kg numeric(5,2) not null check (kg between 30 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)                           -- one entry per day, latest wins (upsert)
);

create table nutrition_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  kcal integer not null check (kcal between 0 and 15000),
  protein_g integer not null check (protein_g between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

-- ---------------------------------------------------------------------------
-- exercises and workouts
-- ---------------------------------------------------------------------------

create table exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique,                               -- set for built-ins, null for custom
  name text not null check (char_length(name) between 2 and 60),
  primary_muscle text not null check (primary_muscle in (
    'chest','front_delts','side_delts','rear_delts','biceps','triceps','forearms',
    'upper_back','lats','lower_back','abs','glutes','quads','hamstrings','calves','adductors')),
  secondary_muscles text[] not null default '{}',
  equipment text not null default 'other'
    check (equipment in ('barbell','dumbbell','machine','cable','bodyweight','smith','kettlebell','band','other')),
  is_bodyweight boolean not null default false,
  created_by uuid references profiles(id) on delete cascade,  -- null = built-in
  created_at timestamptz not null default now(),
  constraint builtin_or_custom check ((slug is null) <> (created_by is null))
);
create unique index on exercises (created_by, lower(name)) where created_by is not null;
create index on exercises using gin (to_tsvector('simple', name));

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Workout' check (char_length(title) <= 60),
  note text check (char_length(note) <= 1000),
  started_at timestamptz not null,
  ended_at timestamptz,
  is_private boolean not null default false,
  client_id uuid not null,                        -- generated on device: makes the finish call idempotent
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id),
  constraint ends_after_start check (ended_at is null or ended_at >= started_at)
);
create index on workouts (user_id, started_at desc);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position smallint not null,
  note text check (char_length(note) <= 500),
  unique (workout_id, position)
);
create index on workout_exercises (exercise_id);

create table sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  position smallint not null,
  kg numeric(6,2) not null check (kg between 0 and 1000),
  reps smallint not null check (reps between 0 and 100),
  rir smallint check (rir between 0 and 10),
  set_type text not null default 'normal' check (set_type in ('normal','warmup','drop','failure')),
  completed_at timestamptz not null,
  unique (workout_exercise_id, position)
);

create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  set_id uuid not null references sets(id) on delete cascade,
  kind text not null check (kind in ('e1rm','weight','reps')),
  value numeric(7,2) not null,
  previous_value numeric(7,2),
  flagged boolean not null default false,         -- improbable jump (honour system + flag)
  achieved_at timestamptz not null,
  unique (set_id, kind)
);
create index on personal_records (user_id, exercise_id, kind, achieved_at desc);

-- ---------------------------------------------------------------------------
-- plans (optional: user's own split)
-- ---------------------------------------------------------------------------

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index on plans (user_id) where is_active;  -- one active plan

create table plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  position smallint not null,
  label text not null check (char_length(label) between 1 and 30),
  weekday smallint check (weekday between 1 and 7),
  unique (plan_id, position)
);

create table plan_day_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references plan_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position smallint not null,
  target_sets smallint not null default 3 check (target_sets between 1 and 10),
  unique (plan_day_id, position)
);
create index on plan_day_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- groups and competition
-- ---------------------------------------------------------------------------

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  timezone text not null default 'Europe/London', -- defines "this week" for the group
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on group_members (user_id);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  metric text not null check (metric in ('hard_sets','sessions','volume_kg','exercise_volume_kg')),
  exercise_id uuid references exercises(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ends_after_start check (ends_at > starts_at),
  constraint exercise_metric check ((metric = 'exercise_volume_kg') = (exercise_id is not null))
);
create index on challenges (group_id, ends_at desc);

create table challenge_participants (
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index on challenge_participants (user_id);
-- Scores are computed from sets inside the challenge window (see challenge_scores()).

create table feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('workout','pr','badge')),
  workout_id uuid references workouts(id) on delete cascade,
  pr_id uuid references personal_records(id) on delete cascade,
  badge_code text,
  created_at timestamptz not null default now()
);
create index on feed_items (user_id, created_at desc);
create index on feed_items (created_at desc);

create table reactions (
  feed_item_id uuid not null references feed_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null check (emoji in ('muscle','fire','laugh','clap','skull')),
  created_at timestamptz not null default now(),
  primary key (feed_item_id, user_id, emoji)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references feed_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);
create index on comments (feed_item_id, created_at);

-- Badge definitions live in code (lib/badges.ts); only awards are stored.
create table user_badges (
  user_id uuid not null references profiles(id) on delete cascade,
  badge_code text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['profiles','body_profiles','weight_entries','nutrition_days','workouts','plans','groups']
  loop
    execute format('create trigger %I_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- access helpers (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------

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

create or replace function owns_workout(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workouts where id = w and user_id = auth.uid());
$$;

create or replace function can_see_workout(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workouts
    where id = w and (user_id = auth.uid() or (not is_private and shares_group_with(user_id)))
  );
$$;

-- Has the owner opted in to sharing weight / nutrition? Reads body_profiles
-- without exposing it (body_profiles RLS is owner-only).
create or replace function shares_body_data(owner uuid, kind text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select case kind when 'weight' then share_weight else share_nutrition end
                   from body_profiles where user_id = owner), false);
$$;

-- Join a group by invite code. Returns the group id, or raises if the code is unknown.
create or replace function join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  select id into g from groups where invite_code = code;
  if g is null then raise exception 'invalid_invite' using errcode = 'P0002'; end if;
  insert into group_members (group_id, user_id) values (g, auth.uid())
    on conflict do nothing;
  return g;
end $$;

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table body_profiles enable row level security;
alter table targets enable row level security;
alter table weight_entries enable row level security;
alter table nutrition_days enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table sets enable row level security;
alter table personal_records enable row level security;
alter table plans enable row level security;
alter table plan_days enable row level security;
alter table plan_day_exercises enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table feed_items enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table user_badges enable row level security;

-- profiles: read self or group-mates; write self
create policy profiles_read on profiles for select using (id = auth.uid() or shares_group_with(id));
create policy profiles_insert on profiles for insert with check (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid());

-- private-by-owner tables
create policy body_own on body_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy targets_own on targets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy plans_own on plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- weight / nutrition: owner always; group-mates only if the owner opted in
create policy weight_own on weight_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy weight_shared on weight_entries for select using (
  shares_group_with(user_id) and shares_body_data(user_id, 'weight')
);
create policy nutrition_own on nutrition_days for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy nutrition_shared on nutrition_days for select using (
  shares_group_with(user_id) and shares_body_data(user_id, 'nutrition')
);

-- exercises: everyone reads built-ins; custom ones readable by creator and group-mates
create policy exercises_read on exercises for select using (
  created_by is null or created_by = auth.uid() or shares_group_with(created_by)
);
create policy exercises_insert on exercises for insert with check (created_by = auth.uid() and slug is null);
create policy exercises_update on exercises for update using (created_by = auth.uid());
create policy exercises_delete on exercises for delete using (created_by = auth.uid());

-- workouts and children
create policy workouts_read on workouts for select using (
  user_id = auth.uid() or (not is_private and shares_group_with(user_id))
);
create policy workouts_write on workouts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy we_read on workout_exercises for select using (can_see_workout(workout_id));
create policy we_write on workout_exercises for all using (owns_workout(workout_id)) with check (owns_workout(workout_id));
create policy sets_read on sets for select using (
  can_see_workout((select workout_id from workout_exercises where id = workout_exercise_id))
);
create policy sets_write on sets for all
  using (owns_workout((select workout_id from workout_exercises where id = workout_exercise_id)))
  with check (owns_workout((select workout_id from workout_exercises where id = workout_exercise_id)));

-- PRs are written by the server (finish_workout), read by owner + group
create policy prs_read on personal_records for select using (user_id = auth.uid() or shares_group_with(user_id));

-- plan days / exercises follow their plan
create policy plan_days_own on plan_days for all
  using (exists (select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy plan_day_ex_own on plan_day_exercises for all
  using (exists (select 1 from plan_days d join plans p on p.id = d.plan_id where d.id = plan_day_id and p.user_id = auth.uid()))
  with check (exists (select 1 from plan_days d join plans p on p.id = d.plan_id where d.id = plan_day_id and p.user_id = auth.uid()));

-- groups: members read; anyone signed in may create; joining goes through join_group()
create policy groups_read on groups for select using (is_group_member(id));
create policy groups_insert on groups for insert with check (created_by = auth.uid());
create policy groups_update on groups for update using (created_by = auth.uid());
create policy members_read on group_members for select using (is_group_member(group_id));
create policy members_leave on group_members for delete using (user_id = auth.uid());

-- challenges: group members read, create and join
create policy challenges_read on challenges for select using (is_group_member(group_id));
create policy challenges_insert on challenges for insert with check (is_group_member(group_id) and created_by = auth.uid());
create policy cp_read on challenge_participants for select using (
  is_group_member((select group_id from challenges where id = challenge_id))
);
create policy cp_join on challenge_participants for insert with check (
  user_id = auth.uid() and is_group_member((select group_id from challenges where id = challenge_id))
);
create policy cp_leave on challenge_participants for delete using (user_id = auth.uid());

-- feed: owner + group-mates read; items written by server
create policy feed_read on feed_items for select using (user_id = auth.uid() or shares_group_with(user_id));
create policy reactions_read on reactions for select using (
  exists (select 1 from feed_items f where f.id = feed_item_id)  -- inherits feed_read via RLS
);
create policy reactions_write on reactions for insert with check (
  user_id = auth.uid() and exists (select 1 from feed_items f where f.id = feed_item_id)
);
create policy reactions_delete on reactions for delete using (user_id = auth.uid());
create policy comments_read on comments for select using (
  exists (select 1 from feed_items f where f.id = feed_item_id)
);
create policy comments_write on comments for insert with check (
  user_id = auth.uid() and exists (select 1 from feed_items f where f.id = feed_item_id)
);
create policy comments_delete on comments for delete using (user_id = auth.uid());

create policy badges_read on user_badges for select using (user_id = auth.uid() or shares_group_with(user_id));

-- ---------------------------------------------------------------------------
-- server-side computations (security definer, return scores only)
-- ---------------------------------------------------------------------------
-- finish_workout(payload jsonb)       insert workout + exercises + sets in one transaction,
--                                     idempotent on (user_id, client_id); detect PRs; flag
--                                     improbable jumps; write feed_items; award badges.
-- leaderboard(group uuid, metric text, period text)
--                                     returns (user_id, display_name, score, rank).
--                                     metrics: pct_improvement | dots | streak | hard_sets.
--                                     DOTS reads body weight internally and never returns it.
-- challenge_scores(challenge uuid)    returns (user_id, score) from sets in the window.
-- These are written in the migration that implements each feature, with their own tests.
