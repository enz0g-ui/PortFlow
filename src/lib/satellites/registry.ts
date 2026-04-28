import type { SatelliteSource } from "./types";
import { aisstreamSource } from "./providers/aisstream";
import { sentinel1Source } from "./providers/sentinel1";
import { viirsSource } from "./providers/viirs";
import { spireSource } from "./providers/spire";
import { marineTrafficSource } from "./providers/marinetraffic";
import { orbcommSource } from "./providers/orbcomm";

export const SATELLITE_SOURCES: SatelliteSource[] = [
  aisstreamSource,
  sentinel1Source,
  viirsSource,
  spireSource,
  marineTrafficSource,
  orbcommSource,
];

export function getSource(id: string): SatelliteSource | undefined {
  return SATELLITE_SOURCES.find((s) => s.id === id);
}
