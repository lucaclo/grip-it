import { cite } from "./citations";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export type EnergyInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
  bodyFatPct?: number | null;
  activity: ActivityLevel;
};

export type EnergyResult = {
  bmr: number;
  tdee: number;
  method: "katch_mcardle" | "mifflin_st_jeor";
  citationKeys: string[];
};

export function mifflinStJeor({ weightKg, heightCm, ageYears, sex }: EnergyInput): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === "male" ? 5 : -161);
}

export function katchMcArdle(weightKg: number, bodyFatPct: number): number {
  const leanKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanKg;
}

export function energy(input: EnergyInput): EnergyResult {
  const useLean = input.bodyFatPct != null && input.bodyFatPct > 0;
  const bmr = useLean ? katchMcArdle(input.weightKg, input.bodyFatPct!) : mifflinStJeor(input);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(bmr * ACTIVITY_FACTORS[input.activity]),
    method: useLean ? "katch_mcardle" : "mifflin_st_jeor",
    citationKeys: cite(useLean ? "katchmcardle" : "mifflin1990bmr"),
  };
}
