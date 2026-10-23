#!/usr/bin/env bash
# Runs the database tests against a throwaway local Postgres: auth stub + every migration in order.
set -euo pipefail
DIR=$(mktemp -d)
PORT=${DB_TEST_PORT:-54329}
initdb -D "$DIR" -U postgres --auth=trust >/dev/null
pg_ctl -D "$DIR" -o "-p $PORT -k $DIR" -l "$DIR/log" -w start >/dev/null
trap 'pg_ctl -D "$DIR" -m immediate stop >/dev/null; rm -rf "$DIR"' EXIT
URL="postgresql://postgres@localhost:$PORT/postgres"
psql "$URL" -q -v ON_ERROR_STOP=1 -f supabase/test/auth-stub.sql
for f in supabase/migrations/*.sql; do psql "$URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
DB_TEST_URL="$URL" npx vitest run --config vitest.db.config.mts "$@"
