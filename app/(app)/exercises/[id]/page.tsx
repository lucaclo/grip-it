"use client";

import { LineChart as ChartIcon, Medal, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExerciseAnatomy } from "@/components/anatomy/exercise-anatomy";
import { PlateBar } from "@/components/plate-bar";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/bits";
import { CountUp } from "@/components/ui/motion";
import { allPRs, exerciseMap, suggestionFor, workoutsOf } from "@/lib/data/selectors";
import type { Exercise } from "@/lib/data/exercises";
import { useStore } from "@/lib/data/store";
import { gripTag } from "@/lib/science/grips";
import { e1rm } from "@/lib/science/strength";
import { MUSCLE_LABEL } from "@/lib/science/volume";

export default function ExerciseHistory() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const def = exerciseMap(s).get(id);
  const [table, setTable] = useState(false);

  const sessions = useMemo(
    () =>
      workoutsOf(s, "me")
        .filter((w) => w.exercises.some((e) => e.exerciseId === id))
        .reverse()
        .map((w) => {
          const logged = w.exercises.find((e) => e.exerciseId === id)!;
          const sets = logged.sets.filter((x) => x.type !== "warmup");
          let best = { kg: 0, reps: 0, v: 0 };
          for (const x of sets) {
            const v = e1rm(x.kg, x.reps) ?? 0;
            if (v > best.v) best = { kg: x.kg, reps: x.reps, v };
          }
          return { date: w.startedAt.slice(5, 10), at: w.startedAt, e1rm: best.v, best, sets, grip: logged.grip };
        }),
    [s, id],
  );
  const prs = useMemo(() => allPRs(s).filter((p) => p.userId === "me" && p.exerciseId === id).reverse(), [s, id]);
  // Next target on the grip you used last.
  const next = useMemo(() => suggestionFor(s, id, undefined, sessions[sessions.length - 1]?.grip), [s, id, sessions]);

  if (!def) return <EmptyState icon={<ChartIcon className="size-10" />} title="Exercise not found" body="" />;

  const first = sessions[0]?.e1rm ?? 0;
  const top = sessions.reduce((a, x) => (x.e1rm > a.e1rm ? x : a), sessions[0] ?? { e1rm: 0, best: { kg: 0, reps: 0, v: 0 } });
  const latest = sessions[sessions.length - 1]?.e1rm ?? 0;
  const change = Math.round((latest - first) * 10) / 10;
  const Trend = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <>
      <PageHeader back="/log" title={def.name} subtitle={`${MUSCLE_LABEL[def.primary]} · ${def.equipment}`} />
      {sessions.length === 0 ? (
        <div className="stagger flex flex-col gap-4">
          <EmptyState icon={<ChartIcon className="size-10" />} title="Not logged yet" body="Add this exercise to a workout and your history starts here." />
          <MusclesCard exercise={def} />
        </div>
      ) : (
        <div className="stagger flex flex-col gap-4">
          <section className="card-hero shine shine-soft rounded-xl p-5">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">Best estimated 1RM</p>
            <p className="mt-1 flex items-end gap-3">
              <CountUp value={top.e1rm} decimals={top.e1rm % 1 ? 1 : 0} suffix=" kg" duration={1200} className="num-hero text-[3.5rem] leading-none" />
              {sessions.length > 1 && (
                <span className={`mb-1.5 flex items-center gap-1 text-sm font-semibold ${change >= 0 ? "text-volt" : "text-warning"}`}>
                  <Trend aria-hidden className="size-4" />
                  {change >= 0 ? "+" : ""}
                  {change} kg
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-text">
              Best set {top.best.kg} kg × {top.best.reps} · {sessions.length} session{sessions.length === 1 ? "" : "s"} · {prs.length} PR
              {prs.length === 1 ? "" : "s"}
            </p>
            {def.equipment === "barbell" && top.best.kg > 0 && (
              <div className="mt-3 rounded-md bg-black/25 py-2">
                <PlateBar kg={top.best.kg} />
              </div>
            )}
            {next.targetKg != null && (
              <p className="mt-3 flex items-center gap-2 rounded-md border border-volt/30 bg-volt/10 px-3 py-2 text-sm">
                <Target aria-hidden className="size-4 text-volt" />
                <span className="flex-1">
                  Next time <span className="num-hero text-base text-volt">{next.targetKg} kg × {next.targetReps}</span>
                </span>
                <span className="rounded-full bg-volt/15 px-2 py-0.5 text-xs font-semibold text-volt">{next.label}</span>
              </p>
            )}
          </section>

          <MusclesCard exercise={def} />

          {sessions.length >= 2 ? (
            <Card>
              <SectionTitle
                action={
                  <button type="button" onClick={() => setTable(!table)} className="min-h-11 text-sm text-accent">
                    {table ? "Show chart" : "Show table"}
                  </button>
                }
              >
                Trend
              </SectionTitle>
              {table ? (
                <table className="w-full text-sm">
                  <thead className="text-left text-subtle">
                    <tr>
                      <th className="py-1 font-medium">Date</th>
                      <th className="py-1 font-medium">e1RM</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {sessions.map((x, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5">{x.date}</td>
                        <td className="py-1.5">{x.e1rm} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-52" aria-hidden>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sessions} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="e1rm-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="e1rm-line" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--color-accent)" />
                          <stop offset="100%" stopColor="var(--color-accent-2)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 6" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "var(--color-subtle)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fill: "var(--color-subtle)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                      <Area dataKey="e1rm" type="monotone" fill="url(#e1rm-fill)" stroke="none" animationDuration={1200} />
                      <Line
                        dataKey="e1rm"
                        type="monotone"
                        stroke="url(#e1rm-line)"
                        strokeWidth={3.5}
                        dot={{ r: 3.5, fill: "var(--color-accent-2)", strokeWidth: 0 }}
                        animationDuration={1400}
                        style={{ filter: "drop-shadow(0 0 8px rgb(183 156 255 / 0.6))" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          ) : (
            <p className="text-center text-sm text-muted">One more session and you&apos;ll see your trend.</p>
          )}

          {prs.length > 0 && (
            <section>
              <SectionTitle>PR timeline</SectionTitle>
              <ol className="relative ml-3 flex flex-col gap-4 border-l-2 border-pr/40 pl-5">
                {prs.map((p) => (
                  <li key={p.id} className="relative">
                    <span aria-hidden className="absolute top-1 -left-[1.95rem] grid size-6 place-items-center rounded-full bg-pr text-on-pr shadow-[0_0_14px_rgb(255_200_87/0.5)]">
                      <Medal className="size-3.5" />
                    </span>
                    <p className="num-hero text-xl text-pr">
                      {p.kg} kg × {p.reps}
                    </p>
                    <p className="text-sm text-muted">
                      e1RM {p.e1rm} kg{p.previous != null && <span className="text-success"> · +{Math.round((p.e1rm - p.previous) * 10) / 10}</span>} ·{" "}
                      {new Date(p.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <SectionTitle>Sessions</SectionTitle>
            <ul className="flex flex-col gap-2">
              {[...sessions].reverse().map((x, i) => (
                <li key={i} className="card flex items-center gap-3 rounded-md px-3 py-2.5 text-sm">
                  <span className="w-12 text-muted">{new Date(x.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  <span className="flex-1">
                    <span className="tabular block">{x.sets.map((y) => `${y.kg}×${y.reps}`).join("  ")}</span>
                    {gripTag(id, x.grip) && <span className="block text-xs text-subtle">{gripTag(id, x.grip)}</span>}
                  </span>
                  <span className="num-hero text-base text-accent">{x.e1rm}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

function MusclesCard({ exercise }: { exercise: Exercise }) {
  return (
    <Card>
      <SectionTitle>Muscles worked</SectionTitle>
      <ExerciseAnatomy exercise={exercise} figureClass="max-h-[26rem]" />
      {exercise.aliases?.length ? (
        <p className="mt-4 text-sm text-muted">
          Also called {exercise.aliases.join(", ")}. They all log here, so your history stays in one place.
        </p>
      ) : null}
    </Card>
  );
}
