import { describe, expect, it } from "vitest";
import { DEMO_FRIENDS, demoWorkouts } from "./seed";
import { allPRs, feed, leaderboard, liftedKg, muscleWork, streakOf, weekStart, weeklyHardSets } from "./selectors";
import type { State, Workout } from "./types";

const now = new Date("2026-10-21T12:00:00");

function state(workouts: Workout[]): State {
  return {
    me: null,
    friends: DEMO_FRIENDS,
    groupName: "Test",
    workouts,
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

const w = (id: string, userId: string, at: string, kg: number, reps: number, isPrivate = false): Workout => ({
  id,
  userId,
  title: "T",
  startedAt: at,
  endedAt: at,
  isPrivate,
  exercises: [{ exerciseId: "bench-press", sets: [{ kg, reps, rir: null, type: "normal" }] }],
});

describe("selectors", () => {
  it("week starts on Monday", () => {
    expect(weekStart(now).getDay()).toBe(1);
  });

  it("demo data produces PRs and a ranked leaderboard for every metric", () => {
    const s = state(demoWorkouts(now));
    expect(allPRs(s).length).toBeGreaterThan(10);
    for (const m of ["hard_sets", "volume", "pct_improvement", "dots", "streak"] as const) {
      const rows = leaderboard(s, m);
      expect(rows).toHaveLength(4);
      expect(rows[0].rank).toBe(1);
    }
  });

  it("flags an improbable jump (>15% within 28 days)", () => {
    const s = state([
      w("a", "f-sam", "2026-10-01T10:00:00Z", 100, 5),
      w("b", "f-sam", "2026-10-08T10:00:00Z", 125, 5),
    ]);
    const prs = allPRs(s);
    expect(prs).toHaveLength(1);
    expect(prs[0].flagged).toBe(true);
  });

  it("private workouts are hidden from the feed and their PRs too", () => {
    const s = state([
      w("a", "f-sam", "2026-10-01T10:00:00Z", 100, 5),
      w("b", "f-sam", "2026-10-08T10:00:00Z", 105, 5, true),
    ]);
    expect(feed(s).every((i) => i.kind !== "pr")).toBe(true);
    expect(feed(s)).toHaveLength(1);
  });

  it("warm-ups don't count as hard sets", () => {
    const x = w("a", "f-sam", new Date(weekStart(now).getTime() + 3600_000).toISOString(), 60, 8);
    x.exercises[0].sets.push({ kg: 40, reps: 10, rir: null, type: "warmup" });
    expect(weeklyHardSets(state([x]), "f-sam", weekStart(now))).toBe(1);
  });

  it("streak counts consecutive weeks meeting the goal", () => {
    const mon = weekStart(now).getTime();
    const ws = [1, 2, 3].map((k) => w(`w${k}`, "f-sam", new Date(mon - k * 7 * 86_400_000 + 3600_000).toISOString(), 60, 8));
    expect(streakOf(state(ws), "f-sam", 1, now)).toBe(3);
  });

  it("easy sets are not hard sets: effort comes from the weight vs your best and the reps", () => {
    const thisWeek = new Date(weekStart(now).getTime() + 3600_000).toISOString();
    // Best before: 100 x 10. This week: 100 x 10 (all-out) and 100 x 4 (about 6 left).
    const before = w("a", "f-sam", "2026-09-01T10:00:00Z", 100, 10);
    const x = w("b", "f-sam", thisWeek, 100, 10);
    x.exercises[0].sets.push({ kg: 100, reps: 4, rir: null, type: "normal" });
    expect(weeklyHardSets(state([before, x]), "f-sam", weekStart(now))).toBe(1);
  });

  it("muscle work: main muscle full, helpers half, and new lifts are marked as estimates", () => {
    const x = w("a", "f-sam", "2026-10-20T10:00:00Z", 60, 8);
    x.exercises[0].sets.push({ kg: 60, reps: 8, rir: null, type: "normal" });
    const work = muscleWork(state([x]), [x]);
    expect(work.hardSets.chest).toBe(2);
    expect(work.hardSets.triceps).toBe(1);
    expect(work.scores.chest).toBeCloseTo(2, 5);
    expect(work.estimated).toBe(true);
    expect(work.by.chest?.[0]).toMatchObject({ exerciseId: "bench-press", role: "main" });
  });

  it("volume leaderboard: weight x reps over working sets, body weight on body-weight moves", () => {
    const thisWeek = new Date(weekStart(now).getTime() + 3600_000).toISOString();
    const x = w("a", "f-sam", thisWeek, 60, 10);
    x.exercises[0].sets.push({ kg: 20, reps: 10, rir: null, type: "warmup" });
    x.exercises.push({ exerciseId: "pull-up", sets: [{ kg: 0, reps: 10, rir: null, type: "normal" }] });
    const s = state([x]);
    const sam = DEMO_FRIENDS.find((f) => f.id === "f-sam")! as { weightKg: number };
    expect(liftedKg(s, x)).toBe(600 + sam.weightKg * 10);
    const row = leaderboard(s, "volume").find((r) => r.userId === "f-sam")!;
    expect(row.score).toBe(600 + sam.weightKg * 10);
    expect(row.rank).toBe(1);
    expect(leaderboard(s, "volume").find((r) => r.userId === "f-priya")!.rank).toBeNull();
  });
});
