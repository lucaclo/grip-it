/** Profile photos: a square crop (shown as a circle), shrunk to AVATAR_PX and saved as a small JPEG data URL. */
export const AVATAR_PX = 256;
export const MAX_ZOOM = 4;

/**
 * The crop view: a square frame `frame` px wide over an image `w` × `h`. At zoom 1 the image just covers the
 * frame (short side = frame); `x`, `y` are the image's top-left corner relative to the frame's, in px.
 */
export type CropView = { w: number; h: number; frame: number; zoom: number; x: number; y: number };

const scaleOf = (v: CropView) => (v.frame / Math.min(v.w, v.h)) * v.zoom;

/** Zoom kept in 1…MAX_ZOOM, and the image kept covering the whole frame (no empty edges). */
export function clampView(v: CropView): CropView {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
  const s = (v.frame / Math.min(v.w, v.h)) * zoom;
  const clamp = (pos: number, size: number) => Math.min(0, Math.max(v.frame - size * s, pos));
  return { ...v, zoom, x: clamp(v.x, v.w), y: clamp(v.y, v.h) };
}

/** The view at zoom 1 with the image centred: where the cropper starts. */
export function initialView(w: number, h: number, frame: number): CropView {
  const s = frame / Math.min(w, h);
  return { w, h, frame, zoom: 1, x: (frame - w * s) / 2, y: (frame - h * s) / 2 };
}

/** Change zoom while keeping the image point under (px, py) in the frame where it is (pinch and wheel). */
export function zoomAt(v: CropView, zoom: number, px = v.frame / 2, py = v.frame / 2): CropView {
  const next = Math.min(MAX_ZOOM, Math.max(1, zoom));
  const k = next / v.zoom;
  return clampView({ ...v, zoom: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
}

/** The square of the source image inside the frame, in image pixels. */
export function cropRegion(v: CropView) {
  const s = scaleOf(v);
  return { sx: Math.max(0, -v.x / s), sy: Math.max(0, -v.y / s), size: v.frame / s };
}

/** The largest centred square inside a w × h image: where to cut it from. */
export function centreSquare(w: number, h: number) {
  const size = Math.min(w, h);
  return { sx: Math.round((w - size) / 2), sy: Math.round((h - size) / 2), size };
}

/** Opens a picked file as a decoded image. Safari applies the photo's EXIF rotation. Revoke `url` when done. */
export async function openPhoto(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Couldn't read that photo.");
  }
  return { img, url };
}

/** Cuts a square region out of the image into a ~5–40 KB JPEG data URL. */
export function photoFromRegion(img: HTMLImageElement, r: { sx: number; sy: number; size: number }): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't read that photo.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, r.sx, r.sy, r.size, r.size, 0, 0, AVATAR_PX, AVATAR_PX);
  return canvas.toDataURL("image/jpeg", 0.85);
}
