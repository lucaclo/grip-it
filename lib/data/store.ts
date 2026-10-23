"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Exercise } from "./exercises";
import { DEMO_FRIENDS, demoWorkouts, generateHistory } from "./seed";
import type {
  Account,
  Comment,
  Draft,
  Friend,
  DraftSet,
  NutritionDay,
  Profile,
  State,
  Workout,
} from "./types";

/**
 * Local-only data layer for the prototype. Everything is saved in this browser's storage.
 * The shape mirrors replica/schema.sql so a Supabase adapter can replace it later.
 *
 * STORE_VERSION + migrate() are how personal data survives app updates: bump the version
 * whenever the persisted shape changes and add an upgrade step. Never drop user data.
 */
export const STORE_VERSION = 3;

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
    likes: {},
    comments: [],
    draft: null,
    account: null,
    syncQueue: { upserts: [], deletes: [] },
  };
}

/**
 * Upgrades saved data from older versions. Each step only adds or converts; nothing is dropped.
 * v1 -> v2: emoji reactions became likes (any reaction of yours = a like); comments start empty.
 * v2 -> v3: friends sync. No account yet, and your existing workouts queue to upload once you join.
 * Grip variations (WorkoutExercise.grip) are optional, so v3 data needs no step: no grip = the usual grip.
 * Profile photos (Profile.photo) are optional too: no photo = the initial, as before.
 */
export function migrate(persisted: unknown, fromVersion: number): State {
  const st = { ...(persisted as State) };
  if (fromVersion < 2) {
    const reactions = st.reactions ?? {};
    st.likes = Object.fromEntries(
      Object.entries(reactions)
        .filter(([, byCode]) => Object.values(byCode ?? {}).some((users) => users?.includes("me")))
        .map(([itemId]) => [itemId, ["me"]]),
    );
    st.comments = [];
  }
  if (fromVersion < 3) {
    st.account = null;
    st.syncQueue = { upserts: (st.workouts ?? []).filter((w) => w.userId === "me").map((w) => w.id), deletes: [] };
  }
  return st;
}

