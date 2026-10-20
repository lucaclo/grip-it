import { cite } from "./citations";
import type { Sex } from "./energy";

/** Epley estimated 1RM. Only trusted for 1–12 reps; returns null outside that. */
export function e1rm(kg: number, reps: number): number | null {
  if (reps < 1 || reps > 12 || kg <= 0) return null;
  if (reps === 1) return kg;
  return Math.round(kg * (1 + reps / 30) * 10) / 10;
}
export const E1RM_CITATIONS = cite("epley1985");

// DOTS polynomial coefficients (a x^4 + b x^3 + c x^2 + d x + e). Verify against the federation
// formula sheet in issue #51 before relying on exact values.
const DOTS = {
  male: [-0.000001093, 0.0007391293, -0.1918759221, 24.0900756, -307.75076],
  female: [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288],
} as const;

export function dots(totalKg: number, bodyWeightKg: number, sex: Sex): number {
  const [a, b, c, d, e] = DOTS[sex];
  const x = Math.min(Math.max(bodyWeightKg, 40), sex === "male" ? 210 : 150);
  const denom = a * x ** 4 + b * x ** 3 + c * x ** 2 + d * x + e;
  return Math.round(((totalKg * 500) / denom) * 10) / 10;
}
export const DOTS_CITATIONS = cite("dots");
