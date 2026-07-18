import { db } from "./db";

/**
 * Web Push delivery (mobile PWA lock-screen notifications).
 *
 * VAPID keys live in .env.local (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY /
 * VAPID_SUBJECT). Until they're set the channel reports "not configured" and
 * every entry point degrades gracefully. web-push is imported dynamically so
 * the dependency never leaks into a client bundle.
 */

export interface PushPayload {
  title: string;
  body?: string;
  /** Path opened when the notification is tapped (defaults to /m). */
  url?: string;
}

interface SubRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function isPushConfigured(): boolean {
  return !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
): void {
  db()
    .raw.prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`,
    )
    .run(userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, Date.now());
}

export function removePushSubscription(userId: string, endpoint: string): void {
  db()
    .raw.prepare(
      `DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?`,
    )
    .run(endpoint, userId);
}

export function countPushSubscriptions(userId: string): number {
  const r = db()
    .raw.prepare(
      `SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?`,
    )
    .get(userId) as { n: number };
  return r.n;
}

/**
 * Send a notification to every device the user subscribed. Returns the number
 * of successful deliveries. Dead subscriptions (404/410) are pruned so the
 * table self-heals as devices unsubscribe or expire.
 */
export async function deliverPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!isPushConfigured()) return -3;
  const subs = db()
    .raw.prepare(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
    )
    .all(userId) as unknown as SubRow[];
  if (subs.length === 0) return 0;

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contact@portflow.uk",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/m",
  });

  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        body,
        { TTL: 3600 },
      );
      ok++;
      db()
        .raw.prepare(`UPDATE push_subscriptions SET last_ok_at = ? WHERE id = ?`)
        .run(Date.now(), s.id);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        db()
          .raw.prepare(`DELETE FROM push_subscriptions WHERE id = ?`)
          .run(s.id);
      }
    }
  }
  return ok;
}
