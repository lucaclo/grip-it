import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

// Every tab, precached so the app opens offline. A fresh revision per build replaces them on update.
const PAGES = ["/", "/home", "/log", "/body", "/compete", "/feed", "/me", "/volume", "/onboarding", "/~offline"];
const revision = randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
  globPatterns: [".next/static/**/*.{js,css,woff2,png,svg,ico,webp,json}", "public/**/*"],
  additionalPrecacheEntries: PAGES.map((url) => ({ url, revision })),
});
