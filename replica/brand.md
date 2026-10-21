# Brand: Grip It

## Name: Grip It (kept)
Screening checks, not legal clearance. Grip It is private and not sold, so the risk is low; get a
trademark search done before any public launch.

| check | result | date |
| --- | --- | --- |
| App Store (GB): "grip it", "gripit" | no exact match; nearby names exist (GripLog, "Grip" pole-fitness log, grip-strength apps) | 2026-10-20 |
| Web: "Grip It" fitness app | no exact app; HTC Grip (2015 wearable, discontinued) | 2026-10-20 |
| US trademark | past "GRIP IT"/"GRIPIT"/"GRIP-IT" marks are cancelled or abandoned; "GRIPIT RITE" (golf aid, 2021) pending | 2026-10-21 |
| UK trademark | no "GRIP IT" found in Trade Mark Journal search results | 2026-10-21 |
| EU trademark (EUIPO eSearch) | to run | |
| gripit.com | taken (GoDaddy, since 1997) | 2026-10-20 |
| gripitapp.com | taken (Namecheap) | 2026-10-20 |
| gripit.app | taken (registered 2025-09-02) | 2026-10-21 |
| GitHub | `gripit` taken, `gripitapp` free | 2026-10-21 |
| Instagram, X, TikTok handles | to run | |
| Play Store | to run | |

Hosting doesn't need a custom domain: the app can live at `grip-it.vercel.app`.

## Palette
Purple-tinted dark, violet→orchid brand gradient, volt lime as the "do this" signal. No reference-app
colour (Strava's orange is in `brand.json` for the sweep). 32 text/background pairs, 0 AA failures
(`replica/design/tokens.json`).

## Logo
**Idea:** a "G" drawn as a bumper-plate ring, whose crossbar is a lime barbell grip. The name, the plate
motif and the grip in one mark.
- Mark type: symbol (with the GRIP IT wordmark in Barlow Condensed Bold Italic beside it).
- Works at 16 px (favicon) and 1024 px.
- Doesn't resemble any reference app's mark (no shared shape, colour pair or letter trick).

| asset | file |
| --- | --- |
| Master vector | `app/icon.svg` (also `public/icon.svg`) |
| Favicon | served from `app/icon.svg` |
| iPhone home-screen icon (180 px, opaque) | `app/apple-icon.tsx` |
| Store icon 1024×1024, no transparency | `branding/app-icon-1024.png` (re-render from `/store-icon`) |
| Social image 1200×630 | `branding/social-1200x630.png`, served as `/opengraph-image` |

## Voice
**Direct, not blunt.** Say what to do next in plain words; never cold.
**Competitive, not toxic.** Rivalry is the fun; nobody is mocked for being new or slow.
**Evidence-led, not preachy.** Show the number and the source; don't lecture.

| do | don't |
| --- | --- |
| "Add 2.5 kg and aim for 6 reps." | "Great job! Maybe try a little more weight?" |
| "Theo's ahead by 3 sets. Two days left." | "Theo is crushing you. Try harder." |
| "Rest over. Go!" | "Your rest period has elapsed." |
| "1.6 g protein per kg (Morton 2018)." | "You MUST hit your protein or you'll lose gains." |
| "0 sets this week. Add an exercise for it next session." | "You're neglecting your rear delts." |

### Rewritten strings
| where | before | after |
| --- | --- | --- |
| Log, start card | Your session saves on your phone after every set, so nothing is lost if you close the app. | Every set saves as you go. Close the app mid-session and pick up right where you left off. |
| Log, start card | Logging one you've already done? Start it, then turn on Auto-tick. | Already trained? Start one, turn on Auto-tick and log it after the fact. |
| Log, history empty | Your saved workouts will show up here. | No workouts yet. Your first one sets the numbers to beat. |
| Exercise search, no results | No exercise matches "x". | Nothing called "x" yet. Add it and it's yours. |
| Feed, empty | Quiet in here / Workouts and PRs from your group show up here. | Nothing to react to yet / When your crew trains, their sessions and PRs land here. Invite someone to get it going. |
| Volume, muscle with no sets | Nothing hit this muscle yet this week. | 0 sets this week. Add an exercise for it next session. |
| Body, chart empty | Weigh in on a couple of days to see your trend… | Weigh in on two different days to see your trend. Daily weight swings by a kilo or more; the 7-day average is what counts. |
| Exercise history, empty | Not enough data yet / Log this exercise twice… | One more session / Log this exercise twice and you'll see your estimated 1-rep max climb. |
| Workout, unticked sets | (already in voice) "3 sets aren't ticked yet…" | kept |
| Rest timer | (already in voice) "Rest over · Go!" | kept |

## Sweep
`app/`, `components/`, `lib/`, `public/`, `README.md`, `CLAUDE.md`: clean (2026-10-20). The only hits
are planning references in `brainstorm.md`, which deliberately name the apps that were studied.
