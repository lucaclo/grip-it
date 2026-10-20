# Grip It components

Direction: **dark, gym-like, competitive but fun.**
- Near-black surfaces, one loud "chalk-volt" accent, condensed athletic type (Barlow Condensed
  for headings and numbers, Barlow for body), tabular numbers everywhere.
- Fun lives in **moments** (a PR burst, rank-up, a badge reveal), not in decoration on every screen.
- Single dark theme for the MVP (deliberate). Tokens are roles, so a light theme can be added later
  by swapping values.

Sources:
- `/ui-ux-pro-max` design system: style "Vibrant & Block-based", fonts Barlow Condensed + Barlow,
  and the anti-patterns "static design" and "no gamification"
- UX rules: `inputmode` for numbers, visible labels, 44pt touch targets, reduced motion, safe areas
- The suggested orange primary was **rejected** because it's Strava's brand colour (trade dress).
  Replaced by volt `#D4FF3A`.
- The skill's database had **no match** for leaderboard/gamification UX, so those specs below come
  from general practice and the recon, not the database.

Icons: **Lucide** (MIT), 24px, 2px stroke, one family only. No emoji as UI icons. The reaction
set renders Lucide icons (flame, biceps-flexed, laugh, hand-metal, skull), stored as codes.
Accessibility baseline for every component:
- real HTML elements
- `:focus-visible` ring 2px `focus`
- 44×44pt minimum hit area
- colour is never the only signal
- motion off under `prefers-reduced-motion`
- text in rem so it scales with iOS text-size settings

Base: **Radix primitives** (Dialog, Tabs, ToggleGroup, Toast) via shadcn/ui patterns, restyled with tokens.

---

