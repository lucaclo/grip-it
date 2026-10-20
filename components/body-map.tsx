"use client";

import type { ReactNode } from "react";
import { MUSCLE_LABEL, VOLUME_BAND, volumeStatus, type Muscle } from "@/lib/science/volume";

type Shape = { m?: Muscle; el: (p: { className: string }) => ReactNode };

// Left half of a stylised figure (viewBox 0 0 120 262); the right half is mirrored. Shapes without
// a muscle are neutral anatomy (head, hands, joints).
const FRONT: Shape[] = [
  { el: (p) => <circle cx={60} cy={19} r={13} {...p} /> },
  { el: (p) => <rect x={54} y={31} width={12} height={9} rx={3} {...p} /> },
  { el: (p) => <rect x={38} y={112} width={44} height={18} rx={8} {...p} /> },
  { m: "front_delts", el: (p) => <ellipse cx={35} cy={48} rx={9} ry={8} {...p} /> },
  { m: "side_delts", el: (p) => <ellipse cx={27} cy={56} rx={5} ry={9} {...p} /> },
  { m: "chest", el: (p) => <rect x={38.5} y={45} width={21} height={21} rx={8} {...p} /> },
  { m: "abs", el: (p) => <rect x={48} y={69} width={12} height={42} rx={5} {...p} /> },
  { el: (p) => <rect x={39} y={69} width={8} height={40} rx={4} {...p} /> },
  { m: "biceps", el: (p) => <ellipse cx={26} cy={79} rx={6} ry={13} {...p} /> },
  { m: "forearms", el: (p) => <ellipse cx={21} cy={108} rx={5} ry={16} {...p} /> },
  { el: (p) => <circle cx={18} cy={129} r={4.5} {...p} /> },
  { m: "quads", el: (p) => <ellipse cx={48.5} cy={160} rx={11} ry={29} {...p} /> },
  { m: "adductors", el: (p) => <ellipse cx={57.5} cy={148} rx={3} ry={15} {...p} /> },
  { el: (p) => <circle cx={48} cy={193} r={5} {...p} /> },
  { m: "calves", el: (p) => <ellipse cx={47.5} cy={220} rx={6.5} ry={22} {...p} /> },
  { el: (p) => <ellipse cx={46} cy={250} rx={7} ry={4} {...p} /> },
];

const BACK: Shape[] = [
  { el: (p) => <circle cx={60} cy={19} r={13} {...p} /> },
  { el: (p) => <rect x={54} y={31} width={12} height={9} rx={3} {...p} /> },
  { m: "upper_back", el: (p) => <polygon points="48,38 60,38 60,82 40,64" {...p} /> },
  { m: "rear_delts", el: (p) => <ellipse cx={34} cy={49} rx={8} ry={8} {...p} /> },
  { m: "side_delts", el: (p) => <ellipse cx={27} cy={56} rx={5} ry={9} {...p} /> },
  { m: "lats", el: (p) => <polygon points="39,66 58,85 57,106 44,99 37,78" {...p} /> },
  { m: "lower_back", el: (p) => <rect x={50} y={96} width={10} height={20} rx={4} {...p} /> },
  { m: "triceps", el: (p) => <ellipse cx={26} cy={79} rx={6} ry={13} {...p} /> },
  { m: "forearms", el: (p) => <ellipse cx={21} cy={108} rx={5} ry={16} {...p} /> },
  { el: (p) => <circle cx={18} cy={129} r={4.5} {...p} /> },
  { m: "glutes", el: (p) => <ellipse cx={50} cy={126} rx={11} ry={12} {...p} /> },
  { m: "hamstrings", el: (p) => <ellipse cx={49} cy={167} rx={10} ry={26} {...p} /> },
  { el: (p) => <circle cx={48} cy={196} r={5} {...p} /> },
  { m: "calves", el: (p) => <ellipse cx={48} cy={220} rx={8} ry={20} {...p} /> },
  { el: (p) => <ellipse cx={46} cy={250} rx={7} ry={4} {...p} /> },
];

function fillFor(sets: number) {
  const st = volumeStatus(sets);
  if (st === "in_range") return "fill-success";
  if (st === "over") return "fill-warning";
  if (sets === 0) return "fill-surface-raised";
  // Under range: lilac that strengthens as you approach 10 sets.
  return sets / VOLUME_BAND.min > 0.5 ? "fill-accent/70" : "fill-accent/35";
}

function Figure({
  shapes,
  vol,
  selected,
  onSelect,
  title,
}: {
  shapes: Shape[];
  vol: Partial<Record<Muscle, number>>;
  selected: Muscle | null;
  onSelect: (m: Muscle) => void;
  title: string;
}) {
  const render = (mirror: boolean) =>
    shapes.map((s, i) => {
      const sets = s.m ? (vol[s.m] ?? 0) : 0;
      const isSel = s.m && s.m === selected;
      const className = s.m
        ? `${fillFor(sets)} cursor-pointer transition-[fill,opacity] duration-300 ${isSel ? "stroke-text [stroke-width:1.6]" : "stroke-bg/60 [stroke-width:0.8]"} ${selected && !isSel ? "opacity-55" : ""}`
        : "fill-surface-raised/70";
      return (
        <g key={`${mirror}-${i}`} onClick={s.m ? () => onSelect(s.m!) : undefined}>
          {s.el({ className })}
        </g>
      );
    });
  return (
    <figure className="flex flex-1 flex-col items-center gap-1">
      <svg viewBox="0 0 120 262" className="h-64 w-auto drop-shadow-[0_10px_30px_rgb(124_92_255/0.25)]" aria-hidden>
        {render(false)}
        <g transform="translate(120,0) scale(-1,1)">{render(true)}</g>
      </svg>
      <figcaption className="text-xs uppercase tracking-widest text-subtle">{title}</figcaption>
    </figure>
  );
}

/** Front and back figures coloured by weekly sets. Tap a muscle to select it. Decorative for screen readers (the list below carries the data). */
export function BodyMap({
  vol,
  selected,
  onSelect,
}: {
  vol: Partial<Record<Muscle, number>>;
  selected: Muscle | null;
  onSelect: (m: Muscle) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-2">
        <Figure shapes={FRONT} vol={vol} selected={selected} onSelect={onSelect} title="Front" />
        <Figure shapes={BACK} vol={vol} selected={selected} onSelect={onSelect} title="Back" />
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted" aria-label="Colour key">
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-surface-raised ring-1 ring-border" />None</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent/50" />Under {VOLUME_BAND.min}</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" />{VOLUME_BAND.min}–{VOLUME_BAND.max}</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" />Over {VOLUME_BAND.max}</li>
      </ul>
    </div>
  );
}

export { MUSCLE_LABEL };
