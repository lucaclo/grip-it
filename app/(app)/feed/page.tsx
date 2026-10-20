"use client";

import {
  Flame,
  HandMetal,
  Laugh,
  Skull,
  Trophy,
  TriangleAlert,
  BicepsFlexed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/bits";
import { useBurst } from "@/components/ui/motion";
import { PlateBar } from "@/components/plate-bar";
import { MUSCLE_LABEL } from "@/lib/science/volume";
import {
  exerciseMap,
  feed,
  seededReactions,
  userName,
  volumeKg,
} from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { ReactionCode } from "@/lib/data/types";

// Each reaction has its own colour, so a post's mood reads at a glance. Full class strings for Tailwind.
type Tone = { on: string; count: string; burst: string };
const TONES: Record<ReactionCode, Tone> = {
  flame: { on: "border-warning/70 bg-warning/18 text-warning shadow-[0_6px_18px_-6px_rgb(255_200_87/0.6)]", count: "text-warning", burst: "text-warning" },
  muscle: { on: "border-volt/70 bg-volt/15 text-volt shadow-glow-volt", count: "text-volt", burst: "text-volt" },
  laugh: { on: "border-accent-2/70 bg-accent-2/18 text-accent-2 shadow-[0_6px_18px_-6px_rgb(229_139_255/0.6)]", count: "text-accent-2", burst: "text-accent-2" },
  metal: { on: "border-accent/70 bg-accent/18 text-accent shadow-glow", count: "text-accent", burst: "text-accent" },
  skull: { on: "border-muted/60 bg-muted/15 text-text", count: "text-text", burst: "text-muted" },
};

const REACTIONS: { code: ReactionCode; label: string; Icon: LucideIcon }[] = [
  { code: "flame", label: "Fire", Icon: Flame },
  { code: "muscle", label: "Strong", Icon: BicepsFlexed },
  { code: "laugh", label: "Laugh", Icon: Laugh },
  { code: "metal", label: "Rock on", Icon: HandMetal },
  { code: "skull", label: "Dead", Icon: Skull },
];

function ago(iso: string, now: number) {
  const m = Math.round((now - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function dayLabel(iso: string, now: number) {
  const d = new Date(iso);
  const today = new Date(now);
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export default function Feed() {
  const s = useStore();
  const [now] = useState(() => Date.now());
  const items = useMemo(() => feed(s), [s]);
  const ex = useMemo(() => exerciseMap(s), [s]);

  if (!items.length)
    return (
      <>
        <PageHeader title="Feed" />
        <EmptyState
          icon={<Trophy className="size-10" />}
          title="Quiet in here"
          body="Workouts and PRs from your group show up here."
        />
      </>
    );

  // Group posts under Today / Yesterday / a date.
  const groups: { label: string; items: typeof items }[] = [];
  for (const it of items) {
    const label = dayLabel(it.at, now);
    const g = groups[groups.length - 1];
    if (g?.label === label) g.items.push(it);
    else groups.push({ label, items: [it] });
  }

  return (
    <>
      <PageHeader title="Feed" subtitle={s.groupName} />
      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <h2 className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-subtle">
              {g.label}
              <span
                aria-hidden
                className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
              />
            </h2>
            <ul className="stagger flex flex-col gap-3">
              {g.items.map((it) => {
                const name = userName(s, it.userId);
                const mine = s.reactions[it.id] ?? {};
                const seeded = seededReactions(it.id);
                const def =
                  it.kind === "pr" ? ex.get(it.pr.exerciseId) : undefined;
                return (
                  <li
                    key={it.id}
                    className={`rounded-lg p-4 ${it.kind === "pr" ? "border border-pr/40 bg-gradient-to-br from-pr/14 via-surface to-accent-2/10 shadow-[0_18px_40px_-24px_rgb(255_200_87/0.6)]" : "card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full p-[2px] ${it.kind === "pr" ? "bg-gradient-to-br from-pr to-accent-2" : "bg-gradient-to-br from-accent/70 to-accent-2/50"}`}
                      >
                        <Avatar name={name} you={it.userId === "me"} />
                      </span>
                      <p className="flex-1 text-sm text-muted">
                        <span className="font-semibold text-text">
                          {it.userId === "me" ? "You" : name}
                        </span>{" "}
                        {it.kind === "pr" ? "hit a PR" : "finished a workout"} ·{" "}
                        {ago(it.at, now)}
                      </p>
                      {it.kind === "pr" && (
                        <Trophy aria-hidden className="size-5 text-pr" />
                      )}
                    </div>

                    {it.kind === "pr" ? (
                      <div className="mt-3">
                        <p className="font-display text-lg font-semibold">
                          {def?.name}
                        </p>
                        <p className="num-hero mt-0.5 text-[2.5rem] leading-none text-pr">
                          {it.pr.kg} kg × {it.pr.reps}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          e1RM {it.pr.e1rm} kg
                          {it.pr.previous != null && (
                            <span className="text-success">
                              {" "}
                              · +
                              {Math.round((it.pr.e1rm - it.pr.previous) * 10) /
                                10}{" "}
                              kg on last best
                            </span>
                          )}
                        </p>
                        {def?.equipment === "barbell" && (
                          <div className="mt-3 rounded-md bg-black/20 py-2">
                            <PlateBar kg={it.pr.kg} />
                          </div>
                        )}
                        {it.pr.flagged && (
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-warning/50 px-2 py-0.5 text-xs text-warning">
                            <TriangleAlert aria-hidden className="size-3.5" />{" "}
                            Big jump: honour system
                          </p>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={`/workout/${it.workout.id}`}
                        transitionTypes={["drill-in"]}
                        className="press mt-3 block rounded-md bg-surface-raised/80 p-3"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-display text-xl font-semibold">
                            {it.workout.title}
                          </span>
                          <span className="num-hero text-xl text-accent">
                            {Math.round(volumeKg(it.workout)).toLocaleString(
                              "en-GB",
                            )}
                            <span className="ml-0.5 text-sm not-italic text-muted">
                              kg
                            </span>
                          </span>
                        </span>
                        <span className="tabular block text-sm text-muted">
                          {it.workout.exercises.length} exercise{it.workout.exercises.length === 1 ? "" : "s"} ·{" "}
                          {it.workout.exercises.reduce(
                            (a, e) => a + e.sets.length,
                            0,
                          )}{" "}
                          sets
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {[
                            ...new Set(
                              it.workout.exercises
                                .map((e) => ex.get(e.exerciseId)?.primary)
                                .filter(Boolean),
                            ),
                          ]
                            .slice(0, 4)
                            .map((m) => (
                              <span
                                key={m}
                                className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent"
                              >
                                {MUSCLE_LABEL[m!]}
                              </span>
                            ))}
                        </span>
                      </Link>
                    )}

                    <div
                      className="mt-3 flex gap-1.5"
                      role="group"
                      aria-label="Reactions"
                    >
                      {REACTIONS.map(({ code, label, Icon }) => {
                        const on = (mine[code] ?? []).includes("me");
                        const count =
                          (seeded[code]?.length ?? 0) + (on ? 1 : 0);
                        return (
                          <ReactionButton
                            key={code}
                            on={on}
                            count={count}
                            label={label}
                            Icon={Icon}
                            tone={TONES[code]}
                            onToggle={() => s.toggleReaction(it.id, code)}
                          />
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function ReactionButton({
  on,
  count,
  label,
  Icon,
  tone,
  onToggle,
}: {
  on: boolean;
  count: number;
  label: string;
  Icon: LucideIcon;
  tone: Tone;
  onToggle: () => void;
}) {
  const { bursts, fire } = useBurst();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${label}, ${count}`}
      onClick={() => {
        if (!on) fire();
        onToggle();
      }}
      className={`relative flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-2.5 text-sm transition-all duration-200 active:scale-90 ${on ? tone.on : count > 0 ? "border-border text-muted" : "border-border/60 text-subtle"}`}
    >
      <Icon
        aria-hidden
        className={`size-4 transition-transform ${on ? "scale-110" : ""}`}
      />
      {count > 0 && (
        <span
          key={count}
          className={`tabular inline-block motion-safe:animate-bump ${tone.count}`}
        >
          {count}
        </span>
      )}
      {bursts.map((b) => (
        <Icon
          key={b.id}
          aria-hidden
          style={{ "--dx": `${b.dx}px` } as React.CSSProperties}
          className={`pointer-events-none absolute top-1 left-1/2 size-4 -ml-2 animate-float-up ${tone.burst}`}
        />
      ))}
    </button>
  );
}
