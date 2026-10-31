import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stylora",
    short_name: "Stylora",
    description: "See the look. Make it yours.",
    start_url: "/create",
    scope: "/",
    display: "standalone",
    background_color: "#f5f2ec",
    theme_color: "#642e3b",
    icons: [
      {
        src: "/brand/stylora-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/stylora-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
