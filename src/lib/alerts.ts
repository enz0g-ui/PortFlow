import { db } from "./db";
import { isVesselWatchlisted } from "./watchlist";
import { TIER_LIMITS, type Tier } from "./auth/tier";

export type AlertKind =
  | "slack"
  | "discord"
  | "telegram"
  | "email"
  | "webhook";
export type AlertEvent =
  | "vessel.arrived"
  | "vessel.departed"
  | "vessel.anomaly"
  | "vessel.eta_approaching"
  | "vessel.sanctioned_chokepoint_transit";

export interface UserAlert {
  id: number;
  user_id: string;
  kind: AlertKind;
  target_url: string;
  event: AlertEvent;
  watchlist_only: number;
  port_filter: string | null;
  active: number;
  created_at: number;
  last_fired_at: number | null;
  last_status: number | null;
  label: string | null;
  /**
   * Only used by event='vessel.eta_approaching'. Fire when predicted ETA
   * minus current time crosses this threshold (e.g. 60 = fire when there's
   * 60 minutes left before the vessel arrives). Default 60 if NULL.
   */
  lead_time_minutes: number | null;
}

const ETA_APPROACHING_DEFAULT_LEAD_MIN = 60;

export function listAlerts(userId: string): UserAlert[] {
  return db()
    .raw.prepare(
      `SELECT * FROM user_alerts WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(userId) as unknown as UserAlert[];
}

export function alertsAllowed(tier: Tier): boolean {
  return TIER_LIMITS[tier].webhooks;
}

export function maxAlerts(tier: Tier): number {
  if (!alertsAllowed(tier)) return 0;
  return tier === "enterprise" ? 200 : tier === "pro" ? 50 : 10;
}

export function countAlerts(userId: string): number {
  const r = db()
    .raw.prepare(`SELECT COUNT(*) as n FROM user_alerts WHERE user_id = ?`)
    .get(userId) as { n: number };
  return r.n;
}

export function createAlert(input: {
  userId: string;
  kind: AlertKind;
  targetUrl: string;
  event: AlertEvent;
  watchlistOnly: boolean;
  portFilter?: string;
  label?: string;
  /** Required for event='vessel.eta_approaching', default 60 min. */
  leadTimeMinutes?: number;
}): UserAlert {
  const lead =
    input.event === "vessel.eta_approaching"
      ? Math.max(
          5,
          Math.min(720, input.leadTimeMinutes ?? ETA_APPROACHING_DEFAULT_LEAD_MIN),
        )
      : null;
  const r = db()
    .raw.prepare(
      `INSERT INTO user_alerts
       (user_id, kind, target_url, event, watchlist_only, port_filter, active, created_at, label, lead_time_minutes)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    )
    .run(
      input.userId,
      input.kind,
      input.targetUrl,
      input.event,
      input.watchlistOnly ? 1 : 0,
      input.portFilter ?? null,
      Date.now(),
      input.label ?? null,
      lead,
    );
  return db()
    .raw.prepare(`SELECT * FROM user_alerts WHERE id = ?`)
    .get(Number(r.lastInsertRowid)) as unknown as UserAlert;
}

export function deleteAlert(id: number, userId: string): boolean {
  const r = db()
    .raw.prepare(`DELETE FROM user_alerts WHERE id = ? AND user_id = ?`)
    .run(id, userId);
  return r.changes > 0;
}

export function setAlertActive(
  id: number,
  userId: string,
  active: boolean,
): boolean {
  const r = db()
    .raw.prepare(
      `UPDATE user_alerts SET active = ? WHERE id = ? AND user_id = ?`,
    )
    .run(active ? 1 : 0, id, userId);
  return r.changes > 0;
}

interface VesselEventPayload {
  mmsi: number;
  vesselName: string;
  port: string;
  portName: string;
  cargoClass?: string | null;
  ts: number;
  predictedEta?: number | null;
  broadcastEta?: number | null;
  detail?: string;
  /** For eta_approaching: minutes remaining until predicted ETA. */
  minutesUntilEta?: number | null;
  /** For eta_approaching: the voyage id used for dedup. */
  voyageId?: string;
  /**
   * For sanctioned_chokepoint_transit. The chokepoint identifier doubles as
   * `port` for filter compatibility (e.g. "cp_hormuz"), while these fields
   * give the human-readable name and the matched sanctions sources/regimes.
   */
  chokepointId?: string;
  chokepointName?: string;
  sanctionsSources?: string[];
  sanctionsRegimes?: string[];
  imo?: number | null;
}

