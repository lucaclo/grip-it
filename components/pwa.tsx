"use client";

import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAppUpdate, watchForUpdates } from "@/lib/app-update";
import { useStore } from "@/lib/data/store";
import { flushFeedback } from "@/lib/feedback-queue";
import { clearPendingInvite, INVITE_EVENT, pendingInvite } from "@/lib/invite";
import { joinGroup, syncNow } from "@/lib/sync";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/data/use-hydrated";

/** Registers the offline service worker (app/sw.ts) and keeps this phone's data from being evicted. */
export function Pwa({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      // The default reloads the page on reconnect, which would interrupt a workout.
      reloadOnOnline={false}
      // Registered below with a catch: private mode or blocked workers must never break the app.
      register={false}
    >
      <Register />
      {children}
      <KeepData />
      <FeedbackSync />
      <FriendsSync />
      <UpdateToast />
    </SerwistProvider>
  );
}

function Register() {
  const { serwist } = useSerwist();
  useEffect(() => {
    serwist?.register().catch(() => {});
  }, [serwist]);
  return null;
}

/** Asks for persistent storage and saves your exercise and workout pages for offline use. */
function KeepData() {
  const { serwist } = useSerwist();
  const hydrated = useHydrated();
  const done = useRef(false);

  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  useEffect(() => {
    if (!serwist || !hydrated || done.current || !navigator.onLine) return;
    done.current = true;
    const mine = useStore.getState().workouts.filter((w) => w.userId === "me");
    const exercises = new Set(mine.flatMap((w) => w.exercises.map((e) => e.exerciseId)));
    const urls = [
      ...[...exercises].map((id) => `/exercises/${encodeURIComponent(id)}`),
      ...mine.slice(-60).map((w) => `/workout/${encodeURIComponent(w.id)}`),
    ];
    if (urls.length) serwist.messageSW({ type: "CACHE_URLS", payload: { urlsToCache: urls } });
  }, [serwist, hydrated]);

  return null;
}

/** Sends feedback written offline as soon as there's signal again. */
function FeedbackSync() {
  useEffect(() => {
    flushFeedback().catch(() => {});
    const on = () => flushFeedback().catch(() => {});
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, []);
  return null;
}

/**
 * Keeps friends in sync: on open, on coming back to the app, when back online, every minute while
 * open, and shortly after you save or delete a workout. Also finishes a pending invite once the
 * person has a profile.
 */
function FriendsSync() {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => !!s.me);
  const hasAccount = useStore((s) => !!s.account);
  const queued = useStore((s) => s.syncQueue.upserts.length + s.syncQueue.deletes.length);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !onboarded) return;
    let joining = false;
    const tryJoin = () => {
      const code = pendingInvite();
      if (!code || joining) return;
      joining = true;
      joinGroup(code)
        .then(() => {
          clearPendingInvite();
          router.push("/compete");
        })
        .catch(() => {}) // stays pending; retried on the next open or invite
        .finally(() => (joining = false));
    };
    tryJoin();
    window.addEventListener(INVITE_EVENT, tryJoin);
    return () => window.removeEventListener(INVITE_EVENT, tryJoin);
  }, [hydrated, onboarded, router]);

  useEffect(() => {
    if (!hydrated || !hasAccount) return;
    syncNow();
    const onShow = () => document.visibilityState === "visible" && syncNow();
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("online", onShow);
    const t = setInterval(() => document.visibilityState === "visible" && syncNow(), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("online", onShow);
      clearInterval(t);
    };
  }, [hydrated, hasAccount]);

  useEffect(() => {
    if (!hydrated || !hasAccount || !queued) return;
    const t = setTimeout(() => syncNow(), 1500);
    return () => clearTimeout(t);
  }, [hydrated, hasAccount, queued]);

  return null;
}

/**
 * "Update ready": a new version only takes over when you tap, and never during a workout.
 * Checks for a new version on every open and whenever you come back to the app.
 */
function UpdateToast() {
  const hydrated = useHydrated();
  const inWorkout = useStore((s) => !!s.draft);
  const { status, check, apply } = useAppUpdate();

  useEffect(() => {
    let stop = () => {};
    watchForUpdates().then((off) => (stop = off));
    // A short delay so the first check doesn't compete with the app starting up.
    const first = setTimeout(() => check(), 3000);
    const onShow = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("online", onShow);
    return () => {
      stop();
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("online", onShow);
    };
  }, [check]);

  if (status !== "ready" || !hydrated || inWorkout) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-50 mx-auto flex max-w-[448px] items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 pl-4 shadow-glow motion-safe:animate-enter"
    >
      <RefreshCw aria-hidden className="size-5 shrink-0 text-accent" />
      <span className="flex-1 text-sm">Update ready. Your data stays put.</span>
      <button type="button" onClick={() => apply()} className="min-h-11 px-2 font-semibold text-accent">
        Refresh
      </button>
    </div>
  );
}
