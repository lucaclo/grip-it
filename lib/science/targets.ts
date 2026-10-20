import { cite } from "./citations";
import { energy, type EnergyInput } from "./energy";

export type Goal = "hypertrophy" | "strength" | "fat_loss";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Difficulty = "easy" | "moderate" | "hard";

const KCAL_PER_KG = 7700;

/** Recommended weekly change as a fraction of body weight. Gains slow down with experience. */
const GAIN_RATE: Record<Experience, number> = { beginner: 0.005, intermediate: 0.0035, advanced: 0.0025 };
const LOSS_RATE: Record<Experience, number> = { beginner: 0.0075, intermediate: 0.0065, advanced: 0.005 };
const MAX_GAIN_RATE = 0.005;
const MAX_LOSS_RATE = 0.01;

export type TargetsInput = EnergyInput & {
  goal: Goal;
  experience: Experience;
  targetWeightKg: number;
  targetDate?: string | null; // YYYY-MM-DD
  today?: string; // YYYY-MM-DD, injectable for tests
};

export type TargetsResult = {
  kcal: number;
  proteinG: number;
  proteinBasis: string;
  tdee: number;
  bmr: number;
  method: "katch_mcardle" | "mifflin_st_jeor";
  direction: "gain" | "lose" | "maintain";
  weeklyRateKg: number; // signed
  weeks: number | null;
  projectedDate: string | null;
  difficulty: Difficulty;
  unrealistic: boolean;
  floored: boolean;
  notes: string[];
  citationKeys: string[];
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000;
}

export function protein(
  weightKg: number,
  goal: Goal,
  bodyFatPct?: number | null,
): { grams: number; basis: string; citationKeys: string[] } {
  if (goal === "fat_loss" && bodyFatPct) {
    const lean = weightKg * (1 - bodyFatPct / 100);
    return {
      grams: Math.round(lean * 2.6),
      basis: "2.6 g per kg of lean mass (dieting)",
      citationKeys: cite("helms2014prep"),
    };
  }
  if (goal === "fat_loss") {
    return {
      grams: Math.round(weightKg * 2.2),
      basis: "2.2 g per kg of body weight (dieting)",
      citationKeys: cite("morton2018protein", "helms2014prep"),
    };
  }
  return {
    grams: Math.round(weightKg * 1.6),
    basis: "1.6 g per kg of body weight (up to 2.2 is fine)",
    citationKeys: cite("morton2018protein"),
  };
}

export function targets(input: TargetsInput): TargetsResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const e = energy(input);
  const p = protein(input.weightKg, input.goal, input.bodyFatPct);
  const notes: string[] = [];
  const keys = new Set([...e.citationKeys, ...p.citationKeys]);

  const diff = input.targetWeightKg - input.weightKg;
  let direction: TargetsResult["direction"] =
    Math.abs(diff) < 0.5 ? "maintain" : diff > 0 ? "gain" : "lose";

  if (input.goal === "fat_loss" && direction === "gain") {
    notes.push("Your target weight is above your current weight, so we've set maintenance instead of a deficit.");
    direction = "maintain";
  }
  if (input.goal === "hypertrophy" && direction === "lose") {
    notes.push("Losing weight while building muscle is slow. We've planned a gentle deficit and high protein.");
  }

  const recommendedRate =
    direction === "gain"
      ? GAIN_RATE[input.experience]
      : direction === "lose"
        ? LOSS_RATE[input.experience] * (input.goal === "hypertrophy" ? 0.6 : 1)
        : 0;
  if (direction === "gain") keys.add("iraki2019offseason");
  if (direction === "lose") keys.add("helms2014prep");

  let weeklyRateKg = recommendedRate * input.weightKg * (direction === "lose" ? -1 : 1);
  let weeks = direction === "maintain" ? null : Math.abs(diff) / Math.abs(weeklyRateKg);
  let projectedDate = weeks == null ? null : addDays(today, weeks * 7);
  let unrealistic = false;
  let difficulty: Difficulty = "moderate";

  if (input.targetDate && direction !== "maintain") {
    const weeksAvailable = daysBetween(today, input.targetDate) / 7;
    const maxRate = direction === "gain" ? MAX_GAIN_RATE : MAX_LOSS_RATE;
    const requiredRate = weeksAvailable > 0 ? Math.abs(diff) / weeksAvailable / input.weightKg : Infinity;
    if (requiredRate > maxRate) {
      unrealistic = true;
      notes.push(
        `Reaching ${input.targetWeightKg} kg by ${input.targetDate} needs a faster rate than the research supports. We suggest ${projectedDate}.`,
      );
    } else {
      // The user's date is achievable: plan to it, at their pace.
      weeklyRateKg = (diff / weeksAvailable) * 1;
      weeks = weeksAvailable;
      projectedDate = input.targetDate;
      difficulty = requiredRate / maxRate < 0.6 ? "easy" : "moderate";
    }
  }
  if (unrealistic) difficulty = "hard";
  if (!input.targetDate && input.experience === "advanced" && direction === "gain") difficulty = "hard";
  if (!input.targetDate && input.experience === "beginner") difficulty = direction === "maintain" ? "easy" : "moderate";

  let kcal = Math.round(e.tdee + (weeklyRateKg * KCAL_PER_KG) / 7);
  let floored = false;
  if (kcal < e.bmr) {
    kcal = e.bmr;
    floored = true;
    notes.push("We never set calories below your resting energy use, so your timeline will be a little longer.");
  }

  return {
    kcal,
    proteinG: p.grams,
    proteinBasis: p.basis,
    tdee: e.tdee,
    bmr: e.bmr,
    method: e.method,
    direction,
    weeklyRateKg: Math.round(weeklyRateKg * 100) / 100,
    weeks: weeks == null ? null : Math.ceil(weeks),
    projectedDate,
    difficulty,
    unrealistic,
    floored,
    notes,
    citationKeys: [...keys],
  };
}
