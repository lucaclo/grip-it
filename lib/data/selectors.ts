import { gripLoad, gripOf, gripVariant, isUsualGrip, withGrip } from "@/lib/science/grips";
import { newGripSession, nextSession, type Session, type Suggestion } from "@/lib/science/progression";
import { sessionEffort, type SetEffort } from "@/lib/science/effort";
import { dots, e1rm } from "@/lib/science/strength";
import { targets, type TargetsResult } from "@/lib/science/targets";
import { addVolume, LOWER_BODY, type Muscle } from "@/lib/science/volume";
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
    .flatMap((w) =>
      w.exercises.filter((e) => e.exerciseId === exerciseId).map((e) => (e.grip ? { sets: e.sets, grip: e.grip } : { sets: e.sets })),
    );
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
  /** Grip the PR was set with, when it isn't the usual one. Each grip variant keeps its own PRs. */
  grip?: string;
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
      const key = `${w.userId}:${gripVariant(e.exerciseId, e.grip)}`;
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
            ...(isUsualGrip(e.exerciseId, e.grip) || gripOf(e.exerciseId, e.grip)?.holdOnly ? {} : { grip: e.grip }),
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

/**
 * Best e1RM on a lift. Grips: "usual" counts only the usual grip (and mixed, hook, straps), as
 * DOTS needs; "converted" counts every grip, scaled to its usual-grip equivalent, so switching grip
 * doesn't look like getting weaker.
 */
export function bestE1rm(
  s: State,
  userId: string,
  exerciseId: string,
  since?: number,
  until?: number,
  grips: "usual" | "converted" = "usual",
) {
  let b = 0;
  for (const w of s.workouts) {
    if (w.userId !== userId) continue;
    const t = Date.parse(w.startedAt);
    if ((since != null && t < since) || (until != null && t > until)) continue;
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      if (grips === "usual" && gripVariant(e.exerciseId, e.grip) !== e.exerciseId) continue;
      const scale = grips === "converted" ? 1 / gripLoad(e.exerciseId, e.grip) : 1;
      for (const set of e.sets) if (set.type !== "warmup") b = Math.max(b, (e1rm(set.kg, set.reps) ?? 0) * scale);
    }
  }
  return b;
}

// ---------------------------------------------------------------- effort

export type ExerciseEffort = { exerciseId: string; grip?: string; sets: SetEffort[]; estimated: boolean };

/** Body weight added to the logged kg for body-weight moves (pull-ups, dips), so effort and volume are fair. */
function extraLoad(s: State, userId: string, def: Exercise | undefined) {
  return def?.equipment === "bodyweight" ? (weightOf(s, userId) ?? 0) : 0;
}

// Effort for every saved set, rebuilt only when the data it depends on changes.
let effortCache: { key: unknown[]; index: Map<string, ExerciseEffort[]> } | null = null;

/** Effort per set for every workout (by workout id, one entry per exercise in order). See lib/science/effort.ts. */
export function effortIndex(s: State): Map<string, ExerciseEffort[]> {
  const key = [s.workouts, s.weights, s.friends, s.customExercises];
  if (effortCache && effortCache.key.every((k, i) => k === key[i])) return effortCache.index;
  const ex = exerciseMap(s);
  const index = new Map<string, ExerciseEffort[]>();
  // Best e1RM per user and lift from earlier sessions, walking forward in time. Kept as the usual
  // grip's equivalent and scaled to each session's grip, so a lighter grip's sets still count as hard.
  const best = new Map<string, number>();
  for (const w of [...s.workouts].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    const todays = new Map<string, number>();
    index.set(
      w.id,
      w.exercises.map((e) => {
        const def = ex.get(e.exerciseId);
        const k = `${w.userId}:${e.exerciseId}`;
        const load = gripLoad(e.exerciseId, e.grip);
        const r = sessionEffort(e.sets, (best.get(k) ?? 0) * load, extraLoad(s, w.userId, def));
        todays.set(k, Math.max(todays.get(k) ?? 0, r.bestToday / load));
        return { exerciseId: e.exerciseId, ...(e.grip ? { grip: e.grip } : {}), sets: r.sets, estimated: r.estimated };
      }),
    );
    for (const [k, v] of todays) best.set(k, Math.max(best.get(k) ?? 0, v));
  }
  effortCache = { key, index };
  return index;
}

export function workoutEffort(s: State, w: Workout): ExerciseEffort[] {
  return effortIndex(s).get(w.id) ?? [];
}

