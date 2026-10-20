"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "./store";

/** True once the persisted store has loaded from this browser's storage (never during SSR). */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
