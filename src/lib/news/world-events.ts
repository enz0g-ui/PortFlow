import { PORTS } from "../ports";
import { listPiracyIncidents } from "../piracy-asam";
import { computeKpiSnapshot } from "../kpi";
import { getChokepointTransitCounts } from "../chokepoint-detector";
import { labelChokepoint } from "./signals";

/**
 * World events tied to our coverage — the "news half" of the news engine.
 *
 * We do NOT republish articles. We surface, for places we actually track, the
 * fact that a NAMED source reported something, with a link, alongside OUR live
 * figure for that place. A post is then: "per {source}: <factual headline> —
 * our data at {place}: <signal>". Factual, attributed, fair-use.
 */

export interface WorldEvent {
  source: string;
  title: string;
  url: string;
  publishedAt: number;
  places: string[];
  /** Our live figure for a matched place, if any. */
  ourData?: string;
  /** Ready-to-edit factual post line (source named). */
  line?: string;
}

interface FeedDef {
  source: string;
  url: string;
}

// Free maritime RSS feeds. Headlines + links only — never the article body.
const FEEDS: FeedDef[] = [
  { source: "gCaptain", url: "https://gcaptain.com/feed/" },
  { source: "Splash247", url: "https://splash247.com/feed/" },
  { source: "The Maritime Executive", url: "https://maritime-executive.com/articles.rss" },
];

// Extra region keywords beyond the 51 port names — chokepoints & seas that the
// news talks about and that map to our coverage.
const REGION_KEYWORDS: Array<{ kw: string; label: string }> = [
  { kw: "hormuz", label: "Strait of Hormuz" },
  { kw: "suez", label: "Suez Canal" },
  { kw: "red sea", label: "Red Sea" },
  { kw: "bab-el-mandeb", label: "Bab-el-Mandeb" },
  { kw: "bab el mandeb", label: "Bab-el-Mandeb" },
  { kw: "gulf of aden", label: "Gulf of Aden" },
  { kw: "malacca", label: "Strait of Malacca" },
  { kw: "singapore strait", label: "Singapore Strait" },
  { kw: "bosphorus", label: "Bosphorus" },
  { kw: "bosporus", label: "Bosphorus" },
  { kw: "black sea", label: "Black Sea" },
  { kw: "kerch", label: "Kerch Strait" },
  { kw: "gibraltar", label: "Strait of Gibraltar" },
  { kw: "english channel", label: "Dover Strait" },
  { kw: "dover", label: "Dover Strait" },
  { kw: "panama canal", label: "Panama Canal" },
  { kw: "persian gulf", label: "Persian Gulf" },
  { kw: "arabian gulf", label: "Persian Gulf" },
];

function placeKeywords(): Array<{ kw: string; label: string }> {
  const list: Array<{ kw: string; label: string }> = [];
  for (const p of PORTS) {
    const name = p.name?.trim();
    if (name && name.length >= 4) list.push({ kw: name.toLowerCase(), label: name });
  }
  return list.concat(REGION_KEYWORDS);
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function firstMatch(re: RegExp, s: string): string {
  const m = re.exec(s);
  return m ? decode(m[1]) : "";
}

async function fetchFeed(feed: FeedDef): Promise<Array<{ title: string; url: string; ts: number }>> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { "user-agent": "PortFlowNewsBot/1.0 (+https://portflow.uk)" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!r.ok) return [];
    const xml = await r.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
    const out: Array<{ title: string; url: string; ts: number }> = [];
    for (const it of items.slice(0, 30)) {
      const title = firstMatch(/<title>([\s\S]*?)<\/title>/, it);
      const link = firstMatch(/<link>([\s\S]*?)<\/link>/, it);
      const pub = firstMatch(/<pubDate>([\s\S]*?)<\/pubDate>/, it);
      if (!title || !link) continue;
      const ts = pub ? Date.parse(pub) : NaN;
      out.push({ title, url: link, ts: Number.isNaN(ts) ? 0 : ts });
    }
    return out;
  } catch {
    return [];
  }
}

