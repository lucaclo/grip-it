"use client";

import { Check, Dumbbell, EllipsisVertical, Plus, Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/bits";
import { Toggle } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { ExerciseSearch } from "@/components/workout/exercise-search";
import { exerciseMap, historyFor, suggestionFor, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { DraftSet } from "@/lib/data/types";
import { MUSCLE_LABEL } from "@/lib/science/volume";

function useElapsed(since: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!since) return "0:00";
  const s = Math.max(0, Math.floor((now - Date.parse(since)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export default function LogPage() {
  const router = useRouter();
  const s = useStore();
  const { draft, startWorkout, addExerciseToDraft, finishWorkout, discardDraft } = s;
  const [searchOpen, setSearchOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPrivate, setPrivate] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const elapsed = useElapsed(draft?.startedAt);
  const ex = useMemo(() => exerciseMap(s), [s]);
  const recentIds = useMemo(
    () => [...new Set(workoutsOf(s, "me").flatMap((w) => w.exercises.map((e) => e.exerciseId)))].slice(0, 12),
    [s],
  );

  if (!draft) {
    return (
      <>
        <PageHeader title="Log" subtitle="Start a session and add exercises as you go." />
        <EmptyState
          icon={<Dumbbell className="size-10" />}
          title="Ready when you are"
          body="Your session saves on your phone after every set, so nothing is lost if you close the app."
          action={
            <Button size="lg" onClick={startWorkout}>
              Start workout
            </Button>
          }
        />
      </>
    );
  }

  const doneSets = draft.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
  const volume = draft.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).reduce((b, x) => b + x.kg * x.reps, 0), 0);

  function addExercise(exerciseId: string) {
    // Prefill with today's target so beating it is one tick per set; "Previous" still shows last time.
    const last = historyFor(s, "me", exerciseId)[0];
    const target = suggestionFor(s, exerciseId);
    const prefill: DraftSet[] = last
      ? last.sets.map((x) => ({
          kg: x.type === "warmup" ? x.kg : (target.targetKg ?? x.kg),
          reps: x.type === "warmup" ? x.reps : (target.targetReps ?? x.reps),
          rir: null,
          type: x.type ?? "normal",
          done: false,
        }))
      : [];
    addExerciseToDraft(exerciseId, prefill);
  }

  return (
    <>
      <header className="sticky top-0 z-10 -mx-4 border-b border-border bg-bg/95 px-4 pt-safe backdrop-blur">
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-subtle">Workout in progress</p>
            <p className="tabular text-xl font-semibold" aria-live="off">
              {elapsed}
            </p>
          </div>
          <div className="text-right text-sm text-muted">
            <p>
              <span className="tabular text-base text-text">{doneSets}</span> sets
            </p>
            <p>
              <span className="tabular text-base text-text">{Math.round(volume)}</span> kg volume
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 pt-4">
        {draft.exercises.map((e, i) => {
          const def = ex.get(e.exerciseId);
          return <ExerciseCard key={`${e.exerciseId}-${i}`} index={i} name={def?.name ?? "Unknown"} muscle={def ? MUSCLE_LABEL[def.primary] : ""} exerciseId={e.exerciseId} />;
        })}

        <Button variant="secondary" size="lg" onClick={() => setSearchOpen(true)}>
          <Plus aria-hidden className="size-5" /> Add exercise
        </Button>
        <Button variant="ghost" onClick={() => setDiscardOpen(true)} className="text-danger">
          Discard workout
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+3.5rem)] z-10 mx-auto max-w-[480px] px-4 pb-3">
        <Button size="lg" className="w-full shadow-[0_16px_40px_rgb(0_0_0/0.55)]" disabled={doneSets === 0} onClick={() => setFinishOpen(true)}>
          <Check aria-hidden className="size-5" /> Finish
        </Button>
      </div>
      <div className="h-20" />

      <ExerciseSearch open={searchOpen} onClose={() => setSearchOpen(false)} onPick={(e) => addExercise(e.id)} recentIds={recentIds} />

      <Sheet open={discardOpen} onClose={() => setDiscardOpen(false)} title="Discard workout?">
        <div className="flex flex-col gap-3">
          <p className="text-muted">This deletes the session in progress. Saved workouts aren&apos;t affected.</p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              discardDraft();
              setDiscardOpen(false);
            }}
          >
            <Trash2 aria-hidden className="size-5" /> Discard
          </Button>
          <Button variant="secondary" onClick={() => setDiscardOpen(false)}>
            Keep logging
          </Button>
        </div>
      </Sheet>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title="Finish workout">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="wtitle" className="text-sm font-medium text-muted">
              Title
            </label>
            <input
              id="wtitle"
              value={title}
              placeholder="e.g. Push day"
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-12 rounded-md border border-border-input bg-bg px-3 text-base outline-none focus:border-focus"
            />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Duration", elapsed],
              ["Sets", String(doneSets)],
              ["Volume", `${Math.round(volume)} kg`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-surface-raised p-2">
                <dt className="text-xs text-subtle">{k}</dt>
                <dd className="tabular text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <Toggle label="Private workout" description="Hidden from the feed. Still counts toward leaderboards." checked={isPrivate} onChange={setPrivate} />
          <p className="text-sm text-subtle">Only ticked sets are saved.</p>
          <Button
            size="lg"
            onClick={() => {
              const id = finishWorkout(title, isPrivate);
              setFinishOpen(false);
              setTitle("");
              if (id) router.push(`/workout/${id}`);
            }}
          >
            Save workout
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function ExerciseCard({ index, name, muscle, exerciseId }: { index: number; name: string; muscle: string; exerciseId: string }) {
  const s = useStore();
  const { draft, addSet, updateSet, removeSet, removeExerciseFromDraft } = s;
  const [menu, setMenu] = useState(false);
  const rir = s.me?.rirEnabled ?? false;
  const e = draft!.exercises[index];
  const previous = historyFor(s, "me", exerciseId)[0];
  const target = suggestionFor(s, exerciseId, draft!.startedAt);

  return (
    <section className="rounded-lg border border-border bg-surface" aria-label={name}>
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold">{name}</h2>
          <p className="text-xs text-subtle">{muscle}</p>
        </div>
        <button type="button" aria-label={`Options for ${name}`} onClick={() => setMenu(true)} className="grid size-11 place-items-center text-muted">
          <EllipsisVertical aria-hidden className="size-5" />
        </button>
      </div>
      {target.targetKg != null && (
        <p className="mx-4 mt-2 flex items-center gap-2 rounded-md bg-surface-raised px-3 py-2 text-sm">
          <Target aria-hidden className="size-4 text-accent" />
          <span>
            Target: <span className="tabular font-semibold text-accent">{target.targetKg} kg × {target.targetReps}</span>{" "}
            <span className="text-subtle">({target.label})</span>
          </span>
        </p>
      )}
      <div className="px-2 pt-2 pb-1">
        <div className={`grid items-center gap-1 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-subtle ${rir ? "grid-cols-[2rem_1fr_4.5rem_4rem_3.5rem_2.75rem]" : "grid-cols-[2rem_1fr_4.5rem_4rem_2.75rem]"}`}>
          <span>Set</span>
          <span>Previous</span>
          <span className="text-center">kg</span>
          <span className="text-center">Reps</span>
          {rir && <span className="text-center">RIR</span>}
          <span className="sr-only">Done</span>
        </div>
        {e.sets.map((set, j) => {
          const prev = previous?.sets[j];
          return (
            <div
              key={j}
              className={`grid min-h-13 items-center gap-1 rounded-md px-2 ${set.done ? "bg-success/12" : ""} ${rir ? "grid-cols-[2rem_1fr_4.5rem_4rem_3.5rem_2.75rem]" : "grid-cols-[2rem_1fr_4.5rem_4rem_2.75rem]"}`}
            >
              <button
                type="button"
                onClick={() => updateSet(index, j, { type: NEXT_TYPE[set.type] })}
                aria-label={`Set ${j + 1}, ${TYPE_NAME[set.type]}. Tap to change type`}
                className={`tabular -ml-2 grid h-11 w-10 place-items-center text-base ${set.type === "failure" ? "text-danger" : set.type === "normal" ? "text-muted" : "text-warning"}`}
              >
                {TYPE_SHORT[set.type] ?? j + 1}
              </button>
              <span className="tabular truncate text-sm text-subtle">{prev ? `${prev.kg} × ${prev.reps}` : "—"}</span>
              <SetInput label={`Set ${j + 1} kilograms`} value={set.kg} decimal onChange={(v) => updateSet(index, j, { kg: v ?? 0 })} />
              <SetInput label={`Set ${j + 1} reps`} value={set.reps} onChange={(v) => updateSet(index, j, { reps: Math.round(v ?? 0) })} />
              {rir && <SetInput label={`Set ${j + 1} reps in reserve`} value={set.rir} onChange={(v) => updateSet(index, j, { rir: v == null ? null : Math.min(10, Math.round(v)) })} />}
              <button
                type="button"
                aria-label={set.done ? `Set ${j + 1} done, tap to undo` : `Mark set ${j + 1} done`}
                aria-pressed={set.done}
                onClick={() => updateSet(index, j, { done: !set.done })}
                disabled={!set.done && (set.reps <= 0 || set.kg < 0)}
                className={`grid size-11 place-items-center rounded-md transition-colors disabled:opacity-40 ${set.done ? "bg-success text-on-accent" : "bg-surface-raised text-muted"}`}
              >
                <Check aria-hidden className="size-5" strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => addSet(index)} className="flex min-h-12 w-full items-center justify-center gap-2 border-t border-border text-sm font-medium text-muted">
        <Plus aria-hidden className="size-4" /> Add set
      </button>

      <Sheet open={menu} onClose={() => setMenu(false)} title={name}>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-subtle">Tap a set number to mark it as a warm-up (W), drop set (D) or to failure (F).</p>
          {e.sets.map((set, j) => (
            <Button key={j} variant="secondary" onClick={() => removeSet(index, j)}>
              <Trash2 aria-hidden className="size-4" /> Delete set {j + 1}
              <span className="tabular text-subtle">
                {set.kg} kg × {set.reps}
              </span>
            </Button>
          ))}
          <Button
            variant="danger"
            onClick={() => {
              removeExerciseFromDraft(index);
              setMenu(false);
            }}
          >
            <Trash2 aria-hidden className="size-5" /> Remove exercise
          </Button>
        </div>
      </Sheet>
    </section>
  );
}

const NEXT_TYPE = { normal: "warmup", warmup: "drop", drop: "failure", failure: "normal" } as const;
const TYPE_NAME = { normal: "normal set", warmup: "warm-up", drop: "drop set", failure: "to failure" } as const;
const TYPE_SHORT: Partial<Record<keyof typeof NEXT_TYPE, string>> = { warmup: "W", drop: "D", failure: "F" };

function SetInput({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimal?: boolean;
}) {
  const shown = (v: number | null) => (v == null || v === 0 ? "" : String(v));
  const [text, setText] = useState(shown(value));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    const parsed = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (parsed !== value && !(parsed == null && value === 0)) setText(shown(value));
  }
  return (
    <input
      aria-label={label}
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      placeholder="0"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value.replace(",", "."));
        onChange(e.target.value.trim() === "" || Number.isNaN(n) ? null : Math.max(0, n));
      }}
      className="tabular h-11 w-full rounded-md bg-surface-raised text-center text-lg outline-none placeholder:text-subtle focus:ring-2 focus:ring-focus"
    />
  );
}
