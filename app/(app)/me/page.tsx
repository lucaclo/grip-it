"use client";

import { Award, ChevronRight, Download, Flame, Lock, Medal, MessageSquarePlus, RotateCcw, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/bits";
import { CountUp } from "@/components/ui/motion";
import { NumberField, Toggle } from "@/components/ui/fields";
import { RirToggle } from "@/components/rir-toggle";
import { AppVersion } from "@/components/app-version";
import { FriendsCard } from "@/components/friends/friends-card";
import { Sheet } from "@/components/ui/sheet";
import { allPRs, streakOf, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { ExperiencePicker, experienceLabel, GoalPicker, goalTitle, HelpMeChoose } from "@/components/goal-picker";

export default function Me() {
  const s = useStore();
  const router = useRouter();
  const me = s.me!;
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const workouts = workoutsOf(s, "me");
  const prs = useMemo(() => allPRs(s).filter((p) => p.userId === "me"), [s]);
  const streak = streakOf(s, "me", me.sessionsPerWeek);

  const badges = [
    { id: "first", title: "First session", have: workouts.length, need: 1, unit: "workout", Icon: Award },
    { id: "ten", title: "10 sessions", have: workouts.length, need: 10, unit: "workouts", Icon: Medal },
    { id: "fifty", title: "50 sessions", have: workouts.length, need: 50, unit: "workouts", Icon: Medal },
    { id: "pr", title: "First PR", have: prs.length, need: 1, unit: "PR", Icon: Trophy },
    { id: "pr10", title: "PR machine", have: prs.length, need: 10, unit: "PRs", Icon: Trophy },
    { id: "streak4", title: "4-week streak", have: streak, need: 4, unit: "weeks", Icon: Flame },
  ].map((b) => ({ ...b, earned: b.have >= b.need }));
  const earnedCount = badges.filter((b) => b.earned).length;

  function exportData() {
    const { me: profile, workouts: all, weights, nutrition, customExercises, comments } = useStore.getState();
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), profile, workouts: all.filter((w) => w.userId === "me"), weights, nutrition, customExercises, comments: comments.filter((c) => c.userId === "me") }, null, 2)],
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
        <section className="card-hero shine shine-soft relative overflow-hidden rounded-xl p-5">
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-gradient-to-br from-volt via-accent to-accent-2 p-[3px] shadow-glow">
              <span className="grid size-16 place-items-center rounded-full bg-surface font-display text-3xl font-bold">{me.name.slice(0, 1)}</span>
            </span>
            <div className="flex-1">
              <p className="font-display text-2xl font-semibold leading-tight">{me.name}</p>
              <p className="text-sm text-text">
                {goalTitle(me.goal)} · {experienceLabel(me.experience)}
              </p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["Workouts", workouts.length],
              ["PRs", prs.length],
              ["Wk streak", streak],
            ].map(([k, v]) => (
              <div key={k as string} className="flex flex-col-reverse rounded-md bg-black/25 p-2.5">
                <dt className="text-xs text-text">{k}</dt>
                <dd>
                  <CountUp value={v as number} className="num-hero text-stat leading-none" />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <SectionTitle action={<span className="text-sm text-muted">{earnedCount} of {badges.length}</span>}>Trophy case</SectionTitle>
          <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
            {badges.map(({ id, title, earned, have, need, unit, Icon }, i) => (
              <li
                key={id}
                className="flex flex-col items-center gap-1.5 text-center motion-safe:animate-pop"
                style={{ animationDelay: `${200 + i * 70}ms` }}
                aria-label={`${title}: ${earned ? "earned" : `${Math.min(have, need)} of ${need} ${unit}`}`}
              >
                {/* Medallion: metallic ring + inner disc; locked ones are hollow with a progress arc. */}
                <span
                  aria-hidden
                  className={`relative grid size-[4.5rem] place-items-center rounded-full ${
                    earned
                      ? "bg-[conic-gradient(from_210deg,var(--color-pr),#fff3c4,var(--color-pr),#b8862a,var(--color-pr))] p-[3px] shadow-[0_8px_26px_-6px_rgb(255_200_87/0.55)]"
                      : "p-[3px]"
                  }`}
                  style={
                    earned
                      ? undefined
                      : { background: `conic-gradient(var(--color-accent) ${Math.min(1, have / need) * 360}deg, var(--color-surface-raised) 0deg)` }
                  }
                >
                  <span
                    className={`grid size-full place-items-center rounded-full ${earned ? "bg-[radial-gradient(circle_at_35%_30%,#3a2c63,#1b1530)]" : "bg-surface"}`}
                  >
                    <Icon className={`size-7 ${earned ? "text-pr drop-shadow-[0_0_8px_rgb(255_200_87/0.6)]" : "text-subtle"}`} />
                  </span>
                </span>
                <span className={`text-sm font-medium leading-tight ${earned ? "" : "text-muted"}`}>{title}</span>
                <span className="text-xs text-subtle">{earned ? "Earned" : `${Math.min(have, need)} / ${need} ${unit}`}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card>
          <SectionTitle>Goal and training</SectionTitle>
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="press flex items-center gap-3 rounded-md border border-volt/30 bg-volt/8 p-3 text-left"
            >
              <Sparkles aria-hidden className="size-5 shrink-0 text-volt" />
              <span className="flex-1">
                <span className="block font-semibold">Not sure? Help me choose</span>
                <span className="block text-sm text-muted">6 quick questions, then we recommend a goal and level.</span>
              </span>
            </button>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted">Goal</p>
              <GoalPicker value={me.goal} onChange={(goal) => s.updateProfile({ goal })} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted">Experience</p>
              <ExperiencePicker value={me.experience} onChange={(experience) => s.updateProfile({ experience })} />
            </div>
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
            <RirToggle checked={me.rirEnabled} onChange={(rirEnabled) => s.updateProfile({ rirEnabled })} />
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

        <FriendsCard manage />

        <Link
          href="/feedback?from=/me"
          transitionTypes={["drill-in"]}
          className="press card flex min-h-16 items-center gap-3 rounded-lg px-4 py-3"
        >
          <MessageSquarePlus aria-hidden className="size-6 text-accent" />
          <span className="flex-1">
            <span className="block text-base">Send feedback</span>
            <span className="block text-sm text-subtle">Report a bug or suggest an idea, with screenshots</span>
          </span>
          <ChevronRight aria-hidden className="size-5 text-subtle" />
        </Link>

        <AppVersion />

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

      <HelpMeChoose
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onApply={(r) => s.updateProfile({ goal: r.goal, experience: r.experience, sessionsPerWeek: r.sessionsPerWeek })}
      />

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
