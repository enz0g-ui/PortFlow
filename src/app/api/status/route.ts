import { meta } from "@/lib/store";
import { getScannerStatus } from "@/lib/sar/scanner";
import { sanctionsStatus } from "@/lib/sanctions";
import { PORTS } from "@/lib/ports";

export const dynamic = "force-dynamic";

export async function GET() {
  const ais = meta.status();
  const aisAge = ais.lastMessageAt ? Date.now() - ais.lastMessageAt : null;
  const aisHealthy = ais.started && (aisAge ?? Infinity) < 60_000;

  const sar = getScannerStatus();
  const sarHealthy = !sar.started ? null : sar.lastError == null;

  const sanc = sanctionsStatus();
  const sancAge = sanc.fetchedAt ? Date.now() - sanc.fetchedAt : null;
  const sancHealthy = sanc.fetchedAt > 0 && (sancAge ?? 0) < 48 * 60 * 60_000;

  const perPort = meta.perPortStatus();
  const activePorts = Object.values(perPort).filter(
    (p) => p.vesselCount > 0,
  ).length;

  return Response.json({
    ts: Date.now(),
    services: {
      ais: {
        healthy: aisHealthy,
        started: ais.started,
        lastMessageAgeSeconds: aisAge != null ? Math.round(aisAge / 1000) : null,
        vesselCount: ais.vesselCount,
        messageCount: ais.messageCount,
      },
      sar: {
        healthy: sarHealthy,
        started: sar.started,
        authAvailable: sar.authAvailable,
        demoEnabled: sar.demoEnabled,
        lastScanAgeSeconds:
          sar.lastScanAt != null
            ? Math.round((Date.now() - sar.lastScanAt) / 1000)
            : null,
        lastError: sar.lastError,
      },
      sanctions: {
        healthy: sancHealthy,
        ...sanc,
        ageSeconds: sancAge != null ? Math.round(sancAge / 1000) : null,
      },
    },
    coverage: {
      portsTracked: PORTS.length,
      portsActive: activePorts,
    },
  });
}
