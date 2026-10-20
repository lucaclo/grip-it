"use client";

import { ChevronRight, Flame, HelpCircle, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card, Citations, EmptyState, PageHeader, SectionTitle } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { allPRs, exerciseMap, streakOf, suggestionFor, userName, volumeKg, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { Suggestion } from "@/lib/science/progression";

export default function WorkoutSummary() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const w = s.workouts.find((x) => x.id === id);
  const ex = useMemo(() => exerciseMap(s), [s]);
  const prs = useMemo(() => allPRs(s).filter((p) => p.workoutId === id), [s, id]);
  const [why, setWhy] = useState<{ name: string; sug: Suggestion } | null>(null);

  if (!w) return <EmptyState icon={<HelpCircle className="size-10" />} title="Workout not found" body="It may have been reset." />;

  const mine = w.userId === "me";
  const number = workoutsOf(s, w.userId).length - workoutsOf(s, w.userId).findIndex((x) => x.id === w.id);
  const sets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
  const mins = Math.round((Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 60000);
  const streak = mine && s.me ? streakOf(s, "me", s.me.sessionsPerWeek) : 0;

  return (
    <>
      <PageHeader
        title={w.title}
        subtitle={`${mine ? "Your" : `${userName(s, w.userId)}'s`} workout #${number} · ${new Date(w.startedAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`}
      />

      {prs.length > 0 && (
        <section className="mb-4 rounded-lg bg-pr p-4 text-on-pr motion-safe:animate-pop" role="status">
          <div className="flex items-center gap-2">
            <Trophy aria-hidden className="size-6" />
            <p className="font-display text-xl font-bold uppercase">
              {prs.length} new PR{prs.length > 1 ? "s" : ""}!
            </p>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {prs.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 text-base">
                <span>{ex.get(p.exerciseId)?.name}</span>
                <span className="tabular font-semibold">
                  {p.kg} × {p.reps} · e1RM {p.e1rm} kg
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Time", `${mins} min`],
          ["Sets", String(sets)],
          ["Volume", `${Math.round(volumeKg(w))} kg`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-border bg-surface p-3">
            <dt className="text-xs text-subtle">{k}</dt>
            <dd className="tabular text-xl font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {mine && streak > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-surface p-3">
          <Flame aria-hidden className="size-5 text-accent" />
          <span>
            <span className="tabular font-semibold">{streak}-week</span> streak. Keep it going.
          </span>
        </p>
      )}

      {mine && (
        <>
          <SectionTitle>Next time, beat this</SectionTitle>
          <ul className="mb-4 flex flex-col gap-2">
            {w.exercises.map((e) => {
              const name = ex.get(e.exerciseId)?.name ?? "Exercise";
              // Suggestion as of just after this workout.
              const sug = suggestionFor(s, e.exerciseId, new Date(Date.parse(w.startedAt) + 1).toISOString());
              return (
                <li key={e.exerciseId}>
                  <button type="button" onClick={() => setWhy({ name, sug })} className="flex min-h-16 w-full items-center gap-3 rounded-md border border-border bg-surface px-3 text-left">
                    <span className="flex-1">
                      <span className="block text-base">{name}</span>
                      <span className="tabular block text-sm text-muted">
                        {sug.targetKg != null ? `${sug.targetKg} kg × ${sug.targetReps}` : "Log it again to get a target"}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sug.action === "add_weight" ? "bg-accent text-on-accent" : sug.action === "deload" ? "bg-warning text-on-pr" : "bg-surface-raised text-text"}`}
                    >
                      {sug.label}
                    </span>
                    <span className="text-sm text-subtle">Why?</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <SectionTitle>Exercises</SectionTitle>
      <Card className="mb-4 flex flex-col divide-y divide-border p-0">
        {w.exercises.map((e) => (
          <Link key={e.exerciseId} href={`/exercises/${e.exerciseId}`} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <span className="flex-1">
              <span className="block">{ex.get(e.exerciseId)?.name}</span>
              <span className="tabular block text-sm text-subtle">{e.sets.map((x) => `${x.kg}×${x.reps}`).join("  ")}</span>
            </span>
            {prs.some((p) => p.exerciseId === e.exerciseId) && <Medal aria-label="PR" className="size-5 text-pr" />}
            <ChevronRight aria-hidden className="size-5 text-subtle" />
          </Link>
        ))}
      </Card>

      <ButtonLink href="/home" variant="secondary" size="lg" className="w-full">
        Done
      </ButtonLink>

      <Sheet open={!!why} onClose={() => setWhy(null)} title={why?.name ?? ""}>
        {why && (
          <div className="flex flex-col gap-3">
            <p className="font-display text-xl font-semibold text-accent">{why.sug.label}</p>
            <p>{why.sug.reason}</p>
            <p className="text-sm text-subtle">
              Rule: double progression in your goal&apos;s rep range ({s.me?.goal === "strength" ? "3–6" : "6–12"} reps). Hit the top on every set, then add weight. Three sessions stuck means a short deload.
            </p>
            <Citations keys={why.sug.citationKeys} />
          </div>
        )}
      </Sheet>
    </>
  );
}
