"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Bottom sheet on the native <dialog>: focus trap, Esc to close and focus return come for free. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  tall?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={`m-0 mt-auto w-full max-w-none bg-transparent p-0 text-text backdrop:bg-black/60 open:animate-rise ${tall ? "h-[92dvh] max-h-[92dvh]" : "max-h-[85dvh]"}`}
    >
      <div
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined }}
        className={`mx-auto flex max-w-[480px] flex-col rounded-t-lg border border-b-0 border-border bg-surface pb-safe ${tall ? "h-full" : "max-h-[85dvh]"} ${dragY ? "" : "transition-transform duration-200"}`}
      >
        {/* Grabber + header: drag down to dismiss (the close button is the non-gesture alternative). */}
        <div
          className="touch-none"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            startY.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) =>
            startY.current != null &&
            setDragY(Math.max(0, e.clientY - startY.current))
          }
          onPointerUp={() => {
            if (dragY > 90) onClose();
            startY.current = null;
            setDragY(0);
          }}
          onPointerCancel={() => {
            startY.current = null;
            setDragY(0);
          }}
        >
          <div
            aria-hidden
            className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border-input"
          />
          <div className="flex items-center gap-2 px-4 pt-2 pb-2">
            <h2 className="flex-1 font-display text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-11 place-items-center rounded-full text-muted"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </dialog>
  );
}
