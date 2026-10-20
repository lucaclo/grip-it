"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, ViewTransition } from "react";
import { TabBar } from "@/components/tab-bar";
import { useStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";

/** Waits for this browser's saved data, sends new users to onboarding, then shows the tab bar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => !!s.me);
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  if (!hydrated || !onboarded) return <div className="min-h-dvh" aria-busy />;
  return (
    <>
      {/* Keyed by route so each navigation runs an exit + enter, typed by the tab bar (left/right) or drill-in. */}
      <ViewTransition
        key={path}
        enter={{ "tab-forward": "tab-forward", "tab-back": "tab-back", "drill-in": "drill-in", default: "none" }}
        exit={{ "tab-forward": "tab-forward", "tab-back": "tab-back", "drill-in": "drill-in", default: "none" }}
        default="none"
      >
        <main className="mx-auto max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">{children}</main>
      </ViewTransition>
      <TabBar />
    </>
  );
}
