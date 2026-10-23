"use client";

import { useEffect, useRef, useState } from "react";
import { PLATES } from "@/lib/plates";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that ticks up from 0 (or from its previous value) when it appears or changes.
 * Screen readers get the final value only.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 800,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) {
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setShown(a + (value - a) * easeOut(k));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  const fmt = (n: number) =>
    n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const text = fmt(reduced ? value : shown);
  const final = fmt(value);
  return (
    <span className={className}>
      <span aria-hidden>
        {prefix}
        {text}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {final}
        {suffix}
      </span>
    </span>
  );
}

type Particle = { x: number; y: number; vx: number; vy: number; r: number; spin: number; color: string; w: number; h: number };

/** One-shot confetti burst in plate colours. Renders nothing under reduced motion. */
export function Confetti({ fire }: { fire: boolean }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  // Latch: once fired, keep going even if `fire` flips back (e.g. the URL flag is cleared).
  const [fired, setFired] = useState(false);
  if (fire && !fired) setFired(true);

  useEffect(() => {
    if (!fired || reduced || done) return;
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = [...PLATES.slice(0, 5).map((p) => p.color), "#b79cff", "#e58bff", "#d4ff3a"];
    const parts: Particle[] = Array.from({ length: 140 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 7 + Math.random() * 9;
      return {
        x: innerWidth / 2,
        y: innerHeight * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        w: 6 + Math.random() * 6,
        h: 3 + Math.random() * 4,
      };
    });
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const age = (t - start) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.spin;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - age / 2.2);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (age < 2.2) raf = requestAnimationFrame(frame);
      else setDone(true);
    };
    raf = requestAnimationFrame(frame);
    navigator.vibrate?.([30, 40, 60]);
    return () => cancelAnimationFrame(raf);
  }, [fired, reduced, done]);

  if (!fired || reduced || done) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}

/** Small icons that float up from a tap point, e.g. a reaction. */
export function useBurst() {
  const [bursts, setBursts] = useState<{ id: number; dx: number }[]>([]);
  const reduced = useReducedMotion();
  function fire() {
    if (reduced) return;
    const now = Date.now();
    const next = [-18, -6, 6, 18].map((dx, i) => ({ id: now + i, dx: dx + (Math.random() - 0.5) * 10 }));
    setBursts((b) => [...b, ...next]);
    setTimeout(() => setBursts((b) => b.filter((x) => !next.some((n) => n.id === x.id))), 850);
  }
  return { bursts, fire };
}
