"use client";

import { ChevronRight, Flame, HelpCircle, Medal, Pencil, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, Citations, EmptyState, PageHeader, SectionTitle } from "@/components/ui/bits";
import { Confetti } from "@/components/ui/motion";
import { PlateBar } from "@/components/plate-bar";
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
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busyNote, setBusyNote] = useState(false);
  // Fire confetti only when arriving straight from saving (?celebrate=1), then drop the flag from the URL.
  const celebrate = useSearchParams().has("celebrate");
  useEffect(() => {
    if (!celebrate) return;
    // Drop the flag after the burst so a refresh doesn't celebrate again.
    const t = setTimeout(() => history.replaceState(null, "", location.pathname), 2500);
    return () => clearTimeout(t);
  }, [celebrate]);

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

      <Confetti fire={celebrate && prs.length > 0} />
      {prs.length > 0 && (
        <section className="mb-4 rounded-xl bg-gradient-to-br from-pr via-[#ffb38a] to-accent-2 p-4 text-on-pr shadow-[0_14px_40px_-12px_rgb(255_200_87/0.6)] motion-safe:animate-pop" role="status">
          <div className="flex items-center gap-2">
            <Trophy aria-hidden className="size-6" />
            <p className="font-display text-xl font-bold uppercase">
              {prs.length} new PR{prs.length > 1 ? "s" : ""}!
            </p>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {prs.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                <span className="flex justify-between gap-2 text-base">
                  <span>{ex.get(p.exerciseId)?.name}</span>
                  <span className="num-hero text-lg">
                    {p.kg} × {p.reps} · e1RM {p.e1rm} kg
                  </span>
                </span>
                {ex.get(p.exerciseId)?.equipment === "barbell" && (
                  <span className="block rounded-md bg-bg/85 py-2">
                    <PlateBar kg={p.kg} />
                  </span>
                )}
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
          <div key={k} className="card rounded-md p-3">
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
                  <button type="button" onClick={() => setWhy({ name, sug })} className="flex min-h-16 w-full items-center gap-3 card rounded-md px-3 text-left">
                    <span className="flex-1">
                      <span className="block text-base">{name}</span>
                      <span className="tabular block text-sm text-muted">
                        {sug.targetKg != null ? `${sug.targetKg} kg × ${sug.targetReps}` : "Log it again to get a target"}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sug.action === "add_weight" ? "bg-volt text-on-volt" : sug.action === "deload" ? "bg-warning text-on-pr" : "bg-surface-raised text-text"}`}
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
          <Link key={e.exerciseId} href={`/exercises/${e.exerciseId}`} transitionTypes={["drill-in"]} className="press flex min-h-14 items-center gap-3 px-4 py-2">
            <span className="flex-1">
              <span className="block">{ex.get(e.exerciseId)?.name}</span>
              <span className="tabular block text-sm text-subtle">{e.sets.map((x) => `${x.kg}×${x.reps}`).join("  ")}</span>
            </span>
            {prs.some((p) => p.exerciseId === e.exerciseId) && <Medal aria-label="PR" className="size-5 text-pr" />}
            <ChevronRight aria-hidden className="size-5 text-subtle" />
          </Link>
        ))}
      </Card>

      {mine && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (s.editWorkout(w.id)) router.push("/log");
              else setBusyNote(true);
            }}
          >
            <Pencil aria-hidden className="size-4" /> Edit
          </Button>
          <Button variant="secondary" className="text-danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 aria-hidden className="size-4" /> Delete
          </Button>
        </div>
      )}
      {busyNote && (
        <p role="status" className="mb-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          Finish or discard the workout you&apos;re logging first, then edit this one.
        </p>
      )}
      <ButtonLink href={mine ? "/log" : "/feed"} variant="secondary" size="lg" className="w-full">
        Done
      </ButtonLink>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete workout?">
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            &ldquo;{w.title}&rdquo; and its sets are removed for good. PRs and leaderboards update to match.
          </p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              s.deleteWorkout(w.id);
              router.replace("/log");
            }}
          >
            <Trash2 aria-hidden className="size-5" /> Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>

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
