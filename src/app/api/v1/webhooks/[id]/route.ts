import { deleteSubscription } from "@/lib/webhooks";
import { gate, withHeaders } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const ok = deleteSubscription(id);
  if (!ok) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return withHeaders({ id, deleted: true }, auth.headers);
}
