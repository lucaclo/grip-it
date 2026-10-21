"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { BodyMap } from "@/components/body-map";
import { Card, Citations, PageHeader } from "@/components/ui/bits";
import { CountUp } from "@/components/ui/motion";
import { exerciseMap, weekStart, weeklyVolume } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import { isHardSet, MUSCLE_GROUPS, MUSCLE_LABEL, MUSCLES, VOLUME_BAND, VOLUME_CITATIONS, volumeStatus, type Muscle } from "@/lib/science/volume";

const SCALE = 26; // bar width covers 0–26 sets
const STATUS = {
  under: { label: "Under", bar: "bg-accent/70", text: "text-accent" },
  in_range: { label: "In range", bar: "bg-success", text: "text-success" },
  over: { label: "A lot", bar: "bg-warning", text: "text-warning" },
} as const;

export default function Volume() {
  const s = useStore();
  const vol = useMemo(() => weeklyVolume(s, "me"), [s]);
  const [selected, setSelected] = useState<Muscle | null>(null);

  // Which exercises fed the selected muscle this week, and how many (half-)sets each.
  const contributors = useMemo(() => {
    if (!selected) return [];
    const ex = exerciseMap(s);
    const from = weekStart().getTime();
    const totals = new Map<string, number>();
    for (const w of s.workouts) {
      if (w.userId !== "me" || Date.parse(w.startedAt) < from) continue;
      for (const e of w.exercises) {
        const def = ex.get(e.exerciseId);
        if (!def) continue;
        const weight = def.primary === selected ? 1 : def.secondary.includes(selected) ? 0.5 : 0;
        if (!weight) continue;
        totals.set(def.name, (totals.get(def.name) ?? 0) + weight * e.sets.filter(isHardSet).length);
      }
    }
    return [...totals].sort((a, b) => b[1] - a[1]);
  }, [s, selected]);

  const selSets = selected ? (vol[selected] ?? 0) : 0;
  const selStatus = STATUS[volumeStatus(selSets)];
  const total = MUSCLES.reduce((a, m) => a + (vol[m] ?? 0), 0);
  const inRange = MUSCLES.filter((m) => volumeStatus(vol[m] ?? 0) === "in_range").length;

  return (
    <>
      <PageHeader title="Volume" subtitle="Hard sets per muscle this week. Tap a muscle." />
      <div className="stagger flex flex-col gap-4">
        <section className="card-hero rounded-xl p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>
              <CountUp value={inRange} className="num-hero text-2xl" /> <span className="text-text">of {MUSCLES.length} muscles in range</span>
            </span>
            <span className="text-text">
              <CountUp value={total} decimals={total % 1 ? 1 : 0} className="num-hero text-2xl" /> sets
            </span>
          </div>
          <BodyMap vol={vol} selected={selected} onSelect={(m) => setSelected(selected === m ? null : m)} />
        </section>

        {selected && (
          <Card className="motion-safe:animate-rise">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-display text-xl font-semibold">{MUSCLE_LABEL[selected]}</p>
                <p className="text-sm text-muted">
                  <span className="num-hero text-2xl text-text">{selSets}</span> hard sets ·{" "}
                  <span className={selStatus.text}>{selStatus.label}</span> (aim for {VOLUME_BAND.min}–{VOLUME_BAND.max})
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Clear selection" className="grid size-11 place-items-center rounded-full text-muted">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            {contributors.length ? (
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {contributors.map(([name, n]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="tabular text-muted">{n} sets</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">0 sets this week. Add an exercise for it next session.</p>
            )}
          </Card>
        )}

        <Card>
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
                  <button
                    type="button"
                    onClick={() => setSelected(selected === m ? null : m)}
                    aria-pressed={selected === m}
                    className={`-mx-2 block w-[calc(100%+1rem)] rounded-md px-2 py-1 text-left transition-colors ${selected === m ? "bg-accent/12 ring-1 ring-accent/40" : ""}`}
                  >
                    <span className="mb-1 flex items-baseline justify-between text-sm">
                      <span>{MUSCLE_LABEL[m]}</span>
                      <span>
                        <span className="tabular text-base">{sets}</span> <span className={`text-xs ${st.text}`}>{st.label}</span>
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
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-subtle">
            Shaded band: {VOLUME_BAND.min}–{VOLUME_BAND.max} sets per week, where most growth happens for most people.
          </p>
        </Card>
        <Citations keys={VOLUME_CITATIONS} />
      </div>
    </>
  );
}
