"use client";

import { ArrowLeft, BicepsFlexed, Check, Flame, HeartPulse, RefreshCcw, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { BarbellIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { REP_RANGE } from "@/lib/science/progression";
import { QUESTIONS, recommend, type Answers, type Recommendation } from "@/lib/science/questionnaire";
import type { Experience, Goal } from "@/lib/science/targets";

type IconType = LucideIcon | typeof BarbellIcon;

export const GOAL_OPTIONS: { value: Goal; title: string; body: string; Icon: IconType }[] = [
  { value: "hypertrophy", title: "Build muscle", body: "Size first: 6–12 rep sets, small surplus.", Icon: BicepsFlexed },
  { value: "strength", title: "Get stronger", body: "Heavier 3–6 rep sets, near maintenance.", Icon: BarbellIcon },
  { value: "powerbuilding", title: "Bigger & stronger", body: "Heavy compounds plus size work, 4–10 reps.", Icon: Zap },
  { value: "recomp", title: "Recomp", body: "Lose fat and build muscle with a small deficit.", Icon: RefreshCcw },
  { value: "fat_loss", title: "Lose fat", body: "Keep muscle while dieting, high protein.", Icon: Flame },
  { value: "fitness", title: "Stay fit", body: "Balanced training, 8–15 reps, maintenance.", Icon: HeartPulse },
];

export const EXPERIENCE_OPTIONS: { value: Experience; label: string; body: string }[] = [
  { value: "novice", label: "Just starting", body: "Under 6 months. Almost every session is a PR." },
  { value: "beginner", label: "Beginner", body: "6–12 months. Fast, steady progress." },
  { value: "intermediate", label: "Intermediate", body: "1–3 years. Progress comes week to week." },
  { value: "advanced", label: "Advanced", body: "3–5 years. Gains are slow, so timelines are longer." },
  { value: "elite", label: "Veteran", body: "5+ years and near your ceiling. Every kilo is earned." },
];

export const goalTitle = (g: Goal) => GOAL_OPTIONS.find((o) => o.value === g)?.title ?? g;
export const experienceLabel = (e: Experience) => EXPERIENCE_OPTIONS.find((o) => o.value === e)?.label ?? e;

export function GoalPicker({ value, onChange }: { value: Goal; onChange: (g: Goal) => void }) {
  return (
    <div role="radiogroup" aria-label="Goal" className="grid grid-cols-2 gap-2">
      {GOAL_OPTIONS.map(({ value: v, title, body, Icon }) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`press relative flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-[border-color,background-color,box-shadow] duration-300 ${
              on ? "border-accent/70 bg-gradient-to-br from-accent/20 to-accent-2/8 shadow-glow" : "border-border bg-surface/70"
            }`}
          >
            <Icon aria-hidden className={`size-5 ${on ? "text-accent" : "text-muted"}`} />
            <span className={`font-display text-base font-semibold leading-tight ${on ? "text-text" : ""}`}>{title}</span>
            <span className="text-xs leading-snug text-muted">{body}</span>
            {on && <Check aria-hidden className="absolute top-2.5 right-2.5 size-4 text-accent motion-safe:animate-pop" />}
          </button>
        );
      })}
    </div>
  );
}

