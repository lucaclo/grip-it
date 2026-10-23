/** Profile photos: a centred square crop, shrunk to AVATAR_PX and saved as a small JPEG data URL. */
export const AVATAR_PX = 256;

/** The largest centred square inside a w × h image: where to cut it from. */
export function centreSquare(w: number, h: number) {
  const size = Math.min(w, h);
  return { sx: Math.round((w - size) / 2), sy: Math.round((h - size) / 2), size };
}

/** Reads a picked image file into a ~20–40 KB square JPEG. Safari applies the photo's EXIF rotation. */
export async function photoFromFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const { sx, sy, size } = centreSquare(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = AVATAR_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't read that photo.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_PX, AVATAR_PX);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
