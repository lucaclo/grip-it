"use client";

import { ChevronRight, Dumbbell, Flame, Scale, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, PageHeader, ProgressRing, SectionTitle } from "@/components/ui/bits";
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

      <div className="flex flex-col gap-4">
        {s.draft ? (
          <ButtonLink href="/log" size="lg" className="w-full">
            <Dumbbell aria-hidden className="size-5" /> Resume workout
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
            <Dumbbell aria-hidden className="size-5" /> Start workout
          </Button>
        )}

        <Link href="/compete" className="card-hero relative overflow-hidden rounded-xl p-5" aria-label={`This week: rank ${myRow?.rank ?? "none"}, ${streak}-week streak, ${hard} hard sets`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-text">This week</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="num-hero text-[4.5rem] leading-none">{myRow?.rank ? `#${myRow.rank}` : "—"}</span>
            <span className="mb-2.5 text-sm text-text">in {s.groupName}</span>
          </div>
          <ol className="mt-4 flex justify-between" aria-label="Training days this week">
            {week.map((d) => (
              <li key={d.key} className="flex flex-col items-center gap-1" aria-label={`${d.name}: ${d.trained ? "trained" : d.future ? "to come" : "rest"}`}>
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
                  {d.trained ? <Dumbbell className="size-4" /> : <span className={`size-1.5 rounded-full ${d.today ? "bg-text" : "bg-text/40"}`} />}
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
              <p className="num-hero mt-1 text-stat leading-none">{streak}</p>
              <p className="text-xs text-text">week streak</p>
            </div>
            <div className="rounded-md bg-black/25 p-3 backdrop-blur-sm">
              <Trophy aria-hidden className="size-5 text-volt" />
              <p className="num-hero mt-1 text-stat leading-none">{hard}</p>
              <p className="text-xs text-text">hard sets</p>
            </div>
          </div>
          <ChevronRight aria-hidden className="absolute top-5 right-4 size-5 text-text" />
        </Link>

        <Card>
          <SectionTitle
            action={
              <Link href="/body" className="flex min-h-11 items-center gap-1 text-sm text-accent">
                Log <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Today
          </SectionTitle>
          {t ? (
            <div className="flex justify-around">
              <ProgressRing label="Calories" unit="kcal" value={n?.kcal ?? 0} target={t.kcal} />
              <ProgressRing label="Protein" unit="g" value={n?.proteinG ?? 0} target={t.proteinG} />
            </div>
          ) : (
            <p className="text-muted">Log your weight to get targets.</p>
          )}
        </Card>

        <Card>
          <SectionTitle
            action={
              <Link href="/volume" className="flex min-h-11 items-center gap-1 text-sm text-accent">
                All muscles <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Needs work this week
          </SectionTitle>
          {needsWork.length ? (
            <ul className="flex flex-col gap-3">
              {needsWork.map(({ m, sets }) => (
                <li key={m}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{MUSCLE_LABEL[m]}</span>
                    <span className="tabular text-muted">
                      {sets} / {VOLUME_BAND.min} sets
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, (sets / VOLUME_BAND.min) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-success">Every muscle has 10+ hard sets this week. Nice.</p>
          )}
        </Card>

        <Link href="/body" className="flex min-h-14 items-center gap-3 card rounded-lg px-4">
          <Scale aria-hidden className="size-5 text-accent" />
          <span className="flex-1">Body weight and nutrition</span>
          <ChevronRight aria-hidden className="size-5 text-subtle" />
        </Link>
      </div>
    </>
  );
}
