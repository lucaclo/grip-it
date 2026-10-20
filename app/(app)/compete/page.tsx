"use client";

import { Crown, Info, Medal, TriangleAlert, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Card, Citations, PageHeader, SectionTitle } from "@/components/ui/bits";
import { Segmented } from "@/components/ui/fields";
import { allPRs, DAY_MS, leaderboard, weekStart, weeklyHardSets, type Metric } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { DOTS_CITATIONS } from "@/lib/science/strength";
import { VOLUME_CITATIONS } from "@/lib/science/volume";

const METRICS: { value: Metric; label: string; explain: string; keys: string[] }[] = [
  {
    value: "hard_sets",
    label: "Hard sets",
    explain: "Working sets this week (Monday to Sunday). Warm-ups don't count, and sets logged with more than 3 reps in reserve don't either.",
    keys: VOLUME_CITATIONS,
  },
  {
    value: "pct_improvement",
    label: "% Gain",
    explain: "Average estimated 1-rep-max gain across your lifts, compared with your best in your first 14 days. Fair for every size and level.",
    keys: ["epley1985"],
  },
  {
    value: "dots",
    label: "DOTS",
    explain: "Squat + bench + deadlift (estimated 1RMs) adjusted for body weight. Your weight is used to score but never shown.",
    keys: DOTS_CITATIONS,
  },
  {
    value: "streak",
    label: "Streak",
    explain: "Weeks in a row hitting your own sessions-per-week goal. Showing up beats being strong here.",
    keys: [],
  },
];

const MEDAL = ["text-rank-gold", "text-rank-silver", "text-rank-bronze"];

