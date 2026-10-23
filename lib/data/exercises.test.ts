import { describe, expect, it } from "vitest";
import { REGION_MUSCLE } from "@/lib/anatomy/regions";
import { BUILT_IN_EXERCISES } from "./exercises";
import { findExisting, normalize, searchExercises } from "./search";
import { demoWorkouts } from "./seed";

const ids = (q: string) => searchExercises(BUILT_IN_EXERCISES, q).map((h) => h.exercise.id);

describe("exercise library", () => {
  it("has unique ids and names", () => {
    expect(new Set(BUILT_IN_EXERCISES.map((e) => e.id)).size).toBe(BUILT_IN_EXERCISES.length);
    expect(new Set(BUILT_IN_EXERCISES.map((e) => normalize(e.name))).size).toBe(BUILT_IN_EXERCISES.length);
  });

  it("keeps every id that saved workouts point at", () => {
    const known = new Set(BUILT_IN_EXERCISES.map((e) => e.id));
    for (const w of demoWorkouts()) for (const e of w.exercises) expect(known).toContain(e.exerciseId);
  });

  it("never files one name under two exercises", () => {
    const owner = new Map<string, string>();
    for (const e of BUILT_IN_EXERCISES) {
      for (const n of new Set([e.name, ...(e.aliases ?? [])].map(normalize))) {
        expect(owner.get(n), `"${n}" belongs to ${owner.get(n)} and ${e.id}`).toBeUndefined();
        owner.set(n, e.id);
      }
    }
  });

  it("only focuses on regions of the primary muscle", () => {
    for (const e of BUILT_IN_EXERCISES)
      for (const r of e.focus ?? []) expect(REGION_MUSCLE[r], `${e.id} → ${r}`).toBe(e.primary);
  });
});

describe("normalize", () => {
  it("folds spellings, plurals and punctuation", () => {
    expect(normalize("Dumbell Bicep-Curls")).toBe("dumbbell bicep curl");
    expect(normalize("Biceps curl")).toBe("bicep curl");
    expect(normalize("DB press")).toBe("dumbbell press");
    expect(normalize("Pullups")).toBe("pull up");
    expect(normalize("Bench presses")).toBe("bench press");
    expect(normalize("Farmer's walk")).toBe("farmer walk");
    expect(normalize("Calves")).toBe("calf");
    expect(normalize("Abs")).toBe("abs");
  });
});

describe("searchExercises", () => {
  it("files other names under the same exercise", () => {
    for (const q of ["bicep curl", "Biceps curls", "dumbbell curl", "dumbell curl", "DB curl"]) expect(ids(q)[0], q).toBe("db-curl");
    expect(searchExercises(BUILT_IN_EXERCISES, "bicep curl")[0].via).toBe("Bicep curl");
    expect(searchExercises(BUILT_IN_EXERCISES, "dumbbell curl")[0].via).toBeUndefined();
  });

  it("finds common shorthand", () => {
    expect(ids("ohp")[0]).toBe("overhead-press");
    expect(ids("RDL")[0]).toBe("romanian-deadlift");
    expect(ids("pullup")[0]).toBe("pull-up");
    expect(ids("squat")[0]).toBe("back-squat");
    expect(ids("lat raise")[0]).toBe("lateral-raise");
    expect(ids("hex bar")[0]).toBe("trap-bar-deadlift");
    expect(ids("rope pushdown")[0]).toBe("triceps-pushdown");
  });

  it("lists each exercise once and keeps partial matches", () => {
    const r = ids("curl");
    expect(new Set(r).size).toBe(r.length);
    expect(r).toEqual(expect.arrayContaining(["db-curl", "barbell-curl", "hammer-curl", "lying-leg-curl"]));
    expect(ids("calves").length).toBeGreaterThan(0);
  });

  it("uses the primary muscle as a weaker match", () => {
    const r = ids("bicep curl");
    expect(r[0]).toBe("db-curl");
    expect(r).toContain("barbell-curl");
    expect(r).not.toContain("lying-leg-curl");
    expect(ids("chest")).toEqual(expect.arrayContaining(["bench-press", "cable-fly"]));
  });

  it("returns everything for an empty query and nothing for nonsense", () => {
    expect(ids("  ").length).toBe(BUILT_IN_EXERCISES.length);
    expect(ids("zzzqqq")).toEqual([]);
  });
});

describe("findExisting", () => {
  it("matches names and aliases", () => {
    expect(findExisting(BUILT_IN_EXERCISES, "Bicep Curls")?.id).toBe("db-curl");
    expect(findExisting(BUILT_IN_EXERCISES, "Military press")?.id).toBe("overhead-press");
    expect(findExisting(BUILT_IN_EXERCISES, "Zercher squat")).toBeUndefined();
  });
});

describe("search finds every spelling", () => {
  it("jelking, jelqing and jelq all find Jelqing first", () => {
    for (const q of ["jelking", "jelqing", "jelq"]) expect(searchExercises(BUILT_IN_EXERCISES, q)[0]?.exercise.id).toBe("jelqing");
  });
});
