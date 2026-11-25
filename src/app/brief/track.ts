// Envoi « fire and forget » d'un clic UI vers /api/ev.
export function track(e: string, m?: number): void {
  try {
    const body = JSON.stringify({ e, m });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/ev", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/ev", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
    }
  } catch {
    /* mesure best effort */
  }
}
