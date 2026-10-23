import type { Region } from "@/lib/anatomy/regions";
import { cite } from "./citations";
import type { Muscle } from "./volume";

/**
 * Grip variations: the same exercise held a different way. What the research says, in short:
 *
 * - Grip width and hand position change muscle emphasis a little, not a lot. Bench width barely
 *   moves chest activity (Saeterbakken 2017, Lehman 2005); pulldown width doesn't change the lats
 *   (Andersen 2014); pull-up hand positions work about the same muscles (Dickie 2017).
 * - The biggest real shift is in curls: palms down moves work to the brachioradialis (Kleiber 2015)
 *   and cuts elbow-flexion strength to about half (Kohn 2018).
 * - Grip changes the weight you can lift, so a target from one grip can't be reused as-is on
 *   another. `load` is the working weight compared with the usual grip; measured where a study
 *   compared loads, otherwise a cautious coaching estimate.
 * - Mixed, hook and straps change what gives out first, not the lift (`holdOnly`): they share the
 *   usual grip's targets and PRs.
 */
export type GripId =
  | "medium"
  | "wide"
  | "close"
  | "overhand"
  | "underhand"
  | "neutral"
  | "rope"
  | "double_overhand"
  | "mixed"
  | "hook"
  | "straps"
  | "snatch";

export type Grip = {
  id: GripId;
  label: string;
  /** What changes, in plain words. */
  effect: string;
  /** Typical working weight compared with the exercise's usual grip (1 = the same). */
  load: number;
  /** "measured": a study compared loads. "estimate": a cautious coaching figure. */
  loadSource: "measured" | "estimate";
  /** Muscle roles with this grip. Left out: the same as the exercise. */
  primary?: Muscle;
  secondary?: Muscle[];
  focus?: Region[];
  /** Only changes how you hold the bar: shares the usual grip's targets and PRs. */
  holdOnly?: boolean;
  citationKeys: string[];
};

const BENCH: Grip[] = [
  {
    id: "medium",
    label: "Medium",
    effect: "Hands a bit wider than shoulders. The usual grip, and the one your targets start from.",
    load: 1,
    loadSource: "measured",
    citationKeys: cite("saeterbakken2017bench"),
  },
  {
    id: "wide",
    label: "Wide",
    effect:
      "A little more lower chest and a little less triceps. Most people lift about the same as with a medium grip. Shorter press, more stress on the front of the shoulder.",
    load: 1,
    loadSource: "measured",
    focus: ["pec_sternal"],
    citationKeys: cite("saeterbakken2017bench", "lehman2005bench"),
  },
  {
    id: "close",
    label: "Close",
    effect:
      "Hands about shoulder-width: more triceps and upper chest, a little less lower chest. Expect roughly 6–11% less weight than medium.",
    load: 0.92,
    loadSource: "measured",
    secondary: ["triceps", "front_delts"],
    focus: ["pec_clavicular"],
    citationKeys: cite("saeterbakken2017bench", "lehman2005bench", "barnett1995bench"),
  },
  {
    id: "underhand",
    label: "Reverse",
    effect:
      "Palms toward you: more upper chest and biceps. Start about 10% lighter while you learn it, and use a spotter: the bar can roll out of an underhand grip.",
    load: 0.9,
    loadSource: "estimate",
    secondary: ["front_delts", "triceps", "biceps"],
    focus: ["pec_clavicular"],
    citationKeys: cite("lehman2005bench"),
  },
];

