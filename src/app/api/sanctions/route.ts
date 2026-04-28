import {
  checkSanctions,
  refreshSanctions,
  sanctionsStatus,
} from "@/lib/sanctions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const mmsiStr = request.nextUrl.searchParams.get("mmsi");
  const imoStr = request.nextUrl.searchParams.get("imo");
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";

  if (refresh) {
    await refreshSanctions(true);
  }

  const mmsi = mmsiStr ? Number(mmsiStr) : undefined;
  const imo = imoStr ? Number(imoStr) : undefined;

  if (mmsi || imo) {
    const matches = checkSanctions({ mmsi, imo });
    return Response.json({
      mmsi,
      imo,
      flagged: matches.length > 0,
      matches,
      status: sanctionsStatus(),
    });
  }

  return Response.json({ status: sanctionsStatus() });
}
