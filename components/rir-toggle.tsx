"use client";

import { useState } from "react";
import { RirInfo, RirText } from "@/components/explainers";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/fields";
import { Research } from "@/components/ui/info";
import { Sheet } from "@/components/ui/sheet";
import { RIR_CITATIONS } from "@/lib/science/effort";

/** The RIR switch for onboarding and Me. Turning it on explains what it is and what changes. */
export function RirToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const [intro, setIntro] = useState(false);
  return (
    <>
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Toggle
            label="Track reps left (RIR)"
            description="After each set, tap how many more reps you could have done."
            checked={checked}
            onChange={(v) => {
              onChange(v);
              if (v) setIntro(true);
            }}
          />
        </div>
        <RirInfo className="ml-1" />
      </div>
      <Sheet open={intro} onClose={() => setIntro(false)} title="Reps left (RIR) is on">
        <div className="flex flex-col gap-4 text-base leading-relaxed">
          <RirText />
          <Button size="lg" onClick={() => setIntro(false)}>
            Got it
          </Button>
          <Research keys={RIR_CITATIONS} />
        </div>
      </Sheet>
    </>
  );
}
