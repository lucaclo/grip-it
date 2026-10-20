"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TabBar } from "@/components/tab-bar";
import { useStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";

/** Waits for this browser's saved data, sends new users to onboarding, then shows the tab bar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => !!s.me);
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  if (!hydrated || !onboarded) return <div className="min-h-dvh" aria-busy />;
  return (
    <>
      <main className="mx-auto max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">{children}</main>
      <TabBar />
    </>
  );
}