export function hardSetsIn(s: State, w: Workout): number {
  return workoutEffort(s, w).reduce((a, e) => a + e.sets.filter((x) => x.hard).length, 0);
}

export type MuscleContribution = { exerciseId: string; name: string; hardSets: number; score: number; role: "main" | "helper" };
export type MuscleWork = {
  /** Effort score per muscle: each set scores up to 1, helper muscles count half. */
  scores: Partial<Record<Muscle, number>>;
  /** Hard sets per muscle (helper muscles count half). */
  hardSets: Partial<Record<Muscle, number>>;
  /** Which exercises fed each muscle. */
  by: Partial<Record<Muscle, MuscleContribution[]>>;
  /** Some lifts had no history, so their effort is judged from today's best set. */
  estimated: boolean;
};

/** How hard each muscle was worked across a set of workouts. */
export function muscleWork(s: State, workouts: Workout[]): MuscleWork {
  const ex = exerciseMap(s);
  const out: MuscleWork = { scores: {}, hardSets: {}, by: {}, estimated: false };
  for (const w of workouts) {
    for (const e of workoutEffort(s, w)) {
      const base = ex.get(e.exerciseId);
      if (!base) continue;
      // The grip can move which muscles get the credit (a reverse curl is mostly forearm).
      const def = withGrip(base, e.grip);
      const score = e.sets.reduce((a, x) => a + x.score, 0);
      const hard = e.sets.filter((x) => x.hard).length;
      if (!score && !hard) continue;
      out.estimated ||= e.estimated;
      const roles: [Muscle, number, "main" | "helper"][] = [
        [def.primary, 1, "main"],
        ...def.secondary.map((m) => [m, 0.5, "helper"] as [Muscle, number, "helper"]),
      ];
      for (const [m, f, role] of roles) {
        out.scores[m] = (out.scores[m] ?? 0) + score * f;
        out.hardSets[m] = (out.hardSets[m] ?? 0) + hard * f;
        const list = (out.by[m] ??= []);
        const c = list.find((x) => x.exerciseId === e.exerciseId);
        if (c) {
          c.hardSets += hard * f;
          c.score += score * f;
        } else list.push({ exerciseId: e.exerciseId, name: def.name, hardSets: hard * f, score: score * f, role });
      }
    }
  }
  for (const list of Object.values(out.by)) list!.sort((a, b) => b.score - a.score);
  return out;
}

function weekOf(s: State, userId: string, from = weekStart(), to = Infinity) {
  return s.workouts.filter((w) => {
    const t = Date.parse(w.startedAt);
    return w.userId === userId && t >= from.getTime() && t < to;
  });
}

export function weeklyMuscleWork(s: State, userId: string, from = weekStart()): MuscleWork {
  return muscleWork(s, weekOf(s, userId, from));
}

// ---------------------------------------------------------------- volume

/** Hard sets per muscle this week (helper muscles count half). */
export function weeklyVolume(s: State, userId: string, from = weekStart()): Partial<Record<Muscle, number>> {
  const totals: Partial<Record<Muscle, number>> = {};
  const ex = exerciseMap(s);
  for (const w of weekOf(s, userId, from))
    for (const e of workoutEffort(s, w)) {
      const base = ex.get(e.exerciseId);
      if (!base) continue;
      const def = withGrip(base, e.grip);
      addVolume(totals, def.primary, def.secondary, e.sets.filter((x) => x.hard).length);
    }
  return totals;
}

export function weeklyHardSets(s: State, userId: string, from = weekStart(), to = Infinity) {
  return weekOf(s, userId, from, to).reduce((a, w) => a + hardSetsIn(s, w), 0);
}

/** Weight × reps over working sets (warm-ups left out); body-weight moves count body weight plus any added. */
export function liftedKg(s: State, w: Workout): number {
  // Friends' totals come worked out on their phone (their body weight never leaves it).
  if (w.userId !== "me" && w.liftedKg != null) return w.liftedKg;
  const ex = exerciseMap(s);
  let kg = 0;
  for (const e of w.exercises) {
    const extra = extraLoad(s, w.userId, ex.get(e.exerciseId));
    for (const x of e.sets) if (x.type !== "warmup") kg += (x.kg + extra) * x.reps;
  }
  return Math.round(kg);
}

export function weeklyLiftedKg(s: State, userId: string, from = weekStart()) {
  return weekOf(s, userId, from).reduce((a, w) => a + liftedKg(s, w), 0);
}

// ---------------------------------------------------------------- leaderboards

