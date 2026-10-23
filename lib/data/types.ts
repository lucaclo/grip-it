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

/** A group-mate: a made-up demo friend, or a real one synced from the group. */
export type Friend = {
  id: string;
  name: string;
  /** Demo friends only: real friends' body stats never leave their phone. */
  sex?: Sex;
  weightKg: number | null;
  sessionsPerWeek: number;
  /** Real friends: their powerlifting (DOTS) score, worked out on their own phone. */
  dots?: number | null;
};

export type WorkoutSet = { kg: number; reps: number; rir: number | null; type: SetType };

export type WorkoutExercise = {
  exerciseId: string;
  sets: WorkoutSet[];
  /** Grip variation (lib/science/grips.ts). Left out = the exercise's usual grip; older data has none. */
  grip?: string;
};

export type Workout = {
  /** Your workouts: the id made on this phone. Friends' workouts: the server's id. */
  id: string;
  userId: string; // "me" or a friend id
  title: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  isPrivate: boolean;
  exercises: WorkoutExercise[];
  /** Friends' workouts: kg lifted as worked out on their phone (it includes their body weight). */
  liftedKg?: number;
};

export type DraftSet = WorkoutSet & { done: boolean };
export type Draft = {
  clientId: string;
  startedAt: string;
  exercises: { exerciseId: string; sets: DraftSet[]; grip?: string }[];
  /** Logging a workout after the fact: every set with reps counts as done. Optional so older drafts still load. */
  autoTick?: boolean;
  /** Set when this draft is an edit of a saved workout; Finish replaces that workout in place. */
  editing?: { id: string; title: string; isPrivate: boolean; endedAt: string };
  /** Rest timer: when the current rest ends and how long it was. Timestamps survive the app sleeping. */
  restEndsAt?: string | null;
  restTotalSec?: number;
};

export type WeightEntry = { day: string; kg: number };
export type NutritionDay = { day: string; kcal: number; proteinG: number };

/** Retired emoji reactions (store v1). Kept in saved data, never shown; likes replaced them. */
export type ReactionCode = "flame" | "muscle" | "laugh" | "metal" | "skull";

/** A comment on a feed item; replies point at their top-level comment (one level deep). */
export type Comment = {
  id: string;
  itemId: string;
  userId: string;
  text: string;
  at: string; // ISO
  parentId: string | null;
};

export type State = {
  me: Profile | null;
  friends: Friend[];
  groupName: string;
  workouts: Workout[];
  customExercises: Exercise[];
  weights: WeightEntry[];
  nutrition: NutritionDay[];
  /** Retired (v1): feedItemId -> reaction code -> user ids. Migrated into likes, kept so nothing is lost. */
  reactions: Record<string, Partial<Record<ReactionCode, string[]>>>;
  /** feedItemId -> user ids who liked it */
  likes: Record<string, string[]>;
  comments: Comment[];
  draft: Draft | null;
  /** Set once this phone has an account (made silently when you invite or join friends). */
  account: Account | null;
  /** Your workouts waiting to upload (ids) or be deleted on the server (ids). */
  syncQueue: { upserts: string[]; deletes: string[] };
};

export type Group = { id: string; name: string; inviteCode: string; role: "owner" | "member" };
export type Account = { userId: string; group: Group | null; lastSyncAt?: string };
