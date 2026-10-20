import type { Muscle } from "@/lib/science/volume";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "smith"
  | "kettlebell"
  | "band"
  | "other";

export type Exercise = {
  id: string; // slug for built-ins, "custom-<uuid>" for custom
  name: string;
  primary: Muscle;
  secondary: Muscle[];
  equipment: Equipment;
  custom?: boolean;
};

// [slug, name, primary, secondary, equipment]. Add rows to grow the library; slugs must never change.
type Row = [string, string, Muscle, Muscle[], Equipment];
const rows: Row[] = [
  // chest
  ["bench-press", "Bench press", "chest", ["triceps", "front_delts"], "barbell"],
  ["incline-bench-press", "Incline bench press", "chest", ["front_delts", "triceps"], "barbell"],
  ["db-bench-press", "Dumbbell bench press", "chest", ["triceps", "front_delts"], "dumbbell"],
  ["incline-db-press", "Incline dumbbell press", "chest", ["front_delts", "triceps"], "dumbbell"],
  ["machine-chest-press", "Machine chest press", "chest", ["triceps", "front_delts"], "machine"],
  ["cable-fly", "Cable fly", "chest", ["front_delts"], "cable"],
  ["pec-deck", "Pec deck", "chest", [], "machine"],
  ["push-up", "Push-up", "chest", ["triceps", "front_delts", "abs"], "bodyweight"],
  ["dip", "Dip", "chest", ["triceps", "front_delts"], "bodyweight"],
  ["smith-incline-press", "Smith incline press", "chest", ["front_delts", "triceps"], "smith"],
  // shoulders
  ["overhead-press", "Overhead press", "front_delts", ["triceps", "side_delts"], "barbell"],
  ["db-shoulder-press", "Dumbbell shoulder press", "front_delts", ["triceps", "side_delts"], "dumbbell"],
  ["machine-shoulder-press", "Machine shoulder press", "front_delts", ["triceps", "side_delts"], "machine"],
  ["lateral-raise", "Lateral raise", "side_delts", [], "dumbbell"],
  ["cable-lateral-raise", "Cable lateral raise", "side_delts", [], "cable"],
  ["machine-lateral-raise", "Machine lateral raise", "side_delts", [], "machine"],
  ["rear-delt-fly", "Rear delt fly", "rear_delts", ["upper_back"], "dumbbell"],
  ["reverse-pec-deck", "Reverse pec deck", "rear_delts", ["upper_back"], "machine"],
  ["face-pull", "Face pull", "rear_delts", ["upper_back"], "cable"],
  ["upright-row", "Upright row", "side_delts", ["upper_back"], "barbell"],
  // back
  ["deadlift", "Deadlift", "hamstrings", ["glutes", "lower_back", "upper_back", "forearms"], "barbell"],
  ["pull-up", "Pull-up", "lats", ["biceps", "upper_back"], "bodyweight"],
  ["chin-up", "Chin-up", "lats", ["biceps"], "bodyweight"],
  ["lat-pulldown", "Lat pulldown", "lats", ["biceps", "upper_back"], "cable"],
  ["close-grip-pulldown", "Close-grip pulldown", "lats", ["biceps"], "cable"],
  ["barbell-row", "Barbell row", "upper_back", ["lats", "biceps", "rear_delts"], "barbell"],
  ["db-row", "Dumbbell row", "lats", ["upper_back", "biceps"], "dumbbell"],
  ["seated-cable-row", "Seated cable row", "upper_back", ["lats", "biceps"], "cable"],
  ["chest-supported-row", "Chest-supported row", "upper_back", ["lats", "rear_delts"], "machine"],
  ["t-bar-row", "T-bar row", "upper_back", ["lats", "biceps"], "barbell"],
  ["straight-arm-pulldown", "Straight-arm pulldown", "lats", [], "cable"],
  ["back-extension", "Back extension", "lower_back", ["glutes", "hamstrings"], "bodyweight"],
  ["shrug", "Shrug", "upper_back", ["forearms"], "dumbbell"],
  ["rack-pull", "Rack pull", "upper_back", ["lower_back", "glutes", "forearms"], "barbell"],
  // arms
  ["barbell-curl", "Barbell curl", "biceps", ["forearms"], "barbell"],
  ["db-curl", "Dumbbell curl", "biceps", ["forearms"], "dumbbell"],
  ["hammer-curl", "Hammer curl", "biceps", ["forearms"], "dumbbell"],
  ["incline-db-curl", "Incline dumbbell curl", "biceps", [], "dumbbell"],
  ["preacher-curl", "Preacher curl", "biceps", [], "machine"],
  ["cable-curl", "Cable curl", "biceps", ["forearms"], "cable"],
  ["ez-bar-curl", "EZ-bar curl", "biceps", ["forearms"], "barbell"],
  ["triceps-pushdown", "Triceps pushdown", "triceps", [], "cable"],
  ["overhead-triceps-extension", "Overhead triceps extension", "triceps", [], "cable"],
  ["skull-crusher", "Skull crusher", "triceps", [], "barbell"],
  ["close-grip-bench", "Close-grip bench press", "triceps", ["chest", "front_delts"], "barbell"],
  ["db-triceps-kickback", "Dumbbell kickback", "triceps", [], "dumbbell"],
  ["wrist-curl", "Wrist curl", "forearms", [], "dumbbell"],
  ["farmers-carry", "Farmer's carry", "forearms", ["upper_back", "abs"], "dumbbell"],
  // legs
  ["back-squat", "Back squat", "quads", ["glutes", "adductors", "lower_back"], "barbell"],
  ["front-squat", "Front squat", "quads", ["glutes", "upper_back"], "barbell"],
  ["hack-squat", "Hack squat", "quads", ["glutes"], "machine"],
  ["leg-press", "Leg press", "quads", ["glutes", "adductors"], "machine"],
  ["bulgarian-split-squat", "Bulgarian split squat", "quads", ["glutes", "adductors"], "dumbbell"],
  ["walking-lunge", "Walking lunge", "quads", ["glutes"], "dumbbell"],
  ["goblet-squat", "Goblet squat", "quads", ["glutes", "adductors"], "dumbbell"],
  ["leg-extension", "Leg extension", "quads", [], "machine"],
  ["smith-squat", "Smith squat", "quads", ["glutes"], "smith"],
  ["step-up", "Step-up", "quads", ["glutes"], "dumbbell"],
  ["romanian-deadlift", "Romanian deadlift", "hamstrings", ["glutes", "lower_back"], "barbell"],
  ["db-romanian-deadlift", "Dumbbell Romanian deadlift", "hamstrings", ["glutes"], "dumbbell"],
  ["lying-leg-curl", "Lying leg curl", "hamstrings", ["calves"], "machine"],
  ["seated-leg-curl", "Seated leg curl", "hamstrings", [], "machine"],
  ["nordic-curl", "Nordic curl", "hamstrings", [], "bodyweight"],
  ["good-morning", "Good morning", "hamstrings", ["lower_back", "glutes"], "barbell"],
  ["hip-thrust", "Hip thrust", "glutes", ["hamstrings"], "barbell"],
  ["glute-bridge", "Glute bridge", "glutes", ["hamstrings"], "bodyweight"],
  ["cable-kickback", "Cable glute kickback", "glutes", [], "cable"],
  ["hip-abduction", "Hip abduction", "glutes", [], "machine"],
  ["hip-adduction", "Hip adduction", "adductors", [], "machine"],
  ["sumo-deadlift", "Sumo deadlift", "glutes", ["adductors", "hamstrings", "quads", "lower_back"], "barbell"],
  ["kettlebell-swing", "Kettlebell swing", "glutes", ["hamstrings", "lower_back"], "kettlebell"],
  ["standing-calf-raise", "Standing calf raise", "calves", [], "machine"],
  ["seated-calf-raise", "Seated calf raise", "calves", [], "machine"],
  ["leg-press-calf-raise", "Leg press calf raise", "calves", [], "machine"],
  // core
  ["hanging-leg-raise", "Hanging leg raise", "abs", ["forearms"], "bodyweight"],
  ["cable-crunch", "Cable crunch", "abs", [], "cable"],
  ["ab-wheel", "Ab wheel rollout", "abs", ["lats"], "other"],
  ["plank", "Plank", "abs", [], "bodyweight"],
  ["crunch", "Crunch", "abs", [], "bodyweight"],
  ["pallof-press", "Pallof press", "abs", [], "cable"],
  ["decline-sit-up", "Decline sit-up", "abs", [], "bodyweight"],
];

export const BUILT_IN_EXERCISES: Exercise[] = rows.map(([id, name, primary, secondary, equipment]) => ({
  id,
  name,
  primary,
  secondary,
  equipment,
}));

/** Lifts that make up the DOTS total. */
export const DOTS_LIFTS = ["back-squat", "bench-press", "deadlift"] as const;
