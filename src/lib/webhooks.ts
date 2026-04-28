import { createHmac, randomBytes } from "node:crypto";
import { db } from "./db";

export type WebhookEvent =
  | "congestion.threshold"
  | "anomaly.detected"
  | "voyage.arrived";

export interface Subscription {
  id: string;
  url: string;
  secret: string;
  port: string;
  event: WebhookEvent;
  threshold: number | null;
  active: number;
  last_fired_at: number | null;
  last_fired_value: number | null;
  created_at: number;
}

export function listSubscriptions(): Subscription[] {
  return db()
    .raw.prepare(
      `SELECT * FROM webhook_subscriptions WHERE active = 1 ORDER BY created_at DESC`,
    )
    .all() as unknown as Subscription[];
}

export function createSubscription(input: {
  url: string;
  port: string;
  event: WebhookEvent;
  threshold?: number;
}): Subscription {
  const id = `sub_${randomBytes(8).toString("hex")}`;
  const secret = randomBytes(24).toString("hex");
  const now = Date.now();
  db()
    .raw.prepare(
      `INSERT INTO webhook_subscriptions
       (id, url, secret, port, event, threshold, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    )
    .run(id, input.url, secret, input.port, input.event, input.threshold ?? null, now);
  return {
    id,
    url: input.url,
    secret,
    port: input.port,
    event: input.event,
    threshold: input.threshold ?? null,
    active: 1,
    last_fired_at: null,
    last_fired_value: null,
    created_at: now,
  };
}

export function deleteSubscription(id: string): boolean {
  const r = db()
    .raw.prepare(`UPDATE webhook_subscriptions SET active = 0 WHERE id = ?`)
    .run(id);
  return r.changes > 0;
}

function sign(secret: string, ts: number, body: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${ts}.${body}`);
  return hmac.digest("hex");
}

async function attemptDelivery(
  sub: Subscription,
  payload: string,
  event: string,
): Promise<{ ok: boolean; statusCode: number; preview: string }> {
  const ts = Date.now();
  const signature = `t=${ts},v1=${sign(sub.secret, ts, payload)}`;
  let statusCode = 0;
  let ok = false;
  let preview = "";
  try {
    const r = await fetch(sub.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-port-flow-signature": signature,
        "x-port-flow-event": event,
      },
      body: payload,
      signal: AbortSignal.timeout(8000),
    });
    statusCode = r.status;
    ok = r.ok;
    const text = await r.text().catch(() => "");
    preview = text.slice(0, 200);
  } catch (err) {
    preview = (err as Error).message.slice(0, 200);
  }
  try {
    db()
      .raw.prepare(
        `INSERT INTO webhook_deliveries (subscription_id, ts, status_code, ok, body_preview)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(sub.id, ts, statusCode, ok ? 1 : 0, preview);
  } catch {
    /* best effort */
  }
  return { ok, statusCode, preview };
}

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

function enqueueDelivery(sub: Subscription, event: string, payload: object) {
  const body = JSON.stringify(payload);
  db()
    .raw.prepare(
      `INSERT INTO webhook_queue (subscription_id, payload, event, attempts, next_attempt_at, status, created_at)
       VALUES (?, ?, ?, 0, ?, 'pending', ?)`,
    )
    .run(sub.id, body, event, Date.now(), Date.now());
}

interface QueueRow {
  id: number;
  subscription_id: string;
  payload: string;
  event: string;
  attempts: number;
}

export async function processQueue(now = Date.now()): Promise<number> {
  const rows = db()
    .raw.prepare(
      `SELECT id, subscription_id, payload, event, attempts FROM webhook_queue
       WHERE status = 'pending' AND next_attempt_at <= ? ORDER BY next_attempt_at ASC LIMIT 50`,
    )
    .all(now) as unknown as QueueRow[];

  let processed = 0;
  for (const row of rows) {
    const sub = db()
      .raw.prepare(`SELECT * FROM webhook_subscriptions WHERE id = ? AND active = 1`)
      .get(row.subscription_id) as unknown as Subscription | undefined;
    if (!sub) {
      db()
        .raw.prepare(`UPDATE webhook_queue SET status = 'cancelled' WHERE id = ?`)
        .run(row.id);
      continue;
    }
    const result = await attemptDelivery(sub, row.payload, row.event);
    processed++;
    if (result.ok) {
      db()
        .raw.prepare(
          `UPDATE webhook_queue SET status = 'delivered', delivered_at = ? WHERE id = ?`,
        )
        .run(Date.now(), row.id);
    } else {
      const nextAttempts = row.attempts + 1;
      const delay = RETRY_DELAYS_MS[Math.min(nextAttempts - 1, RETRY_DELAYS_MS.length - 1)];
      const status = nextAttempts >= RETRY_DELAYS_MS.length + 1 ? "dead" : "pending";
      db()
        .raw.prepare(
          `UPDATE webhook_queue SET attempts = ?, next_attempt_at = ?, status = ?, last_error = ? WHERE id = ?`,
        )
        .run(
          nextAttempts,
          Date.now() + delay,
          status,
          result.preview.slice(0, 200),
          row.id,
        );
    }
  }
  return processed;
}

let queueTimer: NodeJS.Timeout | undefined;

export function startWebhookQueueProcessor(intervalMs = 30_000) {
  if (queueTimer) return;
  const tick = () => {
    processQueue().catch((err) => console.error("[webhook-queue]", err));
  };
  tick();
  queueTimer = setInterval(tick, intervalMs);
}

function recordFire(id: string, value: number, ts: number) {
  db()
    .raw.prepare(
      `UPDATE webhook_subscriptions SET last_fired_at = ?, last_fired_value = ? WHERE id = ?`,
    )
    .run(ts, value, id);
}

export async function dispatchCongestion(
  portId: string,
  anchored: number,
): Promise<void> {
  const subs = listSubscriptions().filter(
    (s) => s.event === "congestion.threshold" && s.port === portId,
  );
  const now = Date.now();
  for (const s of subs) {
    if (s.threshold === null) continue;
    const wasOver = (s.last_fired_value ?? -1) >= s.threshold;
    const isOver = anchored >= s.threshold;
    if (isOver && !wasOver) {
      recordFire(s.id, anchored, now);
      enqueueDelivery(s, "congestion.threshold", {
        event: "congestion.threshold",
        port: portId,
        anchored,
        threshold: s.threshold,
        ts: now,
      });
    } else if (!isOver && wasOver) {
      recordFire(s.id, anchored, now);
      enqueueDelivery(s, "congestion.cleared", {
        event: "congestion.cleared",
        port: portId,
        anchored,
        threshold: s.threshold,
        ts: now,
      });
    }
  }
}

export async function dispatchAnomalies(
  portId: string,
  anomalies: Array<{ id: string; severity: string; mmsi: number; detail: string }>,
): Promise<void> {
  const subs = listSubscriptions().filter(
    (s) => s.event === "anomaly.detected" && s.port === portId,
  );
  if (subs.length === 0) return;
  const ts = Date.now();
  const cutoff = ts - 30 * 60_000;
  for (const s of subs) {
    if ((s.last_fired_at ?? 0) > cutoff) continue;
    if (anomalies.length === 0) continue;
    recordFire(s.id, anomalies.length, ts);
    enqueueDelivery(s, "anomaly.detected", {
      event: "anomaly.detected",
      port: portId,
      anomalies,
      ts,
    });
  }
}
