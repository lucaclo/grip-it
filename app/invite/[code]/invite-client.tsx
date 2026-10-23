"use client";

import { Copy, Loader2, Share, SquarePlus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Plate3D } from "@/components/plate-3d";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { savePendingInvite } from "@/lib/invite";

const noop = () => () => {};
/** Opened from the home-screen icon (installed), not a Safari tab. */
const useInstalled = () =>
  useSyncExternalStore(
    noop,
    () => matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true,
    () => false,
  );
const useIos = () => useSyncExternalStore(noop, () => /iPhone|iPad|iPod/.test(navigator.userAgent), () => false);

/**
 * The invite link. Installed app: joins straight away (after a quick profile if new).
 * Safari on iPhone: three taps to install, and the installed icon opens this same invite.
 */
export function InviteClient({ code, from }: { code: string; from?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useStore((s) => !!s.me);
  const installed = useInstalled();
  const ios = useIos();
  const [going, setGoing] = useState(false);
  const [copied, setCopied] = useState(false);

  // The join itself happens once there's a profile (components/pwa.tsx → FriendsSync).
  useEffect(() => {
    if (!hydrated || !(installed || going)) return;
    savePendingInvite(code);
    router.replace(onboarded ? "/compete" : "/onboarding");
  }, [hydrated, installed, going, onboarded, code, router]);
  const go = () => setGoing(true);

  if (installed || going)
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="flex items-center gap-2 text-muted">
          <Loader2 aria-hidden className="size-5 animate-spin" /> Joining{from ? ` ${from}'s crew` : ""}…
        </p>
      </main>
    );

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-6 px-4 pt-safe pb-safe">
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <Plate3D size={110} />
        <h1 className="font-display text-[2.375rem] font-bold leading-none tracking-[-0.01em]">
          {from ? `${from} invited you` : "You're invited"}
        </h1>
        <p className="text-muted">Log your lifts and compete with friends on Grip It. Free, no sign-up.</p>
      </div>

      {ios ? (
        <section className="card rounded-lg p-4" aria-label="How to join">
          <p className="mb-3 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">Join in three taps</p>
          <ol className="flex flex-col gap-3">
            <li className="flex items-center gap-3">
              <Step n={1} />
              <span className="flex-1">
                Tap <Share aria-label="Share" className="mx-0.5 inline size-5 align-[-4px] text-accent" /> at the bottom of
                Safari
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Step n={2} />
              <span className="flex-1">
                Tap <strong>Add to Home Screen</strong> <SquarePlus aria-hidden className="ml-0.5 inline size-5 align-[-4px] text-accent" />
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Step n={3} />
              <span className="flex-1">Open Grip It from your home screen. You&apos;ll join{from ? ` ${from}` : ""} automatically.</span>
            </li>
          </ol>
        </section>
      ) : (
        <Button size="lg" onClick={go}>
          Join{from ? ` ${from}'s crew` : ""}
        </Button>
      )}

      <section className="flex flex-col items-center gap-2 text-center text-sm text-muted">
        <p>Already have Grip It? Open it, tap Me → Join a group, and enter:</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
          }}
          className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 font-display text-2xl font-semibold tracking-[0.25em] text-text"
          aria-label={`Invite code ${code.split("").join(" ")}. Tap to copy`}
        >
          {code}
          {copied ? <Check aria-hidden className="size-4 text-success" /> : <Copy aria-hidden className="size-4 text-subtle" />}
        </button>
        {ios && (
          <button type="button" onClick={go} className="mt-2 min-h-11 text-sm text-accent">
            Or use it in Safari instead
          </button>
        )}
      </section>
    </main>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand font-semibold text-on-accent">
      {n}
    </span>
  );
}
