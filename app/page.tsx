"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plate3D } from "@/components/plate-3d";
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
      <div className="flex flex-col items-center gap-6">
        <Plate3D size={150} />
        <p className="text-brand font-display text-display font-bold uppercase motion-safe:animate-enter">Grip It</p>
      </div>
    </main>
  );
}
