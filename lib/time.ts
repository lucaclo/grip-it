/** Short relative time for posts and comments: 5m, 3h, 2d. */
export function ago(iso: string, now: number) {
  const m = Math.round((now - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
