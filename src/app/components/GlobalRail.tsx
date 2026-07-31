"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

/**
 * Rail de navigation GLOBAL (handoff §1) — présent sur toutes les pages du site
 * comme outil de navigation. Compact, glyphes géométriques, état actif dérivé
 * de l'URL courante. Rendu en sidebar fixe à gauche (lg+) depuis le layout
 * racine ; le contenu est décalé de 60px via `lg:pl-[60px]` sur le <body>.
 *
 * Porte la classe `pf-deck` pour disposer des tokens --pf-* (couleurs) même
 * hors dashboard. RISK / LIST pointent vers les ancres du dashboard (/app#…)
 * pour rester fonctionnels depuis n'importe quelle page.
 */
export function GlobalRail() {
  const { t } = useI18n();
  const pathname = usePathname() ?? "";

  const items: Array<{
    glyph: string;
    label: string;
    tip: string;
    href: string;
    match?: string; // route qui rend l'item actif (undefined = ancre, jamais actif)
  }> = [
    { glyph: "live", label: "LIVE", tip: t("ws.rail.live"), href: "/app", match: "/app" },
    { glyph: "eta", label: "ETA", tip: t("ws.rail.eta"), href: "/precision", match: "/precision" },
    { glyph: "globe", label: "GLOBE", tip: t("ws.rail.overview"), href: "/overview", match: "/overview" },
    { glyph: "ports", label: "PORTS", tip: t("ws.rail.ports"), href: "/ports", match: "/ports" },
    { glyph: "list", label: "LIST", tip: t("ws.rail.list"), href: "/app#voyages" },
    { glyph: "risk", label: "RISK", tip: t("ws.rail.risk"), href: "/app#risk" },
    { glyph: "news", label: "NEWS", tip: t("ws.rail.news"), href: "/news", match: "/news" },
    { glyph: "api", label: "API", tip: t("ws.rail.api"), href: "/api-docs", match: "/api-docs" },
  ];

  const isActive = (m?: string) =>
    !!m && (pathname === m || pathname.startsWith(m + "/"));

  return (
    <nav
      className="pf-deck pf-rail fixed left-0 top-0 z-[1200] hidden h-screen w-[60px] flex-col items-center gap-0.5 py-3.5 lg:flex"
      aria-label={t("ws.rail.nav")}
    >
      <Link href="/" className="pf-rail__logo" title={t("ws.rail.home")} aria-label={t("ws.rail.home")} />
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          title={it.tip}
          className={`pf-rail__item${isActive(it.match) ? " is-active" : ""}`}
        >
          <span className={`pf-rail__glyph pf-rail__glyph--${it.glyph}`} aria-hidden />
          <span className="pf-rail__label">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
