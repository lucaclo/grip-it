"use client";

import { ArrowLeft, Dumbbell, Flame, Gauge, Lock, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Citations } from "@/components/ui/bits";
import { NumberField, Segmented, TextField, Toggle } from "@/components/ui/fields";
import { targetsFor } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { Profile } from "@/lib/data/types";
import type { ActivityLevel, Sex } from "@/lib/science/energy";
import type { Experience, Goal } from "@/lib/science/targets";

const GOALS: { value: Goal; title: string; body: string }[] = [
  { value: "hypertrophy", title: "Build muscle", body: "Hypertrophy: grow size with 6–12 rep sets and a small surplus." },
  { value: "strength", title: "Get stronger", body: "Strength: heavier 3–6 rep sets, eating around maintenance." },
  { value: "fat_loss", title: "Lose fat", body: "Keep your muscle while dieting, with high protein." },
];
const EXPERIENCE: { value: Experience; label: string; body: string }[] = [
  { value: "beginner", label: "Beginner", body: "Under 1 year of consistent lifting. Fastest gains." },
  { value: "intermediate", label: "Intermediate", body: "1–3 years. Progress is steady but slower." },
  { value: "advanced", label: "Advanced", body: "3+ years. Gains are slow, so timelines are longer." },
];
const ACTIVITY: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Desk job, little walking" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "active", label: "Active job or lots of sport" },
  { value: "very_active", label: "Very active" },
];