type Actions = {
  completeOnboarding: (
    p: Omit<Profile, "id" | "onboardedAt">,
    startWeightKg: number,
    withDemo: boolean,
  ) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  startWorkout: () => void;
  discardDraft: () => void;
  addExerciseToDraft: (exerciseId: string, prefill: DraftSet[], grip?: string) => void;
  /** Change an exercise's grip. `retarget` moves untouched prefilled sets from the old target to the new one. */
  setGrip: (
    exIndex: number,
    grip: string | undefined,
    retarget?: { fromKg: number; fromReps: number; toKg: number; toReps: number },
  ) => void;
  removeExerciseFromDraft: (index: number) => void;
  addSet: (exIndex: number) => void;
  updateSet: (
    exIndex: number,
    setIndex: number,
    patch: Partial<DraftSet>,
  ) => void;
  removeSet: (exIndex: number, setIndex: number) => void;
  insertSet: (exIndex: number, setIndex: number, value: DraftSet) => void;
  markAllDone: () => void;
  setAutoTick: (on: boolean) => void;
  startRest: (seconds?: number) => void;
  adjustRest: (deltaSec: number) => void;
  clearRest: () => void;
  finishWorkout: (
    title: string,
    isPrivate: boolean,
    when?: { startedAt: string; endedAt: string },
  ) => string | null;
  addCustomExercise: (e: Omit<Exercise, "id" | "custom">) => Exercise;
  logWeight: (kg: number, day?: string) => void;
  logNutrition: (n: Omit<NutritionDay, "day">, day?: string) => void;
  addNutrition: (delta: Omit<NutritionDay, "day">, day?: string) => void;
  toggleLike: (feedId: string) => void;
  /** Double-tap: likes, never unlikes. Returns true if it added a like. */
  like: (feedId: string) => boolean;
  addComment: (feedId: string, text: string, parentId?: string | null) => void;
  deleteComment: (commentId: string) => void;
  setAccount: (a: Account | null) => void;
  /** Replace friends and their workouts with what the group has now (your own data is untouched). */
  applyGroupData: (d: { friends: Friend[]; workouts: Workout[]; exercises: Exercise[]; groupName: string }) => void;
  /** Mark uploads/deletes as done. */
  synced: (done: { upserts?: string[]; deletes?: string[] }) => void;
  editWorkout: (id: string) => boolean;
  deleteWorkout: (id: string) => void;
  resetAll: () => void;
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // A real profile starts blank: no made-up friends or their workouts. withDemo keeps the demo
      // friends and adds 4 weeks of sample history for trying the app out.
      completeOnboarding: (p, startWeightKg, withDemo) => {
        const me: Profile = {
          ...p,
          id: "me",
          onboardedAt: new Date().toISOString(),
        };
        const extra = withDemo
          ? generateHistory("me", p.sessionsPerWeek, 4, new Date(), 7)
          : [];
        set((s) => ({
          me,
          friends: withDemo ? s.friends : [],
          reactions: withDemo ? s.reactions : {},
          likes: withDemo ? s.likes : {},
          comments: withDemo ? s.comments : [],
          weights: [
            ...s.weights.filter((w) => w.day !== today()),
            { day: today(), kg: startWeightKg },
          ],
          workouts: [
            ...(withDemo ? s.workouts : s.workouts.filter((w) => w.userId === "me")),
            ...extra,
          ],
        }));
      },

      updateProfile: (patch) =>
        set((s) => (s.me ? { me: { ...s.me, ...patch } } : {})),

      startWorkout: () => {
        if (get().draft) return;
        set({
          draft: {
            clientId: uid(),
            startedAt: new Date().toISOString(),
            exercises: [],
          },
        });
      },
      discardDraft: () => set({ draft: null }),

      addExerciseToDraft: (exerciseId, prefill, grip) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  exercises: [
                    ...s.draft.exercises,
                    {
                      exerciseId,
                      ...(grip ? { grip } : {}),
                      sets: (prefill.length
                        ? prefill
                        : [
                            {
                              kg: 0,
                              reps: 0,
                              rir: null,
                              type: "normal" as const,
                              done: false,
                            },
                          ]
                      ).map((x) => ({
                        ...x,
                        done: s.draft!.autoTick ? x.reps > 0 : x.done,
                      })),
                    },
                  ],
                },
              }
            : {},
        ),
      setGrip: (exIndex, grip, retarget) =>
        mutateDraft(set, (d) => {
          const e = d.exercises[exIndex];
          if (!e) return;
          if (grip) e.grip = grip;
          else delete e.grip;
          if (!retarget) return;
          for (const x of e.sets)
            if (!x.done && x.type !== "warmup" && x.kg === retarget.fromKg && x.reps === retarget.fromReps) {
              x.kg = retarget.toKg;
              x.reps = retarget.toReps;
            }
        }),
      removeExerciseFromDraft: (index) =>
        mutateDraft(set, (d) => d.exercises.splice(index, 1)),
      addSet: (exIndex) =>
        mutateDraft(set, (d) => {
          const sets = d.exercises[exIndex].sets;
          const last = sets[sets.length - 1];
          const reps = last?.reps ?? 0;
          sets.push({
            kg: last?.kg ?? 0,
            reps,
            rir: null,
            type: "normal",
            done: !!d.autoTick && reps > 0,
          });
        }),
      updateSet: (exIndex, setIndex, patch) =>
        mutateDraft(set, (d) => {
          const prev = d.exercises[exIndex].sets[setIndex];
          const next = { ...prev, ...patch };
          if (d.autoTick && patch.done === undefined) next.done = next.reps > 0;
          d.exercises[exIndex].sets[setIndex] = next;
          // Ticking a set by hand during a live session starts the rest timer.
          if (patch.done === true && !prev.done && !d.autoTick && !d.editing) {
            const sec = restFor(get().me?.goal);
            d.restEndsAt = new Date(Date.now() + sec * 1000).toISOString();
            d.restTotalSec = sec;
          }
        }),
      removeSet: (exIndex, setIndex) =>
        mutateDraft(set, (d) => d.exercises[exIndex].sets.splice(setIndex, 1)),
      insertSet: (exIndex, setIndex, value) =>
        mutateDraft(set, (d) =>
          d.exercises[exIndex]?.sets.splice(setIndex, 0, value),
        ),
      markAllDone: () =>
        mutateDraft(set, (d) => {
          for (const e of d.exercises)
            for (const x of e.sets) if (x.reps > 0) x.done = true;
        }),

      startRest: (seconds) =>
        mutateDraft(set, (d) => {
          const sec = seconds ?? restFor(get().me?.goal);
          d.restEndsAt = new Date(Date.now() + sec * 1000).toISOString();
          d.restTotalSec = sec;
        }),
      adjustRest: (deltaSec) =>
        mutateDraft(set, (d) => {
          if (!d.restEndsAt) return;
          const end = Math.max(
            Date.now(),
            Date.parse(d.restEndsAt) + deltaSec * 1000,
          );
          d.restEndsAt = new Date(end).toISOString();
          d.restTotalSec = Math.max(1, (d.restTotalSec ?? 0) + deltaSec);
        }),
      clearRest: () =>
        mutateDraft(set, (d) => {
          d.restEndsAt = null;
        }),

      setAutoTick: (on) =>
        mutateDraft(set, (d) => {
          d.autoTick = on;
          if (on)
            for (const e of d.exercises)
              for (const x of e.sets) x.done = x.reps > 0;
        }),

      finishWorkout: (title, isPrivate, when) => {
        const d = get().draft;
        if (!d) return null;
        // Idempotent on the draft's clientId, like the real finish_workout RPC (edits replace instead).
        if (!d.editing && get().workouts.some((w) => w.id === d.clientId)) {
          set({ draft: null });
          return d.clientId;
        }
        const exercises = d.exercises
          .map((e) => ({
            exerciseId: e.exerciseId,
            ...(e.grip ? { grip: e.grip } : {}),
            sets: e.sets
              .filter((x) => x.done && x.reps > 0)
              .map(({ kg, reps, rir, type }) => ({ kg, reps, rir, type })),
          }))
          .filter((e) => e.sets.length > 0);
        if (!exercises.length) return null;
        const w: Workout = {
          id: d.clientId,
          userId: "me",
          title: title.trim() || "Workout",
          startedAt: when?.startedAt ?? d.startedAt,
          endedAt: when?.endedAt ?? new Date().toISOString(),
          isPrivate,
          exercises,
        };
        set((s) => ({
          workouts: d.editing
            ? s.workouts.map((x) => (x.id === w.id ? w : x))
            : [...s.workouts, w],
          draft: null,
          syncQueue: queue(s.syncQueue, { upsert: w.id }),
        }));
        return w.id;
      },

      addCustomExercise: (e) => {
        const ex: Exercise = { ...e, id: `custom-${uid()}`, custom: true };
        set((s) => ({ customExercises: [...s.customExercises, ex] }));
        return ex;
      },

      logWeight: (kg, day = today()) =>
        set((s) => ({
          weights: [
            ...s.weights.filter((w) => w.day !== day),
            { day, kg },
          ].sort((a, b) => a.day.localeCompare(b.day)),
        })),
      addNutrition: (delta, day = today()) =>
        set((s) => {
          const cur = s.nutrition.find((x) => x.day === day) ?? { day, kcal: 0, proteinG: 0 };
          const next = {
            day,
            kcal: Math.max(0, cur.kcal + delta.kcal),
            proteinG: Math.max(0, cur.proteinG + delta.proteinG),
          };
          return {
            nutrition: [...s.nutrition.filter((x) => x.day !== day), next].sort((a, b) => a.day.localeCompare(b.day)),
          };
        }),
      logNutrition: (n, day = today()) =>
        set((s) => ({
          nutrition: [
            ...s.nutrition.filter((x) => x.day !== day),
            { ...n, day },
          ].sort((a, b) => a.day.localeCompare(b.day)),
        })),

      toggleLike: (feedId) =>
        set((s) => {
          const users = s.likes[feedId] ?? [];
          return {
            likes: {
              ...s.likes,
              [feedId]: users.includes("me") ? users.filter((u) => u !== "me") : [...users, "me"],
            },
          };
        }),
      like: (feedId) => {
        const users = get().likes[feedId] ?? [];
        if (users.includes("me")) return false;
        set((s) => ({ likes: { ...s.likes, [feedId]: [...users, "me"] } }));
        return true;
      },
      addComment: (feedId, text, parentId = null) => {
        const t = text.trim().slice(0, 500);
        if (!t) return;
        const c: Comment = { id: uid(), itemId: feedId, userId: "me", text: t, at: new Date().toISOString(), parentId };
        set((s) => ({ comments: [...s.comments, c] }));
      },
      deleteComment: (commentId) =>
        set((s) => ({
          comments: s.comments.filter((c) => c.id !== commentId && c.parentId !== commentId),
        })),

      editWorkout: (id) => {
        const w = get().workouts.find((x) => x.id === id && x.userId === "me");
        if (!w || get().draft) return false;
        set({
          draft: {
            clientId: w.id,
            startedAt: w.startedAt,
            autoTick: true,
            editing: {
              id: w.id,
              title: w.title,
              isPrivate: w.isPrivate,
              endedAt: w.endedAt,
            },
            exercises: w.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              ...(e.grip ? { grip: e.grip } : {}),
              sets: e.sets.map((x) => ({ ...x, done: true })),
            })),
          },
        });
        return true;
      },

      deleteWorkout: (id) =>
        set((s) => ({
          syncQueue: s.workouts.some((w) => w.id === id && w.userId === "me")
            ? queue(s.syncQueue, { remove: id })
            : s.syncQueue,
          workouts: s.workouts.filter(
            (w) => !(w.id === id && w.userId === "me"),
          ),
          reactions: Object.fromEntries(
            Object.entries(s.reactions).filter(([k]) => !k.includes(id)),
          ),
          likes: Object.fromEntries(Object.entries(s.likes).filter(([k]) => !k.includes(id))),
          comments: s.comments.filter((c) => !c.itemId.includes(id)),
        })),

      setAccount: (account) => set({ account }),

      applyGroupData: ({ friends, workouts, exercises, groupName }) =>
        set((s) => {
          const mine = new Set(s.customExercises.map((e) => e.id));
          return {
            friends,
            groupName,
            workouts: [...s.workouts.filter((w) => w.userId === "me"), ...workouts],
            customExercises: [...s.customExercises, ...exercises.filter((e) => !mine.has(e.id))],
          };
        }),

      synced: ({ upserts = [], deletes = [] }) =>
        set((s) => ({
          syncQueue: {
            upserts: s.syncQueue.upserts.filter((id) => !upserts.includes(id)),
            deletes: s.syncQueue.deletes.filter((id) => !deletes.includes(id)),
          },
        })),

      resetAll: () => set(initialState()),
    }),
    {
      name: "gripit",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Add a step to migrate() above for every STORE_VERSION bump.
      migrate,
    },
  ),
);

/** Adds an upload (or a delete, which cancels a pending upload) to the sync queue. */
function queue(q: State["syncQueue"], op: { upsert?: string; remove?: string }): State["syncQueue"] {
  if (op.upsert) return { upserts: [...q.upserts.filter((x) => x !== op.upsert), op.upsert], deletes: q.deletes.filter((x) => x !== op.upsert) };
  if (op.remove) return { upserts: q.upserts.filter((x) => x !== op.remove), deletes: [...q.deletes.filter((x) => x !== op.remove), op.remove] };
  return q;
}

/** Default rest between sets: longer for heavy strength work. */
export function restFor(goal: string | undefined) {
  return goal === "strength" ? 180 : goal === "powerbuilding" ? 150 : 120;
}

function mutateDraft(
  set: (fn: (s: State) => Partial<State>) => void,
  fn: (d: Draft) => void,
) {
  set((s) => {
    if (!s.draft) return {};
    const d: Draft = structuredClone(s.draft);
    fn(d);
    return { draft: d };
  });
}
