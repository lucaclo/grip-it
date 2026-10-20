"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the person has asked their device for less motion. Animations in JS must check this. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
