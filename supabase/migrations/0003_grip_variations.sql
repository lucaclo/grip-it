-- Grip It 0003: grip variations. Each logged exercise can say how it was held (close-grip bench,
-- hammer curl, straps). Additive only: existing rows keep a null grip, which means the usual grip.
alter table workout_exercises add column if not exists grip text
  check (grip is null or grip ~ '^[a-z_]{1,24}$');

-- Saves (inserts or replaces) one workout from the phone, idempotent on its client_key.
-- payload: { key, title, started_at, ended_at, is_private, lifted_kg,
--            exercises: [{ key, name, primary, secondary[], equipment, custom, grip, sets: [{kg, reps, rir, type}] }] }
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

    -- Unknown or malformed grips are dropped rather than rejected: the phone's grip list grows over time.
    insert into workout_exercises (workout_id, exercise_id, position, grip)
    values (w, ex_id, i, case when ex->>'grip' ~ '^[a-z_]{1,24}$' then ex->>'grip' end)
    returning id into we_id;
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

revoke all on function save_workout(jsonb) from public, anon;
grant execute on function save_workout(jsonb) to authenticated;
