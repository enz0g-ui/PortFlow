import { PORTS } from "../ports";
import { computeKpiSnapshot } from "../kpi";
import { listChokepointTransits } from "../chokepoint-detector";
import { listDarkEvents } from "../dark-events";
import { listLoiteringEvents } from "../loitering-detector";
import { getVoyageAccuracy } from "../voyages";

/**
 * News signals — the raw material for "data briefs" and LinkedIn punchlines.
 *
 * Everything here is a real, observable figure pulled from what the product
 * already computes (congestion, chokepoint transits, AIS-gap/dark events,
 * loitering, the ETA benchmark). No intent is inferred and no number is
 * invented — we describe what the data shows, never why. Punchline strings are
 * factual and copy-paste-ready for a post.
 */

export interface CongestionSignal {
  portId: string;
  portName: string;
  flag: string;
  anchored: number;
  total: number;
  ratioPct: number;
}

export interface ChokepointSignal {
  id: string;
  label: string;
  transits7d: number;
}

export interface BenchmarkSignal {
  portName: string;
  ourMaeHours: number;
  broadcastMaeHours: number;
  voyages: number;
}

export interface NewsSignals {
  generatedAt: number;
  congestion: CongestionSignal[];
  chokepoints: ChokepointSignal[];
  darkEvents7d: number;
  loitering7d: number;
  benchmark: BenchmarkSignal | null;
  /** Factual, copy-paste-ready post lines derived from the above. */
  punchlines: string[];
}

const CHOKEPOINT_LABELS: Record<string, string> = {
  hormuz: "Strait of Hormuz",
  "hormuz-narrow": "Strait of Hormuz",
  "hormuz-east": "Strait of Hormuz (east)",
  "hormuz-west": "Strait of Hormuz (west)",
  suez: "Suez Canal",
  "suez-canal": "Suez Canal",
  "suez-north": "Suez Canal (north)",
  "suez-south": "Suez Canal (south)",
  malacca: "Strait of Malacca",
  bosphorus: "Bosphorus",
  gibraltar: "Strait of Gibraltar",
  "bab-el-mandeb": "Bab-el-Mandeb",
  dover: "Dover Strait",
  kerch: "Kerch Strait",
  panama: "Panama Canal",
  sunda: "Sunda Strait",
};

function labelChokepoint(id: string): string {
  return CHOKEPOINT_LABELS[id] ?? id.replace(/-/g, " ");
}

const MIN_PORT_VESSELS = 8; // ignore near-empty ports (low AIS coverage) as noise
const BENCHMARK_MIN_N = 20;

let cache: { ts: number; data: NewsSignals } | null = null;
const TTL_MS = 60_000;

export function getNewsSignals(now = Date.now()): NewsSignals {
  if (cache && now - cache.ts < TTL_MS) return cache.data;

  // --- Congestion: rank ports by share of vessels at anchor right now ---
  const congestion: CongestionSignal[] = [];
  for (const p of PORTS) {
    try {
      const snap = computeKpiSnapshot(p.id, now);
      if (snap.totalVessels < MIN_PORT_VESSELS) continue;
      const ratioPct = Math.round((snap.anchored / snap.totalVessels) * 100);
      congestion.push({
        portId: p.id,
        portName: p.name,
        flag: p.flag ?? "",
        anchored: snap.anchored,
        total: snap.totalVessels,
        ratioPct,
      });
    } catch {
      /* skip ports that error (no data) */
    }
  }
  congestion.sort((a, b) => b.ratioPct - a.ratioPct || b.anchored - a.anchored);
  const topCongestion = congestion.slice(0, 6);

  // --- Chokepoints: transit counts over the last 7 days, by chokepoint ---
  const chokeCounts = new Map<string, number>();
  try {
    for (const t of listChokepointTransits({ daysBack: 7, limit: 1000 })) {
      chokeCounts.set(t.chokepointId, (chokeCounts.get(t.chokepointId) ?? 0) + 1);
    }
  } catch {
    /* ignore */
  }
  const chokepoints: ChokepointSignal[] = Array.from(chokeCounts.entries())
    .map(([id, n]) => ({ id, label: labelChokepoint(id), transits7d: n }))
    .sort((a, b) => b.transits7d - a.transits7d)
    .slice(0, 6);

  // --- AIS-gap (dark) events + loitering, last 7 days ---
  let darkEvents7d = 0;
  let loitering7d = 0;
  try {
    darkEvents7d = listDarkEvents({ days: 7, limit: 1000 }).length;
  } catch {
    /* ignore */
  }
  try {
    loitering7d = listLoiteringEvents({ daysBack: 7, limit: 1000 }).length;
  } catch {
    /* ignore */
  }

  // --- ETA benchmark headline (busiest port, 30d, same-set) ---
  let benchmark: BenchmarkSignal | null = null;
  try {
    const acc = getVoyageAccuracy("rotterdam", now - 30 * 86_400_000);
    if (
      (acc.baselineCount ?? 0) >= BENCHMARK_MIN_N &&
      acc.modelMaeOnBaselineHours != null &&
      acc.baselineMaeHours != null
    ) {
      benchmark = {
        portName: "Rotterdam",
        ourMaeHours: acc.modelMaeOnBaselineHours,
        broadcastMaeHours: acc.baselineMaeHours,
        voyages: acc.baselineCount,
      };
    }
  } catch {
    /* ignore */
  }

  // --- Factual, copy-paste post lines ---
  const punchlines: string[] = [];
  const topPort = topCongestion[0];
  if (topPort && topPort.anchored >= 5) {
    punchlines.push(
      `${topPort.flag} ${topPort.portName}: ${topPort.anchored} vessels at anchor right now — ${topPort.ratioPct}% of everything in port is waiting. Live on Port Flow. portflow.uk`,
    );
  }
  const topChoke = chokepoints[0];
  if (topChoke && topChoke.transits7d > 0) {
    punchlines.push(
      `${topChoke.label}: ${topChoke.transits7d} vessel transits tracked in the last 7 days. We watch 12 chokepoints live. portflow.uk`,
    );
  }
  if (darkEvents7d > 0) {
    punchlines.push(
      `${darkEvents7d} AIS-gap ("dark") events flagged across monitored waters in the last 7 days — transponders going quiet, detected behaviourally. portflow.uk`,
    );
  }
  if (benchmark) {
    punchlines.push(
      `Predicted ETA error: ${benchmark.ourMaeHours.toFixed(1)}h vs ${benchmark.broadcastMaeHours.toFixed(1)}h for the crew-broadcast ETA, on ${benchmark.voyages} closed voyages (Rotterdam, 30d). We publish the number. portflow.uk/precision`,
    );
  }

  const data: NewsSignals = {
    generatedAt: now,
    congestion: topCongestion,
    chokepoints,
    darkEvents7d,
    loitering7d,
    benchmark,
    punchlines,
  };
  cache = { ts: now, data };
  return data;
}
