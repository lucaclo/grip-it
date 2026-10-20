# Grip It: project brainstorm and planning prompt

> Paste this into Claude Code **in plan mode** with: "Plan Grip It from @brainstorm.md. Think hard."
> No code is written until the plan is approved and the GitHub issues exist.

## 1. What we're building

**Grip It** is a dark, gym-like **progressive web app (PWA)** for iPhone. It tracks lifting,
body weight and nutrition targets, sets **goals backed by published hypertrophy research**, and
lets a small group of friends **compete and keep it fun**.

- Not on the App Store. Friends open an invite link in Safari and "Add to Home Screen".
- Fewer than 30 users. Private use, never sold.
- Budget: **£0/month** (free tiers only).
- Public GitHub repo (needed for free branch protection). No secrets in the repo.
- Units: **kg** only.

### Core loop
Log a workout in under a minute per exercise, get told exactly what to beat next time, and see
where that puts you against your friends this week.

## 2. Reference material already produced (read before planning)

| file | what it holds |
| --- | --- |
| `replica/recon.md` | recon of 5 reference apps (Hevy, Fitbod, RP Hypertrophy, MacroFactor, Strava): 24 screens S01–S24, 9 flows F01–F09, components, inferred data model |
| `replica/features.csv` | feature matrix: 30 must, 16 should, 11 could, 6 skip |
| `replica/architecture.md` | stack, API table, science-engine rules, the parts that bite, build order |
| `replica/schema.sql` | first migration: 21 tables, 41 RLS policies. **Verified** to apply on Postgres with an auth stub; privacy smoke test passed |
| `replica/design/tokens.json`, `tokens.css`, `components.md` | dark design system, Tailwind v4 `@theme`, component specs. Contrast: 28 pairs, 0 AA failures |

Clean-room rule: rebuild **features and flows only**. Never copy any reference app's name, logo,
icons, illustrations, copy, colours or code.

## 3. Requirements (decided, do not re-litigate)

### Accounts and joining (must be quick, clear, simple)
- Sign in with **email OTP: a 6-digit code typed into the app**, with the magic link as fallback.
  Reason: an iOS home-screen PWA has separate storage from Safari, so a tapped magic link would
  sign the user into Safari instead of the app.
- Email is sent through **Supabase custom SMTP using Gmail + an app password** (free, about 500/day).
  Upgrade path: own domain + Resend.
- Join friends with an **invite link** (`/invite/[code]`). Target: invite link → logging in about 60 seconds.
- Flow: invite link in Safari → Add to Home Screen guide → open app → email → code → onboarding.

### Profile and targets
- The user enters height, weight, age, sex, activity level, **target weight** and optional **body-fat %**.
- The app **suggests** daily calories and protein (it doesn't just accept numbers), shows **why**,
  and cites the source.
- Goal can be **toggled** between hypertrophy, strength and fat loss at any time.
- Experience level (beginner / intermediate / advanced) sets **how hard the plan is and a realistic
  time range** to reach the goal. Unrealistic targets get a warning and a proposed realistic date.

### Logging
- Inside a session: **search an exercise**, then enter **kg, reps and sets**. Previous values are
  prefilled.
- **RIR is optional** (a settings toggle).
- Built-in library of **~80 exercises**, each tagged with primary and secondary muscles. It must be
  easy to grow (a seed file, not a schema change). Users can create custom exercises.
- The active workout draft must **survive iOS closing the app** (IndexedDB) and finishing must be
  idempotent.
- Workout templates are optional and come after the MVP. Users can **enter their own plan/split**
  (the owner uses their own regime).

### Coaching (the differentiator)
- After each session the app says **exactly what to do next time** per exercise: add kg, add a rep,
  hold, or deload. The rules come from the scientific literature.
- Every suggestion has a **"Why?"** sheet with a citation and an evidence-strength label.
- Weekly hard sets per muscle are compared against an evidence-based range.
- Starting rules and citations are in `replica/architecture.md` → "The science engine".
  **Every citation must be verified against its DOI** in the issue that adds it. Practitioner
  guidelines are labelled as such.

### Body
- Log body weight, with a **weekly-average trend chart** and a goal line.
- Log **daily totals** of kcal and protein against targets. No food database.

### Competition and fun
- Leaderboards in **four ways**: % improvement over your own baseline, **DOTS** relative strength,
  **streaks/consistency**, and **weekly hard sets**.
- Always-on leaderboards plus **weekly challenges** in the MVP. Time-limited challenges come next.
  **Duels come later.**
- A **feed** of friends' PRs and workouts with **reactions** (comments are a later could-have).
- **Badges** for PRs and streaks, shown in a trophy case.
- Cheating: **honour system plus a flag on improbable jumps**.
- Privacy: **lifts are shared; body weight and nutrition are private by default** (opt-in sharing).
  DOTS is computed server-side and never exposes body weight.

### Data survives every app update (hard requirement)
A user's personal information (profile, body stats, targets, workouts, PRs, weight and nutrition
logs, badges, group membership) **must carry over intact whenever the app is updated**. Users
never re-enter anything and never lose history.
- **The server is the source of truth.** All personal data lives in Supabase Postgres, not only on
  the phone, so a new deploy or a service-worker update can't wipe it.
- **Migrations are forward-only and non-destructive.** No `drop table` / `drop column` on user data
  in the same release that stops using it. Use expand → migrate data → contract across separate
  releases. Every data-transforming migration has a test that seeds old-shape rows and asserts they
  survive with the new shape.
- **CI gates migrations.** Apply every migration in order to a database seeded with fixture users,
  then assert row counts and key values are unchanged. Destructive SQL (`drop`, `truncate`, `delete`
  without `where`) fails CI unless explicitly allow-listed.
