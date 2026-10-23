"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plate3D } from "@/components/plate-3d";
import { StarOfDavid } from "@/components/star-of-david";
import { isCharlie } from "@/lib/charlie";
import { useStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";

export default function Entry() {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => !!s.me);
  const charlie = useStore((s) => isCharlie(s.me?.name));
  const router = useRouter();
  useEffect(() => {
    if (!hydrated) return;
    // Charlie's star stays up long enough to see; everyone else goes straight in.
    const t = setTimeout(() => router.replace(onboarded ? "/home" : "/onboarding"), charlie ? 1500 : 0);
    return () => clearTimeout(t);
  }, [hydrated, onboarded, charlie, router]);
  return (
    <main className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-6">
        {hydrated && charlie ? <StarOfDavid size={150} /> : <Plate3D size={150} />}
        <p className="font-display text-[2.375rem] font-bold tracking-[-0.01em] motion-safe:animate-enter">Grip It</p>
      </div>
    </main>
  );
}
