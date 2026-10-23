"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { CountUp } from "./motion";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card rounded-lg p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h2>
      {action}
    </div>
  );
}

/**
 * Page title with an optional back link for drill-in screens. Installed on the home screen there's no
 * browser back button, so `back` gives one: it goes back in history, or to `back` if there's none.
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  action,
  back,
}: {
  title: string;
  /** Small line above the title (a date, a group name). */
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
  back?: string;
}) {
  const router = useRouter();
  return (
    <header className="pt-safe">
      {back && (
        <button
          type="button"
          onClick={() => (history.length > 1 ? router.back() : router.push(back))}
          className="-ml-2 mt-2 -mb-3 flex min-h-11 items-center gap-0.5 pr-3 text-base text-accent"
        >
          <ChevronLeft aria-hidden className="size-5" /> Back
        </button>
      )}
      <div className="flex items-end gap-3 pt-6 pb-5">
        <div className="flex-1">
          {eyebrow && <p className="mb-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-subtle">{eyebrow}</p>}
          {/* Masked word reveal: each word slides up from behind its own clip. */}
          <h1 className="font-display text-[2.375rem] font-bold leading-none tracking-[-0.01em]" aria-label={title}>
            {title.split(" ").map((w, i) => (
              <span key={i} aria-hidden className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom last:mr-0">
                <span className="text-brand inline-block motion-safe:animate-word" style={{ animationDelay: `${i * 50}ms` }}>
                  {w}
                </span>
              </span>
            ))}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted motion-safe:animate-enter" style={{ animationDelay: "120ms" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="mb-1 text-subtle" aria-hidden>
        {icon}
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ProgressRing({
  value,
  target,
  label,
  unit,
  size = 96,
}: {
  value: number;
  target: number;
  label: string;
  unit: string;
  size?: number;
}) {
  const gid = useId();
  const pct = target > 0 ? value / target : 0;
  const [shown, setShown] = useState(false); // start empty, then fill (CSS transition does the motion)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const met = pct >= 1;
  const stroke = met ? "var(--color-success)" : `url(#${gid})`;
  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`${label}: ${value} of ${target} ${unit}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-accent-2)" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={5} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={shown ? c * (1 - Math.min(pct, 1)) : c}
            className="transition-[stroke-dashoffset] duration-[1100ms] ease-[var(--ease-standard)]"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <CountUp value={Math.round(value)} className="num-hero block text-xl leading-none" />
            <div className="text-xs text-subtle">/ {Math.round(target)}</div>
          </div>
        </div>
      </div>
      <span className="text-xs font-medium text-muted">
        {label} {met && <span className="text-success">· hit</span>}
      </span>
    </div>
  );
}

/**
 * Slim horizontal meter: label and value on one line, a 6px bar under it. Fills on mount.
 * Turns success-green when the target is met; `tone` picks the fill colour otherwise.
 */
export function Meter({
  label,
  value,
  target,
  unit,
  tone = "accent",
  delay = 0,
}: {
  label: ReactNode;
  value: number;
  target: number;
  unit?: string;
  tone?: "accent" | "volt" | "warning";
  delay?: number;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const pct = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  const met = target > 0 && value >= target;
  const fill = met ? "bg-success" : tone === "volt" ? "bg-volt" : tone === "warning" ? "bg-warning" : "bg-accent";
  return (
    <div role="img" aria-label={`${typeof label === "string" ? label : ""}: ${Math.round(value)} of ${Math.round(target)}${unit ? ` ${unit}` : ""}`}>
      <div className="flex items-baseline justify-between gap-3" aria-hidden>
        <span className="text-sm text-text">{label}</span>
        <span className="tabular text-sm text-muted">
          <span className={`text-base font-semibold ${met ? "text-success" : "text-text"}`}>{Math.round(value).toLocaleString("en-GB")}</span>
          <span className="text-subtle"> / {Math.round(target).toLocaleString("en-GB")}{unit ? ` ${unit}` : ""}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
        <div
          className={`h-full origin-left rounded-full ${fill} transition-transform duration-[1100ms] ease-[var(--ease-expo)]`}
          style={{ transform: `scaleX(${shown ? pct : 0})`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

export function Avatar({ name, you }: { name: string; you?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-lg font-semibold ${you ? "bg-accent/15 text-accent ring-1 ring-accent/35" : "bg-surface-raised text-text ring-1 ring-border"}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
