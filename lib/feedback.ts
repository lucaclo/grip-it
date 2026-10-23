/**
 * App feedback: what a friend writes in Me → Send feedback, plus any screenshots or files.
 * The phone queues it (offline-safe) and posts it to /api/feedback, which saves it to the private
 * Vercel Blob store `grip-it-feedback` under feedback/<date>-<id>/. Read it with `npm run feedback`.
 */
export const FEEDBACK_KINDS = [
  { value: "bug", label: "Something's broken" },
  { value: "idea", label: "Idea" },
  { value: "design", label: "Looks or feel" },
  { value: "other", label: "Other" },
] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["value"];

export const FEEDBACK_LIMITS = {
  textMax: 2000,
  files: 4,
  /** Vercel functions accept up to 4.5 MB per request; screenshots are shrunk on the phone first. */
  totalBytes: 4 * 1024 * 1024,
  /** Longest side of an attached image after shrinking. */
  imageMaxPx: 1600,
} as const;

/** Accepted attachments: images (screenshots, photos), PDFs and plain text. */
export const FEEDBACK_ACCEPT = "image/*,application/pdf,text/plain";
export function acceptedType(type: string) {
  return type.startsWith("image/") || type === "application/pdf" || type === "text/plain";
}

export type FeedbackMeta = {
  /** Made on the phone, so a retry after a lost response overwrites instead of duplicating. */
  clientId: string;
  kind: FeedbackKind;
  text: string;
  /** Profile name, so we know who to follow up with. */
  from: string;
  createdAt: string;
  /** Screen the feedback was opened from, app build, screen size and browser. */
  context: { from?: string; build?: string; screen?: string; userAgent?: string };
};

export type FeedbackError = { error: string };

/** Server-side check of the meta JSON. Returns a clean copy or an error message. */
export function validateMeta(raw: unknown): FeedbackMeta | FeedbackError {
  if (!raw || typeof raw !== "object") return { error: "Missing feedback" };
  const m = raw as Record<string, unknown>;
  const text = typeof m.text === "string" ? m.text.trim() : "";
  if (!text) return { error: "Write something first" };
  if (text.length > FEEDBACK_LIMITS.textMax) return { error: `Keep it under ${FEEDBACK_LIMITS.textMax} characters` };
  const kinds: string[] = FEEDBACK_KINDS.map((k) => k.value);
  const kind = (typeof m.kind === "string" && kinds.includes(m.kind) ? m.kind : "other") as FeedbackKind;
  const clientId = typeof m.clientId === "string" && /^[a-z0-9-]{8,64}$/i.test(m.clientId) ? m.clientId : null;
  if (!clientId) return { error: "Bad request" };
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
  const ctx = (m.context ?? {}) as Record<string, unknown>;
  return {
    clientId,
    kind,
    text,
    from: str(m.from, 80) ?? "Unknown",
    createdAt: str(m.createdAt, 40) ?? new Date().toISOString(),
    context: {
      from: str(ctx.from, 200),
      build: str(ctx.build, 80),
      screen: str(ctx.screen, 40),
      userAgent: str(ctx.userAgent, 300),
    },
  };
}

/** A safe file name for storage: letters, digits, dot, dash and underscore. */
export function safeName(name: string) {
  const n = name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+/, "");
  return n.slice(-80) || "file";
}
