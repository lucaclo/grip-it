import type { Region } from "./regions";

/**
 * Hand-drawn anatomy for the muscle figure, original artwork. viewBox 0 0 200 432, an 8-head figure:
 * chin 60, nipples 112, navel 164, crotch 216, knees ~300, soles 424. Only the figure's left half
 * (x ≤ 100) is drawn; the renderer mirrors it. Paths use absolute M/C/L commands only, so every
 * number pair is a point (bounds() relies on that).
 */
export const VIEW_W = 200;
export const VIEW_H = 432;

export type Pt = [number, number];

/** How a muscle's fibres run, so the striations read like real anatomy. */
export type Fibres =
  /** Fan muscles (pecs, lats, traps, delts): fibres converge on a tendon at `at`. */
  | { kind: "radial"; at: Pt; step?: number }
  /** Straight sheets (obliques, glutes, abs): fibres at `angle` degrees, `gap` apart. */
  | { kind: "parallel"; angle: number; gap?: number }
  /** Spindle muscles (biceps, quads, calves): fibres bow out between two tendons. */
  | { kind: "spindle"; from: Pt; to: Pt; spread: number; count?: number };

export type Shape = {
  r: Region | null;
  d: string;
  fibres?: Fibres;
  /** Extra lines drawn over the muscle, e.g. the tendinous bands across the abs. */
  marks?: string;
  /** Sits on the centre line: drawn without an outline so the two halves join invisibly. */
  seamless?: boolean;
};

/** Outline of the whole left half, drawn under the muscles. */
export const SILHOUETTE =
  "M 100 8 C 86 8, 78 18, 78 34 C 78 46, 82 56, 89 62 L 89 70 C 82 76, 70 78, 58 81 " +
  "C 46 85, 40 97, 40 113 C 38 131, 34 149, 32 166 C 28 186, 24 206, 24 226 " +
  "C 20 238, 20 252, 26 264 C 30 269, 36 267, 38 258 C 40 248, 40 236, 38 226 " +
  "C 42 208, 48 188, 51 170 C 55 152, 59 136, 63 124 C 65 140, 67 156, 68 172 " +
  "C 70 186, 68 198, 68 210 C 64 230, 65 262, 73 296 C 71 316, 71 344, 77 372 " +
  "C 80 386, 80 400, 78 410 C 74 418, 76 424, 86 424 L 96 424 C 98 414, 96 400, 94 388 " +
  "C 98 360, 98 330, 95 306 C 97 280, 98 250, 98 224 L 100 218";
/** The outline is stroked without its closing edge, so no seam shows down the middle. */
export const SILHOUETTE_FILL = SILHOUETTE + " Z";

const HEAD = "M 100 10 C 88 10, 81 19, 81 34 C 81 46, 86 55, 93 59 C 96 60, 98 61, 100 61 Z";
const NECK = "M 91 60 C 92 66, 92 70, 90 74 L 100 76 L 100 62 C 97 62, 94 61, 91 60 Z";
const HAND =
  "M 25 230 C 21 240, 21 254, 27 262 C 31 266, 35 264, 37 256 C 39 246, 39 236, 37 228 C 33 227, 28 228, 25 230 Z";
const KNEE = "M 80 296 C 80 290, 92 290, 92 296 C 92 304, 80 304, 80 296 Z";
const FOOT = "M 80 410 C 76 417, 78 424, 86 424 L 96 424 C 97 418, 96 412, 94 406 C 90 404, 84 405, 80 410 Z";

