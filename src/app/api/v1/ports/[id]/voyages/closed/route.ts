import { recentClosedVoyages } from "@/lib/db";
import { getPort } from "@/lib/ports";
import { getVoyageAccuracy } from "@/lib/voyages";
import { gate, withHeaders } from "@/lib/api-auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!getPort(id)) {
    return Response.json({ error: "unknown port" }, { status: 404 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const voyages = recentClosedVoyages(id, since, 1000);
  const accuracy = getVoyageAccuracy(id, since);

  return withHeaders(
    {
      port: id,
      windowDays: days,
      voyages,
      accuracy: {
        sampleCount: accuracy.count,
        rmseHours: accuracy.rmseHours,
        maeHours: accuracy.maeHours,
        baselineRmseHours: accuracy.baselineRmseHours,
      },
    },
    auth.headers,
  );
}
