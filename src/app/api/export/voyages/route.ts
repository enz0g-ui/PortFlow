import { recentClosedVoyages, type VoyageRow } from "@/lib/db";
import { getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "voyage_id",
  "mmsi",
  "port",
  "cargo_class",
  "start_ts",
  "arrived_ts",
  "departed_ts",
  "predicted_eta",
  "broadcast_eta",
  "start_distance_nm",
  "start_sog",
  "draught_arrived",
  "arrival_zone",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsv(row: VoyageRow): string {
  return COLUMNS.map((c) => csvEscape(row[c as keyof VoyageRow])).join(",");
}

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? "rotterdam";
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const rows = recentClosedVoyages(portId, since, 5000);

  const header = COLUMNS.join(",");
  const body = rows.map(rowToCsv).join("\n");
  const csv = `${header}\n${body}\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="voyages-${portId}-${days}d.csv"`,
    },
  });
}