export const FRONT: Shape[] = [
  { r: null, d: HEAD, seamless: true },
  { r: null, d: NECK, seamless: true },
  {
    r: "traps_upper",
    d: "M 90 64 C 87 72, 76 77, 60 81 C 66 83, 76 82, 84 80 C 87 79, 89 78, 90 76 Z",
    fibres: { kind: "parallel", angle: -20, gap: 3 },
  },
  {
    r: "delt_side",
    d: "M 59 82 C 48 84, 41 96, 41 112 C 41 120, 43 126, 46 131 L 50 113 C 51 101, 54 92, 60 86 Z",
    fibres: { kind: "radial", at: [48, 134], step: 4 },
  },
  {
    r: "delt_front",
    d: "M 60 86 C 54 92, 51 101, 50 113 L 46 131 C 52 128, 57 120, 61 110 C 63 102, 66 94, 70 86 C 67 84, 63 84, 60 86 Z",
    fibres: { kind: "radial", at: [48, 134], step: 4 },
  },
  {
    r: "pec_clavicular",
    d: "M 99 84 L 99 100 C 88 101, 76 103, 63 108 C 65 100, 67 92, 71 86 C 80 84, 90 84, 99 84 Z",
    fibres: { kind: "radial", at: [56, 112], step: 3 },
  },
  {
    r: "pec_sternal",
    d: "M 99 102 L 99 130 C 92 136, 80 137, 72 131 C 68 127, 65 120, 63 110 C 76 106, 88 103, 99 102 Z",
    fibres: { kind: "radial", at: [56, 112], step: 3 },
  },
  {
    r: "serratus",
    d: "M 65 129 C 68 129, 71 131, 72 134 C 71 136, 68 136, 66 137 C 69 138, 72 141, 73 144 C 72 146, 68 146, 66 147 C 69 148, 71 151, 72 154 C 71 156, 68 156, 67 156 C 66 146, 65 138, 65 129 Z",
    fibres: { kind: "parallel", angle: 22, gap: 1.8 },
  },
  {
    r: "obliques",
    d: "M 86 140 C 85 160, 85 182, 88 202 C 84 208, 77 210, 71 205 C 70 190, 69 174, 69 160 C 72 152, 74 144, 75 137 C 79 136, 83 137, 86 140 Z",
    fibres: { kind: "parallel", angle: 58, gap: 3 },
  },
  {
    r: "rectus_abdominis",
    d: "M 99 134 L 99 212 C 95 212, 91 208, 89 200 C 87 182, 86 160, 87 140 C 90 136, 94 134, 99 134 Z",
    fibres: { kind: "parallel", angle: 90, gap: 2.4 },
    marks: "M 87 152 L 99 151 M 87 168 L 99 167 M 87.5 184 L 99 183",
  },
  {
    r: "biceps",
    d: "M 59 119 C 61 133, 58 151, 51 166 C 48 168, 45 167, 43 164 C 43 148, 46 131, 52 117 C 55 116, 57 117, 59 119 Z",
    fibres: { kind: "spindle", from: [55, 117], to: [47, 166], spread: 7, count: 9 },
  },
  {
    r: "brachialis",
    d: "M 45 130 C 42 141, 41 153, 41 164 L 43 164 C 43 152, 44 141, 47 128 Z",
    fibres: { kind: "parallel", angle: 100, gap: 1.6 },
  },
  {
    r: "brachioradialis",
    d: "M 41 167 C 35 181, 30 201, 28 222 L 31 224 C 33 206, 37 188, 43 169 Z",
    fibres: { kind: "spindle", from: [42, 168], to: [29, 223], spread: 2.5, count: 4 },
  },
  {
    r: "forearm_flexors",
    d: "M 50 170 C 49 186, 44 206, 39 226 L 32 226 C 33 210, 37 190, 44 169 C 46 168, 48 169, 50 170 Z",
    fibres: { kind: "spindle", from: [47, 168], to: [35, 226], spread: 5, count: 7 },
  },
  { r: null, d: HAND },
  {
    r: "tfl",
    d: "M 69 210 C 71 205, 77 206, 79 212 L 74 232 C 70 226, 68 218, 69 210 Z",
    fibres: { kind: "parallel", angle: 105, gap: 2 },
  },
  {
    r: "adductors",
    d: "M 98 222 C 98 242, 97 262, 95 281 C 93 268, 90 250, 88 230 L 88 220 C 91 219, 95 220, 98 222 Z",
    fibres: { kind: "parallel", angle: 104, gap: 2 },
  },
  {
    r: "vastus_lateralis",
    d: "M 73 222 C 65 240, 65 268, 74 294 L 79 292 C 76 270, 76 246, 79 225 C 77 221, 75 221, 73 222 Z",
    fibres: { kind: "spindle", from: [76, 221], to: [78, 293], spread: 5, count: 7 },
  },
  {
    r: "rectus_femoris",
    d: "M 80 216 C 77 238, 77 264, 81 288 L 87 288 C 90 264, 90 240, 86 216 C 84 214, 82 214, 80 216 Z",
    fibres: { kind: "spindle", from: [83, 214], to: [84, 289], spread: 5, count: 8 },
  },
  {
    r: "vastus_medialis",
    d: "M 91 261 C 96 270, 97 286, 91 297 L 88 291 C 89 282, 90 272, 91 261 Z",
    fibres: { kind: "parallel", angle: 70, gap: 1.8 },
  },
  { r: null, d: KNEE },
  {
    r: "tibialis",
    d: "M 80 310 C 76 332, 78 358, 84 386 L 87 386 C 88 360, 87 334, 87 312 C 85 309, 82 309, 80 310 Z",
    fibres: { kind: "parallel", angle: 93, gap: 1.8 },
  },
  {
    r: "gastroc_lateral",
    d: "M 78 313 C 73 324, 72 338, 75 354 C 76 340, 77 326, 79 315 Z",
  },
  {
    r: "gastroc_medial",
    d: "M 91 310 C 97 326, 97 346, 92 368 L 89 366 C 89 346, 89 328, 89 312 Z",
    fibres: { kind: "spindle", from: [90, 308], to: [90, 368], spread: 3, count: 4 },
  },
  { r: null, d: FOOT },
];

