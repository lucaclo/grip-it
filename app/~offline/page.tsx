import { WifiOff } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function Offline() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-[480px] place-items-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <WifiOff aria-hidden className="size-10 text-muted" />
        <h1 className="font-display text-2xl font-semibold">No signal</h1>
        <p className="text-muted">This page hasn&apos;t been saved for offline yet. Your workouts and logs are safe on this phone.</p>
        <a href="/home" className={buttonClass("primary", "lg")}>
          Back to Home
        </a>
      </div>
    </main>
  );
}