const PULL_UP: Grip[] = [
  {
    id: "overhand",
    label: "Overhand",
    effect: "Palms away, about shoulder-width or a little wider. The usual pull-up grip.",
    load: 1,
    loadSource: "measured",
    citationKeys: cite("dickie2017pullup"),
  },
  {
    id: "wide",
    label: "Wide",
    effect:
      "The lats work about the same as with a normal grip; it isn't a 'wider back' trick. Most people get slightly fewer reps, about 3% less load.",
    load: 0.97,
    loadSource: "measured",
    citationKeys: cite("andersen2014pulldown", "dickie2017pullup"),
  },
  {
    id: "neutral",
    label: "Neutral",
    effect:
      "Palms facing each other. Close to the same muscles as overhand, a little less middle trap. Often kinder to elbows and shoulders.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("dickie2017pullup"),
  },
  {
    id: "underhand",
    label: "Underhand",
    effect: "Palms toward you, as in a chin-up: more biceps and chest, less lower trap. Most people manage a rep or two more.",
    load: 1.03,
    loadSource: "estimate",
    secondary: ["biceps", "chest"],
    citationKeys: cite("youdas2010pullup", "dickie2017pullup"),
  },
];

const PULLDOWN: Grip[] = [
  {
    id: "medium",
    label: "Medium",
    effect: "Overhand, about one and a half shoulder-widths. The usual grip.",
    load: 1,
    loadSource: "measured",
    citationKeys: cite("andersen2014pulldown"),
  },
  {
    id: "wide",
    label: "Wide",
    effect: "The same lat work as medium, about 3–4% less weight. Pick it for comfort, not for a wider back.",
    load: 0.965,
    loadSource: "measured",
    citationKeys: cite("andersen2014pulldown", "lehman2004lats"),
  },
  {
    id: "close",
    label: "Close",
    effect: "Overhand, about shoulder-width. The same muscles and the same weight as medium.",
    load: 1,
    loadSource: "measured",
    citationKeys: cite("andersen2014pulldown"),
  },
  {
    id: "underhand",
    label: "Underhand",
    effect:
      "Palms toward you: the biceps take a bigger share of the work and the lats a slightly smaller one than with a wide overhand grip.",
    load: 1,
    loadSource: "estimate",
    secondary: ["biceps", "upper_back"],
    citationKeys: cite("lehman2004lats", "youdas2010pullup"),
  },
  {
    id: "neutral",
    label: "Neutral",
    effect: "Palms facing (a V-bar or parallel handles). Close to the same muscles as overhand.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("dickie2017pullup"),
  },
];

const ROW_UNDERHAND: Grip = {
  id: "underhand",
  label: "Underhand",
  effect:
    "Palms up, elbows tucked: more lats and biceps, a little less upper back. Coaching experience; few studies have measured it.",
  load: 1,
  loadSource: "estimate",
  primary: "lats",
  secondary: ["upper_back", "biceps", "rear_delts"],
  citationKeys: cite("gripcoaching", "lehman2004lats"),
};
const ROW_WIDE: Grip = {
  id: "wide",
  label: "Wide",
  effect:
    "Elbows flared out to the sides: more upper back and rear delts, less lats. Expect about 10% less weight. Coaching experience; little direct research.",
  load: 0.9,
  loadSource: "estimate",
  primary: "upper_back",
  secondary: ["rear_delts", "biceps"],
  focus: ["traps_mid"],
  citationKeys: cite("gripcoaching", "lehman2004lats"),
};

const BARBELL_ROW: Grip[] = [
  {
    id: "overhand",
    label: "Overhand",
    effect: "Palms down, about shoulder-width or a little wider. The usual grip.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("gripcoaching"),
  },
  ROW_UNDERHAND,
  ROW_WIDE,
];

const CABLE_ROW: Grip[] = [
  {
    id: "neutral",
    label: "Neutral",
    effect: "Palms facing (a V-handle). The usual grip.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("gripcoaching"),
  },
  {
    id: "overhand",
    label: "Overhand",
    effect: "A straight bar, palms down at shoulder-width: nearly the same as neutral, a touch more upper back.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("gripcoaching", "lehman2004lats"),
  },
  ROW_UNDERHAND,
  ROW_WIDE,
];

