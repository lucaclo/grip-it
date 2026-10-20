"use client";

import { useMemo } from "react";
import { Card, Citations, PageHeader } from "@/components/ui/bits";
import { weeklyVolume } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { MUSCLE_GROUPS, MUSCLE_LABEL, MUSCLES, VOLUME_BAND, VOLUME_CITATIONS, volumeStatus } from "@/lib/science/volume";

const SCALE = 26; // bar width covers 0–26 sets
const STATUS = {
  under: { label: "Under", bar: "bg-muted", text: "text-muted" },
  in_range: { label: "In range", bar: "bg-success", text: "text-success" },
  over: { label: "A lot", bar: "bg-warning", text: "text-warning" },
} as const;

export default function Volume() {
  const s = useStore();
  const vol = useMemo(() => weeklyVolume(s, "me"), [s]);
  return (
    <>
      <PageHeader title="Volume" subtitle="Hard sets per muscle this week. Secondary muscles count as half." />
      <Card className="mb-4">
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
                    Shoulders <span className="tabular text-sm font-normal text-muted">{shoulderTotal} sets total</span>
                  </p>
                )}
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span>{MUSCLE_LABEL[m]}</span>
                  <span>
                    <span className="tabular text-base">{sets}</span> <span className={`text-xs ${st.text}`}>{st.label}</span>
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-surface-raised" aria-hidden>
                  <div
                    className="absolute inset-y-0 rounded-sm bg-text/10"
                    style={{ left: `${(VOLUME_BAND.min / SCALE) * 100}%`, width: `${((VOLUME_BAND.max - VOLUME_BAND.min) / SCALE) * 100}%` }}
                  />
                  <div className={`relative h-3 rounded-full ${st.bar}`} style={{ width: `${Math.min(100, (sets / SCALE) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-subtle">
          Shaded band: {VOLUME_BAND.min}–{VOLUME_BAND.max} sets per week, where most growth happens for most people.
        </p>
      </Card>
      <Citations keys={VOLUME_CITATIONS} />
    </>
  );
}
