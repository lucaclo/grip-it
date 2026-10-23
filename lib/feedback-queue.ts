"use client";

import { get, set } from "idb-keyval";
import { FEEDBACK_LIMITS, type FeedbackMeta } from "./feedback";

/**
 * Feedback waits in IndexedDB until it's delivered, so writing it with no signal (or the app being
 * closed mid-send) never loses it. Versioned like the workout draft: bump and migrate if the shape changes.
 */
const KEY = "gripit:feedback:v1";

export type QueuedFile = { name: string; type: string; blob: Blob };
export type FeedbackEntry = {
  meta: FeedbackMeta;
  files: QueuedFile[];
  status: "waiting" | "sent" | "failed";
  /** Why it failed (rejected by the server); network trouble just keeps it waiting. */
  error?: string;
  sentAt?: string;
};

const EVENT = "gripit:feedback";
const notify = () => window.dispatchEvent(new Event(EVENT));

export async function feedbackEntries(): Promise<FeedbackEntry[]> {
  try {
    return (await get<FeedbackEntry[]>(KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: FeedbackEntry[]) {
  await set(KEY, list);
  notify();
}

async function update(clientId: string, patch: Partial<FeedbackEntry>) {
  const list = await feedbackEntries();
  await save(list.map((e) => (e.meta.clientId === clientId ? { ...e, ...patch } : e)));
}

export function onFeedbackChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export async function queueFeedback(meta: FeedbackMeta, files: QueuedFile[]) {
  const list = await feedbackEntries();
  await save([...list, { meta, files, status: "waiting" }]);
  return flushFeedback();
}

export async function removeFeedback(clientId: string) {
  const list = await feedbackEntries();
  await save(list.filter((e) => e.meta.clientId !== clientId));
}

let flushing: Promise<void> | null = null;

/** Sends everything still waiting. Safe to call often: one run at a time, and a no-op offline. */
export function flushFeedback(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    for (const e of await feedbackEntries()) {
      if (e.status !== "waiting") continue;
      const body = new FormData();
      body.set("meta", JSON.stringify(e.meta));
      for (const f of e.files) body.append("files", new File([f.blob], f.name, { type: f.type }));
      let res: Response;
      try {
        res = await fetch("/api/feedback", { method: "POST", body });
      } catch {
        return; // no signal: try again later
      }
      if (res.ok) {
        // Delivered: keep the note for "Your feedback", drop the file bytes to free space.
        await update(e.meta.clientId, {
          status: "sent",
          sentAt: new Date().toISOString(),
          files: e.files.map((f) => ({ ...f, blob: new Blob() })),
        });
      } else if (res.status >= 500 || res.status === 408 || res.status === 429) {
        return; // server trouble: keep waiting
      } else {
        const msg = await res.json().then((j: { error?: string }) => j.error).catch(() => undefined);
        await update(e.meta.clientId, { status: "failed", error: msg ?? "It couldn't be sent." });
      }
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/**
 * Shrinks a photo or screenshot to at most 1600 px on its longest side as a JPEG, so a few fit in
 * one upload. Keeps the original when it's already smaller, or isn't a still image we can draw.
 */
export async function shrinkImage(file: File): Promise<QueuedFile> {
  const keep = { name: file.name, type: file.type, blob: file as Blob };
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return keep;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, FEEDBACK_LIMITS.imageMaxPx / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return keep;
    return { name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg", blob };
  } catch {
    return keep;
  }
}
