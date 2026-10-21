import { ImageResponse } from "next/og";
import { displayFont, iconDataUri } from "@/lib/og";

export const alt = "Grip It: log lifts, get research-backed targets, beat your mates.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share image (link previews in Messages, WhatsApp, etc.). */
export default async function OpenGraphImage() {
  const [icon, font] = await Promise.all([iconDataUri(), displayFont()]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background:
            "radial-gradient(70% 90% at 0% 0%, rgba(123,72,245,0.75), transparent 60%), radial-gradient(60% 80% at 100% 100%, rgba(196,75,255,0.5), transparent 60%), #16141f",
          color: "#f6f4fb",
        }}
      >
        <img src={icon} width={300} height={300} alt="" style={{ borderRadius: 66 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 150, fontFamily: "Display", fontStyle: "italic", lineHeight: 1, letterSpacing: -2 }}>GRIP IT</div>
          <div style={{ fontSize: 38, marginTop: 18, color: "#b9b4cc" }}>Log lifts. Hit research-backed targets.</div>
          <div style={{ fontSize: 38, color: "#d4ff3a" }}>Beat your mates.</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Display", data: font, style: "italic", weight: 700 }] : [] },
  );
}
