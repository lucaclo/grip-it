"use client";

import {
  CalendarClock,
  Check,
  EllipsisVertical,
  Minus,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExerciseAnatomy, ExerciseIcon } from "@/components/anatomy/exercise-anatomy";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/bits";
import { NumberField, Toggle } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { ExerciseSearch } from "@/components/workout/exercise-search";
import { GripPicker } from "@/components/workout/grip-picker";
import { HistoryList } from "@/components/workout/history-list";
import { PlateBar } from "@/components/plate-bar";
import { Plate3D } from "@/components/plate-3d";
import { RestTimer } from "@/components/workout/rest-timer";
import {
  exerciseMap,
  historyFor,
  latestWeight,
  suggestionFor,
  workoutsOf,
} from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { DraftSet } from "@/lib/data/types";
import { RirInfo } from "@/components/explainers";
import { cleanNumberText, parseNumber } from "@/lib/number-input";
import { RIR_CHOICES } from "@/lib/science/effort";
import { gripVariant, isUsualGrip, withGrip } from "@/lib/science/grips";
import { MUSCLE_LABEL } from "@/lib/science/volume";

const pad = (n: number) => String(n).padStart(2, "0");
/** Local calendar date and clock time for the date/time inputs. */
function localDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function localTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const {
    draft,
    startWorkout,
    addExerciseToDraft,
    finishWorkout,
    discardDraft,
    markAllDone,
    setAutoTick,
  } = s;
  const [searchOpen, setSearchOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPrivate, setPrivate] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  // When it happened: editable at Finish, for logging past workouts or fixing a forgotten Finish.
  const [whenDate, setWhenDate] = useState("");
  const [whenTime, setWhenTime] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState(0); // "now" as of opening the Finish sheet
  const elapsed = useElapsed(draft?.startedAt);
  const ex = useMemo(() => exerciseMap(s), [s]);
  const recentIds = useMemo(
    () =>
      [
        ...new Set(
          workoutsOf(s, "me").flatMap((w) =>
            w.exercises.map((e) => e.exerciseId),
          ),
        ),
      ].slice(0, 12),
    [s],
  );

  if (!draft) {
    return (
      <>
        <PageHeader
          title="Log"
          subtitle="Start a session, or open a past one to view or edit it."
        />
        <div className="card-hero mb-6 flex flex-col items-center gap-3 rounded-xl px-5 py-6 text-center">
          <Plate3D size={132} className="my-3" />
          <p className="max-w-xs text-sm text-text">
            Every set saves as you go. Close the app mid-session and pick up
            right where you left off.
          </p>
          <Button size="lg" className="w-full" onClick={startWorkout}>
            Start workout
          </Button>
          <p className="text-xs text-text">
            Already trained? Start one, turn on Auto-tick and log it after the
            fact.
          </p>
        </div>
        <h2 className="mb-3 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">
          History
        </h2>
        <HistoryList />
      </>
    );
  }

  const totalSets = draft.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = draft.exercises.reduce(
    (a, e) => a + e.sets.filter((x) => x.done).length,
    0,
  );
  // Filled in but not ticked yet: offered as "Tick all and save" so nothing typed is lost.
  const unticked = draft.exercises.reduce(
    (a, e) => a + e.sets.filter((x) => !x.done && x.reps > 0).length,
    0,
  );
  // Same rule as saved workouts: working sets only, body weight counted on body-weight moves.
  const bodyWeight = latestWeight(s) ?? 0;
  const volume = draft.exercises.reduce((a, e) => {
    const extra = ex.get(e.exerciseId)?.equipment === "bodyweight" ? bodyWeight : 0;
    return a + e.sets.filter((x) => x.done && x.type !== "warmup").reduce((b, x) => b + (x.kg + extra) * x.reps, 0);
  }, 0);

  const start = new Date(`${whenDate}T${whenTime}`);
  const timeError =
    !whenDate || !whenTime || Number.isNaN(start.getTime())
      ? "Pick a date and start time"
      : start.getTime() > openedAt + 60_000
        ? "That start time is in the future"
        : durationMin == null || durationMin < 1 || durationMin > 600
          ? "Duration should be between 1 and 600 minutes"
          : null;

  function openFinish() {
    const now = Date.now();
    const started = new Date(draft!.startedAt);
    setOpenedAt(now);
    setWhenDate(localDate(started));
    setWhenTime(localTime(started));
    const ended = draft!.editing ? Date.parse(draft!.editing.endedAt) : now;
    setDurationMin(
      Math.max(1, Math.round((ended - started.getTime()) / 60_000)),
    );
    if (draft!.editing) {
      setTitle((t) => t || draft!.editing!.title);
      setPrivate(draft!.editing.isPrivate);
    }
    setFinishOpen(true);
  }

  function save() {
    if (timeError) return;
    const id = finishWorkout(title, isPrivate, {
      startedAt: start.toISOString(),
      endedAt: new Date(start.getTime() + durationMin! * 60_000).toISOString(),
    });
    setFinishOpen(false);
    setTitle("");
    if (id) router.push(`/workout/${id}?celebrate=1`);
  }

  function addExercise(exerciseId: string) {
    // Prefill with today's target so beating it is one tick per set; "Previous" still shows last time.
    // The grip carries over from last time.
    const last = historyFor(s, "me", exerciseId, draft!.startedAt)[0];
    const grip = last?.grip;
    const target = suggestionFor(s, exerciseId, draft!.startedAt, grip);
    const prefill: DraftSet[] = last
      ? last.sets.map((x) => ({
          kg: x.type === "warmup" ? x.kg : (target.targetKg ?? x.kg),
          reps: x.type === "warmup" ? x.reps : (target.targetReps ?? x.reps),
          rir: null,
          type: x.type ?? "normal",
          done: false,
        }))
      : [];
    addExerciseToDraft(exerciseId, prefill, grip);
  }

  return (
    <>
      {/* Slim bar pinned to the very top: time and totals on the left, Finish on the right. */}
      <header className="glass sticky top-0 z-10 -mx-4 border-b border-white/8 px-4 pt-safe">
        <div className="flex min-h-14 items-center gap-3 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] uppercase tracking-wide text-subtle">
              {draft.editing ? "Editing workout" : "Workout"}
            </p>
            <p className="flex items-baseline gap-2 leading-tight" aria-live="off">
              <span className="tabular text-lg font-semibold">
                {draft.editing
                  ? new Date(draft.startedAt).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  : elapsed}
              </span>
              <span className="truncate text-xs text-muted">
                <span key={doneSets} className="tabular inline-block text-text motion-safe:animate-bump">
                  {doneSets}
                </span>{" "}
                set{doneSets === 1 ? "" : "s"} ·{" "}
                <span className="tabular text-text">{Math.round(volume).toLocaleString("en-GB")}</span> kg
              </span>
            </p>
          </div>
          <Button
            size="sm"
            className="min-h-10 px-4"
            disabled={draft.exercises.length === 0}
            onClick={openFinish}
          >
            <Check aria-hidden className="size-4" strokeWidth={3} />
            {draft.editing ? "Save" : "Finish"}
          </Button>
        </div>
        {/* Session progress: ticked sets out of everything planned. */}
        <div
          className="relative -mx-4 h-0.5 bg-white/5"
          role="progressbar"
          aria-label="Sets done"
          aria-valuemin={0}
          aria-valuemax={totalSets}
          aria-valuenow={doneSets}
        >
          <div
            className="bg-brand absolute inset-y-0 left-0 shadow-glow transition-[width] duration-700 ease-[var(--ease-expo)]"
            style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="stagger flex flex-col gap-4 pt-4">
        <div className="card rounded-lg px-4 py-1">
          <Toggle
            label="Auto-tick sets"
            description="For logging a workout you've already done: every set with reps counts, no need to tap each tick."
            checked={!!draft.autoTick}
            onChange={setAutoTick}
          />
        </div>
        {doneSets === 0 && draft.exercises.length > 0 && !draft.autoTick && (
          <p className="-my-1 text-center text-sm text-muted">
            Tap{" "}
            <Check
              aria-hidden
              className="inline size-4 align-[-3px] text-success"
              strokeWidth={3}
            />{" "}
            after each set to log it.
          </p>
        )}
        {draft.exercises.map((e, i) => {
          const def = ex.get(e.exerciseId);
          return (
            <ExerciseCard
              key={`${e.exerciseId}-${i}`}
              index={i}
              name={def?.name ?? "Unknown"}
              muscle={def ? MUSCLE_LABEL[withGrip(def, e.grip).primary] : ""}
              exerciseId={e.exerciseId}
            />
          );
        })}

        <Button
          variant="secondary"
          size="lg"
          onClick={() => setSearchOpen(true)}
        >
          <Plus aria-hidden className="size-5" /> Add exercise
        </Button>
        <Button
          variant="ghost"
          onClick={() => setDiscardOpen(true)}
          className="text-danger"
        >
          {draft.editing ? "Cancel editing" : "Discard workout"}
        </Button>
      </div>

      {/* Only the rest timer floats, and only while resting. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-10 mx-auto max-w-[480px] px-4 pb-2 [&>*]:pointer-events-auto">
        <RestTimer />
      </div>
      <div className="h-24" />

      <ExerciseSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={(e) => addExercise(e.id)}
        recentIds={recentIds}
      />

      <Sheet
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={draft.editing ? "Cancel editing?" : "Discard workout?"}
      >
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            {draft.editing
              ? "Your changes are thrown away. The saved workout stays as it was."
              : "This deletes the session in progress. Saved workouts aren't affected."}
          </p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              discardDraft();
              setDiscardOpen(false);
            }}
          >
            <Trash2 aria-hidden className="size-5" />{" "}
            {draft.editing ? "Discard changes" : "Discard"}
          </Button>
          <Button variant="secondary" onClick={() => setDiscardOpen(false)}>
            Keep logging
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={draft.editing ? "Save changes" : "Finish workout"}
      >
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
          <fieldset className="flex flex-col gap-3 rounded-md border border-border p-3">
            <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-muted">
              <CalendarClock aria-hidden className="size-4" /> When
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="wdate"
                  className="text-sm font-medium text-muted"
                >
                  Date
                </label>
                <input
                  id="wdate"
                  type="date"
                  value={whenDate}
                  max={localDate(new Date(openedAt))}
                  onChange={(e) => setWhenDate(e.target.value)}
                  className="min-h-12 rounded-md border border-border-input bg-bg px-3 text-base outline-none focus:border-focus"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="wtime"
                  className="text-sm font-medium text-muted"
                >
                  Start time
                </label>
                <input
                  id="wtime"
                  type="time"
                  value={whenTime}
                  onChange={(e) => setWhenTime(e.target.value)}
                  className="min-h-12 rounded-md border border-border-input bg-bg px-3 text-base outline-none focus:border-focus"
                />
              </div>
            </div>
            <NumberField
              label="Duration"
              unit="min"
              step={5}
              min={1}
              max={600}
              value={durationMin}
              onChange={setDurationMin}
              error={timeError}
            />
          </fieldset>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Duration", durationMin ? `${durationMin} min` : "—"],
              ["Sets", String(doneSets)],
              ["Volume", `${Math.round(volume).toLocaleString("en-GB")} kg`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-surface-raised p-2">
                <dt className="text-xs text-subtle">{k}</dt>
                <dd className="tabular text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <Toggle
            label="Private workout"
            description="Hidden from the feed. Still counts toward leaderboards."
            checked={isPrivate}
            onChange={setPrivate}
          />
          {unticked > 0 && (
            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              {unticked} set{unticked === 1 ? " isn't" : "s aren't"} ticked yet.
              Tick them all if you did them, or save only the ticked ones.
            </p>
          )}
          {unticked > 0 && (
            <Button
              size="lg"
              disabled={!!timeError}
              onClick={() => {
                markAllDone();
                save();
              }}
            >
              <Check aria-hidden className="size-5" /> Tick all{" "}
              {unticked + doneSets} and save
            </Button>
          )}
          {doneSets > 0 && (
            <Button
              size="lg"
              variant={unticked > 0 ? "secondary" : "primary"}
              disabled={!!timeError}
              onClick={save}
            >
              {unticked > 0
                ? `Save ${doneSets} ticked set${doneSets === 1 ? "" : "s"} only`
                : draft.editing
                  ? "Save changes"
                  : "Save workout"}
            </Button>
          )}
          {doneSets === 0 && unticked === 0 && (
            <p className="text-sm text-muted">
              Enter kg and reps for at least one set to save this workout.
            </p>
          )}
        </div>
      </Sheet>
    </>
  );
}

function ExerciseCard({
  index,
  name,
  muscle,
  exerciseId,
}: {
  index: number;
  name: string;
  muscle: string;
  exerciseId: string;
}) {
  const s = useStore();
  const {
    draft,
    addSet,
    updateSet,
    removeSet,
    insertSet,
    removeExerciseFromDraft,
    setGrip,
  } = s;
  const [undo, setUndo] = useState<{ set: DraftSet; at: number } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);
  function removeWithUndo(j: number) {
    const removed = draft!.exercises[index].sets[j];
    removeSet(index, j);
    setUndo({ set: removed, at: j });
  }
  const [menu, setMenu] = useState(false);
  const [anatomy, setAnatomy] = useState(false);
  // The set whose "reps left?" prompt is open: the one just ticked.
  const [asking, setAsking] = useState<number | null>(null);
  const rir = s.me?.rirEnabled ?? false;
  const e = draft!.exercises[index];
  const base = exerciseMap(s).get(exerciseId);
  // With the grip's muscles, for the icon and the anatomy sheet.
  const def = base && withGrip(base, e.grip);
  const isBarbell = def?.equipment === "barbell";
  const done = e.sets.filter((x) => x.done).length;
  const complete = e.sets.length > 0 && done === e.sets.length;
  // Only sessions before this one: matters when editing an older workout. Same grip first.
  const history = historyFor(s, "me", exerciseId, draft!.startedAt);
  const variant = gripVariant(exerciseId, e.grip);
  const previous = history.find((h) => gripVariant(exerciseId, h.grip) === variant) ?? history[0];
  const target = suggestionFor(s, exerciseId, draft!.startedAt, e.grip);

  function pickGrip(id: string) {
    const next = isUsualGrip(exerciseId, id) ? undefined : id;
    const to = suggestionFor(s, exerciseId, draft!.startedAt, next);
    // Sets still holding the old target move to the new grip's target; typed or ticked sets stay.
    const retarget =
      target.targetKg != null && target.targetReps != null && to.targetKg != null && to.targetReps != null
        ? { fromKg: target.targetKg, fromReps: target.targetReps, toKg: to.targetKg, toReps: to.targetReps }
        : undefined;
    setGrip(index, next, retarget);
  }

  return (
    <section
      className={`card relative overflow-hidden rounded-lg transition-[border-color,box-shadow] duration-500 ${complete ? "!border-success/50 shadow-[0_18px_40px_-24px_rgb(75_227_160/0.6)]" : ""}`}
      aria-label={name}
    >
      {/* per-exercise progress along the top edge */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-white/5">
        <div
          className={`h-full transition-[width] duration-700 ease-[var(--ease-expo)] ${complete ? "bg-success" : "bg-brand"}`}
          style={{ width: `${e.sets.length ? (done / e.sets.length) * 100 : 0}%` }}
        />
      </div>
      <div className="flex items-center gap-3 px-4 pt-3">
        {def && (
          <button
            type="button"
            onClick={() => setAnatomy(true)}
            aria-label={`Muscles worked by ${name}`}
            className="press -my-1 rounded-md"
          >
            <ExerciseIcon exercise={def} className="size-12" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">{name}</h2>
          <p className="text-xs text-subtle">{muscle}</p>
        </div>
        <span
          key={done}
          className={`num-hero rounded-full px-2.5 py-0.5 text-sm motion-safe:animate-bump ${complete ? "bg-success text-on-accent" : "bg-surface-raised text-muted"}`}
          aria-label={`${done} of ${e.sets.length} sets done`}
        >
          {complete ? "Done" : `${done}/${e.sets.length}`}
        </span>
        <button
          type="button"
          aria-label={`Options for ${name}`}
          onClick={() => setMenu(true)}
          className="grid size-11 place-items-center text-muted"
        >
          <EllipsisVertical aria-hidden className="size-5" />
        </button>
      </div>
      {base && (
        <div className="px-3">
          <GripPicker exercise={base} grip={e.grip} onPick={(g) => pickGrip(g.id)} />
        </div>
      )}
      {target.targetKg != null && (
        <div className="mx-4 mt-2 rounded-md border border-volt/25 bg-volt/8 px-3 py-2 shadow-glow-volt">
          <p className="flex items-center gap-2 text-sm">
            <Target aria-hidden className="size-4 text-volt" />
            <span className="flex-1">
              Target{" "}
              <span className="num-hero text-lg text-volt">
                {target.targetKg} kg × {target.targetReps}
              </span>
            </span>
            <span className="rounded-full bg-volt/15 px-2 py-0.5 text-xs font-semibold text-volt">
              {target.label}
            </span>
          </p>
          {target.action === "new_grip" && <p className="mt-1 text-xs text-muted">{target.reason}</p>}
          {isBarbell && (
            <div className="mt-2">
              <PlateBar kg={target.targetKg} />
            </div>
          )}
        </div>
      )}
      <div className="px-2 pt-2 pb-1">
        <div className={`${ROW_GRID} px-2 pb-1 text-[0.6875rem] font-medium uppercase tracking-wide text-subtle`}>
          <span>Set</span>
          <span>Previous</span>
          <span className="text-center">Weight</span>
          <span className="text-center">Reps</span>
          <span className="text-center">Done</span>
        </div>
        {e.sets.map((set, j) => {
          const prev = previous?.sets[j];
          const showAsk = rir && set.done && !draft!.autoTick && asking === j;
          return (
            <div key={`${j}-${e.sets.length}`}>
              <SwipeToDelete
                onDelete={() => removeWithUndo(j)}
                label={`Set ${j + 1}, swipe left to delete`}
              >
                <div
                  className={`${ROW_GRID} min-h-13 rounded-md px-2 transition-colors duration-300 ${set.done ? "bg-success/12 row-sweep" : "bg-surface"}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateSet(index, j, { type: NEXT_TYPE[set.type] })
                    }
                    aria-label={`Set ${j + 1}, ${TYPE_NAME[set.type]}. Tap to change type`}
                    className={`tabular -ml-2 grid h-11 w-10 place-items-center text-base ${set.type === "failure" ? "text-danger" : set.type === "normal" ? "text-muted" : "text-warning"}`}
                  >
                    {TYPE_SHORT[set.type] ?? j + 1}
                  </button>
                  <span className="tabular truncate text-sm text-subtle">
                    {prev ? `${prev.kg} × ${prev.reps}` : "—"}
                  </span>
                  <SetInput
                    label={`Set ${j + 1} weight in kilograms`}
                    unit="kg"
                    value={set.kg}
                    decimal
                    onChange={(v) => updateSet(index, j, { kg: v ?? 0 })}
                  />
                  <SetInput
                    label={`Set ${j + 1} reps`}
                    unit="reps"
                    value={set.reps}
                    onChange={(v) =>
                      updateSet(index, j, { reps: Math.round(v ?? 0) })
                    }
                  />
                  <button
                    type="button"
                    aria-label={
                      set.done
                        ? `Set ${j + 1} done, tap to undo`
                        : `Mark set ${j + 1} done`
                    }
                    aria-pressed={set.done}
                    onClick={() => {
                      updateSet(index, j, { done: !set.done });
                      setAsking(set.done ? null : j);
                    }}
                    disabled={!set.done && (set.reps <= 0 || set.kg < 0)}
                    className={`mx-auto grid size-11 place-items-center rounded-md transition-colors disabled:opacity-40 ${set.done ? "bg-success text-on-accent shadow-[0_6px_18px_-6px_rgb(75_227_160/0.7)] motion-safe:animate-tick" : "border border-success/50 bg-surface-raised text-success"}`}
                  >
                    <Check aria-hidden className="size-5" strokeWidth={3} />
                  </button>
                </div>
              </SwipeToDelete>
              {showAsk ? (
                <RirPrompt
                  value={set.rir}
                  onPick={(v) => {
                    updateSet(index, j, { rir: v });
                    setAsking(null);
                  }}
                  onSkip={() => setAsking(null)}
                />
              ) : (
                rir &&
                set.done &&
                set.rir != null && (
                  <button
                    type="button"
                    onClick={() => setAsking(j)}
                    className="ml-12 flex min-h-8 items-center gap-1 text-xs text-subtle"
                    aria-label={`Set ${j + 1}: ${set.rir} reps left. Change`}
                  >
                    ↳ {set.rir >= 5 ? "5+" : set.rir} rep{set.rir === 1 ? "" : "s"} left
                    <span className="text-accent">· Change</span>
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 border-t border-border">
        <button
          type="button"
          onClick={() => addSet(index)}
          className="flex min-h-12 items-center justify-center gap-2 text-sm font-medium text-muted active:bg-surface-raised"
        >
          <Plus aria-hidden className="size-4" /> Add set
        </button>
        <button
          type="button"
          disabled={e.sets.length === 0}
          onClick={() => removeWithUndo(e.sets.length - 1)}
          className="flex min-h-12 items-center justify-center gap-2 border-l border-border text-sm font-medium text-muted active:bg-surface-raised disabled:opacity-40"
        >
          <Minus aria-hidden className="size-4" /> Remove set
        </button>
      </div>
      {undo && (
        <div
          role="status"
          className="flex items-center gap-3 border-t border-border px-4 py-1 text-sm motion-safe:animate-rise"
        >
          <span className="flex-1 text-muted">
            Set {undo.at + 1} removed ({undo.set.kg} kg × {undo.set.reps})
          </span>
          <button
            type="button"
            onClick={() => {
              insertSet(index, undo.at, undo.set);
              setUndo(null);
            }}
            className="min-h-11 rounded-md px-3 font-semibold text-accent"
          >
            Undo
          </button>
        </div>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={name}>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-subtle">
            Tap a set number to mark it as a warm-up (W), drop set (D) or to
            failure (F).
          </p>
          {e.sets.map((set, j) => (
            <Button
              key={j}
              variant="secondary"
              onClick={() => removeSet(index, j)}
            >
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
      {def && (
        <Sheet open={anatomy} onClose={() => setAnatomy(false)} title={name}>
          <ExerciseAnatomy exercise={def} />
        </Sheet>
      )}
    </section>
  );
}

const NEXT_TYPE = {
  normal: "warmup",
  warmup: "drop",
  drop: "failure",
  failure: "normal",
} as const;
const TYPE_NAME = {
  normal: "normal set",
  warmup: "warm-up",
  drop: "drop set",
  failure: "to failure",
} as const;
const TYPE_SHORT: Partial<Record<keyof typeof NEXT_TYPE, string>> = {
  warmup: "W",
  drop: "D",
  failure: "F",
};

/** Set row columns: set type, previous, weight, reps, done. Shared by the header and every row. */
const ROW_GRID = "grid grid-cols-[2rem_1fr_5rem_4.5rem_2.75rem] items-center gap-1.5";

/**
 * Number box for weight or reps, with its unit inside so it can't be mistaken for another column.
 * Weight takes decimals (27.5, or 27,5 on a comma keyboard); reps are whole numbers with no upper limit.
 */
function SetInput({
  label,
  unit,
  value,
  onChange,
  decimal,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimal?: boolean;
}) {
  const shown = (v: number | null) => (v == null || v === 0 ? "" : String(v));
  const [text, setText] = useState(shown(value));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    const parsed = parseNumber(text);
    if (parsed !== value && !(parsed == null && value === 0))
      setText(shown(value));
  }
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <input
        inputMode={decimal ? "decimal" : "numeric"}
        pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        enterKeyHint="done"
        autoComplete="off"
        value={text}
        placeholder="0"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const clean = cleanNumberText(e.target.value, !!decimal);
          setText(clean);
          onChange(parseNumber(clean));
        }}
        className="tabular h-11 w-full rounded-md bg-surface-raised pr-8 pl-1 text-center text-lg outline-none placeholder:text-subtle focus:ring-2 focus:ring-focus"
      />
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[0.6875rem] font-medium uppercase text-muted">
        {unit}
      </span>
    </label>
  );
}

/** After ticking a set (with RIR on): one tap to say how many more reps you had in you. */
function RirPrompt({
  value,
  onPick,
  onSkip,
}: {
  value: number | null;
  onPick: (v: number) => void;
  onSkip: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Reps left in the tank?"
      className="mx-1 mt-1 mb-1.5 rounded-md border border-accent/30 bg-accent/8 px-2 py-2 motion-safe:animate-rise"
    >
      <div className="mb-1.5 flex items-center gap-3 pl-1">
        <p className="flex items-center gap-2 text-sm">
          Reps left in the tank?
          <RirInfo />
        </p>
        <span className="flex-1" />
        <button type="button" onClick={onSkip} className="-my-1 min-h-11 px-3 text-sm text-muted">
          Skip
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {RIR_CHOICES.map((n) => {
          const on = value != null && Math.min(5, value) === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(n)}
              className={`tabular min-h-11 rounded-md border text-base font-semibold transition-colors active:scale-95 ${on ? "border-accent bg-accent text-on-accent" : "border-border bg-surface-raised text-text"}`}
            >
              {n === 5 ? "5+" : n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Swipe a row left to delete it. The Remove set button is the non-gesture alternative. */
function SwipeToDelete({
  children,
  onDelete,
  label,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  label: string;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; locked: boolean | null } | null>(
    null,
  );
  const dxRef = useRef(0); // latest distance; state can lag a fast swipe
  const THRESHOLD = 96;
  const reset = () => {
    start.current = null;
    dxRef.current = 0;
    setDragging(false);
    setDx(0);
  };
  return (
    <div
      className="relative overflow-hidden rounded-md"
      aria-label={label}
      role="group"
    >
      {dx < 0 && (
        <div
          aria-hidden
          className={`absolute inset-0 flex items-center justify-end rounded-md pr-4 text-on-danger transition-colors ${dx < -THRESHOLD ? "bg-danger" : "bg-danger/60"}`}
        >
          <Trash2
            className={`size-5 transition-transform ${dx < -THRESHOLD ? "scale-125" : ""}`}
          />
        </div>
      )}
      <div
        className={`relative touch-pan-y select-none ${dragging ? "" : "transition-transform duration-300 ease-[var(--ease-spring)]"}`}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, locked: null };
        }}
        onPointerMove={(e) => {
          const st = start.current;
          if (!st) return;
          const mx = e.clientX - st.x;
          const my = e.clientY - st.y;
          if (st.locked === null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) {
            st.locked = Math.abs(mx) > Math.abs(my) && mx < 0;
            if (st.locked) {
              setDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }
          }
          if (st.locked) {
            dxRef.current = Math.min(0, mx);
            setDx(dxRef.current);
          }
        }}
        onPointerUp={() => {
          if (dxRef.current < -THRESHOLD) {
            navigator.vibrate?.(20);
            onDelete();
          }
          reset();
        }}
        onPointerCancel={reset}
      >
        {children}
      </div>
    </div>
  );
}
