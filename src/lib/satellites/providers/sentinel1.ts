import type {
  SatelliteScene,
  SatelliteSource,
  SourceStatus,
} from "../types";

const ODATA_ROOT = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products";

interface ODataAttribute {
  Name?: string;
  Value?: unknown;
}

interface ODataProduct {
  Id?: string;
  Name?: string;
  ContentDate?: { Start?: string; End?: string };
  Footprint?: string;
  Attributes?: ODataAttribute[];
}

interface ODataResp {
  value?: ODataProduct[];
}

const lastSync = new Map<string, { ts: number; error?: string }>();

function bboxAsPolygon(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox;
  return `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`;
}

export const sentinel1Source: SatelliteSource = {
  id: "sentinel1",
  label: "Sentinel-1 SAR",
  tier: "sar",
  tariff: "free",
  description:
    "ESA Copernicus Sentinel-1 synthetic aperture radar. Detects vessels through clouds and at night, ~6-day revisit. Catalog browsing is free; product downloads need a Copernicus account.",
  homepage: "https://browser.dataspace.copernicus.eu/",
  envKeys: [],
  integration: "live",
  status(): SourceStatus {
    const last = lastSync.get("global");
    return {
      active: true,
      configured: true,
      reason: "free public catalog (browse only — downloads require account)",
      lastSyncAt: last?.ts,
      lastError: last?.error,
    };
  },
  async fetchScenes(port, sinceMs) {
    const sinceISO = new Date(sinceMs).toISOString();
    const filter = [
      `Collection/Name eq 'SENTINEL-1'`,
      `ContentDate/Start gt ${sinceISO}`,
      `OData.CSC.Intersects(area=geography'SRID=4326;${bboxAsPolygon(port.bbox)}')`,
    ].join(" and ");
    const url = `${ODATA_ROOT}?$filter=${encodeURIComponent(filter)}&$top=20&$orderby=ContentDate/Start desc`;
    try {
      const r = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) {
        lastSync.set("global", {
          ts: Date.now(),
          error: `HTTP ${r.status}`,
        });
        return [];
      }
      const json = (await r.json()) as ODataResp;
      lastSync.set("global", { ts: Date.now() });
      return (json.value ?? []).map<SatelliteScene>((p) => {
        const acq = p.ContentDate?.Start
          ? Date.parse(p.ContentDate.Start)
          : Date.now();
        return {
          id: p.Id ?? p.Name ?? `sen1_${acq}`,
          source: "sentinel1",
          port: port.id,
          acquiredAt: acq,
          bbox: port.bbox,
          productUrl: p.Id
            ? `https://catalogue.dataspace.copernicus.eu/odata/v1/Products(${p.Id})/$value`
            : undefined,
          meta: { name: p.Name },
        };
      });
    } catch (err) {
      lastSync.set("global", {
        ts: Date.now(),
        error: (err as Error).message,
      });
      return [];
    }
  },
};
