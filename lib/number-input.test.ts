import { describe, expect, it } from "vitest";
import { cleanNumberText, parseNumber } from "./number-input";

const typeKg = (s: string) => parseNumber(cleanNumberText(s, true));
const typeReps = (s: string) => parseNumber(cleanNumberText(s, false));

describe("set boxes", () => {
  it("weight takes half and quarter kilos, with a point or a comma", () => {
    expect(typeKg("27.5")).toBe(27.5);
    expect(typeKg("27,5")).toBe(27.5);
    expect(typeKg("1.25")).toBe(1.25);
    expect(cleanNumberText("27.", true)).toBe("27.");
    expect(typeKg("27.")).toBe(27);
  });
  it("weight ignores a second point and stray characters", () => {
    expect(cleanNumberText("27.5.5", true)).toBe("27.55");
    expect(typeKg("kg 40")).toBe(40);
  });
  it("reps have no upper limit and are whole numbers", () => {
    expect(typeReps("20")).toBe(20);
    expect(typeReps("15")).toBe(15);
    expect(typeReps("50")).toBe(50);
    expect(cleanNumberText("12.5", false)).toBe("125");
  });
  it("empty is empty, never negative", () => {
    expect(typeKg("")).toBeNull();
    expect(typeKg(".")).toBeNull();
    expect(typeReps("-5")).toBe(5);
  });
});
