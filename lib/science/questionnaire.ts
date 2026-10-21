import type { Experience, Goal } from "./targets";

/** "Help me choose": six questions that recommend a goal, experience level and sessions per week. */

export type Answers = {
  years?: "lt6m" | "6to12m" | "1to3y" | "3to5y" | "5yplus";
  progress?: "most_sessions" | "every_few_weeks" | "months";
  aim?: "size" | "strength" | "both" | "lose_fat" | "lose_and_gain" | "health";
  bodyFat?: "lose_lot" | "lose_bit" | "happy" | "gain";
  days?: 2 | 3 | 4 | 5 | 6;
  reps?: "heavy" | "moderate" | "higher" | "no_pref";
};

type Option<K extends keyof Answers> = { value: NonNullable<Answers[K]>; label: string; hint?: string };
export type Question<K extends keyof Answers = keyof Answers> = { key: K; title: string; options: Option<K>[] };

export const QUESTIONS: Question[] = [
  {
    key: "years",
    title: "How long have you been lifting consistently?",
    options: [
      { value: "lt6m", label: "Less than 6 months" },
      { value: "6to12m", label: "6–12 months" },
      { value: "1to3y", label: "1–3 years" },
      { value: "3to5y", label: "3–5 years" },
      { value: "5yplus", label: "5+ years" },
    ],
  },
  {
    key: "progress",
    title: "How often can you still add weight or reps to your main lifts?",
    options: [
      { value: "most_sessions", label: "Most sessions", hint: "Numbers go up nearly every time" },
      { value: "every_few_weeks", label: "Every few weeks" },
      { value: "months", label: "It takes months", hint: "Progress is slow and hard-won" },
    ],
  },
  {
    key: "aim",
    title: "What do you want most right now?",
    options: [
      { value: "size", label: "Look bigger", hint: "More muscle" },
      { value: "strength", label: "Lift heavier", hint: "Bigger numbers on the bar" },
      { value: "both", label: "Both, bigger and stronger" },
      { value: "lose_fat", label: "Lose fat" },
      { value: "lose_and_gain", label: "Lose fat and build muscle" },
      { value: "health", label: "Feel fit and healthy" },
    ],
  },
  {
    key: "bodyFat",
    title: "How do you feel about your body fat?",
    options: [
      { value: "lose_lot", label: "I want to lose a lot" },
      { value: "lose_bit", label: "I'd like to lose a bit" },
      { value: "happy", label: "I'm happy with it" },
      { value: "gain", label: "I'm happy to gain some weight" },
    ],
  },
  {
    key: "days",
    title: "How many days a week can you realistically train?",
    options: [
      { value: 2, label: "2 days" },
      { value: 3, label: "3 days" },
      { value: 4, label: "4 days" },
      { value: 5, label: "5 days" },
      { value: 6, label: "6 days" },
    ],
  },
  {
    key: "reps",
    title: "Which sets do you enjoy most?",
    options: [
      { value: "heavy", label: "Heavy, low reps", hint: "3–6 reps" },
      { value: "moderate", label: "Moderate", hint: "6–12 reps" },
      { value: "higher", label: "Lighter, higher reps", hint: "12–20 reps" },
      { value: "no_pref", label: "No preference" },
    ],
  },
] as Question[];

const LEVELS: Experience[] = ["novice", "beginner", "intermediate", "advanced", "elite"];
const YEARS_LEVEL: Record<NonNullable<Answers["years"]>, number> = { lt6m: 0, "6to12m": 1, "1to3y": 2, "3to5y": 3, "5yplus": 4 };

export type Recommendation = {
  goal: Goal;
  experience: Experience;
  sessionsPerWeek: number;
  reasons: string[];
};

export function recommend(a: Answers): Recommendation {
  const reasons: string[] = [];

  // Experience: years trained, nudged one level by how fast you still progress.
  let level = YEARS_LEVEL[a.years ?? "6to12m"];
  if (a.progress === "most_sessions" && level >= 2) {
    level -= 1;
    reasons.push("You still add weight most sessions, so you're progressing like someone earlier in their training.");
  } else if (a.progress === "months" && level <= 3) {
    level += 1;
    reasons.push("Progress taking months is a sign you're further along than your years suggest.");
  }
  const experience = LEVELS[Math.max(0, Math.min(4, level))];

  // Goal: what you want, checked against how you feel about body fat and the reps you enjoy.
  let goal: Goal;
  const wantsFatOff = a.bodyFat === "lose_lot" || a.bodyFat === "lose_bit";
  switch (a.aim) {
    case "strength":
      goal = a.reps === "higher" ? "powerbuilding" : "strength";
      reasons.push(
        goal === "strength"
          ? "You want bigger numbers, so training focuses on heavier 3–6 rep sets."
          : "You want strength but enjoy higher reps, so a mix of heavy and moderate sets fits best.",
      );
      break;
    case "both":
      goal = "powerbuilding";
      reasons.push("Bigger and stronger: heavier compound sets plus moderate-rep work for size.");
      break;
    case "lose_fat":
      if (wantsFatOff) {
        goal = "fat_loss";
        reasons.push("You want fat off, so you'll eat in a deficit with high protein to keep your muscle.");
      } else {
        goal = "recomp";
        reasons.push("You want to lose fat but you're mostly happy with your body fat, so a gentle recomp suits you better than a diet.");
      }
      break;
    case "lose_and_gain":
      if (a.bodyFat === "lose_lot" && level >= 2) {
        goal = "fat_loss";
        reasons.push("With a lot of fat to lose and some training behind you, a proper fat-loss phase first gets results fastest.");
      } else {
        goal = "recomp";
        reasons.push("Recomp: a small deficit with high protein lets you lose fat while still building muscle.");
      }
      break;
    case "health":
      goal = a.bodyFat === "lose_lot" ? "fat_loss" : "fitness";
      reasons.push(
        goal === "fitness"
          ? "Staying fit: balanced training around maintenance calories, with slightly higher reps."
          : "Losing some fat is the biggest health win for you right now, with training to keep your muscle.",
      );
      break;
    case "size":
    default:
      if (a.bodyFat === "lose_lot") {
        goal = "recomp";
        reasons.push("You want more muscle but also want to lose a lot of fat, so recomp builds muscle without adding fat.");
      } else if (a.reps === "heavy") {
        goal = "powerbuilding";
        reasons.push("You want size but love heavy sets, so heavier work is mixed in alongside size training.");
      } else {
        goal = "hypertrophy";
        reasons.push("You want more muscle, so training focuses on 6–12 rep sets taken close to failure and a small surplus.");
      }
  }
  if ((experience === "novice" || experience === "beginner") && (goal === "hypertrophy" || goal === "recomp")) {
    reasons.push("Newer lifters build muscle fastest, so expect quick progress early on.");
  }

  const sessionsPerWeek = a.days ?? 3;
  reasons.push(
    sessionsPerWeek <= 2
      ? "Two sessions a week can work well with full-body workouts that hit each muscle twice."
      : `${sessionsPerWeek} sessions a week lets you train each muscle about twice a week, which tends to beat once.`,
  );

  return { goal, experience, sessionsPerWeek, reasons };
}