function formatHumanLine(
  event: AlertEvent,
  payload: VesselEventPayload,
): string {
  const t = new Date(payload.ts).toUTCString();
  const cargo = payload.cargoClass ? ` (${payload.cargoClass})` : "";
  switch (event) {
    case "vessel.arrived":
      return `🛳️  ${payload.vesselName}${cargo} arrived at ${payload.portName} at ${t} (MMSI ${payload.mmsi})`;
    case "vessel.departed":
      return `⛴️  ${payload.vesselName}${cargo} departed ${payload.portName} at ${t} (MMSI ${payload.mmsi})`;
    case "vessel.anomaly":
      return `⚠️  ${payload.vesselName}${cargo} anomaly at ${payload.portName}: ${payload.detail ?? "—"} (MMSI ${payload.mmsi})`;
    case "vessel.eta_approaching": {
      const eta = payload.predictedEta
        ? new Date(payload.predictedEta).toUTCString()
        : "—";
      const min = payload.minutesUntilEta ?? "?";
      return `⏱️  ${payload.vesselName}${cargo} arriving ${payload.portName} in ~${min} min (ETA ${eta} UTC, MMSI ${payload.mmsi})`;
    }
    case "vessel.sanctioned_chokepoint_transit": {
      const cp = payload.chokepointName ?? payload.portName;
      const srcs = (payload.sanctionsSources ?? []).join("/").toUpperCase();
      const reg = (payload.sanctionsRegimes ?? []).filter(Boolean).join(", ");
      const imoStr = payload.imo ? ` IMO ${payload.imo}` : "";
      return `🚫  SANCTIONED vessel ${payload.vesselName}${cargo}${imoStr} entering ${cp} at ${t} — listed by ${srcs || "—"}${reg ? ` (${reg})` : ""} (MMSI ${payload.mmsi})`;
    }
  }
}

function formatEmailHtml(
  event: AlertEvent,
  payload: VesselEventPayload,
): string {
  const t = new Date(payload.ts).toUTCString();
  const cargo = payload.cargoClass ? ` (${payload.cargoClass})` : "";
  const verb =
    event === "vessel.arrived"
      ? "arrived at"
      : event === "vessel.departed"
        ? "departed"
        : event === "vessel.anomaly"
          ? "anomaly at"
          : event === "vessel.eta_approaching"
            ? `arriving in ~${payload.minutesUntilEta ?? "?"} min at`
            : event === "vessel.sanctioned_chokepoint_transit"
              ? "🚫 SANCTIONED vessel entering"
              : "event at";
  return `
<!doctype html>
<html><body style="font-family: system-ui, sans-serif; background: #0b0f17; color: #e6edf3; padding: 24px;">
  <div style="max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 20px;">
    <h2 style="margin: 0 0 8px; color: #38bdf8; font-size: 18px;">Port Flow</h2>
    <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8;">${event}</p>
    <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${payload.vesselName}${cargo}</p>
    <p style="margin: 0 0 8px; color: #cbd5e1;">${verb} <strong>${payload.portName}</strong></p>
    <p style="margin: 0 0 16px; font-size: 12px; color: #64748b;">${t} · MMSI ${payload.mmsi}</p>
    <hr style="border: none; border-top: 1px solid #1f2937; margin: 16px 0;" />
    <p style="margin: 0; font-size: 11px; color: #64748b;">
      <a href="https://portflow.uk/fleet" style="color: #38bdf8; text-decoration: none;">Open my fleet →</a>
    </p>
  </div>
</body></html>`.trim();
}

