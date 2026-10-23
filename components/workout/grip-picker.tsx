"use client";

import { Check, ChevronDown, Hand } from "lucide-react";
import { useState } from "react";
import { ExerciseIcon } from "@/components/anatomy/exercise-anatomy";
import { Research } from "@/components/ui/info";
import { Sheet } from "@/components/ui/sheet";
import type { Exercise } from "@/lib/data/exercises";
import { gripOf, gripsFor, loadLabel, withGrip, type Grip } from "@/lib/science/grips";
import { MUSCLE_LABEL } from "@/lib/science/volume";

/** "Works chest · helped by triceps, shoulders (front)" for one grip. */
function worksLine(def: Exercise) {
  const helpers = def.secondary.map((m) => MUSCLE_LABEL[m].toLowerCase());
  return `Works ${MUSCLE_LABEL[def.primary].toLowerCase()}${helpers.length ? ` · helped by ${helpers.join(", ")}` : ""}`;
}

/**
 * The grip pill on an exercise card and the sheet it opens: each grip with what it changes, the
 * weight to expect, the muscles it works and the studies behind it. Hidden for exercises where grip
 * doesn't apply.
 */
export function GripPicker({
  exercise,
  grip,
  onPick,
}: {
  exercise: Exercise;
  grip: string | undefined;
  onPick: (g: Grip) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = gripsFor(exercise.id);
  const current = gripOf(exercise.id, grip);
  if (!options.length || !current) return null;
  const usualWorks = worksLine(exercise);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Grip: ${current.label}. Change grip`}
        className="press inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-sm text-muted"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1">
          <Hand aria-hidden className="size-4 text-accent" />
          <span>
            Grip <span className="font-semibold text-text">{current.label}</span>
          </span>
          <ChevronDown aria-hidden className="size-4 text-subtle" />
        </span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Grip · ${exercise.name}`} tall>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Grip shifts emphasis a little and changes how much you can lift. Your targets and PRs are
            kept per grip; the first session on a new grip starts from a scaled-down estimate.
          </p>
          <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Grip">
            {options.map((g, i) => {
              const on = g.id === current.id;
              const def = withGrip(exercise, g.id);
              // Only say which muscles it works when that differs from the usual grip.
              const works = worksLine(def);
              return (
                <li key={g.id} role="none">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      onPick(g);
                      setOpen(false);
                    }}
                    className={`press flex w-full gap-3 rounded-md border p-3 text-left transition-colors ${on ? "border-accent bg-accent/8" : "border-border bg-surface-raised"}`}
                  >
                    <ExerciseIcon exercise={def} className="size-14" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-display text-lg font-semibold">{g.label}</span>
                        {i === 0 && <span className="text-xs text-subtle">Usual</span>}
                        <span className="flex-1" />
                        {on && <Check aria-hidden className="size-5 text-accent" strokeWidth={3} />}
                      </span>
                      <span className="mt-0.5 block text-sm">{g.effect}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-full bg-surface px-2 py-0.5 text-muted">
                          {g.holdOnly ? "Same targets as the usual grip" : loadLabel(g)}
                          {!g.holdOnly && g.load !== 1 && g.loadSource === "estimate" ? " (estimate)" : ""}
                        </span>
                        {(i === 0 || works !== usualWorks) && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-muted">{works}</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Research keys={options.flatMap((g) => g.citationKeys)} />
        </div>
      </Sheet>
    </>
  );
}
