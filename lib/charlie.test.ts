import { describe, expect, it } from "vitest";
import { isCharlie } from "./charlie";

describe("isCharlie", () => {
  it("matches any form of Charlie by first name, any case", () => {
    for (const n of ["Charlie", "CHARLIE", "  charlie Cohen ", "Charles", "charles", "Charley", "Charly", "Chas", "Chuck", "Charlie!"]) {
      expect(isCharlie(n), n).toBe(true);
    }
  });
  it("ignores everyone else", () => {
    expect(isCharlie(undefined)).toBe(false);
    expect(isCharlie("")).toBe(false);
    expect(isCharlie("Charlotte")).toBe(false);
    expect(isCharlie("Robbie Charlie")).toBe(false);
  });
});
