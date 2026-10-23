/**
 * Typing rules for the set boxes. Weight takes one decimal point (a comma counts, for comma
 * keyboards), so 27.5 and 1.25 work; reps are whole numbers with no upper limit.
 */
export function cleanNumberText(raw: string, decimal: boolean): string {
  const t = raw.replace(",", ".");
  return decimal ? t.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") : t.replace(/\D/g, "");
}

export function parseNumber(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (t === "" || t === ".") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : Math.max(0, n);
}
