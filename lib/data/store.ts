"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Exercise } from "./exercises";
import { DEMO_FRIENDS, demoWorkouts, generateHistory } from "./seed";
import type { Draft, DraftSet, NutritionDay, Profile, ReactionCode, State, Workout } from "./types";

/**
 * Local-only data layer for the prototype. Everything is saved in this browser's storage.
 * The shape mirrors replica/schema.sql so a Supabase adapter can replace it later.
 *
 * STORE_VERSION + migrate() are how personal data survives app updates: bump the version
 * whenever the persisted shape changes and add an upgrade step. Never drop user data.
 */
export const STORE_VERSION = 1;

const today = () => new Date().toISOString().slice(0, 10);
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function initialState(): State {
  return {
    me: null,
    friends: DEMO_FRIENDS,
    groupName: "Grip It crew",
    workouts: demoWorkouts(),
    customExercises: [],
    weights: [],
    nutrition: [],
    reactions: {},
    draft: null,
  };
}

type Actions = {
  completeOnboarding: (p: Omit<Profile, "id" | "onboardedAt">, startWeightKg: number, withSampleHistory: boolean) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  startWorkout: () => void;
  discardDraft: () => void;
  addExerciseToDraft: (exerciseId: string, prefill: DraftSet[]) => void;
  removeExerciseFromDraft: (index: number) => void;
  addSet: (exIndex: number) => void;
  updateSet: (exIndex: number, setIndex: number, patch: Partial<DraftSet>) => void;
  removeSet: (exIndex: number, setIndex: number) => void;
  finishWorkout: (title: string, isPrivate: boolean) => string | null;
  addCustomExercise: (e: Omit<Exercise, "id" | "custom">) => Exercise;
  logWeight: (kg: number, day?: string) => void;
  logNutrition: (n: Omit<NutritionDay, "day">, day?: string) => void;
  toggleReaction: (feedId: string, code: ReactionCode) => void;
  resetAll: () => void;
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      completeOnboarding: (p, startWeightKg, withSampleHistory) => {
        const me: Profile = { ...p, id: "me", onboardedAt: new Date().toISOString() };
        const extra = withSampleHistory ? generateHistory("me", p.sessionsPerWeek, 4, new Date(), 7) : [];
        set((s) => ({
          me,
          weights: [...s.weights.filter((w) => w.day !== today()), { day: today(), kg: startWeightKg }],
          workouts: [...s.workouts, ...extra],
        }));
      },

      updateProfile: (patch) => set((s) => (s.me ? { me: { ...s.me, ...patch } } : {})),

      startWorkout: () => {
        if (get().draft) return;
        set({ draft: { clientId: uid(), startedAt: new Date().toISOString(), exercises: [] } });
      },
      discardDraft: () => set({ draft: null }),

      addExerciseToDraft: (exerciseId, prefill) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  exercises: [
                    ...s.draft.exercises,
                    {
                      exerciseId,
                      sets: prefill.length ? prefill : [{ kg: 0, reps: 0, rir: null, type: "normal", done: false }],
                    },
                  ],
                },
              }
            : {},
        ),
      removeExerciseFromDraft: (index) => mutateDraft(set, (d) => d.exercises.splice(index, 1)),
      addSet: (exIndex) =>
        mutateDraft(set, (d) => {
          const sets = d.exercises[exIndex].sets;
          const last = sets[sets.length - 1];
          sets.push({ kg: last?.kg ?? 0, reps: last?.reps ?? 0, rir: null, type: "normal", done: false });
        }),
      updateSet: (exIndex, setIndex, patch) =>
        mutateDraft(set, (d) => {
          d.exercises[exIndex].sets[setIndex] = { ...d.exercises[exIndex].sets[setIndex], ...patch };
        }),
      removeSet: (exIndex, setIndex) => mutateDraft(set, (d) => d.exercises[exIndex].sets.splice(setIndex, 1)),

      finishWorkout: (title, isPrivate) => {
        const d = get().draft;
        if (!d) return null;
        // Idempotent on the draft's clientId, like the real finish_workout RPC.
        if (get().workouts.some((w) => w.id === d.clientId)) {
          set({ draft: null });
          return d.clientId;
        }
        const exercises = d.exercises
          .map((e) => ({
            exerciseId: e.exerciseId,
            sets: e.sets.filter((x) => x.done && x.reps > 0).map(({ done: _done, ...rest }) => rest),
          }))
          .filter((e) => e.sets.length > 0);
        if (!exercises.length) return null;
        const w: Workout = {
          id: d.clientId,
          userId: "me",
          title: title.trim() || "Workout",
          startedAt: d.startedAt,
          endedAt: new Date().toISOString(),
          isPrivate,
          exercises,
        };
        set((s) => ({ workouts: [...s.workouts, w], draft: null }));
        return w.id;
      },

      addCustomExercise: (e) => {
        const ex: Exercise = { ...e, id: `custom-${uid()}`, custom: true };
        set((s) => ({ customExercises: [...s.customExercises, ex] }));
        return ex;
      },

      logWeight: (kg, day = today()) =>
        set((s) => ({
          weights: [...s.weights.filter((w) => w.day !== day), { day, kg }].sort((a, b) => a.day.localeCompare(b.day)),
        })),
      logNutrition: (n, day = today()) =>
        set((s) => ({
          nutrition: [...s.nutrition.filter((x) => x.day !== day), { ...n, day }].sort((a, b) => a.day.localeCompare(b.day)),
        })),

      toggleReaction: (feedId, code) =>
        set((s) => {
          const item = { ...(s.reactions[feedId] ?? {}) };
          const users = item[code] ?? [];
          item[code] = users.includes("me") ? users.filter((u) => u !== "me") : [...users, "me"];
          return { reactions: { ...s.reactions, [feedId]: item } };
        }),

      resetAll: () => set(initialState()),
    }),
    {
      name: "gripit",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, fromVersion) => {
        // Add a step here for every STORE_VERSION bump, e.g.
        // if (fromVersion < 2) persisted = { ...persisted, newField: default };
        void fromVersion;
        return persisted as State;
      },
    },
  ),
);

function mutateDraft(set: (fn: (s: State) => Partial<State>) => void, fn: (d: Draft) => void) {
  set((s) => {
    if (!s.draft) return {};
    const d: Draft = structuredClone(s.draft);
    fn(d);
    return { draft: d };
  });
}
