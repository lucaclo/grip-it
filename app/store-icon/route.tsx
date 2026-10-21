import { ImageResponse } from "next/og";
import { iconDataUri } from "@/lib/og";

/** 1024px opaque app icon (App Store size), rendered from app/icon.svg. Saved to branding/ for handing out. */
export async function GET() {
  const icon = await iconDataUri();
  // <img> is how next/og (Satori) draws images; next/image doesn't apply here.
  // eslint-disable-next-line @next/next/no-img-element
  return new ImageResponse(<img src={icon} width={1024} height={1024} alt="" />, { width: 1024, height: 1024 });
}
