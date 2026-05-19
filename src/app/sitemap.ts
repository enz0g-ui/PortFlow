import type { MetadataRoute } from "next";

const BASE = "https://portflow.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/precision`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/methodology`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/sources`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/status`, lastModified: now, changeFrequency: "hourly", priority: 0.3 },
    { url: `${BASE}/api-docs`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];
}
