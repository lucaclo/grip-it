"use client";

import { CheckCircle2, CloudOff, Download, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppUpdate } from "@/lib/app-update";

const BUILD = process.env.NEXT_PUBLIC_BUILD ?? "dev";

/** Me → App version: which version this phone runs, and a button to check for and install updates. */
export function AppVersion() {
  const { status, check, apply } = useAppUpdate();
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

  // One row: status icon, version line, and a small action. The full explanation only when an update waits.
  return (
    <section className="card rounded-lg px-4 py-2.5" aria-label="App version">
      <div className="flex min-h-11 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-white/[0.06] text-muted" aria-hidden>
          {status === "checking" ? (
            <Loader2 className="size-[1.125rem] animate-spin" />
          ) : status === "current" ? (
            <CheckCircle2 className="size-[1.125rem] text-success" />
          ) : status === "ready" ? (
            <Download className="size-[1.125rem] text-accent" />
          ) : status === "offline" ? (
            <CloudOff className="size-[1.125rem]" />
          ) : (
            <RefreshCw className="size-[1.125rem]" />
          )}
        </span>
        <p className="min-w-0 flex-1" role="status">
          <span className="block font-medium">Version {BUILD}</span>
          <span className="block truncate text-[0.8125rem] text-muted">{line}</span>
        </p>
        {status === "ready" ? (
          <Button
            size="sm"
            className="min-h-11 shrink-0"
            onClick={() => {
              const r = apply();
              setNote(r === "in_workout" ? "Finish or discard your workout first, then install." : null);
            }}
          >
            Install
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11 shrink-0"
            disabled={status === "checking"}
            onClick={() => (status === "unsupported" ? location.reload() : check())}
          >
            {status === "unsupported" ? "Reload" : "Check"}
          </Button>
        )}
      </div>
      {note && <p className="mt-1 text-sm text-warning">{note}</p>}
      {status === "ready" && <p className="mt-1 text-xs text-subtle">Updating never touches your workouts, logs or settings.</p>}
    </section>
  );
}