export const BACK: Shape[] = [
  { r: null, d: HEAD, seamless: true },
  { r: null, d: NECK, seamless: true },
  {
    // Infraspinatus, in the fossa under the spine of the scapula.
    r: "rotator_cuff",
    d: "M 76 101 C 81 110, 85 120, 85 128 C 78 128, 70 124, 63 117 C 63 111, 66 105, 71 102 C 73 101, 75 101, 76 101 Z",
    fibres: { kind: "radial", at: [52, 110], step: 3 },
  },
  {
    // Teres major, from the scapula's lower tip to the arm.
    r: "rotator_cuff",
    d: "M 85 130 C 84 134, 80 136, 76 135 C 71 133, 66 129, 62 124 C 64 122, 66 121, 67 121 C 72 125, 79 129, 85 130 Z",
    fibres: { kind: "parallel", angle: 30, gap: 1.6 },
  },
  {
    r: "traps_upper",
    d: "M 100 54 L 100 88 C 88 89, 74 88, 60 84 C 72 80, 83 74, 90 66 C 94 62, 97 58, 100 54 Z",
    fibres: { kind: "radial", at: [62, 90], step: 4 },
  },
  {
    r: "traps_mid",
    d: "M 100 90 L 100 166 C 94 150, 87 130, 79 112 C 74 102, 68 94, 61 87 C 74 91, 88 92, 100 90 Z",
    fibres: { kind: "radial", at: [64, 92], step: 3 },
  },
  {
    r: "delt_side",
    d: "M 58 84 C 47 86, 41 97, 41 112 C 41 120, 43 126, 46 131 L 49 114 C 50 102, 53 93, 59 87 Z",
    fibres: { kind: "radial", at: [48, 134], step: 4 },
  },
  {
    r: "delt_rear",
    d: "M 59 87 C 53 93, 50 102, 49 114 L 46 131 C 54 122, 62 110, 70 98 C 67 92, 63 88, 59 87 Z",
    fibres: { kind: "radial", at: [47, 134], step: 4 },
  },
  {
    r: "lats",
    d: "M 90 146 C 92 164, 92 184, 92 200 C 86 204, 78 203, 72 195 C 68 178, 66 156, 64 130 C 70 136, 80 139, 87 135 C 88 138, 89 142, 90 146 Z",
    fibres: { kind: "radial", at: [58, 122], step: 3 },
  },
  {
    r: "erectors",
    d: "M 99 168 L 99 214 C 95 214, 92 210, 91 204 C 90 190, 91 178, 93 170 C 95 167, 97 167, 99 168 Z",
    fibres: { kind: "parallel", angle: 90, gap: 2 },
  },
  {
    r: "triceps",
    d: "M 58 118 C 61 134, 58 152, 51 168 L 42 166 C 39 148, 41 130, 47 116 C 51 114, 55 115, 58 118 Z",
    fibres: { kind: "spindle", from: [52, 115], to: [46, 168], spread: 8, count: 9 },
  },
  {
    r: "forearm_extensors",
    d: "M 50 172 C 49 188, 44 208, 39 226 L 28 224 C 29 204, 34 186, 41 168 C 45 168, 48 169, 50 172 Z",
    fibres: { kind: "spindle", from: [45, 168], to: [33, 226], spread: 6, count: 8 },
  },
  { r: null, d: HAND },
  {
    r: "glute_med",
    d: "M 69 206 C 73 199, 81 196, 90 199 C 86 205, 80 211, 74 218 C 71 214, 69 210, 69 206 Z",
    fibres: { kind: "radial", at: [72, 222], step: 5 },
  },
  {
    r: "glute_max",
    d: "M 99 205 L 99 246 C 92 252, 80 252, 72 244 C 68 234, 68 224, 74 219 C 80 212, 86 206, 92 201 C 95 201, 97 203, 99 205 Z",
    fibres: { kind: "parallel", angle: 140, gap: 3 },
  },
  {
    r: "ham_lateral",
    d: "M 74 250 C 70 268, 72 284, 78 298 L 84 298 C 82 280, 82 262, 84 252 C 81 250, 77 249, 74 250 Z",
    fibres: { kind: "spindle", from: [78, 249], to: [81, 298], spread: 4, count: 6 },
  },
  {
    r: "ham_medial",
    d: "M 85 252 C 83 264, 83 282, 85 298 L 92 296 C 96 280, 97 264, 96 250 C 92 252, 88 253, 85 252 Z",
    fibres: { kind: "spindle", from: [91, 250], to: [88, 297], spread: 5, count: 7 },
  },
  {
    r: "adductors",
    d: "M 97 250 C 98 256, 98 262, 97 270 C 96 264, 96 257, 97 250 Z",
  },
  { r: null, d: "M 81 300 C 81 296, 93 296, 93 300 C 93 304, 81 304, 81 300 Z" },
  {
    r: "gastroc_lateral",
    d: "M 84 306 C 76 316, 74 334, 79 352 L 85 354 C 84 338, 84 320, 85 306 Z",
    fibres: { kind: "spindle", from: [84, 305], to: [83, 354], spread: 4, count: 5 },
  },
  {
    r: "gastroc_medial",
    d: "M 86 306 C 96 314, 97 334, 91 355 L 86 354 C 85 338, 85 320, 86 306 Z",
    fibres: { kind: "spindle", from: [87, 305], to: [88, 355], spread: 5, count: 5 },
  },
  {
    r: "soleus",
    d: "M 79 354 C 80 366, 83 378, 86 390 L 90 390 C 92 376, 93 364, 91 356 C 87 357, 83 356, 79 354 Z",
    fibres: { kind: "parallel", angle: 95, gap: 2 },
  },
  { r: null, d: FOOT },
];