export default function Compete() {
  const s = useStore();
  const [metric, setMetric] = useState<Metric>("hard_sets");
  const [now] = useState(() => Date.now());
  const rows = useMemo(() => leaderboard(s, metric), [s, metric]);
  const flaggedUsers = useMemo(
    () => new Set(allPRs(s).filter((p) => p.flagged && now - Date.parse(p.at) < 28 * DAY_MS).map((p) => p.userId)),
    [s, now],
  );
  const m = METRICS.find((x) => x.value === metric)!;
  // Top three (when at least two people have a score) go on the podium; everyone else below.
  const ranked = rows.filter((r) => r.rank != null);
  const podium = ranked.length >= 2 ? ranked.slice(0, 3) : [];
  const rest = rows.filter((r) => !podium.includes(r));
  const challenge = useMemo(() => weeklyChallenge(s), [s]);

  return (
    <>
      <PageHeader title="Compete" subtitle={s.groupName} />
      <div className="flex flex-col gap-4">
        <Segmented label="Leaderboard" hideLabel value={metric} onChange={setMetric} options={METRICS.map((x) => ({ value: x.value, label: x.label }))} />

        {podium.length >= 2 && <Podium rows={podium} flagged={flaggedUsers} />}

        <ol className="flex flex-col gap-2" aria-label={`${m.label} leaderboard${podium.length >= 2 ? ", from 4th" : ""}`}>
          {rest.map((r) => {
            const you = r.userId === "me";
            return (
              <li
                key={r.userId}
                className={`flex min-h-16 items-center gap-3 rounded-md border px-3 ${you ? "border-accent/70 bg-gradient-to-r from-accent/18 to-accent-2/8 shadow-glow" : "card"}`}
              >
                <span className="w-8 text-center">
                  {r.rank != null && r.rank <= 3 ? (
                    <span className={`flex flex-col items-center ${MEDAL[r.rank - 1]}`}>
                      <Medal aria-hidden className="size-5" />
                      <span className="tabular text-sm font-semibold">{r.rank}</span>
                    </span>
                  ) : (
                    <span className="tabular text-xl font-semibold text-muted">{r.rank ?? "–"}</span>
                  )}
                </span>
                <Avatar name={r.name} you={you} />
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-base">
                    {r.name}
                    {you && <span className="text-xs font-semibold uppercase text-accent">You</span>}
                    {flaggedUsers.has(r.userId) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning/50 px-1.5 text-xs text-warning" title="A recent PR jumped more than 15%. Honour system.">
                        <TriangleAlert aria-hidden className="size-3" /> big jump
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-subtle">{r.note}</span>
                </span>
                <span className={`tabular text-stat font-semibold ${r.score == null ? "text-subtle" : ""}`}>{r.display}</span>
              </li>
            );
          })}
        </ol>

        <Card>
          <p className="flex gap-2 text-sm text-muted">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {m.explain}
          </p>
          {m.keys.length > 0 && (
            <div className="mt-3">
              <Citations keys={m.keys} />
            </div>
          )}
        </Card>

        <section>
          <SectionTitle>Weekly challenge</SectionTitle>
          <Card>
            <p className="font-display text-xl font-semibold">{challenge.title}</p>
            <p className="text-sm text-muted">Ends Sunday midnight · {challenge.daysLeft} day{challenge.daysLeft === 1 ? "" : "s"} left</p>
            <ul className="mt-3 flex flex-col gap-2">
              {challenge.rows.map((r, i) => (
                <li key={r.userId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className={r.userId === "me" ? "text-accent" : ""}>
                      {i + 1}. {r.name}
                    </span>
                    <span className="tabular text-muted">
                      {r.score} / {challenge.goal}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised">
                    <div
                      className={`h-2 rounded-full ${r.score >= challenge.goal ? "bg-success" : "bg-brand"}`}
                      style={{ width: `${Math.min(100, (r.score / challenge.goal) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <button
          type="button"
          onClick={() => navigator.share?.({ title: "Join me on Grip It", text: `Join ${s.groupName} on Grip It`, url: location.origin })}
          className="flex min-h-14 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted"
        >
          <UserPlus aria-hidden className="size-5" /> Invite a friend
        </button>
        <p className="-mt-2 text-center text-xs text-subtle">Demo friends are made up. Real invites arrive with accounts.</p>
      </div>
    </>
  );
}

function weeklyChallenge(s: ReturnType<typeof useStore.getState>) {
  const start = weekStart();
  const end = start.getTime() + 7 * DAY_MS;
  const goal = 60;
  const people = [{ id: "me", name: s.me?.name ?? "You" }, ...s.friends.map((f) => ({ id: f.id, name: f.name }))];
  const rows = people
    .map((p) => ({ userId: p.id, name: p.name, score: weeklyHardSets(s, p.id, start, end) }))
    .sort((a, b) => b.score - a.score);
  return { title: `First to ${goal} hard sets`, goal, rows, daysLeft: Math.max(1, Math.ceil((end - Date.now()) / DAY_MS)) };
}

const PODIUM = [
  { place: "1st", height: "h-28", ring: "from-rank-gold", text: "text-rank-gold", order: "order-2" },
  { place: "2nd", height: "h-20", ring: "from-rank-silver", text: "text-rank-silver", order: "order-1" },
  { place: "3rd", height: "h-14", ring: "from-rank-bronze", text: "text-rank-bronze", order: "order-3" },
];

function Podium({ rows, flagged }: { rows: ReturnType<typeof leaderboard>; flagged: Set<string> }) {
  return (
    <ol aria-label="Top three" className="card-hero flex items-end gap-2 rounded-xl px-3 pt-5">
      {rows.map((r, i) => {
        const p = PODIUM[i];
        const you = r.userId === "me";
        return (
          <li key={r.userId} className={`flex min-w-0 flex-1 flex-col items-center ${p.order}`} aria-label={`${p.place}: ${r.name}, ${r.display}`}>
            <span className={`relative mb-1.5 rounded-full bg-gradient-to-b ${p.ring} to-transparent p-[2px] ${i === 0 ? "shadow-[0_0_28px_rgb(255_200_87/0.45)]" : ""}`}>
              <span className={`grid place-items-center rounded-full font-display font-semibold ${i === 0 ? "size-16 text-2xl" : "size-12 text-xl"} ${you ? "bg-brand text-on-accent" : "bg-surface-raised text-text"}`}>
                {r.name.slice(0, 1)}
              </span>
              {i === 0 && <Crown aria-hidden className="absolute -top-4 left-1/2 size-5 -translate-x-1/2 text-rank-gold" />}
            </span>
            <span className="max-w-full truncate text-sm font-medium">
              {r.name}
              {you && <span className="ml-1 text-xs font-semibold uppercase text-accent">You</span>}
            </span>
            <span className="num-hero text-2xl leading-tight">{r.display}</span>
            {flagged.has(r.userId) && <TriangleAlert aria-label="Big jump, honour system" className="size-3.5 text-warning" />}
            <span
              className={`mt-1.5 flex w-full ${p.height} items-start justify-center rounded-t-lg border border-b-0 border-white/10 bg-gradient-to-b from-white/12 to-white/2 pt-1.5`}
            >
              <span className={`num-hero text-3xl ${p.text}`} aria-hidden>
                {i + 1}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
