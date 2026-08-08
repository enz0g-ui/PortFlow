import { meta } from "@/lib/store";
import { db } from "@/lib/db";
import { getScannerStatus } from "@/lib/sar/scanner";
import { sanctionsStatus } from "@/lib/sanctions";
import {
  secondaryActive,
  secondarySourcesStatus,
} from "@/lib/ais-secondary";
import { PORTS } from "@/lib/ports";

export const dynamic = "force-dynamic";

// Après un reboot en pleine panne de flux, lastMessageAt est null alors que
// la base connaît l'âge réel des données — c'est lui que le bandeau visiteur
// doit afficher. MAX(ts) est instantané (borne d'index), cache 60 s.
let _lastStoredTs: { at: number; ts: number | null } | null = null;
function lastStoredPositionTs(): number | null {
  if (!_lastStoredTs || Date.now() - _lastStoredTs.at > 60_000) {
    let ts: number | null = null;
    try {
      const row = db()
        .raw.prepare(`SELECT MAX(ts) AS ts FROM positions`)
        .get() as { ts: number | null } | undefined;
      ts = row?.ts ?? null;
    } catch {
      /* base indisponible — le statut reste null */
    }
    _lastStoredTs = { at: Date.now(), ts };
  }
  return _lastStoredTs.ts;
}

export async function GET() {
  const ais = meta.status();
  const lastData = ais.lastMessageAt ?? lastStoredPositionTs();
  const aisAge = lastData ? Date.now() - lastData : null;
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
        // Redondance : sources secondaires open-data (attribution requise —
        // « data via BarentsWatch » NLOD ; « Fintraffic / digitraffic.fi »
        // CC BY 4.0). failoverActive = primaire muet mais secondaires vivants.
        failoverActive: secondaryActive(),
        secondarySources: secondarySourcesStatus(),
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
        degraded: sar.lastError != null,
      },
      sanctions: {
        healthy: sancHealthy,
        fetchedAt: sanc.fetchedAt,
        count: sanc.count,
        countByImo: sanc.countByImo,
        countByMmsi: sanc.countByMmsi,
        errorCount: sanc.errors.length,
        ageSeconds: sancAge != null ? Math.round(sancAge / 1000) : null,
      },
    },
    coverage: {
      portsTracked: PORTS.length,
      portsActive: activePorts,
    },
  });
}
