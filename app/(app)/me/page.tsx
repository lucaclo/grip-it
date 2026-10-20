"use client";

import { Award, Download, Flame, Lock, Medal, RotateCcw, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, Card, PageHeader, SectionTitle } from "@/components/ui/bits";
import { NumberField, Segmented, Toggle } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { allPRs, streakOf, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { Goal } from "@/lib/science/targets";

export default function Me() {
  const s = useStore();
  const router = useRouter();
  const me = s.me!;
  const [resetOpen, setResetOpen] = useState(false);
  const workouts = workoutsOf(s, "me");
  const prs = useMemo(() => allPRs(s).filter((p) => p.userId === "me"), [s]);
  const streak = streakOf(s, "me", me.sessionsPerWeek);

  const badges = [
    { id: "first", title: "First session", earned: workouts.length >= 1, how: "Log a workout", Icon: Award },
    { id: "ten", title: "10 sessions", earned: workouts.length >= 10, how: "Log 10 workouts", Icon: Medal },
    { id: "pr", title: "First PR", earned: prs.length >= 1, how: "Beat a best", Icon: Trophy },
    { id: "pr10", title: "PR machine", earned: prs.length >= 10, how: "Hit 10 PRs", Icon: Trophy },
    { id: "streak4", title: "4-week streak", earned: streak >= 4, how: "Meet your weekly goal 4 weeks running", Icon: Flame },
  ];

  function exportData() {
    const { me: profile, workouts: all, weights, nutrition, customExercises } = useStore.getState();
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), profile, workouts: all.filter((w) => w.userId === "me"), weights, nutrition, customExercises }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "grip-it-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader title="Me" />
      <div className="stagger flex flex-col gap-4">
        <Card className="flex items-center gap-4">
          <Avatar name={me.name} you />
          <div className="flex-1">
            <p className="font-display text-xl font-semibold">{me.name}</p>
            <p className="text-sm text-muted">
              {workouts.length} workouts · {prs.length} PRs · {streak}-week streak
            </p>
          </div>
        </Card>

        <section>
          <SectionTitle>Trophy case</SectionTitle>
          <ul className="grid grid-cols-3 gap-2">
            {badges.map(({ id, title, earned, how, Icon }) => (
              <li
                key={id}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center ${earned ? "border-accent bg-surface" : "border-border bg-transparent"}`}
              >
                <Icon aria-hidden className={`size-7 ${earned ? "text-accent" : "text-subtle"}`} />
                <span className={`text-sm font-medium ${earned ? "" : "text-subtle"}`}>{title}</span>
                <span className="text-xs text-subtle">{earned ? "Earned" : how}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card>
          <SectionTitle>Goal and training</SectionTitle>
          <div className="flex flex-col gap-4">
            <Segmented<Goal>
              label="Goal"
              value={me.goal}
              onChange={(goal) => s.updateProfile({ goal })}
              options={[
                { value: "hypertrophy", label: "Muscle" },
                { value: "strength", label: "Strength" },
                { value: "fat_loss", label: "Fat loss" },
              ]}
            />
            <Segmented
              label="Experience"
              value={me.experience}
              onChange={(experience) => s.updateProfile({ experience })}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Target weight" unit="kg" decimal value={me.targetWeightKg} onChange={(v) => v && v >= 30 && s.updateProfile({ targetWeightKg: v })} />
              <NumberField
                label="Sessions / week"
                step={1}
                min={1}
                max={7}
                value={me.sessionsPerWeek}
                onChange={(v) => v && s.updateProfile({ sessionsPerWeek: Math.min(7, Math.max(1, Math.round(v))) })}
              />
            </div>
            <Toggle label="Log RIR (reps in reserve)" description="Adds an optional column to each set for smarter targets." checked={me.rirEnabled} onChange={(rirEnabled) => s.updateProfile({ rirEnabled })} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Privacy</SectionTitle>
          <p className="mb-1 flex gap-2 text-sm text-muted">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" /> Your lifts are shared with your group. Body data is private unless you turn these on.
          </p>
          <Toggle label="Share body weight" description="Group-mates can see your weight trend." checked={me.shareWeight} onChange={(shareWeight) => s.updateProfile({ shareWeight })} />
          <Toggle label="Share nutrition" description="Group-mates can see your daily calories and protein." checked={me.shareNutrition} onChange={(shareNutrition) => s.updateProfile({ shareNutrition })} />
        </Card>

        <Card>
          <SectionTitle>Your data</SectionTitle>
          <p className="mb-3 text-sm text-muted">This prototype stores everything in this browser only. Updates to the app keep your data.</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={exportData}>
              <Download aria-hidden className="size-5" /> Export my data
            </Button>
            <Button variant="ghost" className="text-danger" onClick={() => setResetOpen(true)}>
              <RotateCcw aria-hidden className="size-5" /> Reset everything
            </Button>
          </div>
        </Card>
      </div>

      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} title="Reset everything?">
        <div className="flex flex-col gap-3">
          <p className="text-muted">This deletes your profile, workouts and logs from this browser and restarts onboarding. Export first if you want a copy.</p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              s.resetAll();
              setResetOpen(false);
              router.replace("/onboarding");
            }}
          >
            Reset
          </Button>
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </>
  );
}
