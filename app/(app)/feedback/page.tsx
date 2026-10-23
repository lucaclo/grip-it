"use client";

import { CheckCircle2, Clock, FileText, Paperclip, Send, TriangleAlert, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/bits";
import { useStore } from "@/lib/data/store";
import { acceptedType, FEEDBACK_ACCEPT, FEEDBACK_KINDS, FEEDBACK_LIMITS, type FeedbackKind } from "@/lib/feedback";
import {
  feedbackEntries,
  flushFeedback,
  onFeedbackChange,
  queueFeedback,
  removeFeedback,
  shrinkImage,
  type FeedbackEntry,
  type QueuedFile,
} from "@/lib/feedback-queue";

const mb = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

type Attachment = QueuedFile & { id: string; preview: string | null };

export default function FeedbackPage() {
  return (
    <Suspense>
      <Feedback />
    </Suspense>
  );
}

function Feedback() {
  const me = useStore((s) => s.me);
  const from = useSearchParams().get("from") ?? undefined;
  const fileId = useId();
  const [kind, setKind] = useState<FeedbackKind>("idea");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "sent" | "queued">(null);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);

  // Past feedback from this phone, kept fresh as the queue sends in the background.
  useEffect(() => {
    let live = true;
    const load = () => feedbackEntries().then((e) => live && setEntries([...e].reverse()));
    load();
    const off = onFeedbackChange(load);
    return () => {
      live = false;
      off();
    };
  }, []);

  // Free image previews when they're removed, sent, or the page closes.
  const live = useRef(files);
  useEffect(() => {
    live.current = files;
  }, [files]);
  useEffect(() => () => live.current.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), []);
  function clearFiles(keep: (f: Attachment) => boolean) {
    setFiles((cur) => {
      cur.filter((f) => !keep(f)).forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      return cur.filter(keep);
    });
  }

  const total = useMemo(() => files.reduce((a, f) => a + f.blob.size, 0), [files]);
  const tooBig = total > FEEDBACK_LIMITS.totalBytes;

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const picked = [...list];
    const rejected = picked.filter((f) => !acceptedType(f.type));
    const room = FEEDBACK_LIMITS.files - files.length;
    const ok = picked.filter((f) => acceptedType(f.type)).slice(0, Math.max(0, room));
    const shrunk = await Promise.all(ok.map(shrinkImage));
    setFiles((cur) => [
      ...cur,
      ...shrunk.map((f) => ({ ...f, id: uid(), preview: f.type.startsWith("image/") ? URL.createObjectURL(f.blob) : null })),
    ]);
    if (rejected.length) setError("Only images, PDFs and text files can be attached.");
    else if (picked.length > ok.length) setError(`Up to ${FEEDBACK_LIMITS.files} files per message.`);
  }

  async function send() {
    if (!text.trim() || tooBig || busy) return;
    setBusy(true);
    setError(null);
    const meta = {
      clientId: uid(),
      kind,
      text: text.trim(),
      from: me?.name ?? "Unknown",
      createdAt: new Date().toISOString(),
      context: {
        from,
        build: process.env.NEXT_PUBLIC_BUILD,
        screen: `${screen.width}x${screen.height}`,
        userAgent: navigator.userAgent,
      },
    };
    try {
      await queueFeedback(meta, files.map(({ name, type, blob }) => ({ name, type, blob })));
      const saved = (await feedbackEntries()).find((e) => e.meta.clientId === meta.clientId);
      if (saved?.status === "failed") {
        setError(saved.error ?? "It couldn't be sent.");
        await removeFeedback(meta.clientId);
      } else {
        setDone(saved?.status === "sent" ? "sent" : "queued");
        setText("");
        clearFiles(() => false);
      }
    } catch {
      setError("Couldn't save that on this phone. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader back="/me" title="Feedback" subtitle="What should we fix or build next? Screenshots help." />
      <div className="flex flex-col gap-4">
        {done && (
          <p
            role="status"
            className={`flex items-start gap-2 rounded-md border p-3 text-sm motion-safe:animate-rise ${done === "sent" ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}
          >
            {done === "sent" ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" /> : <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />}
            <span className="flex-1">
              {done === "sent"
                ? "Sent. Thanks, it really helps."
                : "Saved on your phone. It'll send by itself when you're back online."}
            </span>
            <button type="button" onClick={() => setDone(null)} aria-label="Dismiss" className="-m-2 grid size-9 place-items-center">
              <X aria-hidden className="size-4" />
            </button>
          </p>
        )}

        <Card className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-muted">What&apos;s it about?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {FEEDBACK_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === k.value}
                  onClick={() => setKind(k.value)}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${kind === k.value ? "border-accent/70 bg-accent/18 text-text" : "border-border text-muted"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-text" className="text-sm font-medium text-muted">
              Your feedback
            </label>
            <textarea
              id="fb-text"
              value={text}
              maxLength={FEEDBACK_LIMITS.textMax}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={
                kind === "bug"
                  ? "What happened, and what did you expect? Which screen?"
                  : "What would make Grip It better for you?"
              }
              className="min-h-36 rounded-md border border-border-input bg-bg px-3 py-2.5 text-base outline-none focus:border-focus"
            />
            <p className="text-right text-xs text-subtle tabular">
              {text.length}/{FEEDBACK_LIMITS.textMax}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {files.length > 0 && (
              <ul className="grid grid-cols-4 gap-2" aria-label="Attachments">
                {files.map((f) => (
                  <li key={f.id} className="relative aspect-square overflow-hidden rounded-md border border-border bg-surface-raised">
                    {f.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                      <img src={f.preview} alt={f.name} className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full flex-col items-center justify-center gap-1 p-1 text-center text-[0.6875rem] text-muted">
                        <FileText aria-hidden className="size-5" />
                        <span className="line-clamp-2 break-all">{f.name}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => clearFiles((x) => x.id !== f.id)}
                      aria-label={`Remove ${f.name}`}
                      className="absolute top-0.5 right-0.5 grid size-8 place-items-center rounded-full bg-bg/80 text-text"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {files.length < FEEDBACK_LIMITS.files && (
              <label
                htmlFor={fileId}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-input text-sm text-muted active:bg-surface-raised"
              >
                <Paperclip aria-hidden className="size-4" />
                Attach screenshots or files
                <input
                  id={fileId}
                  type="file"
                  multiple
                  accept={FEEDBACK_ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <p className={`text-xs ${tooBig ? "text-danger" : "text-subtle"}`}>
              {files.length ? `${files.length} of ${FEEDBACK_LIMITS.files} files · ${mb(total)}` : `Up to ${FEEDBACK_LIMITS.files} images, PDFs or text files.`}
              {tooBig && ` Too big, the limit is ${mb(FEEDBACK_LIMITS.totalBytes)}.`}
            </p>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-danger">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <Button size="lg" onClick={send} disabled={!text.trim() || tooBig || busy}>
            <Send aria-hidden className="size-5" /> {busy ? "Sending…" : "Send feedback"}
          </Button>
          <p className="text-xs text-subtle">
            Sent with your name ({me?.name ?? "Unknown"}), your phone&apos;s screen size and browser, and the app version, so
            we can follow up and reproduce problems. Nothing else from the app is included.
          </p>
        </Card>

        {entries.length > 0 && (
          <section>
            <SectionTitle>Your feedback</SectionTitle>
            <ul className="card flex flex-col divide-y divide-border rounded-lg">
              {entries.map((e) => (
                <li key={e.meta.clientId} className="flex gap-3 px-4 py-3">
                  <span className="mt-0.5">
                    {e.status === "sent" ? (
                      <CheckCircle2 aria-label="Sent" className="size-5 text-success" />
                    ) : e.status === "waiting" ? (
                      <Clock aria-label="Waiting for signal" className="size-5 text-warning" />
                    ) : (
                      <TriangleAlert aria-label="Couldn't send" className="size-5 text-danger" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm">{e.meta.text}</span>
                    <span className="mt-0.5 block text-xs text-subtle">
                      {FEEDBACK_KINDS.find((k) => k.value === e.meta.kind)?.label} ·{" "}
                      {new Date(e.meta.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {e.files.length > 0 && ` · ${e.files.length} file${e.files.length === 1 ? "" : "s"}`} ·{" "}
                      {e.status === "sent" ? "Sent" : e.status === "waiting" ? "Waiting for signal" : e.error}
                    </span>
                  </span>
                  {e.status !== "sent" && (
                    <span className="flex flex-col items-end gap-1">
                      {e.status === "waiting" && (
                        <button type="button" onClick={() => flushFeedback()} className="min-h-9 px-1 text-sm text-accent">
                          Retry
                        </button>
                      )}
                      <button type="button" onClick={() => removeFeedback(e.meta.clientId)} className="min-h-9 px-1 text-sm text-subtle">
                        Delete
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
