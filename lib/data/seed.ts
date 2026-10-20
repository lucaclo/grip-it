import type { Friend, Workout, WorkoutExercise } from "./types";

/** Small deterministic PRNG so demo data is the same on every reset. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export const DEMO_FRIENDS: Friend[] = [
  { id: "f-sam", name: "Sam", sex: "male", weightKg: 88, sessionsPerWeek: 4 },
  { id: "f-priya", name: "Priya", sex: "female", weightKg: 61, sessionsPerWeek: 3 },
  { id: "f-jordan", name: "Jordan", sex: "male", weightKg: 74, sessionsPerWeek: 3 },
  { id: "f-theo", name: "Theo", sex: "male", weightKg: 95, sessionsPerWeek: 2 },
];

type Day = { title: string; lifts: [string, number][] }; // [exerciseId, starting kg for a strength factor of 1]
const SPLIT: Day[] = [
  {
    title: "Push",
    lifts: [
      ["bench-press", 70],
      ["incline-db-press", 24],
      ["lateral-raise", 10],
      ["triceps-pushdown", 25],
    ],
  },
  {
    title: "Pull",
    lifts: [
      ["deadlift", 120],
      ["lat-pulldown", 55],
      ["seated-cable-row", 55],
      ["db-curl", 12],
    ],
  },
  {
    title: "Legs",
    lifts: [
      ["back-squat", 90],
      ["romanian-deadlift", 80],
      ["leg-extension", 45],
      ["standing-calf-raise", 60],
    ],
  },
];

const STRENGTH: Record<string, number> = {
  "f-sam": 1.15,
  "f-priya": 0.6,
  "f-jordan": 0.9,
  "f-theo": 1.3,
  me: 1,
};

const round = (kg: number, step: number) => Math.max(step, Math.round(kg / step) * step);

/** About `weeks` weeks of plausible, progressing workouts for one user, ending before `now`. */
export function generateHistory(userId: string, sessionsPerWeek: number, weeks: number, now: Date, seed: number) {
  const r = rng(seed);
  const factor = STRENGTH[userId] ?? 1;
  const state = new Map<string, { kg: number; reps: number }>();
  const workouts: Workout[] = [];
  const totalSessions = sessionsPerWeek * weeks;
  const start = new Date(now.getTime() - weeks * 7 * 86_400_000);

  for (let i = 0; i < totalSessions; i++) {
    const dayOffset = Math.floor((i / sessionsPerWeek) * 7) + Math.floor(r() * 2);
    const startedAt = new Date(start.getTime() + dayOffset * 86_400_000);
    startedAt.setHours(17 + Math.floor(r() * 3), Math.floor(r() * 60), 0, 0);
    if (startedAt >= now) break;
    const day = SPLIT[i % SPLIT.length];

    const exercises: WorkoutExercise[] = day.lifts.map(([exerciseId, baseKg]) => {
      const step = baseKg >= 40 ? 2.5 : 1;
      const cur = state.get(exerciseId) ?? { kg: round(baseKg * factor, step), reps: 8 };
      const setCount = 3;
      const sets = Array.from({ length: setCount }, (_, k) => ({
        kg: cur.kg,
        reps: Math.max(5, cur.reps - (k === setCount - 1 ? Math.floor(r() * 2) : 0)),
        rir: null,
        type: "normal" as const,
      }));
      // Double progression with the odd bad day.
      const next = r() < 0.15 ? cur : cur.reps >= 12 ? { kg: cur.kg + step, reps: 7 } : { kg: cur.kg, reps: cur.reps + 1 };
      state.set(exerciseId, next);
      return { exerciseId, sets };
    });

    // One improbable jump for the honour-system flag demo.
    if (userId === "f-theo" && i === totalSessions - 2) exercises[0].sets[0].kg = round(exercises[0].sets[0].kg * 1.25, 2.5);

    const endedAt = new Date(startedAt.getTime() + (50 + Math.floor(r() * 30)) * 60_000);
    workouts.push({
      id: `${userId}-w${i}`,
      userId,
      title: day.title,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      isPrivate: false,
      exercises,
    });
  }
  return workouts;
}

export function demoWorkouts(now = new Date()): Workout[] {
  return DEMO_FRIENDS.flatMap((f, i) => generateHistory(f.id, f.sessionsPerWeek, 6, now, 100 + i));
}
