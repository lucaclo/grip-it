import { describe, expect, it } from "vitest";
import { BUILT_IN_EXERCISES } from "@/lib/data/exercises";
import { DEMO_FRIENDS } from "@/lib/data/seed";
import { allPRs, muscleWork, suggestionFor } from "@/lib/data/selectors";
import type { State, Workout } from "@/lib/data/types";
import { citations } from "./citations";
import { gripLoad, gripsFor, gripTag, gripVariant, isUsualGrip, loadLabel, withGrip } from "./grips";

const byId = new Map(BUILT_IN_EXERCISES.map((e) => [e.id, e]));
const withGrips = BUILT_IN_EXERCISES.filter((e) => gripsFor(e.id).length);

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

const session = (id: string, at: string, exerciseId: string, kg: number, reps: number, grip?: string): Workout => ({
  id,
  userId: "me",
  title: "T",
  startedAt: at,
  endedAt: at,
  isPrivate: false,
  exercises: [{ exerciseId, ...(grip ? { grip } : {}), sets: [0, 1, 2].map(() => ({ kg, reps, rir: null, type: "normal" as const })) }],
});

describe("grip catalogue", () => {
  it("covers real exercises, each with a usual grip first and real citations", () => {
    expect(withGrips.length).toBeGreaterThan(20);
    for (const e of withGrips) {
      const list = gripsFor(e.id);
      expect(list[0].load, e.id).toBe(1);
      expect(new Set(list.map((g) => g.id)).size, e.id).toBe(list.length);
      for (const g of list) {
        expect(g.citationKeys.length, `${e.id}/${g.id}`).toBeGreaterThan(0);
        for (const k of g.citationKeys) expect(citations[k], k).toBeDefined();
        expect(g.load).toBeGreaterThan(0.5);
        expect(g.load).toBeLessThan(1.2);
      }
    }
  });

  it("only grip keys that are real exercise slugs", () => {
    for (const id of ["bench-press", "decline-bench-press", "pendlay-row", "trap-bar-deadlift", "concentration-curl"])
      expect(byId.has(id), id).toBe(true);
  });

  it("exercises without grips are untouched", () => {
    const squat = byId.get("back-squat")!;
    expect(gripsFor("back-squat")).toEqual([]);
    expect(withGrip(squat, "wide")).toBe(squat);
    expect(gripVariant("back-squat", "wide")).toBe("back-squat");
    expect(gripLoad("back-squat", "wide")).toBe(1);
  });

  it("a reverse curl is mostly forearm; a hammer curl brings in the forearm as a helper", () => {
    const curl = byId.get("db-curl")!;
    expect(withGrip(curl, "overhand").primary).toBe("forearms");
    expect(withGrip(curl, "overhand").focus).toEqual(["brachioradialis"]);
    expect(withGrip(curl, "neutral").primary).toBe("biceps");
    expect(withGrip(curl, "neutral").secondary).toContain("forearms");
  });

  it("straps take the forearms out of a deadlift and share its targets", () => {
    const dl = byId.get("deadlift")!;
    expect(dl.secondary).toContain("forearms");
    expect(withGrip(dl, "straps").secondary).not.toContain("forearms");
    expect(gripVariant("deadlift", "straps")).toBe("deadlift");
    expect(gripVariant("deadlift", "snatch")).toBe("deadlift@snatch");
  });

  it("close-grip bench lifts less than medium, as measured (Saeterbakken 2017)", () => {
    expect(gripLoad("bench-press", "close")).toBeLessThan(0.95);
    expect(gripLoad("bench-press", "close")).toBeGreaterThan(0.88);
    expect(loadLabel(gripsFor("bench-press").find((g) => g.id === "close")!)).toBe("About 8% lighter");
  });

  it("unknown grip ids fall back to the usual grip", () => {
    expect(isUsualGrip("bench-press", "banana")).toBe(true);
    expect(gripTag("bench-press", "banana")).toBeNull();
    expect(gripTag("bench-press", "close")).toBe("Close grip");
    expect(gripTag("deadlift", "straps")).toBe("Straps");
    expect(gripTag("deadlift", "snatch")).toBe("Snatch grip");
  });
});

describe("grip-aware coaching", () => {
  it("the first close-grip session starts from the medium-grip weight, scaled down and cited", () => {
    const s = state([session("a", "2026-10-01T10:00:00Z", "bench-press", 100, 8)]);
    const sug = suggestionFor(s, "bench-press", undefined, "close");
    expect(sug.action).toBe("new_grip");
    expect(sug.targetKg).toBe(90); // 100 × 0.92 = 92, rounded down to 2.5 kg
    expect(sug.targetReps).toBe(8);
    expect(sug.citationKeys).toContain("saeterbakken2017bench");
  });

  it("after that, close grip progresses from its own sets; medium is unaffected", () => {
    const s = state([
      session("a", "2026-10-01T10:00:00Z", "bench-press", 100, 8),
      session("b", "2026-10-04T10:00:00Z", "bench-press", 90, 12, "close"),
    ]);
    const close = suggestionFor(s, "bench-press", undefined, "close");
    expect(close.action).toBe("add_weight");
    expect(close.targetKg).toBe(92.5);
    const medium = suggestionFor(s, "bench-press");
    expect(medium.targetKg).toBe(100);
    expect(medium.targetReps).toBe(9);
  });

  it("straps don't start a new progression", () => {
    const s = state([session("a", "2026-10-01T10:00:00Z", "deadlift", 140, 6)]);
    expect(suggestionFor(s, "deadlift", undefined, "straps").action).not.toBe("new_grip");
  });

  it("each grip variant keeps its own PRs", () => {
    const s = state([
      session("a", "2026-10-01T10:00:00Z", "barbell-curl", 40, 8),
      session("b", "2026-10-04T10:00:00Z", "barbell-curl", 25, 8, "overhand"),
      session("c", "2026-10-08T10:00:00Z", "barbell-curl", 27.5, 8, "overhand"),
    ]);
    const prs = allPRs(s);
    // The lighter reverse curl isn't a regression and isn't compared with the normal curl.
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({ workoutId: "c", grip: "overhand", kg: 27.5 });
  });

  it("muscle credit follows the grip", () => {
    const s = state([session("a", "2026-10-01T10:00:00Z", "barbell-curl", 25, 10, "overhand")]);
    const work = muscleWork(s, s.workouts);
    expect(work.hardSets.forearms).toBe(3);
    expect(work.hardSets.biceps).toBe(1.5);
  });

  it("a lighter grip's sets still count as hard against the usual grip's max", () => {
    // 40 kg × 10 normal curls, then reverse curls at 28 kg × 10: close to failure for a reverse curl.
    const s = state([
      session("a", "2026-10-01T10:00:00Z", "barbell-curl", 40, 10),
      session("b", "2026-10-04T10:00:00Z", "barbell-curl", 28, 10, "overhand"),
    ]);
    const work = muscleWork(s, [s.workouts[1]]);
    expect(work.hardSets.forearms).toBe(3);
  });
});
