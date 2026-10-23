"use client";

import { Award, Camera, ChevronRight, Download, Flame, ImagePlus, Lock, Medal, MessageSquarePlus, RotateCcw, Sparkles, Target, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, Disclosure, PageHeader, SectionTitle } from "@/components/ui/bits";
import { CountUp } from "@/components/ui/motion";
import { NumberField, Toggle } from "@/components/ui/fields";
import { RirToggle } from "@/components/rir-toggle";
import { AppVersion } from "@/components/app-version";
import { FriendsCard } from "@/components/friends/friends-card";
import { Sheet } from "@/components/ui/sheet";
import { allPRs, streakOf, workoutsOf } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { openPhoto } from "@/lib/avatar";
import { PhotoCropper } from "@/components/photo-cropper";
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
        <section className="card-hero relative overflow-hidden rounded-xl p-5">
          <div className="flex items-center gap-4">
            <ProfilePhoto name={me.name} />
            <div className="flex-1">
              <p className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.01em]">{me.name}</p>
              <p className="mt-0.5 text-sm text-muted">
                {goalTitle(me.goal)} · {experienceLabel(me.experience)}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 divide-x divide-white/[0.08] border-t border-white/[0.08] pt-4 text-center">
            {[
              ["Workouts", workouts.length],
              ["PRs", prs.length],
              ["Wk streak", streak],
            ].map(([k, v]) => (
              <div key={k as string} className="flex flex-col-reverse gap-1">
                <dt className="text-xs text-muted">{k}</dt>
                <dd>
                  <CountUp value={v as number} className="num-hero text-[1.625rem] leading-none" />
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
                      ? "bg-[conic-gradient(from_210deg,var(--color-pr),var(--color-text),var(--color-pr),var(--color-rank-bronze),var(--color-pr))] p-[2px]"
                      : "p-[2px]"
                  }`}
                  style={
                    earned
                      ? undefined
                      : { background: `conic-gradient(var(--color-accent) ${Math.min(1, have / need) * 360}deg, rgb(255 255 255 / 0.08) 0deg)` }
                  }
                >
                  <span
                    className={`grid size-full place-items-center rounded-full ${earned ? "bg-surface-raised" : "bg-surface"}`}
                  >
                    <Icon className={`size-7 ${earned ? "text-pr" : "text-subtle"}`} strokeWidth={1.8} />
                  </span>
                </span>
                <span className={`text-sm font-medium leading-tight ${earned ? "" : "text-muted"}`}>{title}</span>
                <span className="text-xs text-subtle">{earned ? "Earned" : `${Math.min(have, need)} / ${need} ${unit}`}</span>
              </li>
            ))}
          </ul>
        </section>

        <Disclosure
          id="me-goal"
          icon={<Target className="size-[1.125rem]" />}
          title="Goal and training"
          summary={`${goalTitle(me.goal)} · ${experienceLabel(me.experience)} · ${me.sessionsPerWeek}× a week · target ${me.targetWeightKg} kg`}
        >
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="press flex items-center gap-3 rounded-md bg-volt/[0.07] p-3 text-left ring-1 ring-inset ring-volt/20"
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
        </Disclosure>

        <Disclosure
          id="me-privacy"
          icon={<Lock className="size-[1.125rem]" />}
          title="Privacy"
          summary={
            me.shareWeight || me.shareNutrition
              ? `Sharing ${[me.shareWeight && "weight", me.shareNutrition && "nutrition"].filter(Boolean).join(" and ")} with your group`
              : "Body data private · lifts shared with your group"
          }
        >
          <p className="mb-1 flex gap-2 text-sm text-muted">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" /> Your lifts are shared with your group. Body data is private unless you turn these on.
          </p>
          <Toggle label="Share body weight" description="Group-mates can see your weight trend." checked={me.shareWeight} onChange={(shareWeight) => s.updateProfile({ shareWeight })} />
          <Toggle label="Share nutrition" description="Group-mates can see your daily calories and protein." checked={me.shareNutrition} onChange={(shareNutrition) => s.updateProfile({ shareNutrition })} />
        </Disclosure>

        <FriendsCard manage />

        <Link
          href="/feedback?from=/me"
          transitionTypes={["drill-in"]}
          className="press card flex min-h-14 items-center gap-3 rounded-lg px-4 py-2.5"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-accent/15"><MessageSquarePlus aria-hidden className="size-[1.125rem] text-accent" /></span>
          <span className="flex-1">
            <span className="block text-base font-medium">Send feedback</span>
            <span className="block text-[0.8125rem] text-muted">Bugs and ideas, with screenshots</span>
          </span>
          <ChevronRight aria-hidden className="size-5 text-subtle" />
        </Link>

        <AppVersion />

        <Disclosure id="me-data" icon={<Download className="size-[1.125rem]" />} title="Your data" summary="Export a copy or reset">
          <p className="mb-3 text-sm text-muted">This prototype stores everything in this browser only. Updates to the app keep your data.</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={exportData}>
              <Download aria-hidden className="size-5" /> Export my data
            </Button>
            <Button variant="ghost" className="text-danger" onClick={() => setResetOpen(true)}>
              <RotateCcw aria-hidden className="size-5" /> Reset everything
            </Button>
          </div>
        </Disclosure>
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

/** Your avatar on Me: tap to pick a photo (or change/remove one). The photo stays on this phone. */
function ProfilePhoto({ name }: { name: string }) {
  const photo = useStore((s) => s.me?.photo);
  const updateProfile = useStore((s) => s.updateProfile);
  const input = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ img: HTMLImageElement; url: string } | null>(null);
  function closeCropper() {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(null);
  }
  return (
    <>
      <button
        type="button"
        onClick={() => (photo ? setMenu(true) : input.current?.click())}
        aria-label={photo ? "Change profile photo" : "Add a profile photo"}
        className="press relative shrink-0 rounded-full p-[2px] ring-1 ring-accent/40"
      >
        <Avatar name={name} you className="size-16 text-3xl font-bold" />
        <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full bg-text text-bg ring-2 ring-surface">
          <Camera className="size-3.5" strokeWidth={2.4} />
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // picking the same photo again still fires
          if (!file) return;
          try {
            setPicked(await openPhoto(file)); // then position it in the circle
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't use that photo.");
          }
        }}
      />
      {error && (
        <p role="alert" className="absolute inset-x-5 bottom-2 text-sm text-danger">
          {error}
        </p>
      )}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Profile photo">
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setMenu(false);
              input.current?.click();
            }}
          >
            <ImagePlus aria-hidden className="size-5" /> Choose a new photo
          </Button>
          <Button
            variant="ghost"
            className="text-danger"
            onClick={() => {
              updateProfile({ photo: undefined });
              setMenu(false);
            }}
          >
            <Trash2 aria-hidden className="size-5" /> Remove photo
          </Button>
          <p className="mt-1 text-center text-xs text-subtle">Your photo stays on this phone for now.</p>
        </div>
      </Sheet>
      <PhotoCropper
        photo={picked}
        onCancel={closeCropper}
        onDone={(photo) => {
          updateProfile({ photo });
          closeCropper();
        }}
      />
    </>
  );
}
