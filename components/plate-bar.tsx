import { describeLoading, loadBar, type Plate } from "@/lib/plates";

const THICK: Record<number, number> = { 25: 15, 20: 14, 15: 12, 10: 11, 5: 8, 2.5: 7, 1.25: 5 };

function Side({ plates, flip }: { plates: Plate[]; flip?: boolean }) {
  return (
    <div className={`flex h-full items-center gap-[2px] ${flip ? "flex-row-reverse" : ""}`}>
      {plates.map((p, i) => (
        <span
          key={i}
          className="rounded-[3px] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_2px_6px_rgb(0_0_0/0.35)]"
          style={{ width: THICK[p.kg] ?? 5, height: `${p.size * 100}%`, background: p.color }}
        />
      ))}
    </div>
  );
}

/** The signature element: the target weight drawn as plates on a bar. Barbell lifts only. */
export function PlateBar({ kg, size = "md" }: { kg: number; size?: "sm" | "md" }) {
  const l = loadBar(kg);
  const label = describeLoading(l);
  if (l.belowBar) return null;
  const h = size === "sm" ? "h-8" : "h-16";
  return (
    <figure className="flex flex-col items-center gap-1" aria-label={`${kg} kg: ${label}`} role="img">
      <div className={`relative flex ${h} w-full max-w-[260px] items-center justify-center`} aria-hidden>
        {/* bar */}
        <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-subtle/40 via-muted to-subtle/40" />
        <div className="relative flex h-full items-center">
          <Side plates={l.perSide} flip />
          <span className="mx-[3px] h-[45%] w-[3px] rounded-sm bg-muted" />
          <span className="h-[10px] w-14 rounded-sm bg-gradient-to-b from-text/70 to-subtle" />
          <span className="mx-[3px] h-[45%] w-[3px] rounded-sm bg-muted" />
          <Side plates={l.perSide} />
        </div>
      </div>
      {size === "md" && <figcaption className="text-xs text-muted">{label}</figcaption>}
    </figure>
  );
}
