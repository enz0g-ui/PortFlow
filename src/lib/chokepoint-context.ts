/**
 * Structural, authoritative reference figures for strategic chokepoints.
 *
 * These are NOT our live AIS count — they're well-known baseline statistics
 * from public authorities (EIA / IEA). We show them so a chokepoint where our
 * terrestrial AIS is blind (coverage gap + vessels running dark, e.g. Hormuz)
 * isn't a bare "0" that reads as broken. Always displayed labelled as
 * reference/structural, clearly distinct from the live counters.
 *
 * Only add an entry once its figures are verified against a citable source —
 * never fabricate. (Hence only Hormuz for now; others added as verified.)
 */

export interface ChokepointContext {
  transitsPerDay?: string;
  oilMbd?: string;
  shareGlobal?: string;
  source: string;
  sourceUrl?: string;
}

export const CHOKEPOINT_CONTEXT: Record<string, ChokepointContext> = {
  hormuz: {
    transitsPerDay: "~138 transits/day",
    oilMbd: "~20 Mb/d of oil",
    shareGlobal: "~20–25% of global seaborne oil",
    source: "EIA / IEA · 2024–25",
    sourceUrl: "https://www.eia.gov/todayinenergy/detail.php?id=61002",
  },
};

export function getChokepointContext(
  portId: string,
): ChokepointContext | undefined {
  return CHOKEPOINT_CONTEXT[portId];
}
