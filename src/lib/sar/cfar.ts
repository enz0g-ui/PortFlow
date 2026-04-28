/**
 * Pure-JS Constant False Alarm Rate ship detection on a single-band SAR image.
 *
 * Input pixels are 0-255 (greyscale VV intensity). Ships appear as bright
 * outliers against a darker sea background. We use a global-statistics
 * threshold (mean + k*std) plus a connected-components pass to coalesce
 * adjacent bright pixels into a single object centroid.
 *
 * Land masking is the responsibility of the caller (e.g. by clipping the
 * bbox to sea-only regions or pre-zeroing land pixels).
 */

export interface DetectionRaw {
  cx: number;
  cy: number;
  sizePx: number;
  intensity: number;
  bbox: [number, number, number, number];
}

export interface DetectionGeo extends DetectionRaw {
  lat: number;
  lon: number;
}

export interface CfarOptions {
  k?: number;
  minSizePx?: number;
  maxSizePx?: number;
}

export function detectShipsCfar(
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  opts: CfarOptions = {},
): DetectionRaw[] {
  const k = opts.k ?? 5;
  const minSize = opts.minSizePx ?? 2;
  const maxSize = opts.maxSizePx ?? 800;

  const n = width * height;
  let sum = 0;
  let sumSq = 0;
  let valid = 0;
  for (let i = 0; i < n; i++) {
    const v = pixels[i];
    if (v === 0) continue;
    sum += v;
    sumSq += v * v;
    valid++;
  }
  if (valid === 0) return [];
  const mean = sum / valid;
  const variance = sumSq / valid - mean * mean;
  const std = Math.sqrt(Math.max(0, variance));
  const threshold = mean + k * std;

  const flagged = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (pixels[i] > threshold) flagged[i] = 1;
  }

  const labels = new Int32Array(n);
  let nextLabel = 1;
  const components: Array<{
    cx: number;
    cy: number;
    size: number;
    intensity: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }> = [];

  const stack = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    if (!flagged[i] || labels[i]) continue;
    const label = nextLabel++;
    labels[i] = label;
    let stackTop = 0;
    stack[stackTop++] = i;
    let sumX = 0;
    let sumY = 0;
    let intensity = 0;
    let size = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    while (stackTop > 0) {
      const p = stack[--stackTop];
      const x = p % width;
      const y = (p / width) | 0;
      sumX += x;
      sumY += y;
      intensity += pixels[p];
      size++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const nb of neighbours) {
        if (nb >= 0 && flagged[nb] && !labels[nb]) {
          labels[nb] = label;
          stack[stackTop++] = nb;
        }
      }
    }

    if (size < minSize || size > maxSize) continue;

    components.push({
      cx: sumX / size,
      cy: sumY / size,
      size,
      intensity: intensity / size,
      minX,
      minY,
      maxX,
      maxY,
    });
  }

  return components.map<DetectionRaw>((c) => ({
    cx: c.cx,
    cy: c.cy,
    sizePx: c.size,
    intensity: c.intensity,
    bbox: [c.minX, c.minY, c.maxX, c.maxY],
  }));
}

/**
 * Convert pixel-space detections to geographic coordinates given the bbox the
 * image covers and its pixel dimensions. Assumes a simple linear (non-projected)
 * mapping which is acceptable for small chokepoint AOIs (<5° span).
 */
export function geocodeDetections(
  detections: DetectionRaw[],
  bbox: [number, number, number, number],
  width: number,
  height: number,
): DetectionGeo[] {
  const [s, w, n, e] = bbox;
  const dLat = n - s;
  const dLon = e - w;
  return detections.map((d) => ({
    ...d,
    lon: w + (d.cx / width) * dLon,
    lat: n - (d.cy / height) * dLat,
  }));
}
