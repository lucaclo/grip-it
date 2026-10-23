# Recon map: Grip It, composite of 5 reference apps (iOS, rebuilt as a PWA)

Scope: one composite slice, taken from five apps:
- **Hevy**: logging a workout (search an exercise, then kg × reps × sets, then finish), PR detection, the social feed
- **Fitbod**: next-session suggestions and per-muscle recovery/volume
- **RP Hypertrophy**: weekly sets per muscle (volume landmarks) and feedback after each session
- **MacroFactor**: setup (body stats and goal, which produce calorie/protein targets) and the weight trend
- **Strava**: leaderboards, challenges, clubs, kudos and trophies

For: Luca and fewer than 30 friends. Private use, not sold. Installed as a PWA from an invite link.
Date: 2026-10-20

Clean-room rules: only public sources were used (marketing pages, help centres, App Store
listings, third-party reviews). No accounts were used, no source code was read and no
network calls were logged. Hevy and MacroFactor terms may forbid using an account to build a
competitor, so neither was logged into. `replica/screens/` is empty: no screenshots have been
saved yet. App Store listing screenshots can be added by hand as layout reference. They are
never shipped.

## Sources

| # | app | source | URL | notes |
| --- | --- | --- | --- | --- |
| 1 | Hevy | features index | https://www.hevyapp.com/features/ | full feature list by area |
| 2 | Hevy | logging walkthrough | https://www.hevyapp.com/features/track-workouts/ | logging flow click by click, set types, PR notification, finish screen |
| 3 | Fitbod | help centre: how it works | https://help.fitbod.me/hc/en-us/sections/360001078993-Understanding-Fitbod-How-It-Works | recommendations come from logged history |
| 4 | Fitbod | help article | https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout | progression from history, e1RM, RIR |
| 5 | Fitbod | blog: algorithm | https://fitbod.me/blog/fitbod-algorithm | 10–20 sets per muscle per week, fatigue override (company's own claim) |
| 6 | RP Hypertrophy | product page | https://rpstrength.com/hypertrophy-app | meso builder, pump/soreness/workload feedback, weekly volume view |
| 7 | RP Hypertrophy | third-party comparison | https://www.boostcamp.app/vs/rp-hypertrophy | MEV/MAV/MRV used as weekly auto-regulation (written by a competitor) |
| 8 | MacroFactor | goal features | https://macrofactor.com/goal-features/ | lose/maintain/gain, target weight, weekly rate of change |
| 9 | MacroFactor | product page | https://macrofactor.com/macrofactor/ | trend weight, weekly check-in adjusts targets |
| 10 | MacroFactor | review | https://expertbeacon.com/macrofactor-review/ | onboarding asks weight, body-fat %, goal weight and rate; 4 protein levels |
| 11 | Strava | explainer | https://220triathlon.com/training/bike-training/what-is-strava-and-how-does-it-work | segments, leaderboards (all-time/week/year), challenges, clubs, kudos, trophy case |
| 12 | Strava | explainer | https://www.merlincycles.com/blog/what-is-strava/ | PR medals, top-10 cups, crowns |

## Core loop

Log a workout in under a minute per exercise, get told exactly what to beat next time, and
see where that puts you against your friends this week.

## Screens

The target screen set for Grip It. Each screen notes which reference app the pattern comes from.

