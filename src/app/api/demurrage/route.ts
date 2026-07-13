import { getAnchoredVessels } from "@/lib/store";
import { getThreshold } from "@/lib/anomaly-thresholds";
import { PORTS_BY_ID } from "@/lib/ports";
import type { CargoClass } from "@/lib/types";

export const dynamic = "force-dynamic";

const CARGO_CLASSES = new Set([
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
]);

/**
 * Live inputs for the demurrage calculator: current anchored dwell at a port
 * plus the historical P50/P95 baseline (dynamic per-port thresholds when
 * enough samples exist, honest hardcoded fallback otherwise). The dollar
 * math happens client-side — rates are the user's own.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const portId = url.searchParams.get("port") ?? "";
  const cargoParam = url.searchParams.get("cargo") ?? "";
  const cargo = CARGO_CLASSES.has(cargoParam)
    ? (cargoParam as CargoClass)
    : undefined;

  const port = PORTS_BY_ID[portId];
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 404 });
  }

  const anchored = getAnchoredVessels(portId).filter(
    (v) => !cargo || v.cargoClass === cargo,
  );
  const now = Date.now();
  const dwells = anchored
    .map((v) => (now - v.anchorStart) / 3_600_000)
    .sort((a, b) => a - b);
  const median =
    dwells.length > 0 ? dwells[Math.floor(dwells.length / 2)] : null;
  const max = dwells.length > 0 ? dwells[dwells.length - 1] : null;

  const threshold = getThreshold(portId, cargo);

  return Response.json({
    port: { id: port.id, name: port.name, flag: port.flag },
    cargo: cargo ?? null,
    anchoredCount: anchored.length,
    currentMedianDwellH: median !== null ? Number(median.toFixed(1)) : null,
    currentMaxDwellH: max !== null ? Number(max.toFixed(1)) : null,
    typicalDwellH: threshold.warnH,
    p95DwellH: threshold.criticalH,
    baselineIsDynamic: threshold.isDynamic,
    baselineSamples: threshold.nSamples,
    aisCoverage: port.aisCoverage ?? "good",
  });
}
