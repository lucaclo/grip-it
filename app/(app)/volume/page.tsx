"use client";

import { useMemo } from "react";
import { MuscleHeat } from "@/components/anatomy/muscle-heat";
import { HardSetsInfo } from "@/components/explainers";
import { Card, PageHeader } from "@/components/ui/bits";
import { InfoButton } from "@/components/ui/info";
import { CountUp } from "@/components/ui/motion";
import { weeklyHardSets, weeklyMuscleWork } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { MUSCLE_GROUPS, MUSCLE_LABEL, MUSCLES, VOLUME_BAND, VOLUME_CITATIONS, volumeStatus } from "@/lib/science/volume";

const SCALE = 26; // bar width covers 0–26 sets
const STATUS = {
  under: { label: "Under", bar: "bg-accent/70", text: "text-accent" },
  in_range: { label: "In range", bar: "bg-success", text: "text-success" },
  over: { label: "A lot", bar: "bg-warning", text: "text-warning" },
} as const;
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

export default function Volume() {
  const s = useStore();
  const work = useMemo(() => weeklyMuscleWork(s, "me"), [s]);
  const vol = work.hardSets;
  // Primary sets only, so a bench set isn't counted again for triceps and shoulders.
  const total = useMemo(() => weeklyHardSets(s, "me"), [s]);
  const inRange = MUSCLES.filter((m) => volumeStatus(vol[m] ?? 0) === "in_range").length;

  return (
    <>
      <PageHeader back="/home" title="Volume" subtitle="This week, Monday to Sunday" />
      <div className="stagger flex flex-col gap-4">
        <MuscleHeat work={work} scale="week" title="This week" empty="No working sets yet this week. Log a workout and your muscles light up here." />

        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-sm text-muted">
                Hard sets per muscle
                <HardSetsInfo className="ml-1" />
              </p>
              <p className="text-sm">
                <CountUp value={inRange} className="num-hero text-2xl" /> <span className="text-muted">of {MUSCLES.length} in range</span>
              </p>
            </div>
            <p className="text-right text-sm text-muted">
              <CountUp value={total} decimals={total % 1 ? 1 : 0} className="num-hero block text-2xl text-text" />
              hard sets
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {MUSCLES.map((m) => {
              const sets = vol[m] ?? 0;
              const st = STATUS[volumeStatus(sets)];
              const shoulders = MUSCLE_GROUPS.shoulders.muscles;
              const isHead = shoulders.includes(m);
              const shoulderTotal = shoulders.reduce((a, x) => a + (vol[x] ?? 0), 0);
              return (
                <li key={m} className={isHead ? "border-l-2 border-accent/40 pl-3" : ""}>
                  {m === shoulders[0] && (
                    <p className="mb-2 -ml-3 flex items-baseline justify-between pl-3 font-display text-base font-semibold">
                      Shoulders <span className="tabular text-sm font-normal text-muted">{fmt(shoulderTotal)} set{shoulderTotal === 1 ? "" : "s"} total</span>
                    </p>
                  )}
                  <span className="mb-1 flex items-baseline justify-between text-sm">
                    <span>{MUSCLE_LABEL[m]}</span>
                    <span>
                      <span className="tabular text-base">{fmt(sets)}</span> <span className={`text-xs ${st.text}`}>{st.label}</span>
                    </span>
                  </span>
                  <span className="relative block h-3 rounded-full bg-surface-raised" aria-hidden>
                    <span
                      className="absolute inset-y-0 rounded-sm bg-text/10"
                      style={{ left: `${(VOLUME_BAND.min / SCALE) * 100}%`, width: `${((VOLUME_BAND.max - VOLUME_BAND.min) / SCALE) * 100}%` }}
                    />
                    <span
                      className={`relative block h-3 origin-left rounded-full ${st.bar} motion-safe:animate-[grow-x_700ms_var(--ease-standard)_both]`}
                      style={{ width: `${Math.min(100, (sets / SCALE) * 100)}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-2 text-sm text-subtle">
            <span>Shaded band: {VOLUME_BAND.min}–{VOLUME_BAND.max} hard sets a week</span>
            <InfoButton title="Weekly sets per muscle" label="Why 10 to 20 sets" keys={VOLUME_CITATIONS}>
              <p>
                Most people grow best with about <strong>{VOLUME_BAND.min}–{VOLUME_BAND.max} hard sets per muscle per week</strong>.
                Fewer still works, just more slowly; much more gets hard to recover from.
              </p>
              <p className="text-muted">
                Sets that mainly train another muscle count half here, e.g. bench press is a full set for chest and half a
                set for triceps and front shoulders.
              </p>
            </InfoButton>
          </div>
        </Card>
      </div>
    </>
  );
}
