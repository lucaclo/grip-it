import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow" });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: "Grip It",
  description: "Log lifts, get research-backed targets, beat your friends.",
  appleWebApp: { capable: true, title: "Grip It", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#16141f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh antialiased">
        <div className="aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
