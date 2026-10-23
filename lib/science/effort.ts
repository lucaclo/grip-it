import { cite } from "./citations";
import type { SetType } from "./progression";
import { e1rm } from "./strength";
import { VOLUME_BAND } from "./volume";

/**
 * Effort: how close a set came to failure, worked out from the weight relative to your max and
 * the reps you did. It drives hard sets, the muscle diagram and the Volume screen.
 *
 * - Your max on a lift is your best estimated 1-rep max (Epley) from earlier sessions. With no
 *   history, today's best set stands in for it, and the result is marked as an estimate.
 * - Reps you could do at that weight come from Epley reversed: 30 × (max ÷ weight − 1).
 * - Reps left = could do − did. A logged RIR always wins over the estimate.
 * - Closer to failure scores higher (Refalo 2023, Robinson 2024). Light and heavy loads both count
 *   when sets are hard (Schoenfeld 2017), but very light sets (< 30% of max) are halved, since that
 *   meta-analysis didn't test loads that light.
 */
export const EFFORT_CITATIONS = cite(
  "refalo2023failure",
  "robinson2024failure",
  "schoenfeld2017loading",
  "helms2016rir",
  "epley1985",
);
export const RIR_CITATIONS = cite("helms2016rir", "zourdos2016rir", "refalo2023failure");

/** A hard set ends with this many reps left, or fewer. */
export const HARD_SET_RIR = 3;
/** The RIR prompt's choices; "5+" is stored as 5. */
export const RIR_CHOICES = [0, 1, 2, 3, 4, 5] as const;
/** Score for a working set whose effort can't be judged (no weight to compare): a typical hard set. */
const UNKNOWN_SCORE = 0.7;
const TRUSTED_RIR_MAX = 5;
const LIGHT_LOAD = 0.3;

/** Reps you could do at `loadKg` given an estimated 1-rep max (Epley reversed), at least 1. */
export function repsAtLoad(loadKg: number, maxKg: number): number {
  if (loadKg <= 0 || maxKg <= 0) return 0;
  return Math.max(1, 30 * (maxKg / loadKg - 1));
}

/** Estimated reps left in the tank, or null when there's nothing to compare against. */
export function estimateRir(reps: number, loadKg: number, maxKg: number): number | null {
  if (reps <= 0 || loadKg <= 0 || maxKg <= 0) return null;
  return Math.max(0, repsAtLoad(loadKg, maxKg) - reps);
}

/** 0–1: how much a set counts, by reps left (rounded to the nearest whole rep). */
export function effortScore(rir: number | null, relLoad: number | null = null): number {
  if (rir == null) return UNKNOWN_SCORE;
  const r = Math.round(rir);
  const base = r <= 1 ? 1 : r === 2 ? 0.85 : r === 3 ? 0.7 : r === 4 ? 0.5 : 0.25;
  return relLoad != null && relLoad < LIGHT_LOAD ? base / 2 : base;
}

export type EffortSet = { kg: number; reps: number; rir: number | null; type?: SetType };

export type SetEffort = {
  /** Reps left: logged, or estimated (null when unknown). */
  rir: number | null;
  logged: boolean;
  /** Load as a fraction of your max, when known. */
  relLoad: number | null;
  score: number;
  hard: boolean;
};

/**
 * Effort for each set of one exercise in one session.
 * `bestBefore`: best e1RM on this lift from earlier sessions (0 if none).
 * `extraLoadKg`: added to every set's weight, e.g. body weight for pull-ups and dips.
 * Returns the sets' efforts and whether the max had to come from this session alone.
 */
export function sessionEffort(
  sets: EffortSet[],
  bestBefore: number,
  extraLoadKg = 0,
): { sets: SetEffort[]; estimated: boolean; bestToday: number } {
  const load = (x: EffortSet) => x.kg + extraLoadKg;
  let bestToday = 0;
  for (const x of sets) if (x.type !== "warmup") bestToday = Math.max(bestToday, e1rm(load(x), x.reps) ?? 0);
  // A PR today means today's best set was about as hard as you can go.
  const max = Math.max(bestBefore, bestToday);
  const out = sets.map((x): SetEffort => {
    if (x.type === "warmup" || x.reps <= 0) return { rir: null, logged: false, relLoad: null, score: 0, hard: false };
    const relLoad = max > 0 && load(x) > 0 ? load(x) / max : null;
    // RIR above 5 only ever came from the old RIR column, where people typed reps by mistake. Those
    // values stay saved but aren't trusted; the estimate is used instead.
    const logged = x.rir != null && x.rir <= TRUSTED_RIR_MAX;
    const rir = logged ? x.rir : estimateRir(x.reps, load(x), max);
    // Sets to failure ("F") are 0 reps left by definition.
    const r = x.type === "failure" ? 0 : rir;
    const score = effortScore(r, relLoad);
    return { rir: r, logged, relLoad, score, hard: r == null || Math.round(r) <= HARD_SET_RIR };
  });
  return { sets: out, estimated: bestBefore <= 0 && sets.some((x) => x.type !== "warmup" && x.reps > 0), bestToday };
}

/** 0 = untrained, 1–4 = light to very hard. Session thresholds are effective sets in one workout. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;
export const SESSION_HEAT = [2, 4, 6] as const;
/** Weekly thresholds follow the weekly set band: half the minimum, the minimum, the maximum. */
export const WEEK_HEAT = [VOLUME_BAND.min / 2, VOLUME_BAND.min, VOLUME_BAND.max] as const;
export const HEAT_LABEL = ["Not worked", "Light", "Moderate", "Hard", "Very hard"] as const;

export function heatLevel(score: number, scale: "session" | "week"): HeatLevel {
  if (score <= 0) return 0;
  const [a, b, c] = scale === "session" ? SESSION_HEAT : WEEK_HEAT;
  if (score < a) return 1;
  if (score < b) return 2;
  if (scale === "session" ? score < c : score <= c) return 3;
  return 4;
}