| ID | screen | route / how to reach | purpose | key components | states seen | pattern from |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | Landing / invite | `/` or `/invite/:code` | explain the app, enter email | hero, email input, primary button | default, invited-by-friend, error | Strava (invite) |
| S02 | Check your email | after submitting S01 | tell the user to tap the magic link | big icon, resend button, "wrong email?" | sent, resent, expired link | n/a (magic link) |
| S03 | Add to Home Screen | first open in Safari | show how to install the PWA | iOS share-sheet illustration, steps | Safari, already installed, not iOS | n/a (PWA) |
| S04 | Onboarding: body stats | first login | height, weight, age, sex, body-fat % | number steppers, segmented control | empty, filled, invalid | MacroFactor |
| S05 | Onboarding: goal | after S04 | hypertrophy / strength / fat loss, target weight, experience level | goal cards, slider, level picker | each goal selected | MacroFactor, RP |
| S06 | Onboarding: your plan | after S05 | show kcal and protein targets, a realistic timeline and the "why" | target cards, timeline, citation chips | computed, unrealistic-goal warning | MacroFactor |
| S07 | Home / today | tab 1 | today's targets, start workout, streak, this week's sets per muscle | progress rings, CTA, streak chip, muscle bars | new user, mid-week, goal hit | Hevy, RP |
| S08 | Active workout | Start on S07 | log the live session | timer, exercise cards, set rows (previous, kg, reps, RIR?, ✓), add exercise | empty, in progress, rest timer running, PR hit | Hevy |
| S09 | Exercise search | "+ Add exercise" on S08 | find an exercise | search bar, muscle filter chips, list, "create custom" | empty query, results, no results | Hevy |
| S10 | Create custom exercise | from S09 no-results | add an exercise | name, primary/secondary muscle pickers, equipment | empty, saving, duplicate name | Hevy |
| S11 | Finish workout | Finish on S08 | review and save | title, duration, volume, sets, PR list, note, private toggle | no sets logged, PRs, save error | Hevy |
| S12 | Workout saved / summary | after S11 | celebrate and show what's next | workout #, streak, PRs, next-session suggestions, share | no PRs, PRs, badge earned | Hevy, Fitbod |
| S13 | Next-session suggestions | from S12 or exercise detail | per-exercise "add 2.5 kg" / "add 1 rep", with reasons | suggestion rows, "why?" sheet with citation | progressing, stalled, deload advised | Fitbod |
| S14 | Exercise detail / history | tap exercise anywhere | e1RM chart, best sets, history | line chart, PR list, history list | no history, history | Hevy |
| S15 | Muscle volume | tab or card on S07 | weekly hard sets per muscle vs target range | body heatmap or bars, MEV–MRV bands | under, in range, over | RP, Fitbod |
| S16 | Body weight log | tab "Body" | log weight, view the weekly-average trend | quick entry, trend chart, goal line | no data, trending to goal, off track | MacroFactor |
| S17 | Daily nutrition | "Body" tab section | type in today's kcal and protein totals | two number inputs, progress vs target | empty, partial, hit | MacroFactor (simplified) |
| S18 | Leaderboards | tab "Compete" | ranked friends on 4 metrics | metric switcher (% improvement, DOTS, streak, weekly sets), period switcher, rank rows | alone, ranked, tied | Strava, Hevy |
| S19 | Challenges | "Compete" tab section | weekly and time-limited challenges | challenge cards, progress bar, join button | none active, joined, completed | Strava |
| S20 | Feed | tab "Feed" | friends' PRs and workouts, reactions | feed card, reaction bar, comments | empty (no friends), filled, flagged PR | Hevy, Strava |
| S21 | Profile / trophy case | tab "Me" | badges, stats, privacy settings | avatar, badge grid, stat rows | own, friend's (private fields hidden) | Strava |
| S22 | Invite friends / group | from S21 or S18 empty state | share the invite link | share sheet, link copy, members list | no members, members | Strava (clubs) |
| S23 | My plan / routine | from S07 | enter your own split and days (optional) | day list, exercise picker | none, custom plan | RP, Hevy |
| S24 | Settings | from S21 | goal toggle, units (kg), RIR on/off, privacy, sign out | list rows, toggles | default | Hevy |

## Flows

