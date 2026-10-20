"use client";

import { ChevronRight, Dumbbell, Flame, Scale, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, PageHeader, ProgressRing, SectionTitle } from "@/components/ui/bits";
import { leaderboard, myTargets, streakOf, weeklyHardSets, weeklyVolume } from "@/lib/data/selectors";
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

        <div className="grid grid-cols-3 gap-2">
          <Link href="/compete" className="rounded-lg border border-border bg-surface p-3">
            <Trophy aria-hidden className="size-5 text-accent" />
            <p className="tabular mt-1 text-stat font-semibold leading-none">{myRow?.rank ? `#${myRow.rank}` : "—"}</p>
            <p className="text-xs text-muted">this week</p>
          </Link>
          <div className="rounded-lg border border-border bg-surface p-3">
            <Flame aria-hidden className="size-5 text-accent" />
            <p className="tabular mt-1 text-stat font-semibold leading-none">{streak}</p>
            <p className="text-xs text-muted">week streak</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <Dumbbell aria-hidden className="size-5 text-accent" />
            <p className="tabular mt-1 text-stat font-semibold leading-none">{hard}</p>
            <p className="text-xs text-muted">hard sets</p>
          </div>
        </div>

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
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, (sets / VOLUME_BAND.min) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-success">Every muscle has 10+ hard sets this week. Nice.</p>
          )}
        </Card>

        <Link href="/body" className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface px-4">
          <Scale aria-hidden className="size-5 text-accent" />
          <span className="flex-1">Body weight and nutrition</span>
          <ChevronRight aria-hidden className="size-5 text-subtle" />
        </Link>
      </div>
    </>
  );
}
