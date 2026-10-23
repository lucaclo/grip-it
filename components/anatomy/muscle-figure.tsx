"use client";

import { useId, useMemo } from "react";
import { BACK, bounds, FRONT, fibrePath, SILHOUETTE, SILHOUETTE_FILL, VIEW_H, VIEW_W, type Shape } from "@/lib/anatomy/geometry";
import type { View } from "@/lib/anatomy/exercise";
import type { Region } from "@/lib/anatomy/regions";

const SHAPES: Record<View, Shape[]> = { front: FRONT, back: BACK };

// Fibre paths never change, so build them once per shape.
const FIBRES = new Map<Shape, string>();
function fibresFor(s: Shape) {
  if (!s.fibres) return "";
  let d = FIBRES.get(s);
  if (d == null) FIBRES.set(s, (d = fibrePath(s.fibres, s.d)));
  return d;
}

/** Square window around the worked regions, so a small icon still shows them clearly in context. */
export function zoomBox(view: View, primary: Region[], min = 170): string {
  const hit = SHAPES[view].filter((s) => s.r && primary.includes(s.r)).map((s) => bounds(s.d));
  if (!hit.length) return `0 0 ${VIEW_W} ${VIEW_H}`;
  const y0 = Math.min(...hit.map((b) => b.y0));
  const y1 = Math.max(...hit.map((b) => b.y1));
  const x0 = Math.min(...hit.map((b) => b.x0));
  // Both sides light up, so the window is centred on the body; it's tall enough to show context.
  const size = Math.min(VIEW_H, Math.max(min, y1 - y0 + 50, (100 - x0) * 2 + 24));
  const top = Math.min(Math.max(0, (y0 + y1) / 2 - size / 2), VIEW_H - size);
  return `${100 - size / 2} ${top} ${size} ${size}`;
}

/**
 * Anatomical figure with the worked muscles glowing red. `primary` regions glow with visible fibres,
 * `secondary` regions are a dimmer red, and everything else is drawn as quiet anatomy.
 * `detail="icon"` drops fibres and zooms in, for list rows; `detail="full"` is for sheets and heroes.
 */
export function MuscleFigure({
  view,
  primary,
  secondary = [],
  detail = "full",
  zoom = false,
  className = "",
  title,
}: {
  view: View;
  primary: Region[];
  secondary?: Region[];
  detail?: "icon" | "full";
  /** Crop to the worked muscles: `true` for icons, "close" for a tighter close-up. */
  zoom?: boolean | "close";
  className?: string;
  /** When set, the figure is announced as an image with this label; otherwise it's decorative. */
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const shapes = SHAPES[view];
  const full = detail === "full";
  const viewBox = useMemo(
    () => (zoom ? zoomBox(view, primary, zoom === "close" ? 120 : 170) : `0 0 ${VIEW_W} ${VIEW_H}`),
    [zoom, view, primary],
  );
  const level = (s: Shape) =>
    !s.r ? "none" : primary.includes(s.r) ? "primary" : secondary.includes(s.r) ? "secondary" : "idle";

  const half = (side: "l" | "r") => (
    <g key={side} transform={side === "r" ? `translate(${VIEW_W},0) scale(-1,1)` : undefined}>
      <path d={SILHOUETTE_FILL} className="fill-surface" />
      <path d={SILHOUETTE} fill="none" className="stroke-border" strokeWidth={full ? 0.8 : 1.6} />
      {/* Glow: a blurred copy of the primary muscles under the crisp ones. */}
      <g filter={`url(#${uid}-glow)`} className={full ? "muscle-pulse" : "opacity-80"}>
        {shapes.map((s, i) =>
          level(s) === "primary" ? <path key={i} d={s.d} className="fill-muscle" /> : null,
        )}
      </g>
      {shapes.map((s, i) => {
        const lv = level(s);
        const fill = lv === "primary" ? `url(#${uid}-hot)` : undefined;
        const cls =
          lv === "primary"
            ? ""
            : lv === "secondary"
              ? "fill-muscle/30"
              : lv === "idle"
                ? "fill-surface-raised"
                : "fill-surface-raised/60";
        const fibres = full && s.fibres && lv !== "none" ? fibresFor(s) : "";
        return (
          <g key={i}>
            <path
              d={s.d}
              fill={fill}
              className={`${cls} ${s.seamless ? "" : "stroke-bg"}`}
              strokeWidth={s.seamless ? 0 : full ? 0.9 : 2.2}
              strokeLinejoin="round"
            />
            {fibres && (
              <path
                d={fibres}
                clipPath={`url(#${uid}-c${i})`}
                fill="none"
                strokeLinecap="round"
                strokeWidth={lv === "primary" ? 0.5 : 0.4}
                className={
                  lv === "primary"
                    ? "stroke-muscle-deep/70"
                    : lv === "secondary"
                      ? "stroke-muscle-deep/45"
                      : "stroke-bg/45"
                }
              />
            )}
            {s.marks && lv !== "none" && (
              <path
                d={s.marks}
                fill="none"
                strokeLinecap="round"
                strokeWidth={full ? 1 : 2}
                className={lv === "primary" ? "stroke-muscle-deep" : "stroke-bg"}
              />
            )}
            {/* Sheen along the top edge gives the primary muscles some volume. */}
            {full && lv === "primary" && (
              <path d={s.d} fill={`url(#${uid}-sheen)`} clipPath={`url(#${uid}-c${i})`} />
            )}
          </g>
        );
      })}
    </g>
  );

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}-hot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-muscle-hot)" />
          <stop offset="55%" stopColor="var(--color-muscle)" />
          <stop offset="100%" stopColor="var(--color-muscle-deep)" />
        </linearGradient>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-text)" stopOpacity="0.28" />
          <stop offset="35%" stopColor="var(--color-text)" stopOpacity="0" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={full ? 5 : 9} />
        </filter>
        {full &&
          shapes.map((s, i) =>
            s.fibres || level(s) === "primary" ? (
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
}
