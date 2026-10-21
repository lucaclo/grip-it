"use client";

import { ChevronRight, Flame, Scale, Trophy } from "lucide-react";
import { BarbellIcon } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, PageHeader, ProgressRing, SectionTitle } from "@/components/ui/bits";
import { CountUp } from "@/components/ui/motion";
import { leaderboard, myTargets, streakOf, weekStart, weeklyHardSets, weeklyVolume } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { MUSCLE_LABEL, MUSCLES, VOLUME_BAND, volumeStatus } from "@/lib/science/volume";

export default function Home() {
  const s = useStore();
  const router = useRouter();
  const me = s.me!;
  const t = useMemo(() => myTargets(s), [s]);
  const today = new Date().toISOString().slice(0, 10);
  const n = s.nutrition.find((x) => x.day === today);
  const streak = streakOf(s, "me", me.sessionsPerWeek);
  const hard = weeklyHardSets(s, "me");
  const sessionsThisWeek = s.workouts.filter((w) => w.userId === "me" && Date.parse(w.startedAt) >= weekStart().getTime()).length;
  const [now] = useState(() => new Date());
  // Mon–Sun of this week, marking days with at least one workout.
  const week = useMemo(() => {
    const start = weekStart(now);
    const trained = new Set(s.workouts.filter((w) => w.userId === "me").map((w) => new Date(w.startedAt).toDateString()));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        key: d.toDateString(),
        letter: d.toLocaleDateString("en-GB", { weekday: "narrow" }),
        name: d.toLocaleDateString("en-GB", { weekday: "long" }),
        trained: trained.has(d.toDateString()),
        today: d.toDateString() === now.toDateString(),
        future: d > now,
      };
    });
  }, [s.workouts, now]);
  const vol = useMemo(() => weeklyVolume(s, "me"), [s]);
  const needsWork = MUSCLES.map((m) => ({ m, sets: vol[m] ?? 0 }))
    .filter((x) => volumeStatus(x.sets) === "under")
    .sort((a, b) => a.sets - b.sets)
    .slice(0, 3);
  const board = useMemo(() => leaderboard(s, "hard_sets"), [s]);
  const myRow = board.find((r) => r.userId === "me");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <>
      <PageHeader title={`${greeting}, ${me.name}`} subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="stagger flex flex-col gap-4">
        {s.draft ? (
          <ButtonLink href="/log" size="lg" className="w-full">
            <BarbellIcon aria-hidden className="size-5" /> Resume workout
          </ButtonLink>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              s.startWorkout();
              router.push("/log");
            }}
          >
            <BarbellIcon aria-hidden className="size-5" /> Start workout
          </Button>
        )}

        <Link href="/compete" transitionTypes={["tab-forward"]}
          className="card-hero shine shine-soft press relative overflow-hidden rounded-xl p-5" aria-label={`This week: rank ${myRow?.rank ?? "none"}, ${streak}-week streak, ${hard} hard sets`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-text">This week</p>
          <div className="mt-1 flex items-end gap-2">
            {myRow?.rank ? <CountUp value={myRow.rank} prefix="#" className="num-hero text-[4.5rem] leading-none" /> : <span className="num-hero text-[4.5rem] leading-none">—</span>}
            <span className="mb-2.5 text-sm text-text">in {s.groupName}</span>
          </div>
          <ol className="mt-4 flex justify-between" aria-label="Training days this week">
            {week.map((d, i) => (
              <li
                key={d.key}
                style={{ animationDelay: `${250 + i * 55}ms` }}
                className="flex flex-col items-center gap-1 motion-safe:animate-pop" aria-label={`${d.name}: ${d.trained ? "trained" : d.future ? "to come" : "rest"}`}>
                <span
                  className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${
                    d.trained
                      ? "bg-volt text-on-volt shadow-glow-volt"
                      : d.today
                        ? "border-2 border-dashed border-text/70 text-text"
                        : d.future
                          ? "border border-white/20 text-text"
                          : "bg-black/25 text-text/80"
                  }`}
                  aria-hidden
                >
                  {d.trained ? <BarbellIcon className="size-5" strokeWidth={2.2} /> : <span className={`size-1.5 rounded-full ${d.today ? "bg-text" : "bg-text/40"}`} />}
                </span>
                <span aria-hidden className={`text-[0.6875rem] ${d.today ? "font-semibold text-text" : "text-text"}`}>
                  {d.letter}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-black/25 p-3 backdrop-blur-sm">
              <Flame aria-hidden className="size-5 text-volt" />
              <CountUp value={streak} className="num-hero mt-1 block text-stat leading-none" />
              <p className="text-xs text-text">week streak</p>
            </div>
            <div className="rounded-md bg-black/25 p-3 backdrop-blur-sm">
              <Trophy aria-hidden className="size-5 text-volt" />
              <CountUp value={hard} className="num-hero mt-1 block text-stat leading-none" />
              <p className="text-xs text-text">hard sets</p>
            </div>
          </div>
          <GoalRing done={sessionsThisWeek} goal={me.sessionsPerWeek} className="absolute top-5 right-5" />
        </Link>

        <Card>
          <SectionTitle
            action={
              <Link href="/body" transitionTypes={["drill-in"]} className="press flex min-h-11 items-center gap-1 text-sm text-accent">
                Log <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Today
          </SectionTitle>
          {t ? (
            <>
              <div className="flex justify-around">
                <ProgressRing label="Calories" unit="kcal" value={n?.kcal ?? 0} target={t.kcal} />
                <ProgressRing label="Protein" unit="g" value={n?.proteinG ?? 0} target={t.proteinG} />
              </div>
              <QuickAdd />
            </>
          ) : (
            <p className="text-muted">Log your weight to get targets.</p>
          )}
        </Card>

        <Card>
          <SectionTitle
            action={
              <Link href="/volume" transitionTypes={["drill-in"]} className="press flex min-h-11 items-center gap-1 text-sm text-accent">
                All muscles <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Needs work this week
          </SectionTitle>
          {needsWork.length ? (
            <ul className="grid grid-cols-3 gap-2">
              {needsWork.map(({ m, sets }, i) => (
                <li key={m}>
                  <Link
                    href="/volume"
                    transitionTypes={["drill-in"]}
                    className="press flex flex-col items-center gap-1.5 rounded-md bg-surface-raised/60 px-2 py-3 text-center"
                    aria-label={`${MUSCLE_LABEL[m]}: ${sets} of ${VOLUME_BAND.min} sets`}
                  >
                    <MiniRing pct={sets / VOLUME_BAND.min} delay={i * 120} label={String(sets)} />
                    <span className="text-xs leading-tight text-text">{MUSCLE_LABEL[m]}</span>
                    <span className="text-[0.6875rem] text-subtle">of {VOLUME_BAND.min} sets</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-success">Every muscle has 10+ hard sets this week. Nice.</p>
          )}
        </Card>

        <Link href="/body" transitionTypes={["drill-in"]} className="press flex min-h-14 items-center gap-3 card rounded-lg px-4">
          <Scale aria-hidden className="size-5 text-accent" />
          <span className="flex-1">Body weight and nutrition</span>
          <ChevronRight aria-hidden className="size-5 text-subtle" />
        </Link>
      </div>
    </>
  );
}

/** This week's sessions against your own target: fills on load and breathes once the goal is met. */
function GoalRing({ done, goal, className = "" }: { done: number; goal: number; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const size = 104;
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / Math.max(1, goal));
  const met = done >= goal;
  return (
    <div className={className} role="img" aria-label={`${done} of ${goal} sessions this week${met ? ", goal met" : ""}`}>
      <div className={`relative ${met ? "motion-safe:animate-[breathe_3s_ease-in-out_infinite]" : ""}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 104 104" className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id="goal-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-volt)" />
              <stop offset="100%" stopColor="#9fd12a" />
            </linearGradient>
          </defs>
          <circle cx="52" cy="52" r={r} fill="none" stroke="rgb(0 0 0 / 0.3)" strokeWidth="9" />
          {/* one tick per planned session */}
          {Array.from({ length: goal }, (_, i) => (
            <line
              key={i}
              x1="52"
              y1="4"
              x2="52"
              y2="12"
              stroke="rgb(255 255 255 / 0.35)"
              strokeWidth="2"
              transform={`rotate(${(i / goal) * 360} 52 52)`}
            />
          ))}
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke="url(#goal-ring)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={shown ? c * (1 - pct) : c}
            className="drop-shadow-[0_0_10px_rgb(212_255_58/0.55)] transition-[stroke-dashoffset] duration-[1400ms] ease-[var(--ease-expo)]"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <span className="num-hero text-3xl leading-none">
              <CountUp value={done} />
              <span className="text-lg text-text">/{goal}</span>
            </span>
            <span className="block text-[0.6875rem] uppercase tracking-wider text-text">{met ? "goal hit" : "sessions"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const QUICK = [
  { label: "Shake", kcal: 120, proteinG: 25 },
  { label: "Snack", kcal: 250, proteinG: 10 },
  { label: "Meal", kcal: 600, proteinG: 40 },
  { label: "Big meal", kcal: 900, proteinG: 50 },
] as const;

/** One-tap estimates for today's totals, with an undo for the last tap. Exact numbers live on the Body screen. */
function QuickAdd() {
  const add = useStore((s) => s.addNutrition);
  const [last, setLast] = useState<(typeof QUICK)[number] | null>(null);
  const [taps, setTaps] = useState(0); // re-keys the confirmation so it animates on every tap
  useEffect(() => {
    if (!last) return;
    const t = setTimeout(() => setLast(null), 6000);
    return () => clearTimeout(t);
  }, [last]);
  return (
    <div className="mt-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Quick add food">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => {
              add(q);
              setLast(q);
              setTaps((n) => n + 1);
            }}
            aria-label={`Add ${q.label.toLowerCase()}: ${q.kcal} kcal, ${q.proteinG} g protein`}
            className="press flex min-h-12 shrink-0 flex-col items-start justify-center rounded-md border border-border bg-surface-raised/70 px-3 text-left"
          >
            <span className="text-sm font-semibold">+ {q.label}</span>
            <span className="tabular text-xs text-subtle">
              {q.kcal} kcal · {q.proteinG} g
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex min-h-11 items-center justify-between text-sm" role="status" aria-live="polite">
        {last ? (
          <>
            <span key={taps} className="text-success motion-safe:animate-rise">
              Added {last.label.toLowerCase()}: {last.kcal} kcal, {last.proteinG} g protein
            </span>
            <button
              type="button"
              onClick={() => {
                add({ kcal: -last.kcal, proteinG: -last.proteinG });
                setLast(null);
              }}
              className="min-h-11 px-2 font-semibold text-accent"
            >
              Undo
            </button>
          </>
        ) : (
          <span className="text-subtle">Rough estimates. Exact totals on the Body screen.</span>
        )}
      </div>
    </div>
  );
}

function MiniRing({ pct, label, delay = 0 }: { pct: number; label: string; delay?: number }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-14 place-items-center" aria-hidden>
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgb(0 0 0 / 0.3)" strokeWidth="5" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={shown ? c * (1 - Math.min(1, pct)) : c}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-[var(--ease-expo)]"
          style={{ transitionDelay: `${delay}ms` }}
        />
      </svg>
      <span className="num-hero text-lg">{label}</span>
    </span>
  );
}