let cache: { ts: number; data: WorldEvent[] } | null = null;
const TTL_MS = 15 * 60_000;

export async function getWorldEvents(now = Date.now()): Promise<WorldEvent[]> {
  if (cache && now - cache.ts < TTL_MS) return cache.data;

  const keywords = placeKeywords();

  // Full chokepoint transit counts (7d), keyed by display label — not just the
  // top few, so ANY matched chokepoint gets its figure (v1.1).
  const chokeByLabel = new Map<string, number>();
  try {
    for (const c of getChokepointTransitCounts(7)) {
      chokeByLabel.set(labelChokepoint(c.chokepointId).toLowerCase(), c.count);
    }
  } catch {
    /* ignore */
  }

  // Any matched port gets its live congestion computed on demand (memoised).
  const portByName = new Map(
    PORTS.filter((p) => p.name).map((p) => [p.name.toLowerCase(), p]),
  );
  const kpiMemo = new Map<string, string | null>();

  function congestionStr(portId: string, portName: string): string | null {
    if (kpiMemo.has(portId)) return kpiMemo.get(portId)!;
    let out: string | null = null;
    try {
      const snap = computeKpiSnapshot(portId, now);
      if (snap.totalVessels >= 5) {
        const pct = Math.round((snap.anchored / snap.totalVessels) * 100);
        out = `${portName}: ${snap.anchored} at anchor (${pct}% waiting)`;
      }
    } catch {
      /* ignore */
    }
    kpiMemo.set(portId, out);
    return out;
  }

  function ourDataFor(places: string[]): string | undefined {
    for (const pl of places) {
      const plL = pl.toLowerCase();
      const port = portByName.get(plL);
      if (port) {
        const c = congestionStr(port.id, port.name);
        if (c) return c;
      }
      // Require a meaningful count: a near-zero chokepoint (e.g. Hormuz when
      // ships go dark and aren't counted as transits) would be misleading.
      const n = chokeByLabel.get(plL);
      if (n && n >= 10) return `${pl}: ${n} transits in 7 days`;
    }
    return undefined;
  }

  const events: WorldEvent[] = [];

  // --- RSS, filtered to places we track ---
  const feedResults = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f)));
  feedResults.forEach((res, i) => {
    if (res.status !== "fulfilled") return;
    const source = FEEDS[i].source;
    for (const item of res.value) {
      const hay = item.title.toLowerCase();
      const matched = new Map<string, string>();
      for (const { kw, label } of keywords) {
        if (hay.includes(kw)) matched.set(label, label);
      }
      if (matched.size === 0) continue;
      const places = Array.from(matched.values());
      const ourData = ourDataFor(places);
      events.push({
        source,
        title: item.title,
        url: item.url,
        publishedAt: item.ts,
        places,
        ourData,
        line: ourData
          ? `Per ${source}: "${item.title}". Our live data — ${ourData}. portflow.uk`
          : undefined,
      });
    }
  });

  // --- ASAM maritime-security incidents (already in our DB, named source NGA) ---
  try {
    for (const inc of listPiracyIncidents({ days: 14, limit: 40 })) {
      const place = inc.region || inc.navarea || "open sea";
      const what = [inc.hostility, inc.victim].filter(Boolean).join(" · ");
      events.push({
        source: inc.source || "NGA ASAM",
        title: what ? `${what} — ${place}` : (inc.description?.slice(0, 120) ?? place),
        url: inc.url || "https://msi.nga.mil/Piracy",
        publishedAt: inc.occurredAt,
        places: [place],
      });
    }
  } catch {
    /* ignore */
  }

  events.sort((a, b) => b.publishedAt - a.publishedAt);
  const data = events.slice(0, 40);
  cache = { ts: now, data };
  return data;
}
