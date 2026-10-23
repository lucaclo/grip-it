"use client";

import { ExternalLink, Info, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { citations } from "@/lib/science/citations";
import { Sheet } from "./sheet";

const STRENGTH = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  practitioner: "Coaching guideline",
} as const;

/**
 * The small "i" that keeps explanations and studies off the screen until asked for.
 * Opens a sheet with the plain-English explanation first, then the research behind it.
 * With `text`, the trigger reads "text ⓘ"; otherwise it's just the icon (44pt tap target).
 */
export function InfoButton({
  title,
  label,
  text,
  keys = [],
  children,
  className = "",
}: {
  title: string;
  /** Screen-reader label for an icon-only trigger, e.g. "About hard sets". */
  label?: string;
  text?: ReactNode;
  keys?: string[];
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={text ? undefined : (label ?? `About ${title.toLowerCase()}`)}
        aria-haspopup="dialog"
        className={
          text
            ? `inline-flex min-h-11 items-center gap-1.5 text-sm text-muted ${className}`
            : `-m-2.5 inline-grid size-11 shrink-0 place-items-center rounded-full text-subtle transition-colors active:text-text ${className}`
        }
      >
        {text}
        <Info aria-hidden className="size-[18px]" strokeWidth={2.2} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="flex flex-col gap-4 text-base leading-relaxed">
          {children}
          {keys.length > 0 && <Research keys={keys} />}
        </div>
      </Sheet>
    </>
  );
}

/** The studies behind an explanation, as a quiet list: what each found, how strong it is, a link. */
export function Research({ keys }: { keys: string[] }) {
  const list = [...new Set(keys)].map((k) => citations[k]).filter(Boolean);
  if (!list.length) return null;
  return (
    <section aria-label="The research" className="mt-1 border-t border-border pt-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-subtle">The research</h3>
      <ul className="flex flex-col gap-3">
        {list.map((c) => (
          <li key={c.key} className="rounded-md bg-surface-raised/70 p-3">
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{c.shortRef}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-subtle">
                <ShieldCheck aria-hidden className="size-3.5" />
                {STRENGTH[c.strength]}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">{c.finding}</p>
            {c.doiUrl && (
              <a
                href={c.doiUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm text-accent"
              >
                Read the paper <ExternalLink aria-hidden className="size-3.5" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
