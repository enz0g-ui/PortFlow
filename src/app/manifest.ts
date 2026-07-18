import type { MetadataRoute } from "next";

// PWA manifest — installs the mobile glance view (/m) as a home-screen app.
// Required for Web Push on iOS (≥16.4, installed PWAs only) and for the
// future Play Store TWA wrap.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Port Flow — tanker intelligence",
    short_name: "Port Flow",
    description:
      "Watchlist ETAs and vessel alerts at a glance — live AIS across 51 ports.",
    id: "/m",
    start_url: "/m",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
