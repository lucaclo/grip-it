"use client";

import { ChevronRight, EyeOff, Medal } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { allPRs, liftedKg, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";

/** Every workout you've saved, newest first, grouped by month. */
export function HistoryList() {
  const s = useStore();
  const workouts = useMemo(() => workoutsOf(s, "me"), [s]);
  const prCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of allPRs(s)) if (p.userId === "me") m.set(p.workoutId, (m.get(p.workoutId) ?? 0) + 1);
    return m;
  }, [s]);

  if (!workouts.length) return <p className="py-6 text-center text-sm text-muted">No workouts yet. Your first one sets the numbers to beat.</p>;

  const groups = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const key = new Date(w.startedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...groups].map(([month, ws]) => (
        <section key={month} aria-label={month}>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">
            {month} · {ws.length} workout{ws.length === 1 ? "" : "s"}
          </h3>
          <ul className="card flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-lg">
            {ws.map((w) => {
              const d = new Date(w.startedAt);
              const sets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
              const prs = prCount.get(w.id) ?? 0;
              return (
                <li key={w.id}>
                  <Link href={`/workout/${w.id}`} transitionTypes={["drill-in"]} className="press flex min-h-16 items-center gap-3 px-4 py-3">
                    <span className="grid size-11 shrink-0 place-content-center gap-0.5 rounded-[12px] bg-white/[0.04] text-center leading-none">
                      <span className="num-hero text-lg">{d.getDate()}</span>
                      <span className="text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-subtle">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-base font-medium">
                        <span className="truncate">{w.title}</span>
                        {w.isPrivate && <EyeOff aria-label="Private" className="size-4 shrink-0 text-subtle" />}
                      </span>
                      <span className="tabular mt-0.5 block text-[0.8125rem] text-muted">
                        {w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"} · {sets} set{sets === 1 ? "" : "s"} · {liftedKg(s, w).toLocaleString("en-GB")} kg
                      </span>
                    </span>
                    {prs > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-pr/12 px-2 py-0.5 text-xs font-semibold text-pr" aria-label={`${prs} PR${prs === 1 ? "" : "s"}`}>
                        <Medal aria-hidden className="size-3.5" />
                        {prs}
                      </span>
                    )}
                    <ChevronRight aria-hidden className="size-5 text-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
