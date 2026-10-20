import { cite } from "./citations";
import type { SetType } from "./progression";

export const MUSCLES = [
  "chest",
  "front_delts",
  "side_delts",
  "rear_delts",
  "biceps",
  "triceps",
  "forearms",
  "upper_back",
  "lats",
  "lower_back",
  "abs",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "adductors",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const LOWER_BODY: ReadonlySet<Muscle> = new Set<Muscle>([
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "adductors",
]);

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest",
  front_delts: "Shoulders (front)",
  side_delts: "Shoulders (side)",
  rear_delts: "Shoulders (rear)",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  upper_back: "Upper back",
  lats: "Lats",
  lower_back: "Lower back",
  abs: "Abs",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  adductors: "Adductors",
};

/** Muscle groups people search and think in. Volume is still counted per head (each has its own band). */
export const MUSCLE_GROUPS = {
  shoulders: { label: "Shoulders", muscles: ["front_delts", "side_delts", "rear_delts"] as Muscle[] },
} as const;
export type MuscleGroup = keyof typeof MUSCLE_GROUPS;

/** Filter chips: groups first, then single muscles. */
export const MUSCLE_FILTERS: (Muscle | MuscleGroup)[] = [
  "chest",
  "shoulders",
  "front_delts",
  "side_delts",
  "rear_delts",
  ...MUSCLES.filter((m) => !["chest", "front_delts", "side_delts", "rear_delts"].includes(m)),
];

export function filterLabel(f: Muscle | MuscleGroup): string {
  return f in MUSCLE_GROUPS ? MUSCLE_GROUPS[f as MuscleGroup].label : MUSCLE_LABEL[f as Muscle];
}

export function filterMuscles(f: Muscle | MuscleGroup): Muscle[] {
  return f in MUSCLE_GROUPS ? MUSCLE_GROUPS[f as MuscleGroup].muscles : [f as Muscle];
}

/** Weekly hard-set band per muscle: at least 10 for growth, more than 20 is a lot to recover from. */
export const VOLUME_BAND = { min: 10, max: 20 } as const;
export const VOLUME_CITATIONS = cite("schoenfeld2017volume", "pelland2024volume");

export type VolumeSet = { rir?: number | null; type?: SetType; reps: number };

/** A hard set: not a warm-up, at least one rep, and (if RIR was logged) 3 or fewer reps in reserve. */
export function isHardSet(s: VolumeSet): boolean {
  if (s.type === "warmup" || s.reps <= 0) return false;
  return s.rir == null || s.rir <= 3;
}

export function addVolume(
  totals: Partial<Record<Muscle, number>>,
  primary: Muscle,
  secondary: readonly Muscle[],
  hardSets: number,
) {
  totals[primary] = (totals[primary] ?? 0) + hardSets;
  for (const m of secondary) totals[m] = (totals[m] ?? 0) + hardSets * 0.5;
}

export type VolumeStatus = "under" | "in_range" | "over";
export function volumeStatus(sets: number): VolumeStatus {
  if (sets < VOLUME_BAND.min) return "under";
  if (sets > VOLUME_BAND.max) return "over";
  return "in_range";
}
