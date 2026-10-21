import { describe, expect, it } from "vitest";
import { QUESTIONS, recommend } from "./questionnaire";
import { REP_RANGE } from "./progression";
import { targets } from "./targets";

describe("questionnaire", () => {
  it("has six questions, each with options", () => {
    expect(QUESTIONS).toHaveLength(6);
    for (const q of QUESTIONS) expect(q.options.length).toBeGreaterThan(1);
  });

  it("new lifter who wants size → build muscle, novice", () => {
    const r = recommend({ years: "lt6m", progress: "most_sessions", aim: "size", bodyFat: "happy", days: 3, reps: "moderate" });
    expect(r).toMatchObject({ goal: "hypertrophy", experience: "novice", sessionsPerWeek: 3 });
    expect(r.reasons.length).toBeGreaterThan(1);
  });

  it("fast progress pulls the level down, slow progress pushes it up", () => {
    expect(recommend({ years: "1to3y", progress: "most_sessions", aim: "size" }).experience).toBe("beginner");
    expect(recommend({ years: "3to5y", progress: "months", aim: "size" }).experience).toBe("elite");
  });

  it("strength + heavy reps → strength; size + heavy → powerbuilding; both → powerbuilding", () => {
    expect(recommend({ aim: "strength", reps: "heavy" }).goal).toBe("strength");
    expect(recommend({ aim: "size", reps: "heavy" }).goal).toBe("powerbuilding");
    expect(recommend({ aim: "both" }).goal).toBe("powerbuilding");
  });

  it("fat goals are checked against body fat", () => {
    expect(recommend({ aim: "lose_fat", bodyFat: "lose_lot" }).goal).toBe("fat_loss");
    expect(recommend({ aim: "lose_fat", bodyFat: "happy" }).goal).toBe("recomp");
    expect(recommend({ aim: "lose_and_gain", bodyFat: "lose_bit", years: "lt6m" }).goal).toBe("recomp");
    expect(recommend({ aim: "size", bodyFat: "lose_lot" }).goal).toBe("recomp");
    expect(recommend({ aim: "health", bodyFat: "happy" }).goal).toBe("fitness");
  });
});

describe("new goals in the science engine", () => {
  const base = { weightKg: 80, heightCm: 180, ageYears: 22, sex: "male" as const, activity: "moderate" as const, today: "2026-01-05" };

  it("every goal has a rep range", () => {
    for (const g of ["hypertrophy", "strength", "powerbuilding", "recomp", "fat_loss", "fitness"] as const) {
      expect(REP_RANGE[g][0]).toBeLessThan(REP_RANGE[g][1]);
    }
  });

  it("recomp never plans a surplus and uses high protein", () => {
    const up = targets({ ...base, goal: "recomp", experience: "beginner", targetWeightKg: 85 });
    expect(up.direction).toBe("maintain");
    const down = targets({ ...base, goal: "recomp", experience: "beginner", targetWeightKg: 75 });
    expect(down.direction).toBe("lose");
    expect(down.proteinG).toBe(176); // 2.2 g/kg
    // gentler than a full fat-loss phase
    const cut = targets({ ...base, goal: "fat_loss", experience: "beginner", targetWeightKg: 75 });
    expect(Math.abs(down.weeklyRateKg)).toBeLessThan(Math.abs(cut.weeklyRateKg));
  });

  it("elite gains slowest; fitness gains at half rate", () => {
    const elite = targets({ ...base, goal: "hypertrophy", experience: "elite", targetWeightKg: 84 });
    const adv = targets({ ...base, goal: "hypertrophy", experience: "advanced", targetWeightKg: 84 });
    expect(elite.weeklyRateKg).toBeLessThan(adv.weeklyRateKg);
    expect(elite.difficulty).toBe("hard");
    const fit = targets({ ...base, goal: "fitness", experience: "beginner", targetWeightKg: 84 });
    const hyp = targets({ ...base, goal: "hypertrophy", experience: "beginner", targetWeightKg: 84 });
    expect(fit.weeklyRateKg).toBeCloseTo(hyp.weeklyRateKg / 2, 2);
  });
});
