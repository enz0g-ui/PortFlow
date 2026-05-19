import {
  readEnv,
  type SatelliteFix,
  type SatelliteSource,
  type SourceStatus,
} from "../types";

const SPIRE_REST = "https://api.spire.com/v2/messages";

const lastSync = new Map<string, { ts: number; error?: string }>();

export const spireSource: SatelliteSource = {
  id: "spire",
  label: "Spire Maritime",
  tier: "ais-satellite",
  tariff: "paid",
  description:
    "Premium S-AIS provider (Kpler group since April 2025) with global satellite coverage. Connector available for BYO key on Pro+ tiers — bring your own Spire subscription to complement terrestrial AIS in deep-ocean and chokepoint dead zones.",
  homepage: "https://spire.com/maritime/",
  envKeys: ["SPIRE_API_TOKEN"],
  integration: "planned",
  status(): SourceStatus {
    const configured = !!process.env.SPIRE_API_TOKEN;
    const last = lastSync.get("global");
    return {
      active: false,
      configured,
      reason:
        "BYO key only — bring your own Spire subscription on Pro+ tier to activate this feed.",
      lastSyncAt: last?.ts,
      lastError: last?.error,
    };
  },
  async fetchFixes(port, sinceMs, opts) {
    const token = readEnv("SPIRE_API_TOKEN", opts);
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
        signal: opts?.signal ?? AbortSignal.timeout(10_000),
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
