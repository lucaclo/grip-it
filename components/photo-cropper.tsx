"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { clampView, cropRegion, initialView, MAX_ZOOM, photoFromRegion, zoomAt, type CropView } from "@/lib/avatar";

/**
 * Position a photo inside a circle before it becomes your avatar: drag to move, pinch / scroll / slider to
 * zoom, arrow keys and +/- on a keyboard. Everything outside the circle is dimmed and left out.
 */
export function PhotoCropper({
  photo,
  onCancel,
  onDone,
}: {
  photo: { img: HTMLImageElement; url: string } | null;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<CropView | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  // Fit the photo to the frame once the sheet is open and laid out (the frame's width depends on the phone).
  useEffect(() => {
    if (!photo) return;
    const id = requestAnimationFrame(() => {
      const frame = frameRef.current?.clientWidth || 300;
      setView(initialView(photo.img.naturalWidth, photo.img.naturalHeight, frame));
    });
    return () => cancelAnimationFrame(id);
  }, [photo]);

  // Trackpad / mouse wheel zoom, around the pointer. Non-passive so the page doesn't scroll instead.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      setView((v) => v && zoomAt(v, v.zoom * Math.exp(-e.deltaY / 300), e.clientX - r.left, e.clientY - r.top));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [photo]);

  function local(e: React.PointerEvent) {
    const r = frameRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const pts = [...pointers.current.values()];
    // Functional updates: several moves can arrive before React re-renders, and each must build on the last.
    if (pts.length >= 2 && pinch.current) {
      // Two fingers: zoom by how far apart they are, around their midpoint.
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const zoom = pinch.current.zoom * (dist / pinch.current.dist);
      setView((v) => v && zoomAt(v, zoom, (a.x + b.x) / 2, (a.y + b.y) / 2));
    } else if (pts.length === 1) {
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      setView((v) => v && clampView({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  }

  function startPinch() {
    const pts = [...pointers.current.values()];
    pinch.current =
      pts.length >= 2 && view ? { dist: Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)), zoom: view.zoom } : null;
  }

  const scale = view ? (view.frame / Math.min(view.w, view.h)) * view.zoom : 1;

  return (
    <Sheet open={!!photo} onClose={onCancel} title="Move and scale">
      <div className="flex flex-col gap-4">
        <div
          ref={frameRef}
          tabIndex={0}
          role="application"
          aria-label="Photo crop. Drag to move, pinch to zoom. Arrow keys move, plus and minus zoom."
          className="relative aspect-square w-full touch-none overflow-hidden rounded-md bg-bg outline-none select-none focus-visible:ring-2 focus-visible:ring-focus"
          onPointerDown={(e) => {
            pointers.current.set(e.pointerId, local(e));
            startPinch();
            try {
              e.currentTarget.setPointerCapture(e.pointerId); // keep the drag when a finger slides off the frame
            } catch {
              // pointer already gone: nothing to capture
            }
          }}
          onPointerMove={onMove}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            startPinch();
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            startPinch();
          }}
          onKeyDown={(e) => {
            if (!view) return;
            const step = 12;
            const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
            if (moves[e.key]) {
              e.preventDefault();
              setView(clampView({ ...view, x: view.x + moves[e.key][0], y: view.y + moves[e.key][1] }));
            } else if (e.key === "+" || e.key === "=") setView(zoomAt(view, view.zoom * 1.15));
            else if (e.key === "-") setView(zoomAt(view, view.zoom / 1.15));
          }}
        >
          {photo && view && (
            // A local object URL being positioned by hand: next/image would only get in the way.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
              style={{ width: view.w, height: view.h, transform: `translate(${view.x}px, ${view.y}px) scale(${scale})` }}
            />
          )}
          {/* The circle: everything outside it is dimmed; a hairline marks the edge. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgb(14_13_19/0.72)] ring-1 ring-white/50" />
        </div>

        <label className="flex items-center gap-3">
          <span className="sr-only">Zoom</span>
          <ZoomOut aria-hidden className="size-5 shrink-0 text-muted" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view?.zoom ?? 1}
            onChange={(e) => view && setView(zoomAt(view, Number(e.target.value)))}
            className="h-11 w-full accent-[var(--color-accent)]"
          />
          <ZoomIn aria-hidden className="size-5 shrink-0 text-muted" />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!view} onClick={() => photo && view && onDone(photoFromRegion(photo.img, cropRegion(view)))}>
            Use photo
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
