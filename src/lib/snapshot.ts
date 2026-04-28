import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PORTS } from "./ports";
import {
  bulkLoadStatic,
  getVessels,
  upsertVessel,
} from "./store";
import type { Vessel } from "./types";

const SNAPSHOT_DIR =
  process.env.PORT_SNAPSHOT_DIR ?? resolve(process.cwd(), "data");
const SNAPSHOT_INTERVAL_MS = 30_000;

let timer: NodeJS.Timeout | undefined;

function snapshotPath(portId: string) {
  return resolve(SNAPSHOT_DIR, `vessels-${portId}.json`);
}

function writePortSnapshot(portId: string) {
  const vessels = getVessels(portId);
  if (vessels.length === 0) return;
  const path = snapshotPath(portId);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ ts: Date.now(), vessels }));
}

export function loadSnapshots() {
  let total = 0;
  for (const port of PORTS) {
    try {
      const path = snapshotPath(port.id);
      const raw = readFileSync(path, "utf-8");
      const parsed = JSON.parse(raw) as { ts: number; vessels: Vessel[] };
      const cutoff = Date.now() - 60 * 60_000;
      if (parsed.ts < cutoff) continue;
      for (const v of parsed.vessels) {
        upsertVessel(port.id, v);
        total++;
      }
    } catch {
      /* missing/invalid file — start fresh */
    }
  }
  return total;
}

export function startSnapshotter() {
  if (timer) return;
  const tick = () => {
    for (const port of PORTS) {
      try {
        writePortSnapshot(port.id);
      } catch (err) {
        console.error(`[snapshot] ${port.id}`, err);
      }
    }
  };
  timer = setInterval(tick, SNAPSHOT_INTERVAL_MS);
}

export function stopSnapshotter() {
  if (timer) clearInterval(timer);
  timer = undefined;
}

void bulkLoadStatic;
