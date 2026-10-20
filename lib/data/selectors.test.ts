import { describe, expect, it } from "vitest";
import { DEMO_FRIENDS, demoWorkouts } from "./seed";
import { allPRs, feed, leaderboard, streakOf, weekStart, weeklyHardSets } from "./selectors";
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
    draft: null,
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
    for (const m of ["hard_sets", "pct_improvement", "dots", "streak"] as const) {
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
});
