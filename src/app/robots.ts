import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/sign-in",
        "/sign-up",
        "/welcome",
        "/widget/",
        // Fiches navire, preuves et criblage : déjà en noindex, et le
        // graphe génère une infinité d'URL (?t=…) — les robots d'IA y
        // faisaient ~600 000 requêtes/jour en nov. 2026.
        "/brief/vessel/",
        "/brief/contact/",
        "/brief/screen",
        "/brief/*?",
      ],
    },
    sitemap: "https://portflow.uk/sitemap.xml",
    host: "https://portflow.uk",
  };
}
