import type { MetadataRoute } from "next";
import { OWNER } from "./_config/owner";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${OWNER.displayName}'s Portfolio`,
    short_name: OWNER.osName,
    description: OWNER.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0c",
    theme_color: "#0c0c0c",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