export default function Onboarding() {
  const router = useRouter();
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);

  const [name, setName] = useState("");
  const [heightCm, setHeight] = useState<number | null>(null);
  const [weightKg, setWeight] = useState<number | null>(null);
  const [sex, setSex] = useState<Sex>("male");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [bodyFatPct, setBf] = useState<number | null>(null);

  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [experience, setExperience] = useState<Experience>("beginner");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [targetWeightKg, setTargetWeight] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [sessionsPerWeek, setSessions] = useState(3);
  const [rirEnabled, setRir] = useState(false);
  const [sample, setSample] = useState(true);

  const age = birthYear ? new Date().getFullYear() - birthYear : null;
  const errors = {
    name: !name.trim() ? "Add a name your friends will recognise" : null,
    height: heightCm == null || heightCm < 100 || heightCm > 250 ? "Enter your height in cm (100–250)" : null,
    weight: weightKg == null || weightKg < 30 || weightKg > 300 ? "Enter your weight in kg (30–300)" : null,
    birthYear: birthYear == null || birthYear < 1900 || birthYear > new Date().getFullYear() ? "Enter the year you were born" : null,
    bf: bodyFatPct != null && (bodyFatPct < 3 || bodyFatPct > 60) ? "Body fat should be between 3 and 60%" : null,
    target: targetWeightKg == null || targetWeightKg < 30 || targetWeightKg > 300 ? "Enter a target weight in kg" : null,
  };
  const under16 = age != null && age < 16;

  const profile = useMemo<Omit<Profile, "id" | "onboardedAt"> | null>(() => {
    if (!heightCm || !birthYear || !targetWeightKg) return null;
    return {
      name: name.trim(),
      heightCm,
      sex,
      birthYear,
      bodyFatPct,
      activity,
      goal,
      experience,
      targetWeightKg,
      targetDate: targetDate || null,
      rirEnabled,
      sessionsPerWeek,
      shareWeight: false,
      shareNutrition: false,
    };
  }, [name, heightCm, sex, birthYear, bodyFatPct, activity, goal, experience, targetWeightKg, targetDate, rirEnabled, sessionsPerWeek]);
  const plan = profile && weightKg ? targetsFor({ ...profile, id: "me", onboardedAt: "" }, weightKg) : null;

  function next() {
    setTried(true);
    const stepErrors =
      step === 0
        ? [errors.name, errors.height, errors.weight, errors.birthYear, errors.bf]
        : step === 1
          ? [errors.target]
          : [];
    if (stepErrors.some(Boolean)) return;
    setTried(false);
    if (step < 2) setStep(step + 1);
    else if (profile && weightKg) {
      complete(profile, weightKg, sample);
      router.replace("/home");
    }
  }
  const show = (e: string | null) => (tried ? e : null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-safe pb-safe">
      <div className="flex items-center gap-2 pt-4">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} aria-label="Back" className="grid size-11 place-items-center rounded-full text-muted">
            <ArrowLeft aria-hidden className="size-5" />
          </button>
        ) : (
          <span className="size-11" />
        )}
        <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand shadow-glow" : "bg-surface-raised"}`} />
          ))}
        </div>
        <span className="size-11" />
      </div>

      {step === 0 && (
        <section className="flex flex-1 flex-col gap-4 pt-6">
          <div>
            <h1 className="text-brand font-display text-display font-bold uppercase leading-none">About you</h1>
            <p className="mt-2 text-muted">We use this to set your calorie and protein targets.</p>
          </div>
          <TextField label="Display name" value={name} onChange={setName} placeholder="What your friends call you" error={show(errors.name)} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Height" unit="cm" value={heightCm} onChange={setHeight} error={show(errors.height)} />
            <NumberField label="Weight" unit="kg" decimal value={weightKg} onChange={setWeight} error={show(errors.weight)} />
          </div>
          <Segmented
            label="Sex (used by the energy formulas)"
            value={sex}
            onChange={setSex}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Year of birth" value={birthYear} onChange={setBirthYear} error={show(errors.birthYear)} />
            <NumberField label="Body fat" unit="%" optional decimal value={bodyFatPct} onChange={setBf} error={show(errors.bf)} />
          </div>
          <p className="flex gap-2 rounded-md bg-surface p-3 text-sm text-muted">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
            Your body stats stay private. Friends only see your lifts unless you choose to share more.
          </p>
          {under16 && (
            <p className="flex gap-2 rounded-md border border-warning/40 p-3 text-sm text-warning">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              Calorie targets aren&apos;t designed for under-16s. Talk to a parent or doctor before dieting or bulking.
            </p>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-1 flex-col gap-5 pt-6">
          <div>
            <h1 className="text-brand font-display text-display font-bold uppercase leading-none">Your goal</h1>
            <p className="mt-2 text-muted">You can switch any time in settings.</p>
          </div>
          <div role="radiogroup" aria-label="Goal" className="flex flex-col gap-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                role="radio"
                aria-checked={goal === g.value}
                onClick={() => setGoal(g.value)}
                className={`rounded-md border p-3 text-left transition-colors ${goal === g.value ? "border-accent/70 bg-surface-raised shadow-glow" : "border-border bg-surface/80"}`}
              >
                <span className={`block font-display text-lg font-semibold ${goal === g.value ? "text-accent" : ""}`}>{g.title}</span>
                <span className="block text-sm text-muted">{g.body}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Target weight" unit="kg" decimal value={targetWeightKg} onChange={setTargetWeight} error={show(errors.target)} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tdate" className="text-sm font-medium text-muted">
                By <span className="text-subtle">(optional)</span>
              </label>
              <input
                id="tdate"
                type="date"
                value={targetDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setTargetDate(e.target.value)}
                className="min-h-12 rounded-md border border-border-input bg-surface px-3 text-base outline-none focus:border-focus"
              />
            </div>
          </div>
          <Segmented
            label="Experience"
            value={experience}
            onChange={setExperience}
            options={EXPERIENCE.map((e) => ({ value: e.value, label: e.label }))}
          />
          <p className="-mt-3 text-sm text-subtle">{EXPERIENCE.find((e) => e.value === experience)?.body}</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity" className="text-sm font-medium text-muted">
              Activity outside the gym
            </label>
            <select
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="min-h-12 rounded-md border border-border-input bg-surface px-3 text-base"
            >
              {ACTIVITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <NumberField label="Gym sessions per week" value={sessionsPerWeek} onChange={(v) => setSessions(Math.min(7, Math.max(1, v ?? 3)))} step={1} min={1} max={7} />
        </section>
      )}

      {step === 2 && plan && (
        <section className="flex flex-1 flex-col gap-4 pt-6">
          <div>
            <h1 className="text-brand font-display text-display font-bold uppercase leading-none">Your plan</h1>
            <p className="mt-2 text-muted">Based on published research. Tap a source to read it.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <Flame aria-hidden className="size-5 text-accent" />
              <p className="mt-2 tabular text-stat font-semibold">{under16 ? "—" : plan.kcal}</p>
              <p className="text-sm text-muted">kcal per day</p>
            </Card>
            <Card>
              <Dumbbell aria-hidden className="size-5 text-accent" />
              <p className="mt-2 tabular text-stat font-semibold">{plan.proteinG} g</p>
              <p className="text-sm text-muted">protein per day</p>
            </Card>
          </div>
          <Card>
            <div className="flex items-center gap-2">
              <Gauge aria-hidden className="size-5 text-accent" />
              <p className="font-display text-lg font-semibold">
                {plan.direction === "maintain"
                  ? "Maintain your weight"
                  : `${plan.weeklyRateKg > 0 ? "+" : ""}${plan.weeklyRateKg} kg per week`}
              </p>
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${plan.difficulty === "hard" ? "bg-danger text-on-danger" : plan.difficulty === "moderate" ? "bg-warning text-on-pr" : "bg-success text-on-accent"}`}
              >
                {plan.difficulty}
              </span>
            </div>
            {plan.projectedDate && (
              <p className="mt-2 text-muted">
                Reach <span className="text-text">{targetWeightKg} kg</span> around{" "}
                <span className="text-text">{new Date(plan.projectedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>{" "}
                ({plan.weeks} weeks).
              </p>
            )}
            <p className="mt-2 text-sm text-subtle">
              Maintenance ≈ {plan.tdee} kcal ({plan.method === "katch_mcardle" ? "Katch-McArdle, from your body fat" : "Mifflin-St Jeor"}). Protein: {plan.proteinBasis}.
            </p>
            {plan.notes.map((n) => (
              <p key={n} className={`mt-2 flex gap-2 text-sm ${plan.unrealistic ? "text-warning" : "text-muted"}`}>
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {n}
              </p>
            ))}
          </Card>
          <Citations keys={plan.citationKeys} />
          <Card>
            <Toggle label="Log RIR (reps in reserve)" description="Optional. How many more reps you could have done. Makes your next-session targets smarter." checked={rirEnabled} onChange={setRir} />
            <Toggle label="Fill my history with 4 weeks of sample workouts" description="Handy for trying the app. You can reset everything in Me → Settings." checked={sample} onChange={setSample} />
          </Card>
        </section>
      )}

      <div className="sticky bottom-0 bg-bg pt-3 pb-4">
        <Button size="lg" className="w-full" onClick={next}>
          {step < 2 ? "Continue" : "Start lifting"}
        </Button>
      </div>
    </main>
  );
}
