import { MUSCLE_LABEL } from "@/lib/science/volume";
import type { Exercise } from "./exercises";

/** Spellings people type for the same word. Both the query and every name go through this. */
const WORD: Record<string, string> = {
  biceps: "bicep",
  triceps: "tricep",
  db: "dumbbell",
  dumbell: "dumbbell",
  dumbel: "dumbbell",
  dumbells: "dumbbell",
  bb: "barbell",
  kb: "kettlebell",
  pullup: "pull up",
  pullups: "pull up",
  chinup: "chin up",
  chinups: "chin up",
  pushup: "push up",
  pushups: "push up",
  situp: "sit up",
  situps: "sit up",
  flye: "fly",
  flyes: "fly",
  flies: "fly",
  delts: "delt",
  calves: "calf",
};

function singular(w: string) {
  if (w.length <= 3 || w.endsWith("ss") || w.endsWith("us")) return w;
  if (/(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

/** Lowercase, punctuation out, one spelling per word: "Dumbell Bicep-Curls" → "dumbbell bicep curl". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .flatMap((w) => (WORD[w] ?? singular(w)).split(" "))
    .join(" ");
}

const compact = (s: string) => s.replace(/ /g, "");

/** Typo-tolerant score of one name against a normalized query: every query word must match. */
function score(name: string, q: string): number {
  if (name === q) return 100;
  if (compact(name) === compact(q)) return 90;
  let total = name.startsWith(q) ? 10 : 0;
  const parts = name.split(" ");
  for (const w of q.split(" ")) {
    if (name.startsWith(w)) total += 3;
    else if (parts.some((p) => p.startsWith(w))) total += 2;
    else if (compact(name).includes(w)) total += 1;
    else if (isSubsequence(w, name)) total += 0.5;
    else return 0;
  }
  return total;
}

function isSubsequence(a: string, b: string) {
  let i = 0;
  for (const ch of b) if (ch === a[i]) i++;
  return i === a.length;
}

export type Hit = { exercise: Exercise; /** The other name that matched, when it wasn't the main one. */ via?: string };

/**
 * Exercises matching `query`, best first. Each exercise appears once however many of its names
 * match; an alias match ranks a little below the same match on the real name. The primary muscle
 * counts as a weak extra word, so "bicep curl" also finds Barbell curl, below the exact matches.
 */
export function searchExercises(list: Exercise[], query: string): Hit[] {
  const q = normalize(query);
  if (!q) return list.map((exercise) => ({ exercise }));
  const hits: (Hit & { s: number })[] = [];
  for (const exercise of list) {
    let best = score(normalize(exercise.name), q);
    let via: string | undefined;
    for (const a of exercise.aliases ?? []) {
      const s = score(normalize(a), q) * 0.95;
      if (s > best) {
        best = s;
        via = a;
      }
    }
    if (best === 0) best = score(`${normalize(exercise.name)} ${normalize(MUSCLE_LABEL[exercise.primary])}`, q) * 0.4;
    if (best > 0) hits.push({ exercise, via, s: best });
  }
  return hits
    .sort((a, b) => b.s - a.s || a.exercise.name.length - b.exercise.name.length)
    .map(({ exercise, via }) => ({ exercise, via }));
}

/** The exercise already filed under this name or one of its aliases, if any. */
export function findExisting(list: Exercise[], name: string): Exercise | undefined {
  const n = normalize(name);
  if (!n) return undefined;
  return list.find((e) => normalize(e.name) === n || (e.aliases ?? []).some((a) => normalize(a) === n));
}
