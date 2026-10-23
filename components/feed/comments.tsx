"use client";

import { CornerDownRight, SendHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { threadFor, userName } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { Comment } from "@/lib/data/types";
import { ago } from "@/lib/time";

const MAX = 500;

/** Comments and replies on one feed post, with a composer pinned to the bottom of the sheet. */
export function CommentsSheet({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const s = useStore();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const thread = itemId ? threadFor(s, itemId) : [];
  const count = thread.reduce((a, c) => a + 1 + c.replies.length, 0);

  // Fresh composer for each post (reset during render, not in an effect).
  const [shownFor, setShownFor] = useState(itemId);
  if (itemId !== shownFor) {
    setShownFor(itemId);
    setText("");
    setReplyTo(null);
  }

  function send() {
    if (!itemId || !text.trim()) return;
    s.addComment(itemId, text, replyTo?.id ?? null);
    setText("");
    setReplyTo(null);
    setNow(Date.now());
    // New top-level comments land at the bottom; bring them into view.
    requestAnimationFrame(() => end.current?.scrollIntoView({ block: "end", behavior: "smooth" }));
  }

  const name = (c: Comment) => (c.userId === "me" ? "You" : userName(s, c.userId));

  const row = (c: Comment, reply = false) => (
    <div key={c.id} className={`flex gap-3 ${reply ? "ml-12" : ""}`}>
      <span className={reply ? "scale-90" : ""}>
        <Avatar name={c.userId === "me" ? (s.me?.name ?? "You") : userName(s, c.userId)} you={c.userId === "me"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{name(c)}</span> <span className="text-subtle">· {ago(c.at, now)}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
        <div className="-ml-2 flex gap-1">
          {!reply && (
            <button
              type="button"
              onClick={() => {
                setReplyTo(c);
                input.current?.focus();
              }}
              className="min-h-9 rounded-md px-2 text-sm font-medium text-muted"
            >
              Reply
            </button>
          )}
          {c.userId === "me" && (
            <button
              type="button"
              onClick={() => {
                if (replyTo?.id === c.id) setReplyTo(null);
                s.deleteComment(c.id);
              }}
              className="min-h-9 rounded-md px-2 text-sm text-subtle"
              aria-label={reply ? "Delete reply" : thread.find((t) => t.id === c.id)?.replies.length ? "Delete comment and its replies" : "Delete comment"}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={!!itemId} onClose={onClose} title={count ? `Comments · ${count}` : "Comments"} tall>
      <div className="flex min-h-full flex-col">
        <div className="flex-1">
          {thread.length === 0 ? (
            <p className="py-10 text-center text-muted">No comments yet. Say something nice.</p>
          ) : (
            <ul className="flex flex-col gap-4 pt-1 pb-4">
              {thread.map((c) => (
                <li key={c.id} className="flex flex-col gap-3">
                  {row(c)}
                  {c.replies.map((r) => row(r, true))}
                </li>
              ))}
            </ul>
          )}
          <div ref={end} />
        </div>

        <form
          className="sticky bottom-0 -mx-4 border-t border-white/10 bg-surface/95 px-4 pt-2 pb-2 backdrop-blur"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {replyTo && (
            <p className="mb-1.5 flex items-center gap-2 text-sm text-muted">
              <CornerDownRight aria-hidden className="size-4" />
              <span className="flex-1 truncate">
                Replying to <span className="text-text">{name(replyTo)}</span>
              </span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="grid size-9 place-items-center rounded-full">
                <X aria-hidden className="size-4" />
              </button>
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="comment" className="sr-only">
              {replyTo ? `Reply to ${name(replyTo)}` : "Add a comment"}
            </label>
            <textarea
              id="comment"
              ref={input}
              rows={1}
              value={text}
              maxLength={MAX}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={replyTo ? `Reply to ${name(replyTo)}…` : "Add a comment…"}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-md border border-border-input bg-bg px-3 py-2.5 text-base outline-none [field-sizing:content] focus:border-focus"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Post"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-accent shadow-glow transition-opacity disabled:opacity-35 disabled:shadow-none"
            >
              <SendHorizontal aria-hidden className="size-5" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-subtle">Comments stay on this phone until friends can join.</p>
        </form>
      </div>
    </Sheet>
  );
}
