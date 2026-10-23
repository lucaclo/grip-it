import { defineConfig } from "vitest/config";

// Database tests: run with `npm run test:db` (starts a throwaway Postgres, see scripts/test-db.sh).
export default defineConfig({
  resolve: { alias: { "@": import.meta.dirname } },
  test: { include: ["supabase/test/**/*.test.ts"], fileParallelism: false },
});
