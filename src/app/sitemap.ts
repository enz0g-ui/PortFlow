import type { MetadataRoute } from "next";
import { listBriefs } from "@/lib/news/briefs";
import { PORTS } from "@/lib/ports";

const BASE = "https://portflow.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const briefs: MetadataRoute.Sitemap = listBriefs().map((b) => ({
    url: `${BASE}/news/${b.slug}`,
    lastModified: new Date(b.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const ports: MetadataRoute.Sitemap = PORTS.map((p) => ({
    url: `${BASE}/ports/${p.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/precision`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/news`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/methodology`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/sources`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/status`, lastModified: now, changeFrequency: "hourly", priority: 0.3 },
    { url: `${BASE}/api-docs`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/ports`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/receipts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/demurrage-calculator`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...ports,
    ...briefs,
  ];
}
