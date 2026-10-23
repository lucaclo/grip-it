"use client";

import { memo, useId } from "react";
import { BACK, FRONT, fibrePath, SILHOUETTE, SILHOUETTE_FILL, VIEW_H, VIEW_W, type Shape } from "@/lib/anatomy/geometry";
import { REGION_MUSCLE } from "@/lib/anatomy/regions";
import { HEAT_LABEL, type HeatLevel } from "@/lib/science/effort";
import type { Muscle } from "@/lib/science/volume";

// Full class strings so Tailwind keeps them.
const FILL: Record<HeatLevel, string> = {
  0: "fill-surface-raised",
  1: "fill-heat-1",
  2: "fill-heat-2",
  3: "fill-heat-3",
  4: "fill-heat-4",
};
const SWATCH: Record<HeatLevel, string> = {
  0: "bg-surface-raised ring-1 ring-border",
  1: "bg-heat-1",
  2: "bg-heat-2",
  3: "bg-heat-3",
  4: "bg-heat-4 shadow-[0_0_10px_var(--color-heat-4)]",
};

const FIBRES = new Map<Shape, string>();
function fibresFor(s: Shape) {
  if (!s.fibres) return "";
  let d = FIBRES.get(s);
  if (d == null) FIBRES.set(s, (d = fibrePath(s.fibres, s.d)));
  return d;
}

/** One side of the body, both halves mirrored, each muscle filled by how hard it was worked. */
const Side = memo(function Side({
  view,
  levels,
  selected,
  onSelect,
  className,
}: {
  className: string;
  view: "front" | "back";
  levels: Partial<Record<Muscle, HeatLevel>>;
  selected: Muscle | null;
  onSelect?: (m: Muscle) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const shapes = view === "front" ? FRONT : BACK;
  const half = (side: "l" | "r") => (
    <g key={side} transform={side === "r" ? `translate(${VIEW_W},0) scale(-1,1)` : undefined}>
      <path d={SILHOUETTE_FILL} className="fill-surface" />
      {/* Very hard muscles glow: a blurred copy under the crisp shapes. */}
      <g filter={`url(#${uid}-glow)`} aria-hidden>
        {shapes.map((s, i) => {
          const m = s.r ? REGION_MUSCLE[s.r] : null;
          return m && levels[m] === 4 ? <path key={i} d={s.d} className="fill-heat-4 opacity-70" /> : null;
        })}
      </g>
      {shapes.map((s, i) => {
        const m = s.r ? REGION_MUSCLE[s.r] : null;
        const lv: HeatLevel = m ? (levels[m] ?? 0) : 0;
        const isSel = !!m && m === selected;
        const dim = !!selected && !isSel && !!m;
        return (
          <g
            key={i}
            onClick={m && onSelect ? () => onSelect(m) : undefined}
            className={`${m && onSelect ? "cursor-pointer" : ""} transition-opacity duration-300 ${dim ? "opacity-45" : ""}`}
          >
            <path
              d={s.d}
              className={`${m ? FILL[lv] : "fill-surface-raised/50"} ${s.seamless ? "" : lv > 0 ? "stroke-heat-4/70" : "stroke-bg"} transition-[fill] duration-500`}
              strokeWidth={s.seamless ? 0 : lv > 0 ? 1.3 : 1.1}
              strokeLinejoin="round"
            />
            {m && lv > 0 && s.fibres && (
              <path
                d={fibresFor(s)}
                clipPath={`url(#${uid}-c${i})`}
                fill="none"
                strokeLinecap="round"
                strokeWidth={0.45}
                className="stroke-bg/35"
              />
            )}
            {s.marks && m && <path d={s.marks} fill="none" strokeWidth={1} strokeLinecap="round" className="stroke-bg/70" />}
            {isSel && <path d={s.d} fill="none" strokeWidth={1.8} strokeLinejoin="round" className="stroke-text" />}
          </g>
        );
      })}
      <path d={SILHOUETTE} fill="none" className="stroke-border" strokeWidth={0.9} />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={`w-auto overflow-visible ${className}`} aria-hidden>
      <defs>
        <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
        {shapes.map((s, i) =>
          s.fibres ? (
            <clipPath key={i} id={`${uid}-c${i}`}>
              <path d={s.d} />
            </clipPath>
          ) : null,
        )}
      </defs>
      {half("l")}
      {half("r")}
    </svg>
  );
});

/**
 * Front and back of the body, each muscle in one of five shades from grey (not worked) to bright red
 * (very hard). Tap a muscle to select it. Decorative for screen readers: pages list the same data.
 */
export function HeatFigure({
  levels,
  selected = null,
  onSelect,
  className = "h-80",
}: {
  levels: Partial<Record<Muscle, HeatLevel>>;
  selected?: Muscle | null;
  onSelect?: (m: Muscle) => void;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-2">
        {(["front", "back"] as const).map((v) => (
          <figure key={v} className="flex flex-col items-center gap-1">
            <Side view={v} levels={levels} selected={selected} onSelect={onSelect} className={className} />
            <figcaption className="text-[0.6875rem] uppercase tracking-[0.08em] text-subtle">{v}</figcaption>
          </figure>
        ))}
      </div>
      <HeatKey />
    </div>
  );
}

export function HeatKey() {
  return (
    <ul className="flex items-center justify-center gap-3 text-[0.6875rem] text-muted" aria-label="Colour key, light to very hard">
      {([1, 2, 3, 4] as const).map((l) => (
        <li key={l} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-2.5 rounded-full ${SWATCH[l]}`} />
          {HEAT_LABEL[l]}
        </li>
      ))}
    </ul>
  );
}
