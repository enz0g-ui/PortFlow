import { computeAnomalies } from "@/lib/anomaly";
import { getPort } from "@/lib/ports";
import { gate, withHeaders } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!getPort(id)) {
    return Response.json({ error: "unknown port" }, { status: 404 });
  }
  return withHeaders(
    {
      port: id,
      ts: Date.now(),
      anomalies: computeAnomalies(id),
    },
    auth.headers,
  );
}