export type Metric = "hard_sets" | "volume" | "pct_improvement" | "dots" | "streak";

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
    const baseline = bestE1rm(s, userId, exId, first, calibratedAt, "converted");
    const current = bestE1rm(s, userId, exId, undefined, undefined, "converted");
    if (baseline > 0) gains.push((current - baseline) / baseline);
  }
  if (!gains.length) {
    const days = Math.max(1, Math.ceil((soonest - now) / DAY_MS));
    return { score: null, note: `Calibrating, ${days} day${days === 1 ? "" : "s"} left` };
  }
  return { score: (gains.reduce((a, b) => a + b, 0) / gains.length) * 100 };
}

function dotsOf(s: State, userId: string): { score: number | null; note?: string } {
  // Real friends publish only their score, worked out on their own phone.
  const friend = s.friends.find((f) => f.id === userId);
  if (friend && friend.dots !== undefined)
    return friend.dots == null ? { score: null, note: "Needs squat, bench and deadlift" } : { score: friend.dots };
  const bw = weightOf(s, userId);
  const sex = userId === "me" ? s.me?.sex : s.friends.find((f) => f.id === userId)?.sex;
  const lifts = DOTS_LIFTS.map((id) => bestE1rm(s, userId, id));
  const missing = DOTS_LIFTS.filter((_, i) => lifts[i] === 0);
  if (bw == null || !sex) return { score: null, note: "Log your body weight" };
  if (missing.length) return { score: null, note: "Needs squat, bench and deadlift" };
  return { score: dots(lifts.reduce((a, b) => a + b, 0), bw, sex) };
}

/** Your powerlifting (DOTS) score, published to your group so they can rank it without your weight. */
export function myDots(s: State): number | null {
  return dotsOf(s, "me").score;
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
      case "volume": {
        const kg = weeklyLiftedKg(s, id);
        return { userId: id, name, score: kg, display: kg.toLocaleString("en-GB"), note: "kg lifted this week", rank: null };
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
          note: r.note ?? "DOTS points · body weight stays private",
          rank: null,
        };
      }
    }
  });
  // Nobody gets a medal for zero: 0 hard sets, 0 kg or a 0-week streak is listed but unranked.
  for (const r of rows) if (r.score === 0 && (metric === "hard_sets" || metric === "volume" || metric === "streak")) r.score = null;
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

/** Demo friends' likes on a post: a stable, made-up subset so the demo feed isn't empty. Real likes arrive with accounts. */
export function seededLikes(itemId: string, friendIds: string[]): string[] {
  let h = 0;
  for (const c of itemId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  if (h % 3 === 0) return [];
  return friendIds.filter((_, i) => (h >> i) & 1);
}

/** Comments on a feed item: top-level comments oldest first, each with its replies. */
export function threadFor(s: State, itemId: string) {
  const all = s.comments.filter((c) => c.itemId === itemId).sort((a, b) => a.at.localeCompare(b.at));
  return all.filter((c) => !c.parentId).map((c) => ({ ...c, replies: all.filter((r) => r.parentId === c.id) }));
}

// ---------------------------------------------------------------- coaching

/**
 * Next-session target for one exercise with a given grip. Targets come from sessions with the same
 * grip variant; the first time on a new grip, the latest session on another grip is scaled by how
 * much each grip typically lifts (lib/science/grips.ts).
 */
export function suggestionFor(s: State, exerciseId: string, before?: string, grip?: string): Suggestion {
  const def = exerciseMap(s).get(exerciseId);
  const goal = s.me?.goal ?? "hypertrophy";
  const isLower = def ? LOWER_BODY.has(def.primary) : false;
  const all = historyFor(s, "me", exerciseId, before);
  const variant = gripVariant(exerciseId, grip);
  const same = all.filter((h) => gripVariant(exerciseId, h.grip) === variant);
  const g = gripOf(exerciseId, grip);
  const gripKeys = g && !isUsualGrip(exerciseId, grip) ? g.citationKeys : [];
  const worked = (h: Session) => h.sets.some((x) => x.type !== "warmup" && x.reps > 0);
  if (!same.some(worked)) {
    const other = all.find(worked);
    if (other && g)
      return newGripSession(
        other,
        gripLoad(exerciseId, grip) / gripLoad(exerciseId, other.grip),
        goal,
        { from: gripOf(exerciseId, other.grip)!.label, to: g.label },
        g.citationKeys,
      );
  }
  const sug = nextSession(same, goal, isLower);
  return gripKeys.length ? { ...sug, citationKeys: [...new Set([...sug.citationKeys, ...gripKeys])] } : sug;
}
