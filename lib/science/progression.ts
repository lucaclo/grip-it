import { cite } from "./citations";
import type { Goal } from "./targets";

export type LoggedSet = { kg: number; reps: number; rir?: number | null; type?: SetType };
export type SetType = "normal" | "warmup" | "drop" | "failure";
export type Session = { sets: LoggedSet[] };

export type Action = "add_weight" | "add_rep" | "hold" | "deload" | "first_time";

export type Suggestion = {
  action: Action;
  targetKg: number | null;
  targetReps: number | null;
  label: string;
  reason: string;
  citationKeys: string[];
};

export const REP_RANGE: Record<Goal, [number, number]> = {
  hypertrophy: [6, 12],
  strength: [3, 6],
  powerbuilding: [4, 10],
  recomp: [6, 12],
  fat_loss: [6, 12],
  fitness: [8, 15],
};

const roundTo = (kg: number, step: number) => Math.round(kg / step) * step;

function working(s: Session): LoggedSet[] {
  return s.sets.filter((x) => x.type !== "warmup" && x.reps > 0);
}

function topKg(s: Session): number {
  return Math.max(0, ...working(s).map((x) => x.kg));
}

function repsAtTop(s: Session): number[] {
  const t = topKg(s);
  return working(s)
    .filter((x) => x.kg === t)
    .map((x) => x.reps);
}

/**
 * Double progression. `history` is newest first. `isLower` picks the load step
 * (5 kg for lower body, 2.5 kg for upper body).
 */
export function nextSession(history: Session[], goal: Goal, isLower: boolean): Suggestion {
  const [minReps, maxReps] = REP_RANGE[goal];
  const step = isLower ? 5 : 2.5;
  const last = history.find((s) => working(s).length > 0);
  const base = cite("doubleprogression", "schoenfeld2017loading");

  if (!last) {
    return {
      action: "first_time",
      targetKg: null,
      targetReps: null,
      label: "Log it once",
      reason: `Pick a weight you can lift for ${minReps}–${maxReps} reps with 1–3 reps left in the tank. Next time we'll tell you what to beat.`,
      citationKeys: base,
    };
  }

  const kg = topKg(last);
  const reps = repsAtTop(last);
  const lowest = Math.min(...reps);
  const rirs = working(last)
    .map((x) => x.rir)
    .filter((r): r is number => r != null);
  const avgRir = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null;

  // Stall check: the same top weight for the last 3 sessions with no extra reps.
  const recent = history.filter((s) => working(s).length > 0).slice(0, 3);
  const stalled =
    recent.length === 3 &&
    recent.every((s) => topKg(s) === kg) &&
    sum(repsAtTop(recent[0])) <= sum(repsAtTop(recent[2]));

  if (stalled) {
    const target = roundTo(kg * 0.9, 2.5);
    return {
      action: "deload",
      targetKg: target,
      targetReps: maxReps,
      label: "Deload −10%",
      reason: `${kg} kg hasn't moved for 3 sessions. Drop to ${target} kg for ${maxReps} reps to recover, then build back up.`,
      citationKeys: base,
    };
  }

  if (lowest >= maxReps && (avgRir == null || avgRir >= 1)) {
    return {
      action: "add_weight",
      targetKg: kg + step,
      targetReps: minReps,
      label: `+${step} kg`,
      reason: `You hit ${maxReps} reps on every set at ${kg} kg. Add ${step} kg and aim for at least ${minReps} reps.`,
      citationKeys: base,
    };
  }

  if (lowest < minReps) {
    return {
      action: "hold",
      targetKg: kg,
      targetReps: minReps,
      label: "Hold",
      reason: `Some sets fell below ${minReps} reps. Stay at ${kg} kg until every set reaches ${minReps}.`,
      citationKeys: base,
    };
  }

  if (avgRir != null && avgRir > 3) {
    return {
      action: "add_rep",
      targetKg: kg,
      targetReps: Math.min(lowest + 2, maxReps),
      label: "+2 reps",
      reason: `You logged about ${Math.round(avgRir)} reps in reserve, which is a bit easy for growth. Push each set closer to failure: aim for ${Math.min(lowest + 2, maxReps)} reps.`,
      citationKeys: [...base, ...cite("refalo2023failure")],
    };
  }

  return {
    action: "add_rep",
    targetKg: kg,
    targetReps: lowest + 1,
    label: "+1 rep",
    reason: `Stay at ${kg} kg and beat your lowest set: aim for ${lowest + 1} reps on every set. When all sets reach ${maxReps}, add weight.`,
    citationKeys: base,
  };
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}
