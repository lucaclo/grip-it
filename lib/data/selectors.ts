import { nextSession, type Session, type Suggestion } from "@/lib/science/progression";
import { dots, e1rm } from "@/lib/science/strength";
import { targets, type TargetsResult } from "@/lib/science/targets";
import { addVolume, isHardSet, LOWER_BODY, type Muscle } from "@/lib/science/volume";
import { BUILT_IN_EXERCISES, DOTS_LIFTS, type Exercise } from "./exercises";
import type { Profile, State, Workout } from "./types";

export const DAY_MS = 86_400_000;

export function allExercises(s: Pick<State, "customExercises">): Exercise[] {
  return [...BUILT_IN_EXERCISES, ...s.customExercises];
}

export function exerciseMap(s: Pick<State, "customExercises">): Map<string, Exercise> {
  return new Map(allExercises(s).map((e) => [e.id, e]));
}

/** Monday 00:00 local time of the week containing `d`. */
export function weekStart(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function ageFrom(birthYear: number, now = new Date()) {
  return now.getFullYear() - birthYear;
}

export function userName(s: State, userId: string) {
  if (userId === "me") return s.me?.name ?? "You";
  return s.friends.find((f) => f.id === userId)?.name ?? "Unknown";
}

export function byNewest(a: Workout, b: Workout) {
  return b.startedAt.localeCompare(a.startedAt);
}

export function workoutsOf(s: State, userId: string) {
  return s.workouts.filter((w) => w.userId === userId).sort(byNewest);
}

/** Sessions of one exercise for one user, newest first. */
export function historyFor(s: State, userId: string, exerciseId: string, before?: string): Session[] {
  return workoutsOf(s, userId)
    .filter((w) => !before || w.startedAt < before)
    .flatMap((w) => w.exercises.filter((e) => e.exerciseId === exerciseId).map((e) => ({ sets: e.sets })));
}

export function latestWeight(s: State): number | null {
  return s.weights.length ? s.weights[s.weights.length - 1].kg : null;
}

export function weightOf(s: State, userId: string): number | null {
  if (userId === "me") return latestWeight(s);
  return s.friends.find((f) => f.id === userId)?.weightKg ?? null;
}

// ---------------------------------------------------------------- targets

export function myTargets(s: State): TargetsResult | null {
  const me = s.me;
  const w = latestWeight(s);
  if (!me || w == null) return null;
  return targetsFor(me, w);
}

export function targetsFor(me: Profile, weightKg: number): TargetsResult {
  return targets({
    weightKg,
    heightCm: me.heightCm,
    ageYears: ageFrom(me.birthYear),
    sex: me.sex,
    bodyFatPct: me.bodyFatPct,
    activity: me.activity,
    goal: me.goal,
    experience: me.experience,
    targetWeightKg: me.targetWeightKg,
    targetDate: me.targetDate,
  });
}

// ---------------------------------------------------------------- PRs

export type PR = {
  id: string;
  workoutId: string;
  userId: string;
  exerciseId: string;
  kg: number;
  reps: number;
  e1rm: number;
  previous: number | null;
  at: string;
  /** Improbable jump: more than 15% over the previous best within 28 days (honour system). */
  flagged: boolean;
};

export function allPRs(s: State): PR[] {
  const best = new Map<string, { value: number; at: string }>();
  const out: PR[] = [];
  for (const w of [...s.workouts].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    for (const e of w.exercises) {
      let top: { kg: number; reps: number; v: number } | null = null;
      for (const set of e.sets) {
        if (set.type === "warmup") continue;
        const v = e1rm(set.kg, set.reps);
        if (v != null && (!top || v > top.v)) top = { kg: set.kg, reps: set.reps, v };
      }
      if (!top) continue;
      const key = `${w.userId}:${e.exerciseId}`;
      const prev = best.get(key);
      if (!prev || top.v > prev.value) {
        if (prev) {
          const flagged =
            top.v > prev.value * 1.15 && Date.parse(w.startedAt) - Date.parse(prev.at) <= 28 * DAY_MS;
          out.push({
            id: `pr-${w.id}-${e.exerciseId}`,
            workoutId: w.id,
            userId: w.userId,
            exerciseId: e.exerciseId,
            kg: top.kg,
            reps: top.reps,
            e1rm: top.v,
            previous: prev.value,
            at: w.startedAt,
            flagged,
          });
        }
        best.set(key, { value: top.v, at: w.startedAt });
      }
    }
  }
  return out;
}

export function bestE1rm(s: State, userId: string, exerciseId: string, since?: number, until?: number) {
  let b = 0;
  for (const w of s.workouts) {
    if (w.userId !== userId) continue;
    const t = Date.parse(w.startedAt);
    if ((since != null && t < since) || (until != null && t > until)) continue;
    for (const e of w.exercises)
      if (e.exerciseId === exerciseId)
        for (const set of e.sets) if (set.type !== "warmup") b = Math.max(b, e1rm(set.kg, set.reps) ?? 0);
  }
  return b;
}

// ---------------------------------------------------------------- volume

export function weeklyVolume(s: State, userId: string, from = weekStart()): Partial<Record<Muscle, number>> {
  const ex = exerciseMap(s);
  const totals: Partial<Record<Muscle, number>> = {};
  for (const w of s.workouts) {
    if (w.userId !== userId || Date.parse(w.startedAt) < from.getTime()) continue;
    for (const e of w.exercises) {
      const def = ex.get(e.exerciseId);
      if (!def) continue;
      addVolume(totals, def.primary, def.secondary, e.sets.filter(isHardSet).length);
    }
  }
  return totals;
}

export function weeklyHardSets(s: State, userId: string, from = weekStart(), to = Infinity) {
  let n = 0;
  for (const w of s.workouts) {
    const t = Date.parse(w.startedAt);
    if (w.userId !== userId || t < from.getTime() || t >= to) continue;
    for (const e of w.exercises) n += e.sets.filter(isHardSet).length;
  }
  return n;
}

// ---------------------------------------------------------------- leaderboards

export type Metric = "hard_sets" | "pct_improvement" | "dots" | "streak";

export type Row = {
  userId: string;
  name: string;
  score: number | null; // null = not ranked (calibrating / needs data)
  display: string;
  note?: string;
  rank: number | null;
};

const CALIBRATION_DAYS = 14;

export function streakOf(s: State, userId: string, perWeek: number, now = new Date()): number {
  const sessions = s.workouts.filter((w) => w.userId === userId).map((w) => Date.parse(w.startedAt));
  const count = (from: number, to: number) => sessions.filter((t) => t >= from && t < to).length;
  let wk = weekStart(now).getTime();
  let streak = count(wk, Infinity) >= perWeek ? 1 : 0; // this week counts once it's met, never breaks it
  for (;;) {
    const prev = wk - 7 * DAY_MS;
    if (count(prev, wk) >= perWeek) streak++;
    else break;
    wk = prev;
  }
  return streak;
}

function pctImprovement(s: State, userId: string, now = Date.now()): { score: number | null; note?: string } {
  const firstSeen = new Map<string, number>();
  for (const w of s.workouts) {
    if (w.userId !== userId) continue;
    const t = Date.parse(w.startedAt);
    for (const e of w.exercises) firstSeen.set(e.exerciseId, Math.min(firstSeen.get(e.exerciseId) ?? t, t));
  }
  if (!firstSeen.size) return { score: null, note: "No workouts yet" };
  const gains: number[] = [];
  let soonest = Infinity;
  for (const [exId, first] of firstSeen) {
    const calibratedAt = first + CALIBRATION_DAYS * DAY_MS;
    if (calibratedAt > now) {
      soonest = Math.min(soonest, calibratedAt);
      continue;
    }
    const baseline = bestE1rm(s, userId, exId, first, calibratedAt);
    const current = bestE1rm(s, userId, exId);
    if (baseline > 0) gains.push((current - baseline) / baseline);
  }
  if (!gains.length) {
    const days = Math.max(1, Math.ceil((soonest - now) / DAY_MS));
    return { score: null, note: `Calibrating, ${days} day${days === 1 ? "" : "s"} left` };
  }
  return { score: (gains.reduce((a, b) => a + b, 0) / gains.length) * 100 };
}

function dotsOf(s: State, userId: string): { score: number | null; note?: string } {
  const bw = weightOf(s, userId);
  const sex = userId === "me" ? s.me?.sex : s.friends.find((f) => f.id === userId)?.sex;
  const lifts = DOTS_LIFTS.map((id) => bestE1rm(s, userId, id));
  const missing = DOTS_LIFTS.filter((_, i) => lifts[i] === 0);
  if (bw == null || !sex) return { score: null, note: "Log your body weight" };
  if (missing.length) return { score: null, note: "Needs squat, bench and deadlift" };
  return { score: dots(lifts.reduce((a, b) => a + b, 0), bw, sex) };
}

export function leaderboard(s: State, metric: Metric): Row[] {
  const people = [
    ...(s.me ? [{ id: "me", perWeek: s.me.sessionsPerWeek }] : []),
    ...s.friends.map((f) => ({ id: f.id, perWeek: f.sessionsPerWeek })),
  ];
  const rows: Row[] = people.map(({ id, perWeek }) => {
    const name = userName(s, id);
    switch (metric) {
      case "hard_sets": {
        const n = weeklyHardSets(s, id);
        return { userId: id, name, score: n, display: `${n}`, note: "hard sets this week", rank: null };
      }
      case "streak": {
        const n = streakOf(s, id, perWeek);
        return { userId: id, name, score: n, display: `${n}`, note: `wk streak · ${perWeek}/wk goal`, rank: null };
      }
      case "pct_improvement": {
        const r = pctImprovement(s, id);
        return {
          userId: id,
          name,
          score: r.score,
          display: r.score == null ? "—" : `${r.score >= 0 ? "+" : ""}${r.score.toFixed(1)}%`,
          note: r.note ?? "avg e1RM gain vs baseline",
          rank: null,
        };
      }
      case "dots": {
        const r = dotsOf(s, id);
        return {
          userId: id,
          name,
          score: r.score,
          display: r.score == null ? "—" : r.score.toFixed(0),
          note: r.note ?? "DOTS (body weight stays private)",
          rank: null,
        };
      }
    }
  });
  // Nobody gets a medal for zero: 0 hard sets or a 0-week streak is listed but unranked.
  for (const r of rows) if (r.score === 0 && (metric === "hard_sets" || metric === "streak")) r.score = null;
  const ranked = rows.filter((r) => r.score != null).sort((a, b) => b.score! - a.score!);
  let rank = 0;
  ranked.forEach((r, i) => {
    if (i === 0 || r.score !== ranked[i - 1].score) rank = i + 1;
    r.rank = rank;
  });
  return [...ranked, ...rows.filter((r) => r.score == null)];
}

// ---------------------------------------------------------------- feed

export type FeedItem =
  | { kind: "workout"; id: string; at: string; userId: string; workout: Workout }
  | { kind: "pr"; id: string; at: string; userId: string; pr: PR };

export function feed(s: State, limit = 40): FeedItem[] {
  const priv = new Set(s.workouts.filter((w) => w.isPrivate).map((w) => w.id));
  const items: FeedItem[] = [
    ...s.workouts
      .filter((w) => !w.isPrivate)
      .map((w) => ({ kind: "workout" as const, id: `w-${w.id}`, at: w.endedAt, userId: w.userId, workout: w })),
    ...allPRs(s)
      .filter((p) => !priv.has(p.workoutId))
      .map((pr) => ({ kind: "pr" as const, id: pr.id, at: pr.at, userId: pr.userId, pr })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** A stable, fake set of friend reactions so the demo feed doesn't look empty. */
export function seededReactions(itemId: string): Partial<Record<string, string[]>> {
  let h = 0;
  for (const c of itemId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const codes = ["flame", "muscle", "laugh", "metal", "skull"];
  const friends = ["f-sam", "f-priya", "f-jordan", "f-theo"];
  const out: Partial<Record<string, string[]>> = {};
  if (h % 3 === 0) return out;
  out[codes[h % 2]] = friends.filter((_, i) => (h >> i) & 1);
  if (h % 5 === 0) out.laugh = [friends[h % 4]];
  return out;
}

// ---------------------------------------------------------------- volume

export function volumeKg(w: Workout) {
  return w.exercises.reduce((a, e) => a + e.sets.reduce((b, x) => b + x.kg * x.reps, 0), 0);
}

// ---------------------------------------------------------------- coaching

export function suggestionFor(s: State, exerciseId: string, before?: string): Suggestion {
  const def = exerciseMap(s).get(exerciseId);
  const goal = s.me?.goal ?? "hypertrophy";
  return nextSession(historyFor(s, "me", exerciseId, before), goal, def ? LOWER_BODY.has(def.primary) : false);
}
