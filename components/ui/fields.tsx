"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

/** Labelled number input with optional unit and steppers. Keeps its own text so "72." can be typed. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  step,
  min,
  max,
  decimal = false,
  hint,
  error,
  optional,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  decimal?: boolean;
  hint?: string;
  error?: string | null;
  optional?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(value == null ? "" : String(value));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    if (value !== parse(text)) setText(value == null ? "" : String(value));
  }
  function parse(t: string) {
    const n = Number(t.replace(",", "."));
    return t.trim() === "" || Number.isNaN(n) ? null : n;
  }
  function bump(dir: 1 | -1) {
    const next = Math.round(((value ?? 0) + dir * (step ?? 1)) * 100) / 100;
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
    setText(String(clamped));
    onChange(clamped);
  }
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
        {optional && <span className="text-subtle"> (optional)</span>}
      </label>
      <div
        className={`flex min-h-12 items-center rounded-md border bg-surface ${error ? "border-danger" : "border-border-input"} focus-within:border-focus`}
      >
        {step && (
          <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-1)} className="grid size-12 place-items-center text-muted">
            <Minus aria-hidden className="size-5" />
          </button>
        )}
        <input
          id={id}
          inputMode={decimal ? "decimal" : "numeric"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parse(e.target.value));
          }}
          onFocus={(e) => e.currentTarget.select()}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`tabular w-0 min-w-0 flex-1 bg-transparent py-2 text-lg outline-none ${step ? "text-center" : "px-3"}`}
        />
        {unit && <span className="pr-3 text-sm text-subtle">{unit}</span>}
        {step && (
          <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(1)} className="grid size-12 place-items-center text-muted">
            <Plus aria-hidden className="size-5" />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`min-h-12 rounded-md border bg-surface px-3 text-base outline-none focus:border-focus ${error ? "border-danger" : "border-border-input"}`}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel,
}: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  hideLabel?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={hideLabel ? "sr-only" : "mb-1.5 text-sm font-medium text-muted"}>{label}</legend>
      <div role="radiogroup" className="relative flex rounded-md border border-border bg-surface/80 p-1">
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 rounded-sm bg-surface-raised shadow-[inset_0_0_0_1px_rgb(183_156_255/0.55),0_6px_18px_-8px_rgb(183_156_255/0.6)] transition-transform duration-300 ease-[var(--ease-spring)]"
          style={{
            width: `calc((100% - 0.5rem) / ${options.length})`,
            transform: `translateX(${Math.max(0, options.findIndex((o) => o.value === value)) * 100}%)`,
          }}
        />
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`relative min-h-11 flex-1 rounded-sm px-2 text-sm font-medium transition-colors duration-300 ${on ? "text-text" : "text-muted"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 py-3 text-left"
    >
      <span className="flex-1">
        <span className="block text-base">{label}</span>
        {description && <span className="block text-sm text-subtle">{description}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-brand shadow-glow" : "bg-surface-raised border border-border-input"}`}>
        <span className={`absolute top-0.5 size-6 rounded-full transition-transform ${checked ? "translate-x-5.5 bg-on-accent" : "translate-x-0.5 bg-muted"}`} />
      </span>
    </button>
  );
}
