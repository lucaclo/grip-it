import { describe, expect, it } from "vitest";
import { describeLoading, loadBar } from "./plates";

const kgs = (total: number) => loadBar(total).perSide.map((p) => p.kg);

describe("plate loading", () => {
  it("100 kg = 25 + 15 each side", () => expect(kgs(100)).toEqual([25, 15]));
  it("72.5 kg = 25 + 1.25 each side", () => expect(kgs(72.5)).toEqual([25, 1.25]));
  it("142.5 kg = 25 + 25 + 10 + 1.25", () => expect(kgs(142.5)).toEqual([25, 25, 10, 1.25]));
  it("empty bar and below-bar weights", () => {
    expect(loadBar(20).barOnly).toBe(true);
    expect(loadBar(15).belowBar).toBe(true);
  });
  it("reports what plates can't make", () => {
    const l = loadBar(61);
    expect(l.leftover).toBe(0.5);
    expect(describeLoading(l)).toContain("micro-plates");
  });
  it("describes the loading in words", () => expect(describeLoading(loadBar(100))).toBe("Bar + 25 + 15 kg each side"));
});
