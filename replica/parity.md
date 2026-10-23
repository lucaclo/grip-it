# Parity report: Grip It (2026-10-23)

Measured against `replica/features.csv`, with every row re-checked against the code on `prototype`
(b168289). Earlier rows marked `proto` are now `yes` because friends sync landed in 4772528.

## Score

| | |
| --- | --- |
| Feature score | **86.3 / 100** (58 rows counted, 6 skipped on purpose) |
| Must-haves | **29 of 30** |
| Layout score | not measured (see below) |
| Verdict | **not shippable**: one must-have is partial |

The score itself would pass, since it's above 80. The verdict fails on the one must-have: sign-in.

### By area, weakest first

| area | score | why |
| --- | --- | --- |
| plans | 0 | own plan/split and templates not built |
| notifications | 0 | push not built (could) |
| import | 0 | CSV import not built (could) |
| social | 56 | reactions don't sync; no comments, share card or multiple groups |
| compete | 76 | no period switch, no time-limited challenges, no duels |
| body | 86 | no progress photos (could) |
| onboarding | 92 | sign-in is anonymous with no recovery |
| coaching | 92 | no post-session pump/soreness check (could) |
| logging | 97 | no supersets (could) |
| everything else | 100 | |

## Matrix changes made in this pass

- **Sign in with email magic link**: `no` → `partial`. The design changed: `lib/sync.ts` signs people in
  anonymously the first time they invite or join. That's fewer steps than the email flow, which is good,
  but the account can't be recovered. A new phone, or a wiped home-screen app, loses the user ID, and with
  it the link to every workout they uploaded.
- **Join a group from an invite link**: `no` → `yes` (`app/invite/[code]`, `joinGroup()`).
- **iOS install guide**: `no` → `yes`. It's on the invite page. Someone who opens the bare URL gets no guide.
- **Reactions on feed items**: `proto` → `partial`. They're saved on the phone only and never reach friends.
- **Recalculate targets when weight changes**: `no` → `yes`. `myTargets()` reads the latest weigh-in. There's
  no history of target changes, and the #70 weekly check-in isn't built.
- **Body weight and nutrition private**: `yes`. They never leave the phone; only `dots_score` is uploaded.
- All other `proto` rows → `yes`.

## Layout diff: not run

The recon map combines five reference apps, so there's no single original to compare screens against, and
`replica/screens/` is empty. Matching their layouts isn't the goal anyway: the hard rules forbid copying
another app's look. For our own regressions, use `imgdiff.py --mode pixel` on clone screenshots before and
after a change.

## Behaviour differences

| flow | reference apps do | Grip It does | fix or keep |
| --- | --- | --- | --- |
| F01 sign-up | email/password or OAuth before anything | no account until you invite or join | **keep**, but add optional email linking for recovery |
| F01 new phone | sign in, data comes back | everything is gone, and you'd show up as a stranger in the group | **fix** (#14/#15 rescoped, #90) |
| F02 logging offline | mostly needs a connection | local-first, uploads later | **keep** (a win) |
| F05 install | App Store | Safari Share → Add to Home Screen, guided on the invite page only | **fix**: show the guide in Safari on any page that isn't installed |
| F07 reactions | kudos reach the friend | reaction stays on your phone | **fix** (#62 server half) |
| F06 leaderboards | week / month / all-time | this week only, apart from streak and % improvement | **fix** (#69) |

## Top five to build next

1. **Account recovery (must).** Let someone attach an email to their anonymous account
   (Supabase `updateUser({ email })` plus OTP), and sign in with that email on a new phone so their
   uploaded workouts come back. Pair it with #90 (backup file + `navigator.storage.persist()`). This
   closes the last must-have and the data-survival gap.
2. **Sync reactions** (#62). This needs a `feed_reactions` table with RLS scoped to group members, ported
   from `schema.sql`.
3. **Leaderboard period switch** (#69). A cheap win, since the selectors already take a date window.
4. **Time-limited challenges** (#100), built on the weekly race-track challenge.
5. **Your own plan or split** (#68, then #85 routines). Plans is the only area at 0 with a should-have in it.

## Housekeeping

Issues #26–#70 describe the original server-first design, and many of them shipped locally in the
prototype instead: rest timer, set types, PR flags, badges, and so on. Each one should be closed with a
note saying it was built local-first, or rescoped to its remaining server part. Otherwise the backlog
overstates what's left.
