"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface StatusResp {
  services: {
    ais: { healthy: boolean; lastMessageAgeSeconds: number | null };
  };
}

export function DegradationBanner() {
  const { t } = useI18n();
  const [degraded, setDegraded] = useState(false);
  const [ageSeconds, setAgeSeconds] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch("/api/status", { cache: "no-store" });
        if (!r.ok) return;
        const json = (await r.json()) as StatusResp;
        if (!cancelled) {
          setDegraded(json.services.ais.healthy === false);
          setAgeSeconds(json.services.ais.lastMessageAgeSeconds);
        }
      } catch {
        /* network blips on the client shouldn't show the banner */
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!degraded) return null;

  // « Dernières positions connues : il y a X » — un visiteur compliance
  // préfère des données datées et honnêtes à une carte vide sans contexte.
  const asOf =
    ageSeconds == null
      ? null
      : ageSeconds < 3600
        ? t("banner.aisDegraded.asOfMin", { m: Math.max(1, Math.round(ageSeconds / 60)) })
        : t("banner.aisDegraded.asOfH", { h: Math.round(ageSeconds / 3600) });

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-amber-700 bg-amber-500/10 p-3 text-sm text-amber-200"
    >
      <div className="font-semibold">{t("banner.aisDegraded.title")}</div>
      <p className="mt-1 text-xs text-amber-300/80">
        {t("banner.aisDegraded.body")}
        {asOf ? <> {asOf}</> : null}
      </p>
    </div>
  );
}
