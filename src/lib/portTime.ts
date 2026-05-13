/**
 * Timezone resolution for ports.
 *
 * AIS broadcasts are UTC. The dashboard previously displayed all ETAs in UTC
 * (shipping industry convention), but reviewer feedback flagged this as
 * unfriendly for non-traders. We now display **local port time** as the
 * primary value with the UTC equivalent as a tooltip.
 *
 * Strategy:
 *  - Longitude-derived offset (no DST). Round(lon/15) → hours east of UTC.
 *  - Returns an IANA Etc/GMT zone, which Intl.DateTimeFormat understands.
 *  - Note: Etc/GMT signs are INVERTED from common usage. Etc/GMT-5 means
 *    UTC+5 (Karachi), Etc/GMT+8 means UTC-8 (Los Angeles).
 *
 * Future: add a `timezone?: string` override field to Port for DST-aware
 * IANA names (Europe/Amsterdam, America/New_York, etc.).
 */
export function timezoneForLongitude(lon: number): string {
  if (!Number.isFinite(lon)) return "UTC";
  const offsetHours = Math.round(lon / 15);
  if (offsetHours === 0) return "UTC";
  // Invert sign for Etc/GMT zone convention.
  const sign = offsetHours > 0 ? "-" : "+";
  return `Etc/GMT${sign}${Math.abs(offsetHours)}`;
}

/**
 * AIS ETA is a 4-field encoding (month/day/hour/minute) — vessels often
 * leave it at defaults (year=1970) or set far-future placeholder dates.
 * Reject obviously invalid timestamps before formatting.
 */
export function isPlausibleEta(ts: number | null | undefined): ts is number {
  if (ts == null || !Number.isFinite(ts)) return false;
  const now = Date.now();
  // ETA more than 30 days expired → stale; treat as no useful info.
  if (ts < now - 30 * 86_400_000) return false;
  // ETA more than 1 year in the future → AIS placeholder / default value.
  if (ts > now + 365 * 86_400_000) return false;
  return true;
}

/**
 * Returns the display string in port-local time and the UTC equivalent
 * (for tooltip). Plus the delta from now in hours, signed.
 */
export function formatEtaLocal(
  ts: number | null | undefined,
  locale: string,
  timezone: string,
): { display: string; title: string; ok: boolean } {
  if (!isPlausibleEta(ts)) {
    return {
      display: "—",
      title: ts == null ? "No ETA broadcast" : "Invalid / stale ETA",
      ok: false,
    };
  }
  const d = new Date(ts);
  const diffH = (ts - Date.now()) / 3_600_000;
  const sign = diffH < 0 ? "−" : "+";
  const local = d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
  const utc = d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return {
    display: `${local} (${sign}${Math.abs(diffH).toFixed(1)} h)`,
    title: `${utc} UTC · port-local: ${timezone}`,
    ok: true,
  };
}
