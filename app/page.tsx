"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";

export default function Entry() {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => !!s.me);
  const router = useRouter();
  useEffect(() => {
    if (hydrated) router.replace(onboarded ? "/home" : "/onboarding");
  }, [hydrated, onboarded, router]);
  return (
    <main className="grid min-h-dvh place-items-center">
      <p className="font-display text-display font-bold uppercase text-accent">Grip It</p>
    </main>
  );
}
