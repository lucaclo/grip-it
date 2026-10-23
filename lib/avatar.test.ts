import { describe, expect, it } from "vitest";
import { centreSquare, clampView, cropRegion, initialView, MAX_ZOOM, zoomAt } from "./avatar";

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

describe("crop view", () => {
  const frame = 300;

  it("starts centred at zoom 1, cropping the centre square", () => {
    const v = initialView(3024, 4032, frame);
    expect(cropRegion(v)).toEqual({ sx: 0, sy: 504, size: 3024 });
  });

  it("never lets the image leave an empty edge in the frame", () => {
    const v = clampView({ ...initialView(4000, 3000, frame), x: 50, y: -999 });
    expect(v.x).toBe(0);
    expect(v.y).toBe(0); // at zoom 1 the short side exactly fills the frame
    const r = cropRegion(v);
    expect(r.sx).toBe(0);
    expect(r.sy + r.size).toBeLessThanOrEqual(3000);
  });

  it("zooms around the pinch point and stays inside 1…MAX_ZOOM", () => {
    const v = initialView(1000, 1000, frame);
    const z = zoomAt(v, 2, 0, 0); // pin the top-left corner
    expect(z.zoom).toBe(2);
    expect(cropRegion(z)).toEqual({ sx: 0, sy: 0, size: 500 });
    expect(zoomAt(v, 99).zoom).toBe(MAX_ZOOM);
    expect(zoomAt(v, 0.2).zoom).toBe(1);
  });

  it("crops exactly the part of the photo inside the frame after a pan", () => {
    const v = clampView({ ...initialView(1000, 1000, frame), zoom: 2, x: -150, y: -300 });
    const r = cropRegion(v);
    expect(r.size).toBeCloseTo(500);
    expect(r.sx).toBeCloseTo(250);
    expect(r.sy).toBeCloseTo(500);
  });
});
