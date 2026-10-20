"use client";

import { BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { citations, type Citation } from "@/lib/science/citations";
import { Sheet } from "./sheet";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="pt-safe">
      <div className="flex items-end gap-3 pt-5 pb-4">
        <div className="flex-1">
          <h1 className="font-display text-display font-bold uppercase leading-none">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
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
      <p className="font-display text-lg font-semibold">{title}</p>
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
  const pct = target > 0 ? value / target : 0;
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const met = pct >= 1;
  const stroke = met ? "var(--color-success)" : "var(--color-accent)";
  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`${label}: ${value} of ${target} ${unit}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-raised)" strokeWidth={7} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.min(pct, 1))}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="tabular text-xl font-semibold leading-none">{Math.round(value)}</div>
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

const STRENGTH_LABEL = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  practitioner: "Coaching guideline (lower-quality evidence)",
} as const;

export function CitationChip({ citationKey }: { citationKey: string }) {
  const [open, setOpen] = useState(false);
  const c: Citation | undefined = citations[citationKey];
  if (!c) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 text-sm text-muted"
      >
        <BookOpen aria-hidden className="size-4" />
        {c.shortRef}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={c.shortRef}>
        <div className="flex flex-col gap-3">
          <p className="text-base">{c.finding}</p>
          <div className="rounded-md bg-surface-raised p-3 text-sm">
            <p className="font-medium">{c.title}</p>
            <p className="mt-1 text-muted">
              {c.authors} · {c.year}
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <ShieldCheck aria-hidden className="size-4" />
            {STRENGTH_LABEL[c.strength]}
            {c.verified ? " · DOI checked" : ""}
          </p>
          {c.doiUrl && (
            <a href={c.doiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent underline">
              Read the paper <ExternalLink aria-hidden className="size-4" />
            </a>
          )}
        </div>
      </Sheet>
    </>
  );
}

export function Citations({ keys }: { keys: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[...new Set(keys)].map((k) => (
        <CitationChip key={k} citationKey={k} />
      ))}
    </div>
  );
}

export function Avatar({ name, you }: { name: string; you?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-lg font-semibold ${you ? "bg-accent text-on-accent" : "bg-surface-raised text-text"}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