```
Button
  variants  primary (accent / on-accent), secondary (surface-raised / text, border),
            ghost (transparent / text-muted), danger (danger / on-danger)
  sizes     sm 36px, md 44px, lg 52px (lg = sticky bottom CTAs like "Finish")
  states    default, pressed (scale .97 + 8% darker, 120ms), focus-visible, disabled (40% opacity,
            aria-disabled), loading (spinner replaces icon, label kept for screen readers, aria-busy)
  tokens    radius md, font sans 600 base, uppercase tracking .02em for primary lg
  a11y      <button>; icon-only buttons need aria-label
  used on   all

Tab bar
  items     Home, Log, Compete, Feed, Me (5 max)
  states    active (accent icon + label), inactive (text-muted), badge dot (danger, with sr-only count)
  layout    56px + safe-area-inset-bottom, surface, top hairline border
  rule      the "Log" tab opens the active workout if one exists (draft resume), else starts one
  a11y      <nav aria-label="Main">, aria-current="page"
  used on   all signed-in screens

Set row
  columns   set # / type badge | previous (text-subtle, "80×8") | kg | reps | RIR (only if enabled) | ✓
  variants  normal, warm-up ("W", text-muted), drop ("D"), failure ("F", danger)
  states    empty, prefilled (previous shown as placeholder-style ghost value, tap ✓ to accept),
            editing, completed (row tint success at 12%, ✓ filled), PR (pr left edge + "PR" chip)
  inputs    kg: inputmode="decimal"; reps/RIR: inputmode="numeric"; select-all on focus
  height    52px; ✓ button 44×44
  gesture   swipe-left to delete AND a ⋯ menu alternative (no swipe-only actions)
  a11y      each input labelled "Set 2 kilograms" etc.; completing announces via aria-live
  used on   S08

Number field / stepper
  variants  plain, with − / + steppers (2.5 kg, 1 rep, 0.5 cm), with unit suffix (kg, cm, %)
  states    empty, focused (border focus), invalid (border danger + message below), disabled
  a11y      visible <label> above; error text linked with aria-describedby
  used on   S04, S08, S16, S17

Exercise card (in workout)
  parts     name (display lg), primary muscle chip, ⋯ menu (replace, reorder, note, remove),
            set rows, "+ Add set"
  states    collapsed (name + "3 sets · 80 kg top"), expanded, reordering (drag handle + up/down buttons)
  used on   S08, S23

Search bar + filter chips
  parts     search input (type="search", autofocus in sheet), clear button, muscle chips (scroll-x)
  states    empty query (recent + popular), typing (instant client fuzzy results), no results
            (CTA "Create '<query>'" opens S10)
  a11y      results list role="listbox"; chips are toggle buttons with aria-pressed
  used on   S09

Rest timer
  variants  inline bar under the exercise, compact pill in header when scrolled
  states    running (countdown, ±15s buttons, skip), done (accent pulse once + vibration where
            supported), off
  rule      computed from a stored end timestamp, so it survives iOS backgrounding the tab
  used on   S08

PR celebration
  variants  toast (in session), hero block (S12 summary)
  states    showing → auto-dismiss 4s (pausable on touch), dismissed
  motion    spring scale-in + short confetti burst (Canvas, ≤600ms); static under reduced motion
  tokens    pr / on-pr, font display
  a11y      role="status" text: "New PR: Bench press, 92.5 kg estimated 1RM"
  used on   S08, S12

Progress ring
  variants  kcal, protein, weekly sets
  states    0%, partial, met (success + check), over (warning for kcal only)
  a11y      role="img" aria-label "Protein 120 of 160 grams"; number shown in text too
  used on   S07, S17

Line chart (Recharts)
  variants  e1RM over time, body-weight trend (raw dots text-subtle + weekly-average line accent),
            optional goal line (dashed text-muted)
  states    empty ("Log 2 sessions to see a trend"), data, loading skeleton
  a11y      summary sentence above chart ("Up 4.5 kg in 6 weeks"); table toggle for screen readers
  used on   S14, S16

Muscle volume bars (MVP) / body heatmap (later)
  row       muscle name | bar with shaded evidence band (10–20 sets) | "12 sets"
  states    under (text-muted bar), in range (success), over (warning) + text label, never colour alone
  used on   S07, S15

Suggestion row + "Why?" sheet
  row       exercise | action chip ("+2.5 kg", "+1 rep", "Hold", "Deload −10%") | target "82.5 × 8"
  sheet     plain-English reason, the rule applied, citation chip(s), evidence strength label
            (Strong / Moderate / Practitioner guideline)
  a11y      sheet = Radix Dialog, focus trapped, returns focus to the row
  used on   S12, S13

Citation chip
  look      pill, surface-raised, "Schoenfeld 2017" + book-open icon
  action    opens the sheet with title, authors, year, finding, DOI link (opens externally)
  used on   S06, S13, S15

Leaderboard row
  parts     rank (display xl; 1–3 get gold/silver/bronze medal icon + text, not colour only) |
            avatar (initials) | name | score (tabular) | movement (▲2 / ▼1 / –, with sr text)
  variants  you (accent left edge + "You" label, pinned at bottom if off-screen), friend, calibrating
            (score "—", text-muted "calibrating 9 days left")
  states    default, tied ("=2"), loading skeleton
  used on   S18

Segmented control
  variants  metric (% Gain, DOTS, Streak, Hard sets), period (Week, Month, All), goal
  states    selected (surface-raised + accent text), unselected, focus
  a11y      Radix ToggleGroup type="single"; arrow keys move
  used on   S05, S18

Challenge card
  parts     title, metric, time left ("3d 4h"), your progress bar, top 3 avatars, Join button
  states    available, joined, completed (badge reveal), ended (results)
  used on   S19

Feed card
  variants  PR (pr chip, lift, e1RM, "+5 kg vs last best"), workout (title, duration, sets, volume),
            badge earned
  states    default, flagged ("Big jump: honour system" warning chip), private (never shown to others)
  footer    reaction bar + comment count
  used on   S20

Reaction bar
  set       flame, biceps-flexed, laugh, hand-metal, skull (Lucide)
  states    none, reacted (accent fill + count), loading
  a11y      each is a toggle button: aria-pressed, aria-label "React with flame, 3"
  used on   S20

Badge
  states    locked (outline, text-subtle, shows how to earn), earned (filled, earned date)
  reveal    flip + spring once; static under reduced motion
  used on   S12, S21

Bottom sheet
  variants  why, share, confirm (destructive confirms use danger button, never a browser dialog)
  states    open (slide-up 200ms, scrim black 60%), closed; drag-to-dismiss + close button
  a11y      Radix Dialog; Esc and close button; focus returns to trigger
  used on   S09, S11, S13

Empty state
  parts     Lucide icon 40px, one-line headline, one sentence, one primary action
  examples  no friends ("Gyms are better with rivals." → Invite), no history, no workouts yet
  used on   S09, S14, S18, S20

Toast
  variants  success, error, offline ("Saved on your phone. Will sync when you're back online.")
  states    showing (4s, pause on touch), dismissed
  a11y      role="status" (error: role="alert")
  placement above tab bar, respects safe area
  used on   all

OTP code input (auth)
  parts     6 boxes, one hidden input with autocomplete="one-time-code" inputmode="numeric"
  rules     paste fills all boxes; auto-submit on 6th digit; "Resend code" after 30s; "Wrong email?"
  a11y      single labelled input under the hood (works with iOS code autofill and password managers)
  used on   S02
```

## Screen-level rules

- Max width 480px, centred; 16px gutters; safe-area padding on header, tab bar and sticky CTAs.
- One primary action per screen. On S08 it's the sticky "Finish" (lg); "Add exercise" is secondary.
- Numbers are the hero: stats use `text-stat` tabular in Barlow Condensed.
- Loading: skeletons that reserve final size (no layout shift); spinners only inside buttons.
- Copy voice: short, direct, a bit of gym banter in empty states and celebrations, never in errors.

## Still to do (in the build issues, not now)

- Build these primitives in isolation on a `/design` route and screenshot it (replica-design step 4).
  Per Robbie's workflow no code is written before the issues exist, so this becomes an early issue.
- Run the `/apple-design` audit on the `/design` route and on each screen issue.
