import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The G-plate mark as a data URI, for next/og images. */
export async function iconDataUri() {
  const svg = await readFile(join(process.cwd(), "app/icon.svg"), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Barlow Condensed Bold Italic for the wordmark; falls back to the default font if offline. */
export async function displayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,700", {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/533.21.1" },
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}
