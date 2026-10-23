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

## On your phone, offline

The deployed version (https://grip-it-kappa.vercel.app) works with no signal once it has been opened online. Open the URL in
Safari, then Share → Add to Home Screen, and use it from the icon: home-screen apps keep their data,
and Safari tabs can have theirs cleared after a week unused. Data lives on that phone only, so back
it up from Me → Export now and then.

- `app/sw.ts`: what is cached offline. Every tab is precached; exercise and workout pages are saved
  as you open them.
- `components/pwa.tsx`: the "Update ready" toast. New versions never take over mid-workout.
- The service worker is off in `npm run dev`; test offline with `npm run build && npm start`.

```bash
npx vercel --prod    # deploy (first time: npx vercel login)
```

## App feedback

Me → Send feedback lets anyone write a comment and attach up to 4 screenshots, PDFs or text files.
It's saved on the phone first (so it works offline) and sent to the private Vercel Blob store
`grip-it-feedback` (London). Nothing in it is public.

```bash
npx vercel env pull .env.local   # once, gets the store credentials
npm run feedback                 # downloads new feedback into feedback-inbox/ and prints it
```

`feedback-inbox/` is git-ignored: it holds people's names and screenshots.

## Change things

| You want to change | Edit |
| --- | --- |
| Colours, fonts, sizes | `app/globals.css` (the `@theme` block; values come from `replica/design/tokens.json`) |
| A screen | `app/(app)/<screen>/page.tsx`, onboarding in `app/onboarding/page.tsx` |
| Calorie / protein maths | `lib/science/energy.ts`, `lib/science/targets.ts` |
| What to do next session | `lib/science/progression.ts` |
| Weekly volume rules | `lib/science/volume.ts` |
| Hard sets, effort and the red muscle diagram | `lib/science/effort.ts` (thresholds), `components/anatomy/heat-figure.tsx` |
| The "i" explanations | `components/explainers.tsx` (text), `components/ui/info.tsx` (the sheet) |
| Likes and comments | `lib/data/store.ts` (`like`, `addComment`), `components/feed/comments.tsx` |
| Research sources | `lib/science/citations.ts` |
| The exercise list | `lib/data/exercises.ts` (add rows; never change an existing id) |
| Other names for an exercise | `ALIASES` in `lib/data/exercises.ts` (search spellings: `lib/data/search.ts`) |
| Which part of a muscle an exercise lights up | `FOCUS` in `lib/data/exercises.ts` |
| The anatomy drawing and fibre directions | `lib/anatomy/geometry.ts` (regions: `lib/anatomy/regions.ts`) |
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
