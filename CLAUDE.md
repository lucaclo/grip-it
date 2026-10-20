# Grip It

A dark iPhone PWA for fewer than 30 friends: log lifts, get research-backed next-session targets, and compete
on leaderboards. Not sold, £0/month, kg only.

## Stack
Next.js (App Router) + TypeScript, Supabase (Postgres, email-OTP auth, RLS), Tailwind v4, Radix, Lucide,
Zustand + idb-keyval, Serwist (PWA), Vercel. Tests: Vitest, Playwright, and a Postgres + auth-stub DB harness.

## Commands
The app is not scaffolded yet (issue #1). Once it is: `npm run dev | test | test:db | e2e | lint | typecheck`.

## Specs (read the relevant part before building)
- `brainstorm.md`: requirements and decisions. Don't re-litigate them.
- `replica/recon.md`: screens S01–S24, flows F01–F09. `replica/features.csv`: the feature matrix.
- `replica/architecture.md`: API, science-engine rules, the parts that bite.
- `replica/schema.sql`: the target schema. Each migration ports one section of it.
- `replica/design/`: tokens and component specs.

## Hard rules
- RLS on every table. Security-definer RPCs reject a null `auth.uid()` and revoke from `anon`.
- Personal data must survive every update:
  - migrations are forward-only and non-destructive
  - the IndexedDB draft is versioned
  - the service worker never activates mid-workout
- Components use design tokens (`bg-surface`, `text-muted`), never raw hex.
- Every coaching or target output carries citation keys from `lib/science/citations.ts`.
- Never use another app's name, assets, copy or colours.

## Workflow
One GitHub issue at a time with `/process-issue <n>`: branch, commit + push per step, full tests,
an `/apple-design` audit for UI, then a PR. Branch protection requires the `ci` check.
