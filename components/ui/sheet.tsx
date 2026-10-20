"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

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
      <div className={`mx-auto flex max-w-[480px] flex-col rounded-t-lg border border-b-0 border-border bg-surface pb-safe ${tall ? "h-full" : "max-h-[85dvh]"}`}>
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <h2 className="flex-1 font-display text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full text-muted">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </dialog>
  );
}
