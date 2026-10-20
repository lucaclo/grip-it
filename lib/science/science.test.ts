import { describe, expect, it } from "vitest";
import { citations } from "./citations";
import { energy, katchMcArdle, mifflinStJeor } from "./energy";
import { nextSession } from "./progression";
import { dots, e1rm } from "./strength";
import { protein, targets } from "./targets";
import { addVolume, isHardSet, volumeStatus } from "./volume";

const base = {
  weightKg: 80,
  heightCm: 180,
  ageYears: 22,
  sex: "male" as const,
  activity: "moderate" as const,
};

describe("citations", () => {
  it("every citation has the required fields and a well-formed DOI", () => {
    for (const c of Object.values(citations)) {
      expect(c.title.length).toBeGreaterThan(5);
      expect(c.finding.length).toBeGreaterThan(10);
      if (c.doiUrl) expect(c.doiUrl).toMatch(/^https:\/\/doi\.org\/10\.\d{4,}\/\S+$/);
    }
  });
});

describe("energy", () => {
  it("Mifflin-St Jeor: 10*80 + 6.25*180 - 5*22 + 5 = 1820", () => {
    expect(mifflinStJeor(base)).toBe(1820);
  });
  it("Mifflin-St Jeor female offset is -161", () => {
    expect(mifflinStJeor({ ...base, sex: "female" })).toBe(1654);
  });
  it("Katch-McArdle: 370 + 21.6 * (80 * 0.85) = 1838.8", () => {
    expect(katchMcArdle(80, 15)).toBeCloseTo(1838.8);
  });
  it("uses Katch-McArdle only when body fat is given, and multiplies by the activity factor", () => {
    expect(energy(base)).toMatchObject({ bmr: 1820, tdee: 2821, method: "mifflin_st_jeor" });
    expect(energy({ ...base, bodyFatPct: 15 }).method).toBe("katch_mcardle");
  });
});

describe("protein", () => {
  it("1.6 g/kg for building muscle", () => expect(protein(80, "hypertrophy").grams).toBe(128));
  it("2.6 g/kg lean mass when dieting with body fat known", () =>
    expect(protein(80, "fat_loss", 20).grams).toBe(166));
});

describe("targets", () => {
  const today = "2026-01-05";
  it("beginner lean bulk: +0.5% BW/week = 0.4 kg/week, surplus ~440 kcal", () => {
    const t = targets({ ...base, goal: "hypertrophy", experience: "beginner", targetWeightKg: 84, today });
    expect(t.direction).toBe("gain");
    expect(t.weeklyRateKg).toBe(0.4);
    expect(t.kcal).toBe(2821 + 440);
    expect(t.weeks).toBe(10);
    expect(t.citationKeys).toContain("iraki2019offseason");
  });
  it("flags an unrealistic date and proposes a realistic one", () => {
    const t = targets({
      ...base,
      goal: "fat_loss",
      experience: "intermediate",
      targetWeightKg: 70,
      targetDate: "2026-02-02",
      today,
    });
    expect(t.unrealistic).toBe(true);
    expect(t.difficulty).toBe("hard");
    expect(t.projectedDate! > "2026-02-02").toBe(true);
  });
  it("plans to a realistic user date", () => {
    const t = targets({
      ...base,
      goal: "fat_loss",
      experience: "beginner",
      targetWeightKg: 76,
      targetDate: "2026-04-27",
      today,
    });
    expect(t.unrealistic).toBe(false);
    expect(t.projectedDate).toBe("2026-04-27");
  });
  it("never sets calories below BMR", () => {
    const t = targets({
      ...base,
      activity: "sedentary",
      goal: "fat_loss",
      experience: "beginner",
      targetWeightKg: 60,
      today,
    });
    expect(t.kcal).toBeGreaterThanOrEqual(t.bmr);
  });
  it("fat loss with a higher target weight falls back to maintenance", () => {
    const t = targets({ ...base, goal: "fat_loss", experience: "beginner", targetWeightKg: 90, today });
    expect(t.direction).toBe("maintain");
    expect(t.kcal).toBe(t.tdee);
  });
});

describe("strength", () => {
  it("Epley: 100 kg x 5 = 116.7", () => expect(e1rm(100, 5)).toBe(116.7));
  it("1 rep is the weight itself, more than 12 reps is untrusted", () => {
    expect(e1rm(140, 1)).toBe(140);
    expect(e1rm(60, 15)).toBeNull();
  });
  it("DOTS scales a total by body weight (heavier lifter needs more for the same score)", () => {
    expect(dots(500, 80, "male")).toBeGreaterThan(dots(500, 100, "male"));
    expect(dots(500, 80, "male")).toBeGreaterThan(300);
    expect(dots(500, 80, "male")).toBeLessThan(400);
  });
});

describe("progression (hypertrophy 6-12)", () => {
  const s = (kg: number, ...reps: number[]) => ({ sets: reps.map((r) => ({ kg, reps: r })) });
  it("first time: no target", () => expect(nextSession([], "hypertrophy", false).action).toBe("first_time"));
  it("all sets at 12 → add 2.5 kg upper body", () => {
    const r = nextSession([s(60, 12, 12, 12)], "hypertrophy", false);
    expect(r).toMatchObject({ action: "add_weight", targetKg: 62.5, targetReps: 6 });
  });
  it("lower body steps 5 kg", () =>
    expect(nextSession([s(100, 12, 12)], "hypertrophy", true).targetKg).toBe(105));
  it("in range → +1 rep on the lowest set", () =>
    expect(nextSession([s(60, 10, 9, 8)], "hypertrophy", false)).toMatchObject({
      action: "add_rep",
      targetReps: 9,
    }));
  it("below range → hold", () =>
    expect(nextSession([s(60, 7, 5)], "hypertrophy", false).action).toBe("hold"));
  it("3 sessions stuck → deload 10%", () => {
    const r = nextSession([s(80, 8, 8), s(80, 8, 8), s(80, 8, 8)], "hypertrophy", false);
    expect(r).toMatchObject({ action: "deload", targetKg: 72.5 });
  });
  it("high RIR → push closer to failure (+2 reps)", () => {
    const r = nextSession(
      [{ sets: [{ kg: 60, reps: 8, rir: 5 }, { kg: 60, reps: 8, rir: 5 }] }],
      "hypertrophy",
      false,
    );
    expect(r.action).toBe("add_rep");
    expect(r.targetReps).toBe(10);
    expect(r.citationKeys).toContain("refalo2023failure");
  });
  it("warm-ups are ignored", () => {
    const r = nextSession(
      [{ sets: [{ kg: 100, reps: 3, type: "warmup" }, { kg: 60, reps: 12 }] }],
      "hypertrophy",
      false,
    );
    expect(r.targetKg).toBe(62.5);
  });
});

describe("volume", () => {
  it("hard sets exclude warm-ups and RIR > 3", () => {
    expect(isHardSet({ reps: 8 })).toBe(true);
    expect(isHardSet({ reps: 8, rir: 4 })).toBe(false);
    expect(isHardSet({ reps: 8, type: "warmup" })).toBe(false);
  });
  it("secondary muscles count half", () => {
    const t = {};
    addVolume(t, "chest", ["triceps", "front_delts"], 4);
    expect(t).toEqual({ chest: 4, triceps: 2, front_delts: 2 });
  });
  it("status bands", () => {
    expect(volumeStatus(6)).toBe("under");
    expect(volumeStatus(12)).toBe("in_range");
    expect(volumeStatus(24)).toBe("over");
  });
});
