import { getVapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

// Public VAPID key for PushManager.subscribe(). Served at runtime (not baked
// at build) so key rotation is an env change + reload, no rebuild.
export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return Response.json({ error: "push not configured" }, { status: 503 });
  }
  return Response.json({ publicKey: key });
}