const CURL_OVERHAND: Grip = {
  id: "overhand",
  label: "Reverse",
  effect:
    "Palms down: the brachioradialis (top of the forearm) takes over much of the work. You're far weaker this way (about half the force in testing), so expect roughly 30% less weight.",
  load: 0.7,
  loadSource: "estimate",
  primary: "forearms",
  secondary: ["biceps"],
  focus: ["brachioradialis"],
  citationKeys: cite("kleiber2015curl", "kohn2018forearm"),
};
const CURL_UNDERHAND: Grip = {
  id: "underhand",
  label: "Underhand",
  effect: "Palms up. The usual curl grip, and the best position for the biceps.",
  load: 1,
  loadSource: "measured",
  citationKeys: cite("kleiber2015curl"),
};

const BAR_CURL: Grip[] = [CURL_UNDERHAND, CURL_OVERHAND];

const DB_CURL: Grip[] = [
  CURL_UNDERHAND,
  {
    id: "neutral",
    label: "Hammer",
    effect:
      "Palms facing: your strongest curling position, so most people can add a little weight. Brings in the brachialis and the forearm.",
    load: 1.1,
    loadSource: "estimate",
    secondary: ["forearms"],
    focus: ["brachialis", "biceps", "brachioradialis"],
    citationKeys: cite("kohn2018forearm", "kleiber2015curl"),
  },
  CURL_OVERHAND,
];

const PUSHDOWN: Grip[] = [
  {
    id: "overhand",
    label: "Bar",
    effect: "A straight or angled bar, palms down. The usual grip.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("gripcoaching"),
  },
  {
    id: "rope",
    label: "Rope",
    effect:
      "Spread the rope at the bottom for a full lockout. The same muscle, about 10% less weight than a bar.",
    load: 0.9,
    loadSource: "estimate",
    citationKeys: cite("gripcoaching"),
  },
  {
    id: "underhand",
    label: "Reverse",
    effect: "Palms up. Still all triceps, but the weaker grip limits you: expect about 20% less weight.",
    load: 0.8,
    loadSource: "estimate",
    secondary: ["forearms"],
    citationKeys: cite("gripcoaching"),
  },
];

/** Ways of holding a heavy bar. They change what gives out first, not the muscles. */
const HOLD: Grip[] = [
  {
    id: "double_overhand",
    label: "Overhand",
    effect: "Both palms down. Your grip usually fails first, which trains the forearms.",
    load: 1,
    loadSource: "estimate",
    citationKeys: cite("gripcoaching"),
  },
  {
    id: "mixed",
    label: "Mixed",
    effect:
      "One palm up, one down, so the bar can't roll out of your hands. The same muscles. Swap which hand is up from set to set: the palm-up arm's biceps is under strain.",
    load: 1,
    loadSource: "estimate",
    holdOnly: true,
    citationKeys: cite("gripcoaching"),
  },
  {
    id: "hook",
    label: "Hook",
    effect: "Thumb wrapped under your fingers. As secure as mixed with both palms down. Painful at first.",
    load: 1,
    loadSource: "estimate",
    holdOnly: true,
    citationKeys: cite("gripcoaching"),
  },
  {
    id: "straps",
    label: "Straps",
    effect: "Straps hold the bar for you. Everything else works the same; your forearms do less.",
    load: 1,
    loadSource: "estimate",
    holdOnly: true,
    citationKeys: cite("gripcoaching"),
  },
];

const PULL_FROM_FLOOR: Grip[] = [
  ...HOLD,
  {
    id: "snatch",
    label: "Snatch grip",
    effect:
      "Hands very wide: you start lower, so more upper back and hamstrings. Expect about 15% less weight.",
    load: 0.85,
    loadSource: "estimate",
    focus: ["ham_lateral", "ham_medial"],
    citationKeys: cite("gripcoaching"),
  },
];

