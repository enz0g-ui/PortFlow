import { computeKpiSnapshot } from "@/lib/kpi";
import { getPort } from "@/lib/ports";
import { meta } from "@/lib/store";
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
      snapshot: computeKpiSnapshot(id),
      worker: meta.status(),
    },
    auth.headers,
  );
}