/** Five levels on a track: the dots fill up to your level. */
export function ExperiencePicker({ value, onChange }: { value: Experience; onChange: (e: Experience) => void }) {
  const idx = EXPERIENCE_OPTIONS.findIndex((o) => o.value === value);
  const sel = EXPERIENCE_OPTIONS[idx];
  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Experience" className="relative flex justify-between px-1">
        <span aria-hidden className="absolute inset-x-5 top-[21px] h-1 rounded-full bg-surface-raised" />
        <span
          aria-hidden
          className="bg-brand absolute left-5 top-[21px] h-1 rounded-full transition-[width] duration-500 ease-[var(--ease-expo)]"
          style={{ width: `calc((100% - 2.5rem) * ${idx / (EXPERIENCE_OPTIONS.length - 1)})` }}
        />
        {EXPERIENCE_OPTIONS.map((o, i) => {
          const on = i === idx;
          const filled = i <= idx;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${o.label}: ${o.body}`}
              onClick={() => onChange(o.value)}
              className="relative flex w-14 flex-col items-center gap-1.5"
            >
              <span
                className={`grid size-11 place-items-center rounded-full border-2 transition-all duration-300 ${
                  on ? "scale-110 border-accent bg-brand text-on-accent shadow-glow" : filled ? "border-accent/70 bg-surface-raised text-accent" : "border-border bg-surface text-subtle"
                }`}
              >
                <span className="num-hero text-base">{i + 1}</span>
              </span>
              <span className={`text-center text-[0.6875rem] leading-tight ${on ? "font-semibold text-text" : "text-muted"}`}>{o.label}</span>
            </button>
          );
        })}
      </div>
      <p key={sel.value} className="text-sm text-muted motion-safe:animate-rise">
        {sel.body}
      </p>
    </div>
  );
}

/** "Help me choose": one question per screen, then a recommendation with reasons. */
export function HelpMeChoose({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (r: Recommendation) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [dir, setDir] = useState<1 | -1>(1);
  const done = step >= QUESTIONS.length;
  const result = done ? recommend(answers) : null;
  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];

  function close() {
    onClose();
    setTimeout(() => {
      setStep(0);
      setAnswers({});
    }, 300);
  }

  return (
    <Sheet open={open} onClose={close} title={done ? "Your recommendation" : "Help me choose"} tall>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              aria-label="Previous question"
              onClick={() => {
                setDir(-1);
                setStep(step - 1);
              }}
              className="grid size-11 place-items-center rounded-full text-muted"
            >
              <ArrowLeft aria-hidden className="size-5" />
            </button>
          )}
          <div className="flex flex-1 gap-1" aria-label={done ? "Done" : `Question ${step + 1} of ${QUESTIONS.length}`}>
            {QUESTIONS.map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step || done ? "bg-brand" : i === step ? "bg-accent/50" : "bg-surface-raised"}`} />
            ))}
          </div>
        </div>

        {!done && (
          <div key={step} className={dir === 1 ? "motion-safe:animate-[vt-in-right_500ms_var(--ease-expo)_both]" : "motion-safe:animate-[vt-in-left_500ms_var(--ease-expo)_both]"}>
            <h3 className="mb-4 font-display text-2xl font-semibold leading-tight">{q.title}</h3>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={q.title}>
              {q.options.map((o) => {
                const on = answers[q.key] === o.value;
                return (
                  <button
                    key={String(o.value)}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setAnswers({ ...answers, [q.key]: o.value });
                      setDir(1);
                      // brief pause so the choice visibly lands before moving on
                      setTimeout(() => setStep((s) => s + 1), 180);
                    }}
                    className={`press flex min-h-14 items-center gap-3 rounded-md border px-4 text-left transition-colors ${
                      on ? "border-accent bg-accent/15" : "border-border bg-surface-raised/60"
                    }`}
                  >
                    <span className="flex-1">
                      <span className="block text-base">{o.label}</span>
                      {o.hint && <span className="block text-sm text-subtle">{o.hint}</span>}
                    </span>
                    {on && <Check aria-hidden className="size-5 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4 motion-safe:animate-rise">
            <div className="card-hero rounded-xl p-4">
              <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">
                <Sparkles aria-hidden className="size-4 text-volt" /> We suggest
              </p>
              <p className="mt-2 font-display text-3xl font-bold leading-tight">{goalTitle(result.goal)}</p>
              <p className="mt-1 text-text">
                {experienceLabel(result.experience)} · {result.sessionsPerWeek} sessions a week · {REP_RANGE[result.goal].join("–")} reps
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {result.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-muted">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              onClick={() => {
                onApply(result);
                close();
              }}
            >
              Use these
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDir(-1);
                setStep(0);
                setAnswers({});
              }}
            >
              Start again
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
