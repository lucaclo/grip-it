# Grip It

A dark iPhone web app for lifting with friends: log sets, get research-backed next-session targets,
and compete on leaderboards.

**Status: local prototype** (branch `prototype`). Everything is saved in your browser; there are no
accounts yet, and the "friends" are made-up demo people. Accounts, real groups and sync arrive with
the Supabase issues (#10 onwards).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 on this computer
npm run dev:phone    # also reachable from your phone on the same Wi-Fi
```

On your iPhone, open `http://<your-mac's-ip>:3000` in Safari (find the IP with
`ipconfig getifaddr en0`). For the full-screen app feel: Share → Add to Home Screen.

## Change things

| You want to change | Edit |
| --- | --- |
| Colours, fonts, sizes | `app/globals.css` (the `@theme` block; values come from `replica/design/tokens.json`) |
| A screen | `app/(app)/<screen>/page.tsx`, onboarding in `app/onboarding/page.tsx` |
| Calorie / protein maths | `lib/science/energy.ts`, `lib/science/targets.ts` |
| What to do next session | `lib/science/progression.ts` |
| Weekly volume rules | `lib/science/volume.ts` |
| Research sources | `lib/science/citations.ts` |
| The exercise list | `lib/data/exercises.ts` (add rows; never change an existing id) |
| Demo friends and their history | `lib/data/seed.ts` |
| Leaderboards, PRs, feed | `lib/data/selectors.ts` |

After changing the science or data code, run `npm test`. In the app, Me → Reset everything
regenerates demo data.

## Checks

```bash
npm test             # unit tests (science engine, leaderboards, PRs)
npm run lint
npm run typecheck
npm run build
```
