"use client";

import { LineChart as ChartIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/bits";
import { exerciseMap, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
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
          const sets = w.exercises.find((e) => e.exerciseId === id)!.sets.filter((x) => x.type !== "warmup");
          const best = Math.max(0, ...sets.map((x) => e1rm(x.kg, x.reps) ?? 0));
          return { date: w.startedAt.slice(5, 10), e1rm: best, sets };
        }),
    [s, id],
  );

  if (!def) return <EmptyState icon={<ChartIcon className="size-10" />} title="Exercise not found" body="" />;
  const first = sessions[0]?.e1rm ?? 0;
  const last = sessions[sessions.length - 1]?.e1rm ?? 0;

  return (
    <>
      <PageHeader title={def.name} subtitle={`${MUSCLE_LABEL[def.primary]} · ${def.equipment}`} />
      {sessions.length < 2 ? (
        <EmptyState icon={<ChartIcon className="size-10" />} title="Not enough data yet" body="Log this exercise twice to see your estimated 1-rep max trend." />
      ) : (
        <Card className="mb-4">
          <SectionTitle
            action={
              <button type="button" onClick={() => setTable(!table)} className="min-h-11 text-sm text-accent">
                {table ? "Show chart" : "Show table"}
              </button>
            }
          >
            Estimated 1RM
          </SectionTitle>
          <p className="mb-2 text-sm text-muted">
            {last >= first ? "Up" : "Down"} <span className="tabular text-text">{Math.abs(Math.round((last - first) * 10) / 10)} kg</span> over {sessions.length} sessions.
          </p>
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
                <LineChart data={sessions} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "var(--color-subtle)", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fill: "var(--color-subtle)", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Line dataKey="e1rm" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 3, fill: "var(--color-accent)" }} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}
      <SectionTitle>History</SectionTitle>
      <ul className="flex flex-col gap-2">
        {[...sessions].reverse().map((x, i) => (
          <li key={i} className="flex justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm">
            <span className="text-muted">{x.date}</span>
            <span className="tabular">{x.sets.map((y) => `${y.kg}×${y.reps}`).join("  ")}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
