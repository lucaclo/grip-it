import type { ActivityLevel, Sex } from "@/lib/science/energy";
import type { SetType } from "@/lib/science/progression";
import type { Experience, Goal } from "@/lib/science/targets";
import type { Exercise } from "./exercises";

export type Profile = {
  id: "me";
  name: string;
  heightCm: number;
  sex: Sex;
  birthYear: number;
  bodyFatPct: number | null;
  activity: ActivityLevel;
  goal: Goal;
  experience: Experience;
  targetWeightKg: number;
  targetDate: string | null;
  rirEnabled: boolean;
  sessionsPerWeek: number;
  shareWeight: boolean;
  shareNutrition: boolean;
  onboardedAt: string;
};

/** A demo group-mate. In the real app these come from Supabase. */
export type Friend = {
  id: string;
  name: string;
  sex: Sex;
  weightKg: number;
  sessionsPerWeek: number;
};

export type WorkoutSet = { kg: number; reps: number; rir: number | null; type: SetType };

export type WorkoutExercise = { exerciseId: string; sets: WorkoutSet[] };

export type Workout = {
  id: string;
  userId: string; // "me" or a friend id
  title: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  isPrivate: boolean;
  exercises: WorkoutExercise[];
};

export type DraftSet = WorkoutSet & { done: boolean };
export type Draft = {
  clientId: string;
  startedAt: string;
  exercises: { exerciseId: string; sets: DraftSet[] }[];
  /** Logging a workout after the fact: every set with reps counts as done. Optional so older drafts still load. */
  autoTick?: boolean;
  /** Set when this draft is an edit of a saved workout; Finish replaces that workout in place. */
  editing?: { id: string; title: string; isPrivate: boolean; endedAt: string };
};

export type WeightEntry = { day: string; kg: number };
export type NutritionDay = { day: string; kcal: number; proteinG: number };

export type ReactionCode = "flame" | "muscle" | "laugh" | "metal" | "skull";

export type State = {
  me: Profile | null;
  friends: Friend[];
  groupName: string;
  workouts: Workout[];
  customExercises: Exercise[];
  weights: WeightEntry[];
  nutrition: NutritionDay[];
  /** feedItemId -> reaction code -> user ids */
  reactions: Record<string, Partial<Record<ReactionCode, string[]>>>;
  draft: Draft | null;
};
