import { describe, expect, it } from "vitest";
import { BUILT_IN_EXERCISES } from "@/lib/data/exercises";
import { MUSCLES } from "@/lib/science/volume";
import { workedLabel, workedRegions } from "./exercise";
import { BACK, bounds, fibrePath, FRONT, VIEW_H } from "./geometry";
import { MUSCLE_REGIONS, REGION_MUSCLE, REGIONS } from "./regions";

const ex = (id: string) => BUILT_IN_EXERCISES.find((e) => e.id === id)!;
const drawn = new Set([...FRONT, ...BACK].map((s) => s.r).filter(Boolean));

describe("anatomy figure", () => {
  it("draws every region and every tracked muscle", () => {
    for (const r of REGIONS) expect(drawn, r).toContain(r);
    for (const m of MUSCLES) {
      expect(MUSCLE_REGIONS[m].length, m).toBeGreaterThan(0);
      for (const r of MUSCLE_REGIONS[m]) expect(REGION_MUSCLE[r], `${m} → ${r}`).toBe(m);
    }
  });

  it("keeps the left half inside the canvas", () => {
    for (const s of [...FRONT, ...BACK]) {
      const b = bounds(s.d);
      expect(b.x0).toBeGreaterThanOrEqual(0);
      expect(b.x1).toBeLessThanOrEqual(100);
      expect(b.y0).toBeGreaterThanOrEqual(0);
      expect(b.y1).toBeLessThanOrEqual(VIEW_H);
    }
  });

  it("builds fibres for every muscle that has them", () => {
    for (const s of [...FRONT, ...BACK]) if (s.fibres) expect(fibrePath(s.fibres, s.d)).toMatch(/^M /);
  });
});

describe("workedRegions", () => {
  it("picks the side the muscle is on", () => {
    expect(workedRegions(ex("db-curl")).view).toBe("front");
    expect(workedRegions(ex("lat-pulldown")).view).toBe("back");
    expect(workedRegions(ex("lying-leg-curl")).view).toBe("back");
    expect(workedRegions(ex("leg-extension")).view).toBe("front");
    expect(workedRegions(ex("shrug")).view).toBe("back");
    expect(workedRegions(ex("lateral-raise")).view).toBe("front");
    expect(workedRegions(ex("standing-calf-raise")).view).toBe("back");
  });

  it("lights the focus and shows the rest of the muscle as secondary", () => {
    const w = workedRegions(ex("incline-bench-press"));
    expect(w.primary).toEqual(["pec_clavicular"]);
    expect(w.secondary).toEqual(expect.arrayContaining(["pec_sternal", "delt_front", "triceps"]));
    expect(w.secondary).not.toContain("pec_clavicular");
    expect(workedRegions(ex("seated-calf-raise")).primary).toEqual(["soleus"]);
    expect(workedRegions(ex("shrug")).secondary).not.toContain("rotator_cuff");
  });

  it("describes it in words", () => {
    expect(workedLabel(workedRegions(ex("db-curl")))).toBe(
      "Mainly works biceps and brachialis; also brachioradialis, forearm flexors and forearm extensors",
    );
  });
});
