"use client";

import { Minus, Plus, SkipForward, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/data/store";

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/** Floating rest countdown. Remaining time comes from a stored end timestamp, so it survives the phone sleeping. */
export function RestTimer() {
  const endsAt = useStore((s) => s.draft?.restEndsAt ?? null);
  const total = useStore((s) => s.draft?.restTotalSec ?? 120);
  const { adjustRest, clearRest } = useStore();
  const [now, setNow] = useState(() => Date.now());
  const buzzed = useRef<string | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [endsAt]);

  const left = endsAt ? Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000)) : 0;
  const over = !!endsAt && left === 0;

  // Buzz once when rest ends, then tidy the pill away after a few seconds.
  useEffect(() => {
    if (!over || buzzed.current === endsAt) return;
    buzzed.current = endsAt;
    navigator.vibrate?.([200, 100, 200]);
    const t = setTimeout(clearRest, 4000);
    return () => clearTimeout(t);
  }, [over, endsAt, clearRest]);

  if (!endsAt) return null;
  const pct = total > 0 ? left / total : 0;
  const R = 18;
  const C = 2 * Math.PI * R;

  return (
    <div
      role="timer"
      aria-live={over ? "assertive" : "off"}
      aria-label={over ? "Rest over" : `Rest: ${fmt(left)} left`}
      className={`glass mb-2 flex items-center gap-2 rounded-2xl border p-2 pl-3 shadow-[0_14px_36px_-12px_rgb(0_0_0/0.7)] motion-safe:animate-rise ${over ? "border-volt/60 bg-volt/15" : "border-white/10"}`}
    >
      <span className="relative grid size-11 place-items-center">
        <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={R} fill="none" stroke="var(--color-surface-raised)" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r={R}
            fill="none"
            stroke={over ? "var(--color-volt)" : "var(--color-accent)"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
        </svg>
        <Timer aria-hidden className={`size-4 ${over ? "text-volt" : "text-accent"}`} />
      </span>
      <span className="flex-1">
        <span className="block text-xs uppercase tracking-wide text-muted">{over ? "Rest over" : "Rest"}</span>
        <span className={`num-hero block text-2xl leading-none ${over ? "text-volt" : ""}`}>{over ? "Go!" : fmt(left)}</span>
      </span>
      {!over && (
        <>
          <button type="button" onClick={() => adjustRest(-15)} aria-label="15 seconds less rest" className="grid size-11 place-items-center rounded-xl bg-surface-raised text-muted active:scale-95">
            <Minus aria-hidden className="size-4" />
          </button>
          <button type="button" onClick={() => adjustRest(15)} aria-label="15 seconds more rest" className="grid size-11 place-items-center rounded-xl bg-surface-raised text-muted active:scale-95">
            <Plus aria-hidden className="size-4" />
          </button>
        </>
      )}
      <button type="button" onClick={clearRest} aria-label={over ? "Dismiss" : "Skip rest"} className="grid size-11 place-items-center rounded-xl bg-surface-raised text-muted active:scale-95">
        <SkipForward aria-hidden className="size-4" />
      </button>
    </div>
  );
}