/** Built-in exercise slug -> its grip options. The first option is the usual grip. */
const BY_EXERCISE: Record<string, Grip[]> = {
  "bench-press": BENCH,
  "incline-bench-press": BENCH,
  "decline-bench-press": BENCH,
  "smith-incline-press": BENCH,
  "floor-press": BENCH,
  "pull-up": PULL_UP,
  "assisted-pull-up": PULL_UP,
  "lat-pulldown": PULLDOWN,
  "barbell-row": BARBELL_ROW,
  "pendlay-row": BARBELL_ROW,
  "t-bar-row": BARBELL_ROW,
  "inverted-row": BARBELL_ROW,
  "seated-cable-row": CABLE_ROW,
  "machine-row": CABLE_ROW,
  "barbell-curl": BAR_CURL,
  "ez-bar-curl": BAR_CURL,
  "cable-curl": BAR_CURL,
  "preacher-curl": BAR_CURL,
  "db-curl": DB_CURL,
  "incline-db-curl": DB_CURL,
  "concentration-curl": DB_CURL,
  "triceps-pushdown": PUSHDOWN,
  deadlift: PULL_FROM_FLOOR,
  "romanian-deadlift": PULL_FROM_FLOOR,
  "stiff-leg-deadlift": PULL_FROM_FLOOR,
  "rack-pull": HOLD,
  "sumo-deadlift": HOLD,
  "trap-bar-deadlift": HOLD.filter((g) => g.id !== "mixed" && g.id !== "hook"),
  shrug: HOLD.filter((g) => g.id === "double_overhand" || g.id === "straps"),
  "barbell-shrug": HOLD,
};

/** Grip options for an exercise, usual grip first. Empty when grip doesn't apply. */
export function gripsFor(exerciseId: string): Grip[] {
  return BY_EXERCISE[exerciseId] ?? [];
}

/** The grip as logged, or the exercise's usual grip when none was picked (or the id is unknown). */
export function gripOf(exerciseId: string, grip: string | null | undefined): Grip | null {
  const list = gripsFor(exerciseId);
  return list.find((g) => g.id === grip) ?? list[0] ?? null;
}

/** True when this grip is the exercise's usual one (or grip doesn't apply). */
export function isUsualGrip(exerciseId: string, grip: string | null | undefined): boolean {
  const g = gripOf(exerciseId, grip);
  return !g || g === gripsFor(exerciseId)[0];
}

/**
 * Which grips count as the same lift for targets and PRs: holding the bar differently (mixed,
 * hook, straps) is the usual grip; a different width or hand position is its own variant.
 */
export function gripVariant(exerciseId: string, grip: string | null | undefined): string {
  const g = gripOf(exerciseId, grip);
  if (!g || g.holdOnly || g === gripsFor(exerciseId)[0]) return exerciseId;
  return `${exerciseId}@${g.id}`;
}

/** Working weight with this grip compared with the usual grip. */
export function gripLoad(exerciseId: string, grip: string | null | undefined): number {
  return gripOf(exerciseId, grip)?.load ?? 1;
}

/** The exercise's muscles with this grip: roles and focus swapped in where the grip changes them. */
export function withGrip<T extends { id: string; primary: Muscle; secondary: Muscle[]; focus?: Region[] }>(
  def: T,
  grip: string | null | undefined,
): T {
  const g = gripOf(def.id, grip);
  if (!g || isUsualGrip(def.id, grip)) return def;
  let secondary = g.secondary ?? def.secondary;
  // Straps take the forearms out of a pull.
  if (g.id === "straps") secondary = secondary.filter((m) => m !== "forearms");
  const primary = g.primary ?? def.primary;
  return {
    ...def,
    primary,
    secondary: secondary.filter((m) => m !== primary),
    focus: g.focus ?? (g.primary ? undefined : def.focus),
  };
}

/** "About 8% lighter", "About the same weight", "About 10% heavier". */
export function loadLabel(g: Grip): string {
  const pct = Math.round((g.load - 1) * 100);
  if (Math.abs(pct) < 2) return "About the same weight";
  return `About ${Math.abs(pct)}% ${pct < 0 ? "lighter" : "heavier"}`;
}

/** "Close grip", "Straps": a short tag for a logged grip, or null for the usual one. */
export function gripTag(exerciseId: string, grip: string | null | undefined): string | null {
  if (isUsualGrip(exerciseId, grip)) return null;
  const g = gripOf(exerciseId, grip)!;
  return g.id === "straps" || /grip$/i.test(g.label) ? g.label : `${g.label} grip`;
}
