import type {
  SatelliteFix,
  SatelliteSource,
  SourceStatus,
} from "../types";

const SPIRE_REST = "https://api.spire.com/v2/messages";

const lastSync = new Map<string, { ts: number; error?: string }>();

export const spireSource: SatelliteSource = {
  id: "spire",
  label: "Spire Maritime",
  tier: "ais-satellite",
  tariff: "paid",
  description:
    "Premium S-AIS provider with global coverage, 1-3 min latency. Recommended for Persian Gulf, Strait of Hormuz, Mediterranean dead zones. Geofenced subscriptions available.",
  homepage: "https://spire.com/maritime/",
  envKeys: ["SPIRE_API_TOKEN"],
  integration: "in-progress",
  integrationEta: "Q2 2026",
  status(): SourceStatus {
    const configured = !!process.env.SPIRE_API_TOKEN;
    const last = lastSync.get("global");
    return {
      active: false,
      configured,
      reason:
        "Connecteur REST codé mais pas encore branché au worker — la donnée Spire n'est pas encore mergée dans le dashboard. Tracking : intégration finale Q2 2026.",
      lastSyncAt: last?.ts,
      lastError: last?.error,
    };
  },
  async fetchFixes(port, sinceMs) {
    const token = process.env.SPIRE_API_TOKEN;
    if (!token) return [];
    const sinceISO = new Date(sinceMs).toISOString();
    const [s, w, n, e] = port.bbox;
    const url =
      `${SPIRE_REST}?` +
      new URLSearchParams({
        bounds: `${s},${w},${n},${e}`,
        since: sinceISO,
      }).toString();
    try {
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) {
        lastSync.set("global", { ts: Date.now(), error: `HTTP ${r.status}` });
        return [];
      }
      const json = (await r.json()) as {
        data?: Array<{
          mmsi?: number;
          name?: string;
          imo?: number;
          timestamp?: string;
          latitude?: number;
          longitude?: number;
          speed?: number;
          course?: number;
        }>;
      };
      lastSync.set("global", { ts: Date.now() });
      return (json.data ?? [])
        .filter(
          (m) =>
            typeof m.latitude === "number" && typeof m.longitude === "number",
        )
        .map<SatelliteFix>((m) => ({
          source: "spire",
          port: port.id,
          ts: m.timestamp ? Date.parse(m.timestamp) : Date.now(),
          lat: m.latitude!,
          lon: m.longitude!,
          mmsi: m.mmsi,
          imo: m.imo,
          name: m.name,
          sog: m.speed,
          cog: m.course,
        }));
    } catch (err) {
      lastSync.set("global", {
        ts: Date.now(),
        error: (err as Error).message,
      });
      return [];
    }
  },
};
