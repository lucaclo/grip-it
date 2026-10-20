"use client";

import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, Citations, PageHeader, ProgressRing, SectionTitle } from "@/components/ui/bits";
import { NumberField } from "@/components/ui/fields";
import { latestWeight, myTargets } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";

export default function Body() {
  const s = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayWeight = s.weights.find((w) => w.day === today)?.kg ?? null;
  const n = s.nutrition.find((x) => x.day === today);
  const [kg, setKg] = useState<number | null>(todayWeight ?? latestWeight(s));
  const [kcal, setKcal] = useState<number | null>(n?.kcal ?? null);
  const [protein, setProtein] = useState<number | null>(n?.proteinG ?? null);
  const [saved, setSaved] = useState<string | null>(null);
  const t = useMemo(() => myTargets(s), [s]);

  const data = useMemo(() => {
    return s.weights.map((w, i) => {
      const from = Date.parse(w.day) - 6 * 86_400_000;
      const window = s.weights.slice(0, i + 1).filter((x) => Date.parse(x.day) >= from);
      const avg = window.reduce((a, b) => a + b.kg, 0) / window.length;
      return { day: w.day.slice(5), kg: w.kg, avg: Math.round(avg * 10) / 10 };
    });
  }, [s.weights]);

  const first = s.weights[0];
  const last = data[data.length - 1];
  const change = first && last ? Math.round((last.avg - first.kg) * 10) / 10 : 0;

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2500);
  }

  return (
    <>
      <PageHeader title="Body" subtitle="Private to you unless you share it in settings." />
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>Weight</SectionTitle>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <NumberField label="Today" unit="kg" decimal step={0.1} value={kg} onChange={setKg} />
            </div>
            <Button
              className="mb-0 min-h-12"
              disabled={kg == null || kg < 30 || kg > 300}
              onClick={() => {
                s.logWeight(kg!);
                flash("Weight saved");
              }}
            >
              Save
            </Button>
          </div>
          {data.length >= 2 ? (
            <>
              <p className="mt-4 text-sm text-muted">
                7-day average <span className="tabular text-text">{last.avg} kg</span>, {change >= 0 ? "+" : ""}
                {change} kg since you started. Target <span className="tabular text-text">{s.me?.targetWeightKg} kg</span>.
              </p>
              <div className="mt-2 h-48" aria-hidden>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "var(--color-subtle)", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "var(--color-subtle)", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                    {s.me && <ReferenceLine y={s.me.targetWeightKg} stroke="var(--color-muted)" strokeDasharray="4 4" />}
                    <Scatter dataKey="kg" fill="var(--color-subtle)" />
                    <Line dataKey="avg" stroke="var(--color-accent)" strokeWidth={3} dot={false} type="monotone" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-xs text-subtle">Dots: daily weigh-ins. Line: 7-day average. Dashed: your target.</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Weigh in on a couple of days to see your trend. Daily weight jumps around; the average is what matters.</p>
          )}
        </Card>

        <Card>
          <SectionTitle>Today&apos;s food</SectionTitle>
          {t && (
            <div className="mb-4 flex justify-around">
              <ProgressRing label="Calories" unit="kcal" value={kcal ?? 0} target={t.kcal} />
              <ProgressRing label="Protein" unit="g" value={protein ?? 0} target={t.proteinG} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Calories" unit="kcal" value={kcal} onChange={setKcal} />
            <NumberField label="Protein" unit="g" value={protein} onChange={setProtein} />
          </div>
          <Button
            className="mt-3 w-full"
            disabled={kcal == null || protein == null}
            onClick={() => {
              s.logNutrition({ kcal: kcal!, proteinG: protein! });
              flash("Today's totals saved");
            }}
          >
            Save totals
          </Button>
          {t && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-subtle">
                Targets: {t.kcal} kcal and {t.proteinG} g protein ({t.proteinBasis}).
              </p>
              <Citations keys={t.citationKeys} />
            </div>
          )}
        </Card>

        <p className="flex items-center gap-2 text-sm text-subtle">
          <Lock aria-hidden className="size-4" /> Friends can&apos;t see this page. DOTS uses your weight without showing it.
        </p>
      </div>
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 flex justify-center">
        {saved && <span className="rounded-full bg-success px-4 py-2 text-sm font-semibold text-on-accent motion-safe:animate-rise">{saved}</span>}
      </div>
    </>
  );
}
