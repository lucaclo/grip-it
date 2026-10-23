"use client";

import { Crown, Flag, Medal, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HardSetsInfo, PowerliftingInfo, VolumeBoardInfo } from "@/components/explainers";
import { FriendsCard } from "@/components/friends/friends-card";
import { Avatar, PageHeader, SectionTitle } from "@/components/ui/bits";
import { InfoButton } from "@/components/ui/info";
import { CountUp } from "@/components/ui/motion";
import { allPRs, DAY_MS, leaderboard, weekStart, weeklyHardSets, type Metric } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { E1RM_CITATIONS } from "@/lib/science/strength";

// One short line under the board says what's being ranked; the "i" holds the full explanation.
const METRICS: { value: Metric; label: string; caption: string; info: ReactNode }[] = [
  { value: "hard_sets", label: "Hard sets", caption: "Hard sets this week, Monday to Sunday.", info: <HardSetsInfo /> },
  { value: "volume", label: "Volume", caption: "Total kg lifted this week (weight × reps).", info: <VolumeBoardInfo /> },
  {
    value: "pct_improvement",
    label: "% Gain",
    caption: "Average strength gain since your first two weeks.",
    info: (
      <InfoButton title="% Gain" label="How % gain works" keys={E1RM_CITATIONS}>
        <p>
          For every lift, your best estimated 1-rep max now is compared with your best in your first 14 days on it. The
          board shows the average gain across your lifts.
        </p>
        <p className="text-muted">
          It&apos;s fair for every size and level: a beginner adding 20% beats a strong lifter adding 5%. New lifts are
          &ldquo;calibrating&rdquo; for 14 days before they count.
        </p>
      </InfoButton>
    ),
  },
  {
    value: "dots",
    label: "Powerlifting",
    caption: "Squat + bench + deadlift maxes, adjusted for body weight (DOTS) so lighter and heavier lifters compete fairly.",
    info: <PowerliftingInfo />,
  },
  {
    value: "streak",
    label: "Streak",
    caption: "Weeks in a row hitting your own sessions-per-week goal.",
    info: (
      <InfoButton title="Streak" label="How streaks work">
        <p>
          A week counts when you hit your own goal for sessions per week (set on Me). The streak is how many weeks in a row
          you&apos;ve done it.
        </p>
        <p className="text-muted">This week joins the streak once you hit the goal; it never breaks it early.</p>
      </InfoButton>
    ),
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
      <div className="stagger flex flex-col gap-4">
        <MetricTabs value={metric} onChange={setMetric} />

        {podium.length >= 2 && <Podium key={metric} rows={podium} flagged={flaggedUsers} />}

        <ol className="card divide-y divide-white/[0.06] overflow-hidden rounded-lg" aria-label={`${m.label} leaderboard${podium.length >= 2 ? ", from 4th" : ""}`}>
          {rest.map((r) => {
            const you = r.userId === "me";
            return (
              <li
                key={r.userId}
                className={`relative flex min-h-16 items-center gap-3 px-4 ${you ? "bg-accent/[0.08]" : ""}`}
              >
                <span className="w-8 text-center">
                  {r.rank != null && r.rank <= 3 ? (
                    <span className={`flex flex-col items-center ${MEDAL[r.rank - 1]}`}>
                      <Medal aria-hidden className="size-5" />
                      <span className="tabular text-sm font-semibold">{r.rank}</span>
                    </span>
                  ) : (
                    <span className="tabular text-lg font-semibold text-subtle">{r.rank ?? "–"}</span>
                  )}
                </span>
                <Avatar name={r.name} you={you} />
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-base font-medium">
                    {r.name}
                    {you && <span className="rounded-[5px] bg-accent/15 px-1.5 py-px text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-accent">You</span>}
                    {flaggedUsers.has(r.userId) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning/50 px-1.5 text-xs text-warning" title="A recent PR jumped more than 15%. Honour system.">
                        <TriangleAlert aria-hidden className="size-3" /> big jump
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-subtle">{r.note}</span>
                </span>
                <span className={`num-hero text-[1.625rem] ${r.score == null ? "text-subtle" : ""}`}>{r.display}</span>
              </li>
            );
          })}
        </ol>

        <div className="-mt-1 flex items-start gap-2 px-1">
          <p className="flex-1 text-sm text-muted">{m.caption}</p>
          <span className="pt-0.5">{m.info}</span>
        </div>

        <section>
          <SectionTitle>Weekly challenge</SectionTitle>
          <RaceTrack challenge={challenge} />
        </section>

        <FriendsCard />
        {!s.account?.group && s.friends.length > 0 && (
          <p className="-mt-2 text-center text-xs text-subtle">The people above are made-up demo friends.</p>
        )}
      </div>
    </>
  );
}

/** Leaderboard picker: pills that scroll sideways on narrow phones, the chosen one kept in view. */
function MetricTabs({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [value]);
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="Leaderboard"
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {METRICS.map((x) => {
        const on = x.value === value;
        return (
          <button
            key={x.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(x.value)}
            className={`min-h-10 shrink-0 snap-start rounded-full px-4 text-sm font-medium transition-colors duration-200 ${on ? "bg-text text-bg" : "bg-white/[0.05] text-muted ring-1 ring-inset ring-white/[0.06]"}`}
          >
            {x.label}
          </button>
        );
      })}
    </div>
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
  { place: "1st", height: "h-28", ring: "from-rank-gold", text: "text-rank-gold", order: "order-2", delay: 420 },
  { place: "2nd", height: "h-20", ring: "from-rank-silver", text: "text-rank-silver", order: "order-1", delay: 220 },
  { place: "3rd", height: "h-14", ring: "from-rank-bronze", text: "text-rank-bronze", order: "order-3", delay: 60 },
];

function Podium({ rows, flagged }: { rows: ReturnType<typeof leaderboard>; flagged: Set<string> }) {
  return (
    <ol aria-label="Top three" className="card-hero shine flex items-end gap-2 rounded-xl px-3 pt-7">
      {rows.map((r, i) => {
        const p = PODIUM[i];
        const you = r.userId === "me";
        return (
          <li key={r.userId} className={`flex min-w-0 flex-1 flex-col items-center ${p.order}`} aria-label={`${p.place}: ${r.name}, ${r.display}`}>
            <span className={`relative mb-1.5 rounded-full bg-gradient-to-b ${p.ring} to-transparent p-[2px] `}>
              <span className={`grid place-items-center rounded-full font-display font-semibold ${i === 0 ? "size-16 text-2xl" : "size-12 text-xl"} ${you ? "bg-surface-raised text-accent" : "bg-surface-raised text-text"}`}>
                {r.name.slice(0, 1)}
              </span>
              {i === 0 && (
                <Crown
                  aria-hidden
                  style={{ animationDelay: `${p.delay + 500}ms` }}
                  className="absolute -top-4 left-1/2 size-5 -translate-x-1/2 text-rank-gold motion-safe:animate-drop"
                />
              )}
            </span>
            <span className="max-w-full truncate text-sm font-medium">
              {r.name}
              {you && <span className="ml-1 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-accent">You</span>}
            </span>
            <span className="num-hero text-2xl leading-tight">
              {r.score != null && /^[+-]?\d/.test(r.display) ? (
                <CountUp
                  value={r.score}
                  decimals={r.display.includes(".") ? 1 : 0}
                  prefix={r.display.startsWith("+") ? "+" : ""}
                  suffix={r.display.endsWith("%") ? "%" : ""}
                />
              ) : (
                r.display
              )}
            </span>
            {flagged.has(r.userId) && <TriangleAlert aria-label="Big jump, honour system" className="size-3.5 text-warning" />}
            <span
              style={{ animationDelay: `${p.delay}ms` }}
              className={`mt-1.5 flex w-full ${p.height} origin-bottom items-start justify-center rounded-t-[12px] border border-b-0 border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.01] pt-1.5 motion-safe:animate-grow`}
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

/** Weekly challenge as a race: everyone's avatar runs along their own lane toward the finish flag. */
function RaceTrack({ challenge }: { challenge: ReturnType<typeof weeklyChallenge> }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const leader = challenge.rows[0];
  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-lg font-semibold">{challenge.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {leader && leader.score > 0 ? `${leader.name} leads with ${leader.score}` : "Nobody's started yet"} ·{" "}
            {challenge.daysLeft} day{challenge.daysLeft === 1 ? "" : "s"} left
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-[10px] bg-volt/12"><Flag aria-hidden className="size-[1.125rem] text-volt" /></span>
      </div>
      <ol className="mt-4 flex flex-col gap-3" aria-label="Race standings">
        {challenge.rows.map((r, i) => {
          const pct = Math.min(1, r.score / challenge.goal);
          const you = r.userId === "me";
          const finished = r.score >= challenge.goal;
          return (
            <li key={r.userId} aria-label={`${i + 1}. ${r.name}: ${r.score} of ${challenge.goal} sets`}>
              <div aria-hidden className="relative h-9">
                {/* lane */}
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.07]" />
                <span
                  className={`absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-[width] duration-[1600ms] ease-[var(--ease-expo)] ${finished ? "bg-success" : you ? "bg-accent" : "bg-white/25"}`}
                  style={{ width: go ? `calc((100% - 2.25rem) * ${pct} + 1.125rem)` : "1.125rem", transitionDelay: `${i * 90}ms` }}
                />
                {/* finish line */}
                <span className="absolute right-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[repeating-linear-gradient(0deg,var(--color-text)_0_3px,transparent_3px_6px)] opacity-50" />
                {/* runner */}
                <span
                  className="absolute top-0 grid size-9 place-items-center rounded-full transition-[left] duration-[1600ms] ease-[var(--ease-expo)]"
                  style={{ left: go ? `calc((100% - 2.25rem) * ${pct})` : "0px", transitionDelay: `${i * 90}ms` }}
                >
                  <span
                    className={`grid size-9 place-items-center rounded-full font-display text-sm font-semibold ring-2 ${
                      you ? "bg-accent text-on-accent ring-surface" : finished ? "bg-success text-on-accent ring-surface" : "bg-surface-raised text-text ring-surface"
                    }`}
                  >
                    {r.name.slice(0, 1)}
                  </span>
                </span>
              </div>
              <div className="mt-0.5 flex justify-between text-xs text-muted">
                <span className={you ? "font-semibold text-text" : ""}>
                  {i + 1}. {r.name}
                </span>
                <span className="tabular">
                  {r.score}/{challenge.goal}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
