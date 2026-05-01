import type {
  SatelliteFix,
  SatelliteSource,
  SourceStatus,
} from "../types";

const MT_REST =
  "https://services.marinetraffic.com/api/exportvessels/v:8";

const lastSync = new Map<string, { ts: number; error?: string }>();

export const marineTrafficSource: SatelliteSource = {
  id: "marinetraffic",
  label: "MarineTraffic",
  tier: "ais-satellite",
  tariff: "paid",
  description:
    "Mainstream commercial AIS provider — terrestrial + satellite combined. Easier entry pricing than Spire. Good fallback for Mediterranean and Asia.",
  homepage: "https://www.marinetraffic.com/en/p/api-services",
  envKeys: ["MARINETRAFFIC_API_KEY"],
  integration: "in-progress",
  integrationEta: "Q3 2026",
  status(): SourceStatus {
    const configured = !!process.env.MARINETRAFFIC_API_KEY;
    const last = lastSync.get("global");
    return {
      active: false,
      configured,
      reason:
        "Connecteur exportvessels codé mais pas encore mergé au flux dashboard — intégration finale Q3 2026.",
      lastSyncAt: last?.ts,
      lastError: last?.error,
    };
  },
  async fetchFixes(port) {
    const key = process.env.MARINETRAFFIC_API_KEY;
    if (!key) return [];
    const [s, w, n, e] = port.bbox;
    const url = `${MT_REST}/${key}/protocol:jsono/MINLAT:${s}/MAXLAT:${n}/MINLON:${w}/MAXLON:${e}`;
    try {
      const r = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) {
        lastSync.set("global", { ts: Date.now(), error: `HTTP ${r.status}` });
        return [];
      }
      const json = (await r.json()) as Array<{
        MMSI?: number;
        IMO?: number;
        SHIPNAME?: string;
        LAT?: number;
        LON?: number;
        SPEED?: number;
        COURSE?: number;
        TIMESTAMP?: string;
      }>;
      lastSync.set("global", { ts: Date.now() });
      return (json ?? [])
        .filter((m) => typeof m.LAT === "number" && typeof m.LON === "number")
        .map<SatelliteFix>((m) => ({
          source: "marinetraffic",
          port: port.id,
          ts: m.TIMESTAMP ? Date.parse(m.TIMESTAMP) : Date.now(),
          lat: m.LAT!,
          lon: m.LON!,
          mmsi: m.MMSI,
          imo: m.IMO,
          name: m.SHIPNAME,
          sog: typeof m.SPEED === "number" ? m.SPEED / 10 : undefined,
          cog: typeof m.COURSE === "number" ? m.COURSE / 10 : undefined,
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
