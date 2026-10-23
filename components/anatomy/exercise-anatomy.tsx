"use client";

import { memo, useMemo } from "react";
import type { Exercise } from "@/lib/data/exercises";
import { workedLabel, workedRegions } from "@/lib/anatomy/exercise";
import { REGION_LABEL, type Region } from "@/lib/anatomy/regions";
import { MuscleFigure } from "./muscle-figure";

type Ex = Pick<Exercise, "primary" | "secondary" | "focus">;

/** Small tile for list rows: the side of the body the lift works, zoomed in, worked muscles glowing. */
export const ExerciseIcon = memo(function ExerciseIcon({
  exercise,
  className = "size-12",
}: {
  exercise: Ex;
  className?: string;
}) {
  const w = useMemo(() => workedRegions(exercise), [exercise]);
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-bg/60 ${className}`}
    >
      <MuscleFigure view={w.view} primary={w.primary} secondary={w.secondary} detail="icon" zoom className="size-full" />
    </span>
  );
});

/** A close-up of the worked muscles with their fibres, a whole-body inset, a key and the names. */
export function ExerciseAnatomy({ exercise, figureClass = "max-h-80" }: { exercise: Ex; figureClass?: string }) {
  const w = useMemo(() => workedRegions(exercise), [exercise]);
  const label = workedLabel(w);
  // Lead with the side the lift mainly works.
  const views = w.view === "front" ? (["front", "back"] as const) : (["back", "front"] as const);
  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-lg bg-bg/60" role="img" aria-label={label}>
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-1/4 h-1/2 rounded-full bg-muscle/12 blur-3xl" />
        {/* Close-up of the worked muscles, big enough to see the fibres run. */}
        <MuscleFigure
          view={w.view}
          primary={w.primary}
          secondary={w.secondary}
          zoom="close"
          className={`relative mx-auto block aspect-square w-full ${figureClass}`}
        />
      </div>
      <div className="flex items-center gap-4">
        {/* Whole body front and back, so it's clear where on the body the close-up is. */}
        <div aria-hidden className="flex shrink-0 gap-1.5 rounded-md border border-border bg-bg/60 p-2">
          {views.map((v) => (
            <figure key={v} className="flex flex-col items-center gap-1">
              <MuscleFigure view={v} primary={w.primary} secondary={w.secondary} detail="icon" className="h-28 w-auto" />
              <figcaption className="text-[0.6875rem] uppercase tracking-widest text-subtle">{v}</figcaption>
            </figure>
          ))}
        </div>
        <dl className="flex min-w-0 flex-1 flex-col gap-3 text-sm">
          <Group title="Main" dot="bg-muscle shadow-[0_0_10px_var(--color-muscle)]" regions={w.primary} />
          {w.secondary.length > 0 && <Group title="Also works" dot="bg-muscle/30" regions={w.secondary} />}
        </dl>
      </div>
    </div>
  );
}

function Group({ title, dot, regions }: { title: string; dot: string; regions: Region[] }) {
  const names = [...new Set(regions.map((r) => REGION_LABEL[r]))];
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
        <span aria-hidden className={`size-2.5 rounded-full ${dot}`} />
        {title}
      </dt>
      <dd className="flex flex-wrap gap-1.5">
        {names.map((n) => (
          <span key={n} className="rounded-full bg-surface-raised px-2.5 py-0.5 text-text">
            {n}
          </span>
        ))}
      </dd>
    </div>
  );
}