```
F01 Friend joins from an invite link (the "quick and simple" requirement)
    S01 (invite) -> S02 -> email app -> magic link -> S03 -> S04 -> S05 -> S06 -> S07
    happy path taps: ~10 (email, send, open mail, tap link, add to home, 4 onboarding fields, done)
    edge: link opened in a different browser than the one requested from, expired link,
          invite code invalid/expired, already a member, not on iOS Safari (skip S03)

F02 Log a workout (core loop)
    S07 -> S08 -> S09 (search "bench") -> S08 enter kg/reps per set, tick -> repeat -> S11 -> S12
    happy path taps per set: 3 (kg, reps, tick), with previous values prefilled
    edge: no history for the exercise, offline mid-session, app backgrounded or killed mid-session
          (draft must survive), zero sets ticked on finish, duplicate exercise added

F03 Get next-session targets
    S12 -> S13 -> "why?" sheet
    taps: 2
    edge: first time doing an exercise (no baseline), stalled 3+ sessions (suggest deload/variation),
          RIR not logged (fall back to reps-only rule), goal = strength vs hypertrophy changes rep target

F04 Set goals in onboarding
    S04 -> S05 -> S06
    taps: ~8
    edge: no body-fat % known (fall back to Mifflin-St Jeor), unrealistic target weight or timeline
          (warn and propose a realistic date), under 18 (block or warn)

F05 Check leaderboard
    S07 -> S18 -> switch metric -> switch period
    taps: 3
    edge: only one member, new member with no baseline (% improvement undefined),
          friend hides body weight (DOTS needs it: exclude or use a private calculation)

F06 Join a weekly challenge
    S18 -> S19 -> join
    taps: 2
    edge: challenge ended, joined mid-week, tie at the end

F07 React to a friend's PR
    S20 -> tap reaction
    taps: 1
    edge: PR flagged as improbable (show a flag badge), own post, deleted workout

F08 Log body weight and nutrition
    S07 -> S16 -> enter kg -> S17 -> enter kcal, protein
    taps: 4
    edge: two entries in one day (keep latest), big outlier, missed days

F09 Invite a friend
    S21 -> S22 -> share
    taps: 2
    edge: share sheet not available (copy link fallback)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger | default, pressed, focus, disabled, loading | all |
| Tab bar | 5 tabs (Home, Workout/Log, Compete, Feed, Me) | active, inactive, badge | all signed-in |
| Set row | normal, warm-up, drop, failure | empty, prefilled (previous), completed, PR | S08 |
| Number input / stepper | kg, reps, RIR, cm, % | empty, focused, invalid | S04, S08, S16, S17 |
| Exercise card | in workout, in list | collapsed, expanded, reordering | S08, S09, S23 |
| Search bar + filter chips | muscle, equipment | empty, typing, no results | S09 |
| Rest timer | inline bar, Live-Activity-style banner | running, done, skipped | S08 |
| PR toast | e1RM, reps, weight | showing, dismissed | S08 |
| Progress ring | kcal, protein, weekly sets | 0%, partial, met, over | S07, S17 |
| Line chart | e1RM, body weight trend | empty, data, goal line | S14, S16 |
| Muscle volume bars / heatmap | front/back body | under, in range, over | S07, S15 |
| Suggestion row + "why?" sheet | add weight, add rep, hold, deload | default, expanded | S12, S13 |
| Citation chip | paper reference | default, tapped (opens sheet) | S06, S13, S15 |
| Leaderboard row | you, friend, top 3 | default, highlighted (you), tied | S18 |
| Segmented control | metric, period, goal | selected | S05, S18 |
| Challenge card | weekly, time-limited | available, joined, complete | S19 |
| Feed card | PR, workout, badge | default, flagged, private | S20 |
| Reaction bar | 💪 🔥 😂 (example set) | none, reacted | S20 |
| Badge | PR, streak, challenge | locked, earned | S12, S21 |
| Bottom sheet | why, share, confirm | open, closed | S11, S13 |
| Empty state | no friends, no history, no workouts | default | S09, S14, S18, S20 |
| Toast | success, error, offline | showing | all |

## Inferred data model

```
User          id, email, display_name, avatar_url, created_at
              evidence: S01, S21; all reference apps   confidence: high

Profile       user_id, height_cm, sex, birth_year, body_fat_pct?, experience (beginner|intermediate|advanced),
              goal (hypertrophy|strength|fat_loss), target_weight_kg, target_date?, rir_enabled,
              privacy_weight (private|friends), privacy_nutrition (private|friends)
              evidence: MacroFactor onboarding review [10], RP meso builder [6]   confidence: high

Targets       user_id, kcal, protein_g, method (katch_mcardle|mifflin_st_jeor), computed_at, citations[]
              evidence: MacroFactor [8][9]; our own rules engine   confidence: high

WeightEntry   id, user_id, date, kg      (unique per user+date)
              evidence: MacroFactor trend weight [9]   confidence: high

NutritionDay  id, user_id, date, kcal, protein_g   (daily totals only)
              evidence: simplified from MacroFactor   confidence: high

Exercise      id, name, primary_muscle, secondary_muscles[], equipment, is_custom, created_by?
              evidence: Hevy exercise library + custom exercises [1][2]   confidence: high

Workout       id, user_id, title, started_at, ended_at, note, is_private, status (active|finished)
              evidence: Hevy finish screen [2]   confidence: high

WorkoutExercise  id, workout_id, exercise_id, position, note
              evidence: Hevy exercise cards, reorder [2]   confidence: high

Set           id, workout_exercise_id, position, kg, reps, rir?, set_type (normal|warmup|drop|failure),
              completed_at
              evidence: Hevy set types and completion [2], Fitbod RIR [4]   confidence: high

PersonalRecord id, user_id, exercise_id, set_id, kind (e1rm|weight|reps), value, achieved_at, flagged
              evidence: Hevy live PR notification [2], Strava medals [12]   confidence: high

Suggestion    id, user_id, exercise_id, for_date, action (add_weight|add_rep|hold|deload),
              target_kg, target_reps, reason, citation_id
              evidence: Fitbod progression [3][4]   confidence: medium (our own design)

