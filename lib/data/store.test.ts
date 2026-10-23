import { beforeEach, describe, expect, it } from "vitest";
import { migrate, STORE_VERSION, useStore } from "./store";

const set = (kg: number, reps: number) => ({ kg, reps, rir: null, type: "normal" as const, done: false });

describe("workout draft", () => {
  beforeEach(() => {
    useStore.getState().resetAll();
    useStore.getState().startWorkout();
  });

  it("auto-tick marks every set with reps as done, including new and edited sets", () => {
    const st = useStore.getState();
    st.addExerciseToDraft("bench-press", [set(60, 8), set(60, 0)]);
    st.setAutoTick(true);
    let sets = useStore.getState().draft!.exercises[0].sets;
    expect(sets.map((x) => x.done)).toEqual([true, false]);

    st.updateSet(0, 1, { reps: 7 });
    st.addSet(0);
    st.addExerciseToDraft("db-curl", [set(12, 10)]);
    sets = useStore.getState().draft!.exercises[0].sets;
    expect(sets.map((x) => x.done)).toEqual([true, true, true]);
    expect(useStore.getState().draft!.exercises[1].sets[0].done).toBe(true);
  });

  it("finish saves with the chosen start and end times", () => {
    const st = useStore.getState();
    st.addExerciseToDraft("bench-press", [set(60, 8)]);
    st.markAllDone();
    const id = st.finishWorkout("Monday", false, {
      startedAt: "2026-10-12T17:00:00.000Z",
      endedAt: "2026-10-12T18:05:00.000Z",
    });
    const w = useStore.getState().workouts.find((x) => x.id === id)!;
    expect(w.startedAt).toBe("2026-10-12T17:00:00.000Z");
    expect(w.endedAt).toBe("2026-10-12T18:05:00.000Z");
    expect(useStore.getState().draft).toBeNull();
  });

  it("a draft saved before auto-tick existed still works (data survives updates)", () => {
    useStore.setState({ draft: { clientId: "old", startedAt: "2026-10-01T10:00:00.000Z", exercises: [] } });
    useStore.getState().addExerciseToDraft("bench-press", [set(60, 8)]);
    expect(useStore.getState().draft!.exercises[0].sets[0].done).toBe(false);
  });
});

describe("editing saved workouts", () => {
  beforeEach(() => useStore.getState().resetAll());

  function saveOne() {
    const st = useStore.getState();
    st.startWorkout();
    st.addExerciseToDraft("bench-press", [{ kg: 60, reps: 8, rir: null, type: "normal", done: true }]);
    return st.finishWorkout("Push", false, { startedAt: "2026-10-12T17:00:00.000Z", endedAt: "2026-10-12T18:00:00.000Z" })!;
  }

  it("edit loads the workout, and finish replaces it in place without duplicating", () => {
    const id = saveOne();
    const before = useStore.getState().workouts.length;
    expect(useStore.getState().editWorkout(id)).toBe(true);
    const d = useStore.getState().draft!;
    expect(d.editing?.title).toBe("Push");
    expect(d.exercises[0].sets[0].done).toBe(true);

    useStore.getState().updateSet(0, 0, { kg: 62.5 });
    useStore.getState().finishWorkout("Push (fixed)", true, { startedAt: "2026-10-11T09:00:00.000Z", endedAt: "2026-10-11T10:00:00.000Z" });
    const ws = useStore.getState().workouts;
    expect(ws).toHaveLength(before);
    const w = ws.find((x) => x.id === id)!;
    expect(w).toMatchObject({ title: "Push (fixed)", isPrivate: true, startedAt: "2026-10-11T09:00:00.000Z" });
    expect(w.exercises[0].sets[0].kg).toBe(62.5);
  });

  it("can't edit while another workout is in progress, or edit a friend's workout", () => {
    const id = saveOne();
    useStore.getState().startWorkout();
    expect(useStore.getState().editWorkout(id)).toBe(false);
    useStore.getState().discardDraft();
    expect(useStore.getState().editWorkout("f-sam-w0")).toBe(false);
  });

  it("delete removes only my workout", () => {
    const id = saveOne();
    useStore.getState().deleteWorkout(id);
    useStore.getState().deleteWorkout("f-sam-w0");
    const ws = useStore.getState().workouts;
    expect(ws.some((w) => w.id === id)).toBe(false);
    expect(ws.some((w) => w.id === "f-sam-w0")).toBe(true);
  });
});

describe("rest timer", () => {
  beforeEach(() => {
    useStore.getState().resetAll();
    useStore.getState().startWorkout();
    useStore.getState().addExerciseToDraft("bench-press", [set(60, 8), set(60, 8)]);
  });

  it("ticking a set starts a 2-minute rest; +15 and skip adjust it", () => {
    const t0 = Date.now();
    useStore.getState().updateSet(0, 0, { done: true });
    const d = useStore.getState().draft!;
    const left = Date.parse(d.restEndsAt!) - t0;
    expect(left).toBeGreaterThan(119_000);
    expect(left).toBeLessThan(121_500);
    useStore.getState().adjustRest(15);
    expect(useStore.getState().draft!.restTotalSec).toBe(135);
    useStore.getState().clearRest();
    expect(useStore.getState().draft!.restEndsAt).toBeNull();
  });

  it("auto-tick and un-ticking don't start a rest", () => {
    useStore.getState().setAutoTick(true);
    useStore.getState().updateSet(0, 1, { reps: 9 });
    expect(useStore.getState().draft!.restEndsAt ?? null).toBeNull();
  });
});

