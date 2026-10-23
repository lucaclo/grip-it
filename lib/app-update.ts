"use client";

import { create } from "zustand";
import { useStore } from "@/lib/data/store";

/**
 * App updates on the phone. A new version downloads in the background but only takes over when the
 * person says so, and never mid-workout, so nothing on screen changes under them. Updates never
 * touch saved data (that lives in localStorage and IndexedDB, which the service worker never clears).
 *
 * - check(): asks the server for a newer version now (also run on every open and return to the app).
 * - apply(): switches to the waiting version and reloads.
 */
export type UpdateStatus = "idle" | "checking" | "current" | "ready" | "offline" | "unsupported" | "error";

type UpdateState = {
  status: UpdateStatus;
  lastChecked: number | null;
  check: () => Promise<UpdateStatus>;
  apply: () => "applied" | "in_workout" | "none";
};

const registration = async () =>
  "serviceWorker" in navigator ? ((await navigator.serviceWorker.getRegistration()) ?? null) : null;

/** Resolves once an installing worker has finished installing (or failed). */
function installed(w: ServiceWorker) {
  return new Promise<void>((resolve) => {
    if (w.state !== "installing") return resolve();
    const on = () => {
      if (w.state !== "installing") {
        w.removeEventListener("statechange", on);
        resolve();
      }
    };
    w.addEventListener("statechange", on);
  });
}

let reloading = false;

export const useAppUpdate = create<UpdateState>()((set, get) => ({
  status: "idle",
  lastChecked: null,

  check: async () => {
    if (get().status === "checking") return "checking";
    const reg = await registration();
    if (!reg) {
      set({ status: "unsupported" });
      return "unsupported";
    }
    if (reg.waiting) {
      set({ status: "ready", lastChecked: Date.now() });
      return "ready";
    }
    if (!navigator.onLine) {
      set({ status: "offline" });
      return "offline";
    }
    set({ status: "checking" });
    try {
      await reg.update();
      if (reg.installing) await installed(reg.installing);
      const status: UpdateStatus = reg.waiting ? "ready" : "current";
      set({ status, lastChecked: Date.now() });
      return status;
    } catch {
      set({ status: navigator.onLine ? "error" : "offline" });
      return get().status;
    }
  },

  apply: () => {
    if (useStore.getState().draft) return "in_workout";
    void (async () => {
      const reg = await registration();
      if (!reg?.waiting) return;
      // Reload once the new version is in control.
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    })();
    return get().status === "ready" ? "applied" : "none";
  },
}));

/** Notice a version that finished downloading in the background (e.g. after a check the browser ran itself). */
export async function watchForUpdates() {
  const reg = await registration();
  if (!reg) return () => {};
  const mark = () => {
    if (reg.waiting) useAppUpdate.setState({ status: "ready" });
  };
  const onFound = () => {
    const w = reg.installing;
    if (w) installed(w).then(mark);
  };
  mark();
  reg.addEventListener("updatefound", onFound);
  return () => reg.removeEventListener("updatefound", onFound);
}
