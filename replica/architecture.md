# Architecture: Grip It (core features rebuilt from Hevy, Fitbod, RP Hypertrophy, MacroFactor and Strava)

Inputs: `replica/recon.md` (screens S01–S24, flows F01–F09), `replica/features.csv`.
Constraints: PWA on iPhone, fewer than 30 users, £0/month, public GitHub repo, kg only.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 15 (App Router) + TypeScript, React 19 | one codebase for UI and server code, first-class on Vercel |
| PWA | Serwist (`@serwist/next`) service worker + web app manifest | caches the app shell and exercise library so logging works with bad gym signal |
| styling | Tailwind CSS v4, tokens from `/replica-design` | fast, works with the design tokens, no runtime cost |
| client state | Zustand + `idb-keyval` (IndexedDB) for the active-workout draft | the draft must survive iOS killing the tab (recon hard part #3) |
| database | Postgres on Supabase (free tier) | one managed database; RLS lets the browser query safely |
| data access | `@supabase/supabase-js` + `@supabase/ssr`, generated TS types | RLS is the auth layer, so no ORM is needed. Raw SQL migrations in `supabase/migrations/` |
| auth | Supabase Auth, **email OTP (6-digit code), with the magic link as fallback** | an iOS home-screen PWA can't receive a magic-link session (see "parts that bite") |
| email | Custom SMTP on Supabase: Gmail with an app password (free, ~500/day) | Supabase's built-in SMTP won't email non-team addresses; Resend needs a domain you own |
| payments | none | not sold |
| jobs | Vercel Cron (Hobby: 1 run/day) calling `/api/cron/daily` | closes challenges, awards badges, keeps Supabase from pausing |
| files | none in MVP (avatars via initials); Supabase Storage later | progress photos are a "could" |
| charts | Recharts | small, React-native API, good enough for e1RM and weight trend |
| tests | Vitest (unit + integration), Playwright (e2e, iPhone 15 viewport) | TypeScript stack. **Replaces "rspec" in Robbie's workflow** |
| db tests | Vitest against a throwaway Postgres with an `auth` stub (Homebrew locally, `postgres` service in CI) | Supabase CLI needs Docker, which isn't installed; this proves RLS without it |
| lint/format | ESLint (next config) + Prettier, `tsc --noEmit` in CI | |
| browser MCP | Playwright MCP (`@playwright/mcp`) | the Puppeteer MCP server is archived |
| hosting | Vercel Hobby, preview deploy per PR | every PR gets a URL you can open on your phone |
| environments | 2 Supabase projects: `grip-it-prod`, `grip-it-staging` (free tier allows 2) | previews and e2e never touch real data |

One database, one app, no microservices.

## Schema

Tables: 21. Access rules: **Postgres RLS on every table** (41 policies), plus security-definer
helper functions so that policies don't recurse and private numbers never leave the server.

Full SQL: `replica/schema.sql` (becomes `supabase/migrations/0001_init.sql`).
**Verified 2026-10-20**: it applies cleanly to Postgres with an `auth` stub. A three-user RLS
smoke test passed:
- a group-mate sees your profile but not your `body_profiles` row
- a group-mate sees your weight only after `share_weight = true`
- a non-member sees nothing

Key decisions:
- `profiles` (public within a group) is split from `body_profiles` (owner only) so body data
  can't leak through a profile query.
- Suggestions, leaderboard scores, streaks and challenge scores are **computed, not stored**.
  At fewer than 30 users, queries are instant and there's no stale data to sync.
- Citations and badge definitions live in code (`lib/science/citations.ts`, `lib/badges.ts`):
  they're versioned, reviewable in PRs and unit-tested.
- `workouts.client_id` (generated on the device) makes "finish workout" idempotent.
- The exercise library is seed data with stable `slug`s, so adding exercise #81–#300 is a new
  seed file, not a schema change.
- `on delete cascade` from `auth.users` means deleting an account removes everything (GDPR).
  `exercises` used in workouts are `restrict`, so a custom exercise can't be deleted out from
  under history; it gets archived instead (later).

## The science engine (`lib/science/`)

Pure TypeScript functions with no I/O, unit-tested against worked examples. Every output
carries `citationKeys`. Each citation must be checked against its DOI in the issue that adds it.

| module | rule (starting point) | evidence |
| --- | --- | --- |
| `energy.ts` | BMR: Katch-McArdle if body-fat % is given, else Mifflin-St Jeor; × activity factor = TDEE | Mifflin et al. 1990; Katch & McArdle |
| `targets.ts` | hypertrophy: surplus to gain ~0.25–0.5% BW/week (beginners toward the top). Fat loss: 0.5–1.0% BW/week. Strength: maintenance to small surplus | Iraki et al. 2019; Helms et al. 2014 |
| `protein.ts` | 1.6 g/kg/day (ceiling 2.2); in a deficit, 2.3–3.1 g/kg of lean mass when body fat is known | Morton et al. 2018; Helms et al. 2014 |
| `timeline.ts` | realistic date for the target weight from the rate above; monthly lean-gain ceilings by experience | practitioner guideline (marked "lower-quality evidence" in the UI) |
| `volume.ts` | weekly hard sets per muscle: ≥10 target, flag below 4 and above ~20; secondary muscles count 0.5 | Schoenfeld et al. 2017; Pelland et al. 2024 |
| `progression.ts` | double progression in a rep range per goal (hypertrophy 6–12, strength 3–6). All sets at the top of the range → add load (2.5 kg upper, 5 kg lower). Else add reps. Stalled for 3 sessions → hold, or deload 10%. Uses RIR when logged (aim for 0–3) | Schoenfeld et al. 2017 (loading), Refalo et al. 2023 (proximity to failure) |
| `e1rm.ts` | Epley; PRs only count e1RM for sets of ≤12 reps | Epley 1985 |
| `dots.ts` | DOTS coefficient from body weight and sex | published DOTS formula (verify coefficients) |
| `flags.ts` | flag a PR if e1RM jumps >15% over the previous best inside 28 days | design heuristic, not research |

Experience level changes **difficulty and timeline**, not just numbers: a beginner gets a
faster but capped rate, and an advanced lifter gets a slower rate and a longer, honest date.

## API

Most reads are direct `supabase-js` queries under RLS from Server Components. Writes that need
logic are Postgres functions (RPC) or Next.js Server Actions.

### Pages (App Router)

| path | screen | auth |
| --- | --- | --- |
| `/` | S01 landing | public |
| `/invite/[code]` | S01 invited variant, then S03 install guide | public |
| `/login` | S01/S02 email → code entry | public |
| `/onboarding/body`, `/goal`, `/plan` | S04, S05, S06 | signed in, not onboarded |
| `/home` | S07 | signed in |
| `/workout` | S08 active workout (+ S09 search sheet, S10 custom exercise) | signed in |
| `/workout/[id]` | S11/S12 summary, S13 suggestions | owner or group |
| `/exercises/[id]` | S14 history | signed in |
| `/volume` | S15 | signed in |
| `/body` | S16, S17 | owner |
| `/compete` | S18 leaderboards, S19 challenges | signed in |
| `/feed` | S20 | signed in |
| `/me`, `/u/[id]` | S21 profile / trophy case | self / group |
| `/me/invite` | S22 | signed in |
| `/me/plan` | S23 | owner |
| `/me/settings` | S24 | owner |

### Actions and RPCs

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `auth.signInWithOtp` | email a 6-digit code (+ link) | anyone | email | sent | F01 |
| `auth.verifyOtp` | exchange the code for a session in *this* browser context | anyone | email, code | session | F01 |
| action `saveBodyProfile` | upsert `body_profiles` and `profiles` goal/experience | self | stats | ok / field errors | F04 |
| action `computeTargets` | run `lib/science`, insert into `targets` | self | none | kcal, protein, rate, date, citations | F04 |
| rpc `join_group` | add the caller to a group by code | signed in | code | group id / `invalid_invite` | F01, F09 |
| action `createGroup` | create a group + owner membership | signed in | name | group + invite URL | F09 |
| select `exercises` | the full library (cached by the SW, searched on the client) | signed in | none | list | F02 |
| insert `exercises` | create a custom exercise | self | name, muscles, equipment | exercise / duplicate | F02 |
| rpc `finish_workout` | one transaction: workout + exercises + sets → PR detection → flags → feed item → badges. Idempotent on `client_id` | self | draft JSON | workout id, PRs, badges | F02 |
| action `getSuggestions` | next-session targets for each exercise in a workout | self | workout id | suggestions + citations | F03 |
| select `sets` view `exercise_history` | e1RM over time | self/group | exercise id | series | F03 |
| rpc `weekly_volume` | hard sets per muscle this week (group tz) | self | none | muscle → sets, range | F03 |
| upsert `weight_entries` | log today's weight | self | day, kg | ok | F08 |
| upsert `nutrition_days` | log today's totals | self | day, kcal, protein | ok | F08 |
| rpc `leaderboard` | ranks for the group; DOTS computed inside, body weight never returned | member | group, metric, period | rows | F05 |
| insert `challenges` / `challenge_participants` | create or join a challenge | member | challenge fields / id | ok | F06 |
| rpc `challenge_scores` | scores in the window | member | challenge id | rows | F06 |
| select `feed_items` (+ joins) | the group feed, paginated by `created_at` | member | cursor | items | F07 |
| insert/delete `reactions`, `comments` | react / comment | member | item, emoji/body | ok | F07 |
| action `deleteAccount` | delete the `auth.users` row (cascade) | self | confirm | signed out | settings |

Webhooks in: none. Webhooks out: none.
Jobs: `GET /api/cron/daily` (Vercel Cron, 03:00 UTC, protected by `CRON_SECRET`):
1. close ended challenges and award challenge badges + feed items
2. create the next weekly auto-challenge for each group (Monday)
3. award streak badges
4. a tiny query so the Supabase free project never pauses (it pauses after 7 days idle)

## The parts that bite

- **Magic links on iOS PWAs.** A home-screen web app has separate storage from Safari. Tapping a
  magic link in Mail opens Safari, so the session lands in Safari, not in the installed app.
  Fix: the email shows a **6-digit code** prominently and the user types it in the app. The link
  stays as a fallback for people who haven't installed yet. The onboarding order is:
  invite link in Safari → Add to Home Screen → open app → email → code. ~60 seconds.
- **Email deliverability.** Supabase's default SMTP only sends to project team members, so custom
  SMTP is required. Gmail with an app password is free; buying a domain (~£10/yr) + Resend is
  better and is the upgrade path. **This needs your decision.**
- **Time zones.** "This week" = Monday 00:00 in the **group's** timezone (default Europe/London).
  Weight and nutrition `day` = the user's local date. Store `timestamptz`, compute weeks in SQL
  with `AT TIME ZONE`.
- **Idempotency.** `finish_workout` is keyed by `(user_id, client_id)`, so a retry after a dropped
  connection returns the same workout. Cron steps are idempotent (`on conflict do nothing` on badges).
- **Races.** PR detection runs inside `finish_workout` under `pg_advisory_xact_lock(user)`, so two
  devices finishing at once can't both claim the same PR.
- **Offline.** The draft lives in IndexedDB, updated on every set tick. The service worker caches the
  app shell and the exercise list. Finishing while offline queues the request and retries when online.
  Leaderboards and the feed need a connection (show a clear offline state).
- **Search.** ~80–300 exercises → load them all and fuzzy-match on the client (instant, works
  offline). No server search.
- **Realtime.** Not needed. Refetch on focus and pull-to-refresh.
- **Fair leaderboards.**
  - % improvement needs a baseline: best e1RM in the user's first 14 days per exercise. Users
    without one show "calibrating".
  - DOTS needs body weight: the latest entry is used server-side, and users with none are excluded
    with a prompt.
- **Health data and GDPR.** Body stats are special-category data under UK GDPR. Keep them owner-only
  by default, add a one-line consent at onboarding, and provide account deletion and data export.
  Block or warn under 16 for calorie advice.
- **iOS PWA limits.**
  - no HealthKit
  - push only after Add to Home Screen (iOS 16.4+), so notifications are "later"
  - no background timers, so the rest timer uses timestamps, not intervals
- **Data must survive every update (user requirement).**
  - Personal data lives server-side in Postgres.
  - Migrations are forward-only and use expand → migrate → contract across releases. No drops in
    the same release.
  - A CI job applies all migrations to a fixture-seeded DB and asserts the data is intact, and it
    fails on unapproved destructive SQL.
  - `pg_dump` before each prod migration (free tier has no PITR).
  - The IndexedDB draft carries a `schemaVersion` with upgrade functions.
  - The service worker waits for no active workout before activating and shows "Update ready".
    Cache clean-up never touches IndexedDB.
  - The refresh token persists, so updates don't sign anyone out.
- **Free-tier limits.** Supabase 500 MB DB / 50k MAU; Vercel Hobby is for non-commercial use, with
  1 cron per day. All fine at fewer than 30 users.

## Build order

1. **Vertical slice (MVP 0)**: prove the stack end to end, ugly.
   - Screens: S01, S02, S04 (minimal), S07 (bare), S08, S09, S11, S18 (one metric: weekly hard sets)
   - Tables: profiles, body_profiles, exercises (seed 80), workouts, workout_exercises, sets, groups,
     group_members
   - Routes: OTP auth, `join_group`, `finish_workout` (no PRs yet), `leaderboard('hard_sets')`
   - Done when: two phones join one group, both log a workout, and both see the ranking.
2. **Must-haves**, by area:
   - onboarding + targets: S03, S05, S06, `lib/science/energy|targets|protein|timeline`, `targets`
   - logging polish: previous values, optional RIR, offline draft, custom exercise S10
   - progress + coaching: PR detection, S12, S13, S14, S15, `progression|volume|e1rm`, citations sheet
   - body: S16, S17, weight_entries, nutrition_days, trend chart
   - compete: remaining leaderboard metrics (% improvement, DOTS, streak), privacy defaults
3. **Should-haves**: weekly challenges S19, feed + reactions S20, badges + trophy case S21, PR flags,
   rest timer, set types, own plan S23, period switch, heatmap, target recalculation.
4. **Could-haves**: comments, duels, templates, push, CSV import, share cards, supersets, plate calc,
   photos, multiple groups, pump/soreness feedback.
5. **Fixes from replica-entrepreneur**: once it has read Hevy/Fitbod/MacroFactor reviews.

Robbie's workflow wraps this: issue #1 test suite, #2 CI, #3 Playwright MCP, then milestone 1 split into atomic issues.
