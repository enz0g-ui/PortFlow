import { listChokepointTransits } from "@/lib/portwatch";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/portwatch/chokepoints?days=30&id=chokepoint5
 *
 * Returns recent daily transit counts for the IMF PortWatch chokepoint
 * dataset (28 chokepoints worldwide: Suez, Hormuz, Bab el-Mandeb,
 * Bosphorus, Panama, Malacca, Singapore, Dover, etc.).
 *
 * Response: list of { chokepointId, chokepointName, dateUtc, totalTransits,
 *                     tankerTransits, containerTransits, dryBulkTransits,
 *                     tradeVolumeTons }
 *
 * Source: IMF PortWatch (https://portwatch.imf.org). CC-BY-style commercial
 * reuse with attribution.
 */

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = Number(sp.get("days") ?? 30);
  const limit = Number(sp.get("limit") ?? 1000);
  const chokepointId = sp.get("id") ?? undefined;
  const rows = listChokepointTransits({
    daysBack: days,
    limit,
    chokepointId,
  });
  // Group by chokepoint for convenient client rendering: sparkline per id.
  const byId = new Map<
    string,
    { chokepointId: string; chokepointName: string | null; series: typeof rows }
  >();
  for (const r of rows) {
    let g = byId.get(r.chokepointId);
    if (!g) {
      g = {
        chokepointId: r.chokepointId,
        chokepointName: r.chokepointName,
        series: [],
      };
      byId.set(r.chokepointId, g);
    }
    g.series.push(r);
  }
  return Response.json({
    chokepoints: Array.from(byId.values()),
    days,
    attribution: "IMF PortWatch (https://portwatch.imf.org)",
  });
}
