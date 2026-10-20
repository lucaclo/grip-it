"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented, TextField } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import type { Equipment, Exercise } from "@/lib/data/exercises";
import { allExercises } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { MUSCLE_LABEL, MUSCLES, type Muscle } from "@/lib/science/volume";

/** Simple typo-tolerant score: every query word must appear as a word prefix or a subsequence. */
export function matchScore(name: string, query: string): number {
  const n = name.toLowerCase();
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  let score = 0;
  for (const w of words) {
    if (n.startsWith(w)) score += 3;
    else if (n.split(/[\s-]+/).some((p) => p.startsWith(w))) score += 2;
    else if (isSubsequence(w, n)) score += 0.5;
    else return 0;
  }
  return score;
}
function isSubsequence(a: string, b: string) {
  let i = 0;
  for (const ch of b) if (ch === a[i]) i++;
  return i === a.length;
}

export function ExerciseSearch({
  open,
  onClose,
  onPick,
  recentIds,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (e: Exercise) => void;
  recentIds: string[];
}) {
  const custom = useStore((s) => s.customExercises);
  const addCustom = useStore((s) => s.addCustomExercise);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useMemo(() => allExercises({ customExercises: custom }), [custom]);
  const results = useMemo(() => {
    const pool = muscle ? list.filter((e) => e.primary === muscle || e.secondary.includes(muscle)) : list;
    if (!q.trim()) {
      const recent = recentIds.map((id) => pool.find((e) => e.id === id)).filter((e): e is Exercise => !!e);
      const rest = pool.filter((e) => !recentIds.includes(e.id));
      return [...recent, ...rest];
    }
    return pool
      .map((e) => ({ e, s: matchScore(e.name, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  }, [list, q, muscle, recentIds]);

  function pick(e: Exercise) {
    onPick(e);
    setQ("");
    setMuscle(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={creating ? "New exercise" : "Add exercise"} tall>
      {creating ? (
        <CreateExercise
          initialName={q}
          existing={list}
          onCancel={() => setCreating(false)}
          onCreate={(e) => {
            const ex = addCustom(e);
            setCreating(false);
            pick(ex);
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-surface/85 px-4 pb-2 backdrop-blur-md">
            <div className="flex min-h-12 items-center gap-2 rounded-md border border-border-input bg-bg px-3 focus-within:border-focus">
              <Search aria-hidden className="size-5 text-subtle" />
              <input
                type="search"
                enterKeyHint="search"
                data-autofocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search exercises"
                aria-label="Search exercises"
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="grid size-9 place-items-center text-muted">
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by muscle">
              {MUSCLES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={muscle === m}
                  onClick={() => setMuscle(muscle === m ? null : m)}
                  className={`min-h-9 shrink-0 rounded-full border px-3 text-sm ${muscle === m ? "border-accent bg-accent text-on-accent" : "border-border text-muted"}`}
                >
                  {MUSCLE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          {!q && recentIds.length > 0 && !muscle && <p className="text-xs font-medium uppercase tracking-wide text-subtle">Recent first</p>}
          <ul role="listbox" aria-label="Exercises" className="flex flex-col">
            {results.map((e) => (
              <li key={e.id} role="option" aria-selected={false}>
                <button type="button" onClick={() => pick(e)} className="flex min-h-14 w-full items-center gap-3 border-b border-border text-left">
                  <span className="flex-1">
                    <span className="block text-base">{e.name}</span>
                    <span className="block text-sm text-subtle">
                      {MUSCLE_LABEL[e.primary]} · {e.equipment}
                      {e.custom ? " · custom" : ""}
                    </span>
                  </span>
                  <Plus aria-hidden className="size-5 text-accent" />
                </button>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-muted">No exercise matches &ldquo;{q}&rdquo;.</p>
              <Button onClick={() => setCreating(true)}>
                <Plus aria-hidden className="size-5" /> Create &ldquo;{q || "new exercise"}&rdquo;
              </Button>
            </div>
          )}
          {results.length > 0 && (
            <Button variant="ghost" onClick={() => setCreating(true)}>
              <Plus aria-hidden className="size-5" /> Create a custom exercise
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

const EQUIPMENT: Equipment[] = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "smith", "kettlebell", "band", "other"];

function CreateExercise({
  initialName,
  existing,
  onCreate,
  onCancel,
}: {
  initialName: string;
  existing: Exercise[];
  onCreate: (e: Omit<Exercise, "id" | "custom">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [primary, setPrimary] = useState<Muscle>("chest");
  const [secondary, setSecondary] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment>("dumbbell");
  const [tried, setTried] = useState(false);
  const dup = existing.some((e) => e.name.toLowerCase() === name.trim().toLowerCase());
  const err = !name.trim() ? "Give it a name" : dup ? "That exercise already exists" : null;
  return (
    <div className="flex flex-col gap-4">
      <TextField label="Name" value={name} onChange={setName} error={tried ? err : null} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="primary" className="text-sm font-medium text-muted">
          Main muscle
        </label>
        <select id="primary" value={primary} onChange={(e) => setPrimary(e.target.value as Muscle)} className="min-h-12 rounded-md border border-border-input bg-bg px-3">
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABEL[m]}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-muted">Also works (counts as half a set)</legend>
        <div className="flex flex-wrap gap-2">
          {MUSCLES.filter((m) => m !== primary).map((m) => {
            const on = secondary.includes(m);
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => setSecondary(on ? secondary.filter((x) => x !== m) : [...secondary, m])}
                className={`min-h-9 rounded-full border px-3 text-sm ${on ? "border-accent text-accent" : "border-border text-muted"}`}
              >
                {MUSCLE_LABEL[m]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Segmented
        label="Equipment"
        value={equipment}
        onChange={setEquipment}
        options={EQUIPMENT.slice(0, 4).map((e) => ({ value: e, label: e[0].toUpperCase() + e.slice(1) }))}
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            setTried(true);
            if (!err) onCreate({ name: name.trim(), primary, secondary, equipment });
          }}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
