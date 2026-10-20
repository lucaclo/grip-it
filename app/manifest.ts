import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grip It",
    short_name: "Grip It",
    description: "Log lifts, get research-backed targets, beat your friends.",
    start_url: "/",
    display: "standalone",
    background_color: "#16141f",
    theme_color: "#16141f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
