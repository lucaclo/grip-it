/** Standard 20 kg barbell and competition plate colours (IWF convention). */
export const BAR_KG = 20;

export type Plate = { kg: number; color: string; size: number };

/** size = plate height relative to a 25 kg bumper. Colours are decorative; the kg is always shown as text. */
export const PLATES: Plate[] = [
  { kg: 25, color: "#e5383b", size: 1 },
  { kg: 20, color: "#2f6bff", size: 1 },
  { kg: 15, color: "#ffc93c", size: 0.9 },
  { kg: 10, color: "#2bb673", size: 0.8 },
  { kg: 5, color: "#f3f1f8", size: 0.62 },
  { kg: 2.5, color: "#e5383b", size: 0.5 },
  { kg: 1.25, color: "#c9c6d6", size: 0.42 },
];

export type Loading = { perSide: Plate[]; leftover: number; barOnly: boolean; belowBar: boolean };

/** Greedy plate loading for a target weight on a 20 kg bar. `leftover` is per side, kg that plates can't make. */
export function loadBar(totalKg: number): Loading {
  if (totalKg < BAR_KG) return { perSide: [], leftover: 0, barOnly: false, belowBar: true };
  let side = Math.round(((totalKg - BAR_KG) / 2) * 100) / 100;
  const perSide: Plate[] = [];
  for (const p of PLATES) {
    while (side + 1e-9 >= p.kg) {
      perSide.push(p);
      side = Math.round((side - p.kg) * 100) / 100;
    }
  }
  return { perSide, leftover: side, barOnly: perSide.length === 0 && side === 0, belowBar: false };
}

export function describeLoading(l: Loading): string {
  if (l.belowBar) return "Lighter than an empty bar";
  if (l.barOnly) return "Empty bar";
  const plates = l.perSide.map((p) => p.kg).join(" + ");
  return `Bar + ${plates} kg each side${l.leftover ? ` (+${l.leftover} kg needs micro-plates)` : ""}`;
}
