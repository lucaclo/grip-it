"use client";

import { CheckCircle2, CloudOff, Download, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/bits";
import { useAppUpdate } from "@/lib/app-update";

const BUILD = process.env.NEXT_PUBLIC_BUILD ?? "dev";

/** Me → App version: which version this phone runs, and a button to check for and install updates. */
export function AppVersion() {
  const { status, lastChecked, check, apply } = useAppUpdate();
  const [note, setNote] = useState<string | null>(null);

  const line = {
    idle: "Checks for updates every time you open the app.",
    checking: "Checking for updates…",
    current: "You're on the latest version.",
    ready: "A new version is ready to install.",
    offline: "No signal. It'll check again when you're back online.",
    unsupported: "Updates arrive when you reopen the app.",
    error: "Couldn't check right now. Try again in a minute.",
  }[status];

  return (
    <Card>
      <SectionTitle>App version</SectionTitle>
      <p className="flex items-start gap-2 text-sm text-muted" role="status">
        {status === "checking" ? (
          <Loader2 aria-hidden className="mt-0.5 size-4 shrink-0 animate-spin" />
        ) : status === "current" ? (
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
        ) : status === "ready" ? (
          <Download aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
        ) : status === "offline" ? (
          <CloudOff aria-hidden className="mt-0.5 size-4 shrink-0" />
        ) : (
          <RefreshCw aria-hidden className="mt-0.5 size-4 shrink-0" />
        )}
        <span>
          {line}
          <span className="block text-xs text-subtle">
            Version {BUILD}
            {lastChecked && ` · checked ${new Date(lastChecked).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </span>
      </p>
      <div className="mt-3">
        {status === "ready" ? (
          <Button
            className="w-full"
            onClick={() => {
              const r = apply();
              setNote(r === "in_workout" ? "Finish or discard your workout first, then install." : null);
            }}
          >
            <Download aria-hidden className="size-5" /> Install update
          </Button>
        ) : status === "unsupported" ? (
          <Button variant="secondary" className="w-full" onClick={() => location.reload()}>
            <RefreshCw aria-hidden className="size-5" /> Reload the app
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" disabled={status === "checking"} onClick={() => check()}>
            <RefreshCw aria-hidden className="size-5" /> Check for updates
          </Button>
        )}
      </div>
      {note && <p className="mt-2 text-sm text-warning">{note}</p>}
      <p className="mt-3 text-xs text-subtle">Updating never touches your workouts, logs or settings.</p>
    </Card>
  );
}