/** Bounding box of a path made of absolute coordinates. */
export function bounds(d: string): { x0: number; y0: number; x1: number; y1: number } {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]);
    x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]);
    y1 = Math.max(y1, n[i + 1]);
  }
  return { x0, y0, x1, y1 };
}

const f1 = (v: number) => Math.round(v * 10) / 10;

/** Fibre lines for a shape as one path. They overshoot the muscle and get clipped to it. */
export function fibrePath(f: Fibres, d: string): string {
  const b = bounds(d);
  const reach = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) + 40;
  const out: string[] = [];
  if (f.kind === "radial") {
    const step = ((f.step ?? 3) * Math.PI) / 180;
    for (let a = 0; a < Math.PI * 2; a += step) {
      out.push(`M ${f.at[0]} ${f.at[1]} L ${f1(f.at[0] + Math.cos(a) * reach)} ${f1(f.at[1] + Math.sin(a) * reach)}`);
    }
  } else if (f.kind === "parallel") {
    const gap = f.gap ?? 3;
    const a = (f.angle * Math.PI) / 180;
    const [dx, dy] = [Math.cos(a), Math.sin(a)];
    const [nx, ny] = [-dy, dx];
    const cx = (b.x0 + b.x1) / 2;
    const cy = (b.y0 + b.y1) / 2;
    for (let k = -reach; k <= reach; k += gap) {
      const px = cx + nx * k;
      const py = cy + ny * k;
      out.push(`M ${f1(px - dx * reach)} ${f1(py - dy * reach)} L ${f1(px + dx * reach)} ${f1(py + dy * reach)}`);
    }
  } else {
    const count = f.count ?? 7;
    const [ax, ay] = f.from;
    const [bx, by] = f.to;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const [nx, ny] = [-(by - ay) / len, (bx - ax) / len];
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    for (let i = 0; i < count; i++) {
      // -1..1 across the belly; the control point sits twice as far out so the curve's widest
      // point lands at `spread`.
      const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
      const off = t * f.spread * 2;
      out.push(`M ${ax} ${ay} Q ${f1(mx + nx * off)} ${f1(my + ny * off)} ${bx} ${by}`);
    }
  }
  return out.join(" ");
}
