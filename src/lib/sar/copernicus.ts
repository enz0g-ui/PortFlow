const TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.COPERNICUS_CLIENT_ID;
  const secret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cache && cache.expiresAt > Date.now() + 60_000) return cache.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) {
    throw new Error(`Copernicus auth failed: HTTP ${r.status}`);
  }
  const json = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Copernicus auth: no access_token");
  cache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 600) * 1000,
  };
  return cache.token;
}

export interface SarFetchResult {
  pixels: Uint8Array;
  width: number;
  height: number;
  acquiredAt: number;
  sceneId: string;
}

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["VV"], units: "DN" }],
    output: { bands: 1, sampleType: "UINT8" },
    mosaicking: "ORBIT"
  };
}
function evaluatePixel(s) {
  // Stretch raw VV digital number into 0-255 visible range.
  // Values above ~3000 saturate; ships often >5000.
  const v = Math.min(255, Math.max(0, Math.round(s.VV * 0.04)));
  return [v];
}`;

export async function fetchSarImage(
  bbox: [number, number, number, number],
  fromMs: number,
  toMs: number,
  outWidth = 2048,
  outHeight = 2048,
): Promise<SarFetchResult | null> {
  const token = await getToken().catch(() => null);
  if (!token) return null;

  const [s, w, n, e] = bbox;
  const body = {
    input: {
      bounds: {
        bbox: [w, s, e, n],
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [
        {
          type: "sentinel-1-grd",
          dataFilter: {
            timeRange: {
              from: new Date(fromMs).toISOString(),
              to: new Date(toMs).toISOString(),
            },
            polarization: "DV",
            acquisitionMode: "IW",
            resolution: "HIGH",
          },
          processing: { backCoeff: "GAMMA0_TERRAIN" },
        },
      ],
    },
    output: {
      width: outWidth,
      height: outHeight,
      responses: [
        {
          identifier: "default",
          format: { type: "image/png" },
        },
      ],
    },
    evalscript: EVALSCRIPT,
  };

  const r = await fetch(PROCESS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Process API ${r.status}: ${text.slice(0, 200)}`);
  }
  const arrayBuf = await r.arrayBuffer();

  const pixels = await pngToGreyscale(new Uint8Array(arrayBuf));
  return {
    pixels: pixels.data,
    width: pixels.width,
    height: pixels.height,
    acquiredAt: toMs,
    sceneId: `sh_${toMs}_${Math.round((s + n) * 100)}_${Math.round((w + e) * 100)}`,
  };
}

async function pngToGreyscale(
  buf: Uint8Array,
): Promise<{ data: Uint8Array; width: number; height: number }> {
  const { PNG } = await import("pngjs");
  return new Promise((resolve, reject) => {
    new PNG().parse(Buffer.from(buf), (err, png) => {
      if (err) return reject(err);
      const { width, height, data } = png;
      const grey = new Uint8Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        grey[i] = (r * 299 + g * 587 + b * 114) / 1000;
      }
      resolve({ data: grey, width, height });
    });
  });
}
