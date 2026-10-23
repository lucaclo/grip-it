import { describe, expect, it } from "vitest";
import { centreSquare } from "./avatar";

describe("centreSquare", () => {
  it("cuts the middle of a portrait photo", () => {
    expect(centreSquare(3024, 4032)).toEqual({ sx: 0, sy: 504, size: 3024 });
  });
  it("cuts the middle of a landscape photo", () => {
    expect(centreSquare(4032, 3024)).toEqual({ sx: 504, sy: 0, size: 3024 });
  });
  it("keeps a square photo whole", () => {
    expect(centreSquare(500, 500)).toEqual({ sx: 0, sy: 0, size: 500 });
  });
});
