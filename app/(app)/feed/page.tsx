"use client";

import { Flame, HandMetal, Laugh, Skull, Trophy, TriangleAlert, BicepsFlexed, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/bits";
import { exerciseMap, feed, seededReactions, userName, volumeKg } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { ReactionCode } from "@/lib/data/types";

const REACTIONS: { code: ReactionCode; label: string; Icon: LucideIcon }[] = [
  { code: "flame", label: "Fire", Icon: Flame },
  { code: "muscle", label: "Strong", Icon: BicepsFlexed },
  { code: "laugh", label: "Laugh", Icon: Laugh },
  { code: "metal", label: "Rock on", Icon: HandMetal },
  { code: "skull", label: "Dead", Icon: Skull },
];

function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default function Feed() {
  const s = useStore();
  const items = useMemo(() => feed(s), [s]);
  const ex = useMemo(() => exerciseMap(s), [s]);

  if (!items.length)
    return (
      <>
        <PageHeader title="Feed" />
        <EmptyState icon={<Trophy className="size-10" />} title="Quiet in here" body="Workouts and PRs from your group show up here." />
      </>
    );

  return (
    <>
      <PageHeader title="Feed" subtitle={s.groupName} />
      <ul className="flex flex-col gap-3">
        {items.map((it) => {
          const name = userName(s, it.userId);
          const mine = s.reactions[it.id] ?? {};
          const seeded = seededReactions(it.id);
          return (
            <li key={it.id} className="card rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Avatar name={name} you={it.userId === "me"} />
                <p className="flex-1 text-sm text-muted">
                  <span className="font-semibold text-text">{it.userId === "me" ? "You" : name}</span>{" "}
                  {it.kind === "pr" ? "hit a PR" : "finished a workout"} · {ago(it.at)}
                </p>
              </div>

              {it.kind === "pr" ? (
                <div className="mt-3 rounded-md bg-surface-raised p-3">
                  <p className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Trophy aria-hidden className="size-5 text-pr" />
                    {ex.get(it.pr.exerciseId)?.name}
                  </p>
                  <p className="tabular mt-1 text-xl font-semibold">
                    {it.pr.kg} kg × {it.pr.reps}
                  </p>
                  <p className="text-sm text-muted">
                    e1RM {it.pr.e1rm} kg
                    {it.pr.previous != null && (
                      <span className="text-success"> · +{Math.round((it.pr.e1rm - it.pr.previous) * 10) / 10} kg on last best</span>
                    )}
                  </p>
                  {it.pr.flagged && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-warning/50 px-2 py-0.5 text-xs text-warning">
                      <TriangleAlert aria-hidden className="size-3.5" /> Big jump: honour system
                    </p>
                  )}
                </div>
              ) : (
                <Link href={`/workout/${it.workout.id}`} className="mt-3 block rounded-md bg-surface-raised p-3">
                  <p className="font-display text-lg font-semibold">{it.workout.title}</p>
                  <p className="tabular text-sm text-muted">
                    {it.workout.exercises.length} exercises · {it.workout.exercises.reduce((a, e) => a + e.sets.length, 0)} sets ·{" "}
                    {Math.round(volumeKg(it.workout)).toLocaleString("en-GB")} kg
                  </p>
                  <p className="mt-1 truncate text-sm text-subtle">{it.workout.exercises.map((e) => ex.get(e.exerciseId)?.name).join(", ")}</p>
                </Link>
              )}

              <div className="mt-3 flex gap-1.5" role="group" aria-label="Reactions">
                {REACTIONS.map(({ code, label, Icon }) => {
                  const on = (mine[code] ?? []).includes("me");
                  const count = (seeded[code]?.length ?? 0) + (on ? 1 : 0);
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${label}, ${count}`}
                      onClick={() => s.toggleReaction(it.id, code)}
                      className={`flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-2.5 text-sm transition-transform active:scale-90 ${on ? "border-accent bg-accent text-on-accent" : "border-border text-muted"}`}
                    >
                      <Icon aria-hidden className="size-4" />
                      {count > 0 && <span className="tabular">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