- **Backups before prod migrations.** Supabase free tier has no point-in-time recovery, so
  `pg_dump` prod (to a private place, never the public repo) before applying a migration.
- **On-device data is versioned.** The IndexedDB workout draft has a `schemaVersion` and an upgrade
  function. A new app version upgrades an old draft instead of discarding it. Unknown or corrupt
  drafts are kept aside and reported, never silently deleted.
- **Service-worker updates are safe.** A new version activates only when no workout is in progress
  (or after the draft is flushed). The user sees "Update ready, tap to refresh", not a forced reload
  mid-set. Cache clean-up only touches app-shell caches, never IndexedDB.
- **Sessions persist.** Updating the app doesn't sign users out (the Supabase refresh token stays
  in storage).
- Account deletion and data export remain the only ways personal data is removed or taken out.

### Later (not MVP)
Push notifications, Hevy/Strong CSV import, duels, templates, comments, share cards, supersets,
plate calculator, progress photos, multiple groups, pump/soreness feedback.

### Out of scope
Food database, Apple Health, technique videos, program libraries, GPS, coach platform, payments,
App Store listing.

## 4. Stack (decided; see `replica/architecture.md` for the reasoning)

- Next.js 15 App Router + TypeScript + React 19. PWA via Serwist. Tailwind v4 with the tokens.
  Radix primitives. Lucide icons. Recharts.
- Supabase: Postgres + Auth (email OTP) + RLS. `supabase-js` + `@supabase/ssr` with generated
  types, no ORM. Migrations in `supabase/migrations/`.
- Zustand + idb-keyval for the workout draft.
- Vercel Hobby with a preview deploy per PR, and one Vercel Cron per day (`/api/cron/daily`).
- Two Supabase projects: prod and staging.
- Tests:
  - **Vitest** for unit and integration tests
  - **Playwright** for e2e on an iPhone viewport
  - DB/RLS tests run against a throwaway Postgres with an `auth` stub (the `postgres` service in
    CI; Homebrew locally, since Docker isn't installed)
- Lint: ESLint + Prettier + `tsc --noEmit`.
- Browser testing for Claude: **Playwright MCP** (`@playwright/mcp`). It replaces the archived
  Puppeteer MCP.

## 5. What I want from planning

1. Confirm or challenge the stack, data flow and API in `replica/architecture.md`. Flag anything wrong.
2. Lay out the **MVP vertical slice** first. Done when two phones join one group, both log a workout,
   and both see a weekly-hard-sets leaderboard. Then iterate in this order: must-haves → should-haves
   → could-haves.
3. Then produce the **ordered list of atomic GitHub issues** (outline first, for my approval), with:
   - #1 set up the test suite (Vitest unit + integration, Playwright e2e, the DB test harness)
   - #2 set up CI on GitHub Actions: tests + lint + typecheck on every push and PR. The job must be
     named `ci`, because branch protection requires it.
   - #3 set up the Playwright MCP server for browser-based UI testing at an iPhone viewport
   - then strictly by dependency. One model, route or feature per issue. Each issue has exactly
     these sections: Goal / Acceptance Criteria (3–7 items) / Implementation Notes /
     Dependencies / Out of Scope.
   - Early issues include: Next.js + PWA scaffold, design tokens + `/design` primitives page,
     the Supabase migration, and auth.
4. Then create `.claude/commands/process-issue.md` (the `/process-issue` engine, section 6).
5. Run `/init` for a lean `CLAUDE.md`.

## 6. Workflow adjustments (agreed changes to Robbie's workflow)

- **Branch protection**: set it up *after* issue #2 merges, because the `ci` check only appears
  after it has run once. Require status checks only. **Don't** require an approving review, since a
  solo dev can't approve their own PR.
- **`/process-issue`** lives at `.claude/commands/process-issue.md`. Scratchpads go in
  `scratchpads/<issue-number>-<slug>.md` with a link to the issue.
- **TEST step**:
  - Vitest/Playwright, **not rspec**
  - Playwright MCP click-through for UI changes at the iPhone viewport
  - **run the `/apple-design` audit on any issue that touches UI** and fix its high-severity findings
  - check against `replica/design/components.md` and the `/ui-ux-pro-max` pre-delivery checklist
- **Before the PR**: run `/code-review` on the branch. Then open the PR with the Vercel preview URL
  so it can be tested on a phone.
- After each milestone: run `/replica-test` (flows), then `/replica-diff` (parity vs
  `features.csv`). Then tick the `clone` column.
- Before going live: `/replica-entrepreneur` (read real reviews of the reference apps for gaps),
  `/replica-brand` (final name check, logo brief, a sweep for leftovers from the reference apps),
  `/replica-deploy`. **Skip `/replica-launch`** (no pricing or store listing).
- Commit after each logical step and push straight away. Commit messages reference the issue (`#12`).

## 7. Open risks to address in the plan

1. Correctness and honesty of the science engine: unit-tested worked examples and verified citations.
2. Fair leaderboards: baseline calibration (first 14 days) and DOTS without exposing body weight.
3. iOS PWA realities: OTP auth, offline workout draft, rest timer from timestamps, no background
   timers, push only after install.
4. Health data under UK GDPR: consent line at onboarding, data export, account deletion (cascade).
5. Free-tier limits: Supabase pauses after 7 idle days (the daily cron pings it); Vercel Hobby
   allows 1 cron/day.
6. Data loss on update: non-destructive migrations, a CI migration gate with seeded fixtures, a
   versioned on-device draft, safe service-worker activation, and backups before prod migrations.
   Put the migration gate into issue #2 (CI) or a dedicated issue right after the Supabase migration issue.
