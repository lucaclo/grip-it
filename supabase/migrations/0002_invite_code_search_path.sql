-- Grip It 0002: on Supabase, pgcrypto's gen_random_bytes lives in the "extensions" schema, which the
-- security-definer functions (search_path = public) can't see. Look in both places.
create or replace function gen_invite_code() returns text
language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(gen_random_bytes(1), 0) % 31), 1), '')
  from generate_series(1, 6);
$$;
