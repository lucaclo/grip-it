import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the same Wi-Fi load the dev server (npm run dev:phone).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
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

export default nextConfig;