async function deliverEmail(
  alert: UserAlert,
  payload: VesselEventPayload,
): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return -3;
  const from = process.env.RESEND_FROM ?? "Port Flow <noreply@portflow.uk>";
  const html = formatEmailHtml(alert.event as AlertEvent, payload);
  const subject = `[Port Flow] ${formatHumanLine(alert.event as AlertEvent, payload)}`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [alert.target_url],
        subject: subject.slice(0, 200),
        html,
      }),
    });
    return r.status;
  } catch {
    return -1;
  }
}

async function deliver(alert: UserAlert, payload: VesselEventPayload) {
  if (alert.kind === "email") {
    const status = await deliverEmail(alert, payload);
    db()
      .raw.prepare(
        `UPDATE user_alerts SET last_fired_at = ?, last_status = ? WHERE id = ?`,
      )
      .run(Date.now(), status, alert.id);
    return;
  }

  const text = formatHumanLine(alert.event as AlertEvent, payload);
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  let url = alert.target_url;
  let body: string;
  if (alert.kind === "slack") {
    body = JSON.stringify({ text });
  } else if (alert.kind === "discord") {
    body = JSON.stringify({ content: text });
  } else if (alert.kind === "telegram") {
    try {
      const u = new URL(alert.target_url);
      const chatId = u.searchParams.get("chat_id");
      if (!chatId) {
        db()
          .raw.prepare(
            `UPDATE user_alerts SET last_fired_at = ?, last_status = -2 WHERE id = ?`,
          )
          .run(Date.now(), alert.id);
        return;
      }
      u.search = "";
      url = u.toString();
      body = JSON.stringify({ chat_id: chatId, text });
    } catch {
      db()
        .raw.prepare(
          `UPDATE user_alerts SET last_fired_at = ?, last_status = -2 WHERE id = ?`,
        )
        .run(Date.now(), alert.id);
      return;
    }
  } else {
    body = JSON.stringify({
      event: alert.event,
      text,
      payload,
    });
  }
  try {
    const r = await fetch(url, { method: "POST", headers, body });
    db()
      .raw.prepare(
        `UPDATE user_alerts SET last_fired_at = ?, last_status = ? WHERE id = ?`,
      )
      .run(Date.now(), r.status, alert.id);
  } catch {
    db()
      .raw.prepare(
        `UPDATE user_alerts SET last_fired_at = ?, last_status = -1 WHERE id = ?`,
      )
      .run(Date.now(), alert.id);
  }
}

export async function fireVesselEvent(
  event: AlertEvent,
  payload: VesselEventPayload,
): Promise<number> {
  const candidates = db()
    .raw.prepare(
      `SELECT * FROM user_alerts WHERE event = ? AND active = 1`,
    )
    .all(event) as unknown as UserAlert[];

  let fired = 0;
  await Promise.all(
    candidates.map(async (alert) => {
      if (alert.port_filter && alert.port_filter !== payload.port) return;
      if (
        alert.watchlist_only &&
        !isVesselWatchlisted(alert.user_id, payload.mmsi)
      ) {
        return;
      }
      // For eta_approaching: respect the per-alert lead_time_minutes —
      // alerts with a small lead (e.g. 30 min) shouldn't fire when the
      // vessel is still 2 h out, while alerts with a 120 min lead should.
      // Plus dedup against the voyage id so we fire once per voyage
      // instead of every scanner tick while ETA stays close.
      if (event === "vessel.eta_approaching") {
        const lead = alert.lead_time_minutes ?? ETA_APPROACHING_DEFAULT_LEAD_MIN;
        const minsUntil = payload.minutesUntilEta;
        if (typeof minsUntil !== "number" || minsUntil > lead) return;
        if (payload.voyageId) {
          const existing = db()
            .raw.prepare(
              `SELECT 1 FROM alert_eta_fired
               WHERE alert_id = ? AND voyage_id = ?`,
            )
            .get(alert.id, payload.voyageId);
          if (existing) return;
        }
      }
      await deliver(alert, payload);
      if (event === "vessel.eta_approaching" && payload.voyageId) {
        db()
          .raw.prepare(
            `INSERT OR IGNORE INTO alert_eta_fired
             (alert_id, voyage_id, fired_at) VALUES (?, ?, ?)`,
          )
          .run(alert.id, payload.voyageId, Date.now());
      }
      fired++;
    }),
  );
  return fired;
}
