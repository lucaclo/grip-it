"use client";

import { ChevronRight, Flame, Plus, Scale, Trophy } from "lucide-react";
import { BarbellIcon } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, Meter, PageHeader, SectionTitle } from "@/components/ui/bits";
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
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting}, ${me.name}`}
      />

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
          className="card-hero press relative overflow-hidden rounded-xl p-5" aria-label={`This week: rank ${myRow?.rank ?? "none"}, ${streak}-week streak, ${hard} hard sets`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">This week</p>
              <div className="mt-2 flex items-baseline gap-2">
                {myRow?.rank ? <CountUp value={myRow.rank} prefix="#" className="num-hero text-[3.75rem] leading-[0.85]" /> : <span className="num-hero text-[3.75rem] leading-[0.85]">—</span>}
              </div>
              <p className="mt-2 text-sm text-muted">in {s.groupName}</p>
            </div>
            <GoalRing done={sessionsThisWeek} goal={me.sessionsPerWeek} />
          </div>

          <ol className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Training days this week">
            {week.map((d, i) => (
              <li
                key={d.key}
                style={{ animationDelay: `${200 + i * 40}ms` }}
                className="flex flex-col items-center gap-1.5 motion-safe:animate-enter" aria-label={`${d.name}: ${d.trained ? "trained" : d.future ? "to come" : "rest"}`}>
                <span
                  className={`grid h-8 w-full place-items-center rounded-[10px] ${
                    d.trained
                      ? "bg-volt text-on-volt"
                      : d.today
                        ? "ring-1 ring-inset ring-text/60"
                        : d.future
                          ? "ring-1 ring-inset ring-white/[0.08]"
                          : "bg-white/[0.04]"
                  }`}
                  aria-hidden
                >
                  {d.trained ? <BarbellIcon className="size-[1.125rem]" strokeWidth={2.2} /> : d.today ? <span className="size-1.5 rounded-full bg-text" /> : null}
                </span>
                <span aria-hidden className={`text-[0.6875rem] ${d.today ? "font-semibold text-text" : "text-subtle"}`}>
                  {d.letter}
                </span>
              </li>
            ))}
          </ol>

          <dl className="mt-5 grid grid-cols-2 divide-x divide-white/[0.08] border-t border-white/[0.08] pt-4">
            <div className="flex items-center gap-3 pr-4">
              <Flame aria-hidden className="size-5 shrink-0 text-volt" />
              <div>
                <dd><CountUp value={streak} className="num-hero block text-[1.625rem] leading-none" /></dd>
                <dt className="mt-1 text-xs text-muted">week streak</dt>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4">
              <Trophy aria-hidden className="size-5 shrink-0 text-volt" />
              <div>
                <dd><CountUp value={hard} className="num-hero block text-[1.625rem] leading-none" /></dd>
                <dt className="mt-1 text-xs text-muted">hard sets</dt>
              </div>
            </div>
          </dl>
        </Link>

        <Card>
          <SectionTitle
            action={
              <Link href="/body" transitionTypes={["drill-in"]} className="press -my-3 flex min-h-11 items-center gap-0.5 text-sm text-accent">
                Details <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Today&apos;s food
          </SectionTitle>
          {t ? (
            <>
              <div className="flex flex-col gap-4">
                <Meter label="Calories" unit="kcal" value={n?.kcal ?? 0} target={t.kcal} />
                <Meter label="Protein" unit="g" value={n?.proteinG ?? 0} target={t.proteinG} delay={120} />
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
              <Link href="/volume" transitionTypes={["drill-in"]} className="press -my-3 flex min-h-11 items-center gap-0.5 text-sm text-accent">
                All muscles <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Needs work this week
          </SectionTitle>
          {needsWork.length ? (
            <ul className="flex flex-col gap-4">
              {needsWork.map(({ m, sets }, i) => (
                <li key={m}>
                  <Link href="/volume" transitionTypes={["drill-in"]} className="press block" aria-label={`${MUSCLE_LABEL[m]}: ${sets} of ${VOLUME_BAND.min} sets`}>
                    <Meter label={MUSCLE_LABEL[m]} unit="sets" value={sets} target={VOLUME_BAND.min} delay={i * 100} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-success">Every muscle has 10+ hard sets this week. Nice.</p>
          )}
        </Card>

        <Link href="/body" transitionTypes={["drill-in"]} className="press card flex min-h-14 items-center gap-3 rounded-lg px-4">
          <span className="grid size-8 place-items-center rounded-[9px] bg-accent/15">
            <Scale aria-hidden className="size-[1.125rem] text-accent" />
          </span>
          <span className="flex-1 font-medium">Body weight and nutrition</span>
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
  const size = 88;
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / Math.max(1, goal));
  const met = done >= goal;
  return (
    <div className={className} role="img" aria-label={`${done} of ${goal} sessions this week${met ? ", goal met" : ""}`}>
      <div className={`relative ${met ? "motion-safe:animate-[breathe_3s_ease-in-out_infinite]" : ""}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 88 88" className="-rotate-90" aria-hidden>
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="6" />
          {/* one tick per planned session */}
          {Array.from({ length: goal }, (_, i) => (
            <line
              key={i}
              x1="44"
              y1="3"
              x2="44"
              y2="9"
              stroke="var(--color-bg)"
              strokeWidth="2"
              transform={`rotate(${(i / goal) * 360} 44 44)`}
            />
          ))}
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="var(--color-volt)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={shown ? c * (1 - pct) : c}
            className="transition-[stroke-dashoffset] duration-[1400ms] ease-[var(--ease-expo)]"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <span className="num-hero text-[1.625rem] leading-none">
              <CountUp value={done} />
              <span className="text-base text-subtle">/{goal}</span>
            </span>
            <span className="mt-0.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">{met ? "goal hit" : "sessions"}</span>
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
    <div className="mt-5 border-t border-white/[0.06] pt-4">
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
            className="press flex min-h-12 shrink-0 flex-col items-start justify-center rounded-[12px] bg-white/[0.05] px-3.5 text-left ring-1 ring-inset ring-white/[0.06]"
          >
            <span className="flex items-center gap-1 text-sm font-semibold"><Plus aria-hidden className="size-3.5 text-accent" strokeWidth={2.6} />{q.label}</span>
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
