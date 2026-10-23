-- Stand-in for the parts of Supabase the migrations rely on, so they run on plain Postgres in tests:
-- the auth schema, auth.users, auth.uid() (from the request's JWT claims) and the anon/authenticated roles.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, is_anonymous boolean not null default true);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