Citation      id, short_ref, title, authors, year, doi_url, finding
              evidence: none in the references (Grip It's own differentiator)   confidence: guess

Plan          id, user_id, name, days[] -> PlanDay(id, plan_id, weekday?, label, exercise_ids[])
              evidence: Hevy routines [1], RP meso builder [6]   confidence: medium

Group         id, name, invite_code, created_by       (one friend group for MVP)
GroupMember   group_id, user_id, joined_at
              evidence: Strava clubs [11]   confidence: high

Challenge     id, group_id, title, metric (volume|sets|sessions|exercise_volume), exercise_id?, starts_at, ends_at
ChallengeEntry challenge_id, user_id, score
              evidence: Strava challenges [11]   confidence: medium

FeedItem      id, user_id, kind (pr|workout|badge), ref_id, created_at
Reaction      feed_item_id, user_id, emoji
Comment       id, feed_item_id, user_id, body, created_at
              evidence: Hevy social feed [1], Strava kudos [11]   confidence: high

Badge         id, code, title, rule        UserBadge  user_id, badge_id, earned_at
              evidence: Strava trophy case [11], Hevy streaks [1]   confidence: medium
```

Relationships: User 1-1 Profile, User 1-n Targets (history), User 1-n WeightEntry / NutritionDay,
User 1-n Workout, Workout 1-n WorkoutExercise, WorkoutExercise 1-n Set, Exercise 1-n WorkoutExercise,
User 1-n PersonalRecord, Group n-n User (GroupMember), Group 1-n Challenge, Challenge 1-n ChallengeEntry,
User 1-n FeedItem, FeedItem 1-n Reaction / Comment, Suggestion n-1 Citation.

Leaderboard metrics are **computed, not stored** (views or queries):
- % improvement: e1RM now vs baseline (the first two weeks)
- DOTS: total of best e1RMs (squat, bench, deadlift) adjusted for body weight. Computed on the
  server so a hidden body weight never leaves the server.
- streak: consecutive weeks hitting the user's planned session count
- weekly hard sets: sets with RIR ≤ 3, or all working sets if RIR is off

## Feature matrix

See `features.csv`. Must: 30, should: 16, could: 11, skip: 6.

## Out of scope (cannot or should not be cloned)

- Their exercise videos and illustrations (Hevy, RP: 250+ technique videos). Licensed content.
- Their routine and program libraries (RP's 45+ templates, Hevy's routine library). Their IP.
- Strava's GPS segments and global network. There is no GPS, and the network is their users.
- Food database and barcode scanning (MacroFactor). Licensed data, and also scoped out by the user.
- Coach platforms (Hevy Coach). Not needed for fewer than 30 friends.
- Apple Health / HealthKit sync. A PWA can't access it.
- Their brand names, logos, copy and colours. Grip It gets its own (via `/replica-brand`).

## Size

Screens 24, flows 9, entities 19. Hard parts:
1. **Goal and progression engine with citations.** Rules have to be correct, tested and honest about uncertainty.
2. **Fair leaderboards.** DOTS needs body weight while body weight stays private. Baselines are undefined for new users.
3. **Offline-safe active workout in a PWA.** The session draft must survive iOS killing the tab.

Other: magic links opened in a different browser on iOS, and the iOS "Add to Home Screen" flow.
No payments, no realtime needed (polling or refresh on open is fine at <30 users).

Size: **M** (a few weeks). The MVP slice (F01 + F02 + F05 with one metric) is roughly S.

## Prototype parity (2026-10-21)

The local prototype (browser storage, demo friends) compared against this map. `features.csv` now marks
40 of 63 rows `proto`. Server rows (auth, invite, RLS, sync) stay `no` until the Supabase issues land.

- **Screens built locally:** S04–S18, S20, S21, S24 (S13's Why sheet lives on the summary, S12).
- **Screens missing:** S01–S03 (sign-in, install guide: #14, #15, #18), S19 join and time-limited
  challenges (#100), S22 invite (#20), S23 plan (#68, #85).
- **Flow edges checked:**
  - F02 duplicate exercise: no guard (#97). F02 offline: no service worker yet (#7).
  - F03 stall → variation: missing (#99).
  - F04 under-age: blocked under 16.
  - F08 outlier and two entries in a day: no guard (#98).
- **S11 note field:** missing (#96).
- **Dev on phone:** `allowedDevOrigins` lacked the 172.* range, so the iPhone hotspot got 403 on every chunk.
  Fixed in `next.config.ts`; the helper is #105.
