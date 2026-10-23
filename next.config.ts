import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build stamp sent with app feedback, so a report can be matched to the version it came from.
  env: { NEXT_PUBLIC_BUILD: new Date().toISOString().slice(0, 16).replace("T", " ") },
  // Lets phones on the same Wi-Fi load the dev server (npm run dev:phone).
  // 172.*: private range, including iPhone Personal Hotspot (172.20.10.x).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // cacheComponents / partialPrefetching are off: every app screen renders from data saved in the
  // browser, so server caching does nothing yet. Revisit when Supabase arrives (issue #10).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
