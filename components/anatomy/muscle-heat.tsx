"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { IntensityInfo } from "@/components/explainers";
import type { MuscleWork } from "@/lib/data/selectors";
import { HEAT_LABEL, heatLevel, type HeatLevel } from "@/lib/science/effort";
import { MUSCLE_LABEL, MUSCLES, type Muscle } from "@/lib/science/volume";
import { HeatFigure } from "./heat-figure";

const CHIP: Record<HeatLevel, string> = {
  0: "border-border text-subtle",
  1: "border-heat-1 text-text",
  2: "border-heat-2 text-text",
  3: "border-heat-3 text-text",
  4: "border-heat-4 bg-heat-4/15 text-text",
};
const DOT: Record<HeatLevel, string> = {
  0: "bg-surface-raised",
  1: "bg-heat-1",
  2: "bg-heat-2",
  3: "bg-heat-3",
  4: "bg-heat-4",
};

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

/**
 * "Muscles worked": the red body diagram, a tappable list of worked muscles (the accessible version
 * of the figure), and what fed the selected muscle.
 */
export function MuscleHeat({
  work,
  scale,
  title = "Muscles worked",
  empty = "No working sets yet.",
}: {
  work: MuscleWork;
  scale: "session" | "week";
  title?: string;
  empty?: string;
}) {
  const [selected, setSelected] = useState<Muscle | null>(null);
  const levels = useMemo(
    () => Object.fromEntries(MUSCLES.map((m) => [m, heatLevel(work.scores[m] ?? 0, scale)])) as Record<Muscle, HeatLevel>,
    [work, scale],
  );
  const worked = MUSCLES.filter((m) => (work.scores[m] ?? 0) > 0).sort((a, b) => (work.scores[b] ?? 0) - (work.scores[a] ?? 0));
  const pick = (m: Muscle) => setSelected((cur) => (cur === m ? null : m));
  const sel = selected;

  return (
    <section className="card-hero rounded-xl p-4" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">{title}</h2>
        <IntensityInfo scale={scale} />
      </div>

      <HeatFigure levels={levels} selected={sel} onSelect={pick} className="h-[22rem]" />

      {worked.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted">{empty}</p>
      ) : (
        <>
          {sel ? (
            <div className="mt-4 rounded-md bg-bg/50 p-3 motion-safe:animate-rise" role="status">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-display text-xl font-semibold">{MUSCLE_LABEL[sel]}</p>
                  <p className="text-sm text-muted">
                    <span className="text-text">{HEAT_LABEL[levels[sel]]}</span> · effort {fmt(work.scores[sel] ?? 0)} ·{" "}
                    {fmt(work.hardSets[sel] ?? 0)} hard sets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Clear selection"
                  className="-mt-1 -mr-1 grid size-11 place-items-center rounded-full text-muted"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
              {work.by[sel]?.length ? (
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {work.by[sel]!.map((c) => (
                    <li key={c.exerciseId} className="flex justify-between gap-3">
                      <span>
                        {c.name}
                        {c.role === "helper" && <span className="text-subtle"> · helps</span>}
                      </span>
                      <span className="tabular shrink-0 text-muted">
                        {fmt(c.hardSets)} hard set{c.hardSets === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Not trained {scale === "session" ? "in this workout" : "this week"}.</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-subtle">Tap a muscle for details</p>
          )}
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Muscles, hardest worked first">
            {worked.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => pick(m)}
                  aria-pressed={sel === m}
                  className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${CHIP[levels[m]]} ${sel === m ? "ring-2 ring-text/70" : ""}`}
                >
                  <span aria-hidden className={`size-2 rounded-full ${DOT[levels[m]]}`} />
                  {MUSCLE_LABEL[m]}
                  <span className="text-subtle">
                    <span className="sr-only">:</span> {HEAT_LABEL[levels[m]]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {work.estimated && (
            <p className="mt-3 text-xs text-subtle">
              Some lifts are new to you, so their effort is estimated from your best set today.
            </p>
          )}
        </>
      )}
    </section>
  );
}
