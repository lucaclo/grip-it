import { describe, expect, it } from "vitest";
import { effortScore, estimateRir, heatLevel, repsAtLoad, sessionEffort } from "./effort";
import { e1rm } from "./strength";

const set = (kg: number, reps: number, extra: Partial<{ rir: number | null; type: "warmup" | "failure" }> = {}) => ({
  kg,
  reps,
  rir: null,
  ...extra,
});

describe("reps at a load (Epley reversed)", () => {
  it("round-trips Epley: 100 kg x 10 has an e1RM of 133.3, so 10 reps are possible at 100 kg", () => {
    expect(repsAtLoad(100, e1rm(100, 10)!)).toBeCloseTo(10, 1);
  });
  it("at or above your max you can still do 1", () => {
    expect(repsAtLoad(140, 120)).toBe(1);
  });
});

describe("estimated reps in reserve", () => {
  it("8 reps at a load you could do 10 with leaves about 2", () => {
    expect(estimateRir(8, 100, e1rm(100, 10)!)).toBeCloseTo(2, 1);
  });
  it("never goes below 0 and is null without a max", () => {
    expect(estimateRir(12, 100, e1rm(100, 10)!)).toBe(0);
    expect(estimateRir(8, 100, 0)).toBeNull();
  });
});

describe("effort score", () => {
  it("follows the agreed table", () => {
    expect([0, 1, 2, 3, 4, 5, 8].map((r) => effortScore(r))).toEqual([1, 1, 0.85, 0.7, 0.5, 0.25, 0.25]);
  });
  it("halves very light sets and treats unknown effort as a typical hard set", () => {
    expect(effortScore(0, 0.25)).toBe(0.5);
    expect(effortScore(null)).toBe(0.7);
  });
});

describe("session effort", () => {
  it("scores sets against your previous best", () => {
    // Best before: 100 x 10 (e1RM 133.3). Today 100 x 10 is all-out, 100 x 5 leaves ~5.
    const r = sessionEffort([set(100, 10), set(100, 5)], e1rm(100, 10)!);
    expect(r.estimated).toBe(false);
    expect(r.sets[0]).toMatchObject({ score: 1, hard: true });
    expect(r.sets[1]).toMatchObject({ score: 0.25, hard: false });
  });

  it("with no history, today's best set stands in for your max and is marked as an estimate", () => {
    const r = sessionEffort([set(60, 8), set(60, 8), set(60, 6)], 0);
    expect(r.estimated).toBe(true);
    expect(r.sets.map((x) => x.hard)).toEqual([true, true, true]);
    expect(r.sets[2].rir).toBeCloseTo(2, 1);
  });

  it("a logged RIR wins over the estimate; warm-ups score nothing; F sets are 0 left", () => {
    const r = sessionEffort(
      [set(40, 10, { type: "warmup" }), set(100, 5, { rir: 1 }), set(100, 5, { type: "failure" })],
      e1rm(100, 10)!,
    );
    expect(r.sets[0]).toMatchObject({ score: 0, hard: false });
    expect(r.sets[1]).toMatchObject({ rir: 1, logged: true, score: 1, hard: true });
    expect(r.sets[2]).toMatchObject({ rir: 0, score: 1 });
  });

  it("a PR today raises the max, so the PR set counts as all-out", () => {
    const r = sessionEffort([set(110, 8)], e1rm(100, 8)!);
    expect(r.sets[0].rir).toBeCloseTo(0, 5);
  });

  it("body-weight moves add your body weight to the load", () => {
    // 80 kg person, +0 kg pull-ups: 10 reps, then 6 reps.
    const r = sessionEffort([set(0, 10), set(0, 6)], 0, 80);
    expect(r.sets[0].hard).toBe(true);
    expect(r.sets[1].rir).toBeCloseTo(4, 1);
  });

  it("high-rep sets (over 12) can still be judged against a max", () => {
    const r = sessionEffort([set(50, 20)], e1rm(80, 8)!);
    expect(r.sets[0].rir).not.toBeNull();
  });
});

describe("heat levels", () => {
  it("session: 0 none, under 2 light, 2-4 moderate, 4-6 hard, 6+ very hard", () => {
    expect([0, 1, 2, 3.9, 4, 5.9, 6, 12].map((x) => heatLevel(x, "session"))).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
  it("week: tracks the 10-20 set band", () => {
    expect([0, 4, 5, 9, 10, 20, 21].map((x) => heatLevel(x, "week"))).toEqual([0, 1, 2, 2, 3, 3, 4]);
  });
});

describe("old RIR values", () => {
  it("ignores RIR above 5 (reps typed into the old RIR column) and estimates instead", () => {
    const r = sessionEffort([set(100, 10, { rir: 10 })], e1rm(100, 10)!);
    expect(r.sets[0]).toMatchObject({ logged: false, hard: true, score: 1 });
  });
});
