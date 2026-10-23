"use client";

import { ArrowLeft, Flame, Gauge, Lock, Sparkles, Target, TriangleAlert, Trophy } from "lucide-react";
import { Plate3D } from "@/components/plate-3d";
import { CountUp } from "@/components/ui/motion";
import { ExperiencePicker, GoalPicker, HelpMeChoose } from "@/components/goal-picker";
import { BarbellIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/bits";
import { InfoButton } from "@/components/ui/info";
import { RirToggle } from "@/components/rir-toggle";
import { NumberField, Segmented, TextField, Toggle } from "@/components/ui/fields";
import { targetsFor } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { Profile } from "@/lib/data/types";
import type { ActivityLevel, Sex } from "@/lib/science/energy";
import type { Experience, Goal } from "@/lib/science/targets";

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
  const [intro, setIntro] = useState(true);
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
  const [sample, setSample] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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

  if (intro) return <Welcome onStart={() => setIntro(false)} />;

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
            <h1 className="font-display text-[2.375rem] font-bold leading-none tracking-[-0.01em]">About you</h1>
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
            <h1 className="font-display text-[2.375rem] font-bold leading-none tracking-[-0.01em]">Your goal</h1>
            <p className="mt-2 text-muted">You can switch any time in settings.</p>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="press flex items-center gap-3 rounded-md border border-volt/30 bg-volt/8 p-3 text-left"
          >
            <Sparkles aria-hidden className="size-5 shrink-0 text-volt" />
            <span className="flex-1">
              <span className="block font-semibold">Not sure? Help me choose</span>
              <span className="block text-sm text-muted">6 quick questions, then we suggest a goal, level and weekly sessions.</span>
            </span>
          </button>
          <GoalPicker value={goal} onChange={setGoal} />
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
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted">Experience</p>
            <ExperiencePicker value={experience} onChange={setExperience} />
          </div>
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
            <h1 className="font-display text-[2.375rem] font-bold leading-none tracking-[-0.01em]">Your plan</h1>
            <p className="mt-2 flex items-center gap-1 text-muted">
              Based on published research.
              <InfoButton title="Where your plan comes from" label="Where your plan comes from" keys={plan.citationKeys}>
                <p>
                  <strong>Calories:</strong> your maintenance is about {plan.tdee} kcal a day, estimated with{" "}
                  {plan.method === "katch_mcardle" ? "the Katch-McArdle equation from your lean mass" : "the Mifflin-St Jeor equation from your weight, height, age and sex"}, then
                  scaled for how active you are. Your target adds or removes enough to move at the weekly rate shown.
                </p>
                <p>
                  <strong>Protein:</strong> {plan.proteinBasis}.
                </p>
                <p className="text-muted">These are starting points. Check them against your weight trend on the Body screen every couple of weeks.</p>
              </InfoButton>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <Flame aria-hidden className="size-5 text-accent" />
              <p className="mt-2 text-stat">{under16 ? <span className="num-hero">—</span> : <CountUp value={plan.kcal} duration={1200} className="num-hero" />}</p>
              <p className="text-sm text-muted">kcal per day</p>
            </Card>
            <Card>
              <BarbellIcon aria-hidden className="size-5 text-accent" />
              <p className="mt-2 text-stat">
                <CountUp value={plan.proteinG} suffix=" g" duration={1200} className="num-hero" />
              </p>
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
            {plan.notes.map((n) => (
              <p key={n} className={`mt-2 flex gap-2 text-sm ${plan.unrealistic ? "text-warning" : "text-muted"}`}>
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {n}
              </p>
            ))}
          </Card>
          <Card>
            <RirToggle checked={rirEnabled} onChange={setRir} />
            <Toggle label="Try it with demo friends and sample workouts" description="Adds made-up friends and 4 weeks of practice history. Leave off for your real profile." checked={sample} onChange={setSample} />
          </Card>
        </section>
      )}

      <HelpMeChoose
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onApply={(r) => {
          setGoal(r.goal);
          setExperience(r.experience);
          setSessions(r.sessionsPerWeek);
        }}
      />

      <div className="sticky bottom-0 bg-bg pt-3 pb-4">
        <Button size="lg" className="w-full" onClick={next}>
          {step < 2 ? "Continue" : "Start lifting"}
        </Button>
      </div>
    </main>
  );
}

const WELCOME_WORDS = ["Lift.", "Log.", "Beat", "your", "mates."];
const FEATURES = [
  { Icon: BarbellIcon, title: "Log every set in seconds", body: "Targets prefilled, ticks that save as you go." },
  { Icon: Target, title: "Coaching from real research", body: "Every target links to the study behind it." },
  { Icon: Trophy, title: "Compete with your crew", body: "Leaderboards, weekly races and PR bragging rights." },
];

/** First screen a friend sees: the 3D plate, a headline that lands word by word, and what the app does. */
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 pt-safe pb-safe">
      <div className="flex flex-1 flex-col justify-center gap-8 py-10">
        <Plate3D size={150} className="mx-auto motion-safe:animate-enter" />
        <h1 className="font-display text-[3.4rem] font-bold uppercase leading-[0.95]" aria-label="Lift. Log. Beat your mates.">
          {WELCOME_WORDS.map((w, i) => (
            <span key={i} aria-hidden className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom">
              <span
                className={`inline-block motion-safe:animate-word ${i >= 2 ? "text-accent" : ""}`}
                style={{ animationDelay: `${300 + i * 110}ms` }}
              >
                {w}
              </span>
            </span>
          ))}
        </h1>
        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex gap-3 motion-safe:animate-enter" style={{ animationDelay: `${900 + i * 120}ms` }}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/12 text-accent">
                <Icon aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pb-4 motion-safe:animate-enter" style={{ animationDelay: "1300ms" }}>
        <Button size="lg" className="w-full" onClick={onStart}>
          Get started
        </Button>
        <p className="mt-3 text-center text-xs text-subtle">Takes about a minute. Your body stats stay private.</p>
      </div>
    </main>
  );
}
