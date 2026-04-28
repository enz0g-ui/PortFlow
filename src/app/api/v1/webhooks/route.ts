import { z } from "zod";
import {
  createSubscription,
  listSubscriptions,
  type WebhookEvent,
} from "@/lib/webhooks";
import { getPort, PORTS } from "@/lib/ports";
import { gate, withHeaders } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const validEvents: ReadonlyArray<WebhookEvent> = [
  "congestion.threshold",
  "anomaly.detected",
  "voyage.arrived",
];

const SubSchema = z.object({
  url: z.string().url(),
  port: z.string().refine((p) => PORTS.some((x) => x.id === p), {
    message: "unknown port",
  }),
  event: z.enum(validEvents as unknown as [string, ...string[]]),
  threshold: z.number().optional(),
});

export async function GET(request: Request) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const subs = listSubscriptions().map((s) => ({
    id: s.id,
    url: s.url,
    port: s.port,
    event: s.event,
    threshold: s.threshold,
    createdAt: s.created_at,
    lastFiredAt: s.last_fired_at,
  }));
  return withHeaders({ subscriptions: subs }, auth.headers);
}

export async function POST(request: Request) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const parsed = SubSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (!getPort(parsed.data.port)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const sub = createSubscription({
    url: parsed.data.url,
    port: parsed.data.port,
    event: parsed.data.event as WebhookEvent,
    threshold: parsed.data.threshold,
  });
  return withHeaders(
    {
      id: sub.id,
      url: sub.url,
      port: sub.port,
      event: sub.event,
      threshold: sub.threshold,
      secret: sub.secret,
      note: "Save the secret — it is only shown once and required to verify webhook signatures.",
    },
    auth.headers,
  );
}