describe("remove set with undo", () => {
  it("insertSet puts a removed set back in its original place", () => {
    useStore.getState().resetAll();
    useStore.getState().startWorkout();
    useStore.getState().addExerciseToDraft("bench-press", [set(60, 8), set(62.5, 6), set(60, 7)]);
    const removed = useStore.getState().draft!.exercises[0].sets[1];
    useStore.getState().removeSet(0, 1);
    expect(useStore.getState().draft!.exercises[0].sets).toHaveLength(2);
    useStore.getState().insertSet(0, 1, removed);
    expect(useStore.getState().draft!.exercises[0].sets.map((x) => x.kg)).toEqual([60, 62.5, 60]);
  });
});

describe("quick nutrition", () => {
  it("adds to today's totals, and a negative add undoes it without going below zero", () => {
    useStore.getState().resetAll();
    const st = useStore.getState();
    st.addNutrition({ kcal: 120, proteinG: 25 }, "2026-10-21");
    st.addNutrition({ kcal: 600, proteinG: 40 }, "2026-10-21");
    expect(useStore.getState().nutrition.find((n) => n.day === "2026-10-21")).toMatchObject({ kcal: 720, proteinG: 65 });
    st.addNutrition({ kcal: -600, proteinG: -40 }, "2026-10-21");
    st.addNutrition({ kcal: -999, proteinG: -999 }, "2026-10-21");
    expect(useStore.getState().nutrition.find((n) => n.day === "2026-10-21")).toMatchObject({ kcal: 0, proteinG: 0 });
  });
});

describe("onboarding", () => {
  const profile = {
    name: "Luca",
    heightCm: 180,
    sex: "male" as const,
    birthYear: 2005,
    bodyFatPct: null,
    activity: "moderate" as const,
    goal: "hypertrophy" as const,
    experience: "beginner" as const,
    targetWeightKg: 80,
    targetDate: null,
    rirEnabled: false,
    sessionsPerWeek: 3,
    shareWeight: false,
    shareNutrition: false,
  };

  beforeEach(() => useStore.getState().resetAll());

  it("a real profile starts blank: no demo friends, their workouts or sample history", () => {
    useStore.getState().completeOnboarding(profile, 78, false);
    const s = useStore.getState();
    expect(s.me?.name).toBe("Luca");
    expect(s.friends).toEqual([]);
    expect(s.workouts).toEqual([]);
    expect(s.weights).toEqual([{ day: expect.any(String), kg: 78 }]);
  });

  it("the demo option keeps the made-up friends and adds sample history", () => {
    useStore.getState().completeOnboarding(profile, 78, true);
    const s = useStore.getState();
    expect(s.friends.length).toBeGreaterThan(0);
    expect(s.workouts.some((w) => w.userId === "me")).toBe(true);
  });
});

describe("saved data upgrades (v1 -> v2)", () => {
  it("turns your old emoji reactions into likes and keeps everything else", () => {
    const v1 = {
      me: null,
      friends: [],
      groupName: "Crew",
      workouts: [{ id: "w1" }],
      customExercises: [],
      weights: [{ day: "2026-10-01", kg: 80 }],
      nutrition: [],
      reactions: { "w-w1": { flame: ["me", "f-sam"] }, "w-w2": { laugh: ["f-sam"] } },
      draft: null,
    };
    const v2 = migrate(v1, 1);
    expect(v2.likes).toEqual({ "w-w1": ["me"] });
    expect(v2.comments).toEqual([]);
    expect(v2.reactions).toEqual(v1.reactions);
    expect(v2.workouts).toEqual(v1.workouts);
    expect(v2.weights).toEqual(v1.weights);
  });
  it("leaves current data alone", () => {
    const st = { likes: { a: ["me"] }, comments: [{ id: "c" }] };
    expect(migrate(st, STORE_VERSION)).toEqual(st);
  });
});

describe("likes and comments", () => {
  beforeEach(() => useStore.getState().resetAll());

  it("double-tap likes once and never unlikes; the heart button toggles", () => {
    const st = useStore.getState();
    expect(st.like("w-1")).toBe(true);
    expect(useStore.getState().like("w-1")).toBe(false);
    expect(useStore.getState().likes["w-1"]).toEqual(["me"]);
    useStore.getState().toggleLike("w-1");
    expect(useStore.getState().likes["w-1"]).toEqual([]);
  });

  it("comments and replies; deleting a comment removes its replies", () => {
    const st = useStore.getState();
    st.addComment("w-1", "  Huge session  ");
    const top = useStore.getState().comments[0];
    expect(top.text).toBe("Huge session");
    useStore.getState().addComment("w-1", "Thanks!", top.id);
    useStore.getState().addComment("w-1", "   ");
    expect(useStore.getState().comments).toHaveLength(2);
    useStore.getState().deleteComment(top.id);
    expect(useStore.getState().comments).toEqual([]);
  });
});
