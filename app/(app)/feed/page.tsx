"use client";

import { Heart, MessageCircle, Trophy, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CommentsSheet } from "@/components/feed/comments";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/bits";
import { useBurst } from "@/components/ui/motion";
import { PlateBar } from "@/components/plate-bar";
import { MUSCLE_LABEL } from "@/lib/science/volume";
import {
  exerciseMap,
  feed,
  hardSetsIn,
  liftedKg,
  seededLikes,
  threadFor,
  userName,
  type FeedItem,
} from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { gripTag } from "@/lib/science/grips";
import { ago } from "@/lib/time";

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
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  if (!items.length)
    return (
      <>
        <PageHeader title="Feed" />
        <EmptyState
          icon={<Trophy className="size-10" />}
          title="Nothing here yet"
          body="Your workouts and PRs land here, and your crew's will too once friends can join."
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
      <PageHeader title="Feed" subtitle="Double-tap a post to like it" />
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
              {g.items.map((it) => (
                <FeedCard key={it.id} item={it} now={now} onComments={() => setCommentsFor(it.id)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <CommentsSheet itemId={commentsFor} onClose={() => setCommentsFor(null)} />
    </>
  );
}

const DOUBLE_TAP_MS = 280;

function FeedCard({ item: it, now, onComments }: { item: FeedItem; now: number; onComments: () => void }) {
  const s = useStore();
  const router = useRouter();
  const ex = useMemo(() => exerciseMap(s), [s]);
  const name = userName(s, it.userId);
  const def = it.kind === "pr" ? ex.get(it.pr.exerciseId) : undefined;
  const likers = [...seededLikes(it.id, s.friends.map((f) => f.id)), ...(s.likes[it.id] ?? [])];
  const liked = likers.includes("me");
  const thread = threadFor(s, it.id);
  const commentCount = thread.reduce((a, c) => a + 1 + c.replies.length, 0);
  const latest = s.comments.filter((c) => c.itemId === it.id).sort((a, b) => b.at.localeCompare(a.at))[0];

  // Double-tap anywhere on the post likes it (never unlikes), with a heart that pops in the middle.
  // A single tap on a workout still opens it, once it's clear no second tap is coming.
  const [hearts, setHearts] = useState<number[]>([]);
  const last = useRef<{ t: number; x: number; y: number } | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { bursts, fire } = useBurst();

  function popHeart() {
    const id = Date.now();
    setHearts((h) => [...h, id]);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 900);
  }

  function onTap(e: React.MouseEvent, single?: () => void) {
    const t = e.timeStamp;
    const p = last.current;
    if (p && t - p.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 40) {
      if (pending.current) clearTimeout(pending.current);
      pending.current = null;
      last.current = null;
      popHeart();
      if (s.like(it.id)) {
        fire();
        navigator.vibrate?.(12);
      }
      return;
    }
    last.current = { t, x: e.clientX, y: e.clientY };
    if (single) pending.current = setTimeout(single, DOUBLE_TAP_MS);
  }

  const likeLine =
    likers.length === 0
      ? null
      : liked
        ? likers.length === 1
          ? "You like this"
          : `You and ${likers.length - 1} other${likers.length === 2 ? "" : "s"}`
        : `${likers.length} like${likers.length === 1 ? "" : "s"}`;

  return (
    <li
      className={`relative touch-manipulation select-none rounded-lg p-4 ${it.kind === "pr" ? "border border-pr/40 bg-gradient-to-br from-pr/14 via-surface to-accent-2/10 shadow-[0_18px_40px_-24px_rgb(255_200_87/0.6)]" : "card"}`}
      onClick={(e) => {
        // Taps on buttons and the workout link are handled by those; anywhere else counts for double-tap.
        if ((e.target as HTMLElement).closest("button, a")) return;
        onTap(e);
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full p-[2px] ${it.kind === "pr" ? "bg-gradient-to-br from-pr to-accent-2" : "bg-gradient-to-br from-accent/70 to-accent-2/50"}`}
        >
          <Avatar name={name} you={it.userId === "me"} />
        </span>
        <p className="flex-1 text-sm text-muted">
          <span className="font-semibold text-text">{it.userId === "me" ? "You" : name}</span>{" "}
          {it.kind === "pr" ? "hit a PR" : "finished a workout"} · {ago(it.at, now)}
        </p>
        {it.kind === "pr" && <Trophy aria-hidden className="size-5 text-pr" />}
      </div>

      {it.kind === "pr" ? (
        <div className="mt-3">
          <p className="font-display text-lg font-semibold">
            {def?.name}
            {it.pr.grip && <span className="text-muted"> · {gripTag(it.pr.exerciseId, it.pr.grip)}</span>}
          </p>
          <p className="num-hero mt-0.5 text-[2.5rem] leading-none text-pr">
            {it.pr.kg} kg × {it.pr.reps}
          </p>
          <p className="mt-1 text-sm text-muted">
            e1RM {it.pr.e1rm} kg
            {it.pr.previous != null && (
              <span className="text-success"> · +{Math.round((it.pr.e1rm - it.pr.previous) * 10) / 10} kg on last best</span>
            )}
          </p>
          {def?.equipment === "barbell" && (
            <div className="mt-3 rounded-md bg-black/20 py-2">
              <PlateBar kg={it.pr.kg} />
            </div>
          )}
          {it.pr.flagged && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-warning/50 px-2 py-0.5 text-xs text-warning">
              <TriangleAlert aria-hidden className="size-3.5" /> Big jump: honour system
            </p>
          )}
        </div>
      ) : (
        <Link
          href={`/workout/${it.workout.id}`}
          transitionTypes={["drill-in"]}
          onClick={(e) => {
            // Keyboard activation (no pointer) opens straight away; taps wait to see if a second one comes.
            if (e.detail === 0) return;
            e.preventDefault();
            onTap(e, () => router.push(`/workout/${it.workout.id}`, { transitionTypes: ["drill-in"] }));
          }}
          className="press mt-3 block rounded-md bg-surface-raised/80 p-3"
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-xl font-semibold">{it.workout.title}</span>
            <span className="num-hero text-xl text-accent">
              {liftedKg(s, it.workout).toLocaleString("en-GB")}
              <span className="ml-0.5 text-sm not-italic text-muted">kg</span>
            </span>
          </span>
          <span className="tabular block text-sm text-muted">
            {it.workout.exercises.length} exercise{it.workout.exercises.length === 1 ? "" : "s"} · {hardSetsIn(s, it.workout)} hard sets
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {[...new Set(it.workout.exercises.map((e) => ex.get(e.exerciseId)?.primary).filter(Boolean))]
              .slice(0, 4)
              .map((m) => (
                <span key={m} className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                  {MUSCLE_LABEL[m!]}
                </span>
              ))}
          </span>
        </Link>
      )}

      {/* The heart that pops on double-tap. */}
      {hearts.map((h) => (
        <Heart
          key={h}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 fill-danger text-danger drop-shadow-[0_8px_24px_rgb(255_107_122/0.6)] motion-safe:animate-heart"
        />
      ))}

      <div className="mt-2 -mb-2 flex items-center gap-1">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          onClick={() => {
            if (!liked) fire();
            s.toggleLike(it.id);
          }}
          className="relative -ml-2.5 grid size-11 place-items-center rounded-full active:scale-90 transition-transform"
        >
          <Heart
            aria-hidden
            className={`size-6 transition-[color,fill,scale] duration-200 ${liked ? "scale-110 fill-danger text-danger" : "text-muted"}`}
          />
          {bursts.map((b) => (
            <Heart
              key={b.id}
              aria-hidden
              style={{ "--dx": `${b.dx}px` } as React.CSSProperties}
              className="pointer-events-none absolute top-1 left-1/2 -ml-2 size-4 fill-danger text-danger animate-float-up"
            />
          ))}
        </button>
        <button
          type="button"
          onClick={onComments}
          aria-label={`Comments, ${commentCount}`}
          className="grid size-11 place-items-center rounded-full text-muted active:scale-90 transition-transform"
        >
          <MessageCircle aria-hidden className="size-6" />
        </button>
        <p className="flex-1 text-sm text-muted">
          {likeLine && <span key={likers.length} className="inline-block motion-safe:animate-bump">{likeLine}</span>}
        </p>
      </div>

      {commentCount > 0 && latest && (
        <button type="button" onClick={onComments} className="mt-2 block w-full text-left text-sm">
          <span className="line-clamp-2">
            <span className="font-semibold">{latest.userId === "me" ? "You" : userName(s, latest.userId)}</span>{" "}
            <span className="text-text">{latest.text}</span>
          </span>
          {commentCount > 1 && <span className="mt-0.5 block text-subtle">View all {commentCount} comments</span>}
        </button>
      )}
    </li>
  );
}
