import { describe, expect, it } from "vitest";
import { isHenry } from "./henry";

describe("isHenry", () => {
  it("matches Henry by first name, any case", () => {
    for (const n of ["Henry", "HENRY", "  henry Smith ", "Henry!"]) {
      expect(isHenry(n), n).toBe(true);
    }
  });
  it("ignores everyone else", () => {
    expect(isHenry(undefined)).toBe(false);
    expect(isHenry("")).toBe(false);
    expect(isHenry("Henrietta")).toBe(false);
    expect(isHenry("Luca Henry")).toBe(false);
  });
});
