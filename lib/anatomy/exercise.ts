import type { Exercise } from "@/lib/data/exercises";
import type { Muscle } from "@/lib/science/volume";
import { BACK, FRONT } from "./geometry";
import { MUSCLE_REGIONS, REGION_LABEL, type Region } from "./regions";

export type View = "front" | "back";

/** Where a muscle is easiest to see, for when it shows on both sides. */
const MUSCLE_VIEW: Record<Muscle, View> = {
  chest: "front",
  front_delts: "front",
  side_delts: "front",
  rear_delts: "back",
  biceps: "front",
  triceps: "back",
  forearms: "front",
  upper_back: "back",
  lats: "back",
  lower_back: "back",
  abs: "front",
  glutes: "back",
  quads: "front",
  hamstrings: "back",
  calves: "back",
  adductors: "front",
};

export type Worked = { primary: Region[]; secondary: Region[]; view: View };

/**
 * The regions an exercise lights up. Its focus (or the whole primary muscle) glows; the rest of the
 * primary muscle and every secondary muscle show as secondary.
 */
export function workedRegions(ex: Pick<Exercise, "primary" | "secondary" | "focus">): Worked {
  const focused = !!ex.focus?.length;
  const primary = focused ? ex.focus! : MUSCLE_REGIONS[ex.primary];
  // "Upper back" is really separate muscles (upper traps, mid traps, rotator cuff): a shrug that
  // focuses on one doesn't work the others. Elsewhere the rest of the muscle still helps.
  const restOfPrimary = focused && ex.primary === "upper_back" ? [] : MUSCLE_REGIONS[ex.primary];
  const rest = [...restOfPrimary, ...ex.secondary.flatMap((m) => MUSCLE_REGIONS[m])];
  const secondary = [...new Set(rest)].filter((r) => !primary.includes(r));
  const count = (shapes: typeof FRONT) => shapes.filter((s) => s.r && primary.includes(s.r)).length;
  const f = count(FRONT);
  const b = count(BACK);
  const view = f === b ? MUSCLE_VIEW[ex.primary] : f > b ? "front" : "back";
  return { primary, secondary, view };
}

/** Plain-English list of what's worked, for screen readers and captions. */
export function workedLabel(w: Worked): string {
  const names = (rs: Region[]) => [...new Set(rs.map((r) => REGION_LABEL[r]))];
  const p = names(w.primary);
  const s = names(w.secondary);
  return `Mainly works ${list(p)}${s.length ? `; also ${list(s)}` : ""}`;
}

function list(xs: string[]) {
  const l = xs.map((x) => x.toLowerCase());
  return l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`;
}
