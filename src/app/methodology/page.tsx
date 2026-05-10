"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Attributions } from "../components/Attributions";

export default function MethodologyPage() {
  const { tp } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("methodology.backLink")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("methodology.title")}
        </h1>
        <p className="text-sm text-slate-300">{tp("methodology.lead")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.sources.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>AIS positions</strong> —{" "}
            <a
              className="text-sky-400 underline"
              href="https://aisstream.io"
              target="_blank"
              rel="noreferrer"
            >
              aisstream.io
            </a>
            . {tp("methodology.sources.aisLive")}
          </li>
          <li>
            <strong>AIS static</strong> — {tp("methodology.sources.aisStatic")}
          </li>
          <li>
            <strong>Geo</strong> — {tp("methodology.sources.geo")}
          </li>
          <li>
            <strong>Premium</strong> — {tp("methodology.sources.proprietary")}
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.cargoClass.title")}
        </h2>
        <p className="text-sm text-slate-300">
          {tp("methodology.cargoClass.body")}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.voyages.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.voyages.open")}</li>
          <li>{tp("methodology.voyages.arrival")}</li>
          <li>{tp("methodology.voyages.departure")}</li>
          <li>{tp("methodology.voyages.falsePositives")}</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("methodology.eta.title")}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.eta.naive")}</li>
          <li>{tp("methodology.eta.seasonal")}</li>
          <li>{tp("methodology.eta.broadcast")}</li>
          <li>{tp("methodology.eta.metrics")}</li>
          <li>{tp("methodology.eta.roadmap")}</li>
        </ol>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.anomalies.title")}
        </h2>
        <p className="text-sm text-slate-300">
          {tp("methodology.anomalies.intro")}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.anomalies.tanker")}</li>
          <li>{tp("methodology.anomalies.container")}</li>
          <li>{tp("methodology.anomalies.other")}</li>
        </ul>
        <p className="text-sm text-slate-300">
          {tp("methodology.anomalies.roadmap")}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.persistence.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.persistence.storage")}</li>
          <li>{tp("methodology.persistence.timestamps")}</li>
          <li>{tp("methodology.persistence.snapshot")}</li>
          <li>{tp("methodology.persistence.export")}</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("methodology.sla.title")}</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.uptime")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.uptimeValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.latencyLive")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.latencyLiveValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.latencyKpi")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.latencyKpiValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.webhook")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.webhookValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.retention")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.retentionValue")}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.backfill")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.backfillValue")}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          Sanctions screening — couverture multi-régime
        </h2>
        <p className="text-sm text-slate-300">
          Les navires sont rapprochés de quatre listes officielles, mises à
          jour quotidiennement et réconciliées sur IMO/MMSI :
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>UK Sanctions List (UKSL)</strong> — FCDO, Open Government
            Licence v3.0. ~600 navires (Russie, Iran). Source autoritative
            depuis le retrait de l&apos;OFSI Consolidated List le 28 janvier 2026.
          </li>
          <li>
            <strong>OFAC SDN</strong> — US Treasury, domaine public (17 USC
            §105). ~1 500 navires. Plus large couverture mondiale,
            principalement Iran / Russie / Venezuela / Cuba / Corée du Nord.
          </li>
          <li>
            <strong>UN Security Council Consolidated List</strong> —
            information publique ONU, libre réutilisation. Coverage RPDC,
            Libye, Iran historique.
          </li>
          <li>
            <strong>EU Consolidated FSF</strong> — Commission européenne, EC
            Reuse Decision 2011/833/EU. Russie post-2022 shadow fleet, Belarus,
            Syrie. Activé sur configuration (jeton EU webgate requis).
          </li>
        </ul>
        <p className="text-xs italic text-slate-500">
          Match sur IMO 7 chiffres en priorité (autoritatif), MMSI en
          fallback. Indicateur visuel rouge sur la carte et badge 🚫 dans les
          listes voyages.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          Détection de transit aux chokepoints maritimes
        </h2>
        <p className="text-sm text-slate-300">
          12 zones suivies en continu : Suez, Hormuz, Bab el-Mandeb, Malacca,
          Singapour, Bosphore-Dardanelles, Gibraltar, Skagerrak-Kattegat,
          Détroit du Pas-de-Calais, Panama, Cap de Bonne-Espérance, Magellan.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Détection point-in-bbox toutes les 5 minutes sur la fenêtre
            glissante des 10 dernières minutes de positions AIS reçues.
          </li>
          <li>
            Dédup par cooldown 6 h pour absorber le jitter GPS sans
            doubler les transits.
          </li>
          <li>
            Snapshot de l&apos;état sanctionné au moment de l&apos;entrée — un navire
            radié ultérieurement reste forensiquement marqué pour ce
            transit-là.
          </li>
          <li>
            Alerte composable{" "}
            <code className="rounded bg-slate-800 px-1 text-[11px]">
              vessel.sanctioned_chokepoint_transit
            </code>{" "}
            : déclenchée au moment exact où un navire sous sanctions entre dans
            une de ces zones.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          Estimation des émissions CO₂ — méthode in-house
        </h2>
        <p className="text-sm text-slate-300">
          Approche bottom-up dérivée de l&apos;IMO Fourth GHG Study (2020),
          intégrée sur le flux AIS sans dépendance externe. Pour chaque
          paire de positions consécutives :
        </p>
        <pre className="overflow-x-auto rounded bg-slate-950/80 p-3 text-[11px] text-slate-300">
          power_kW = installed_kW × max(0.10, (speed/design_speed)³){"\n"}
          energy_kWh = power_kW × dt_hours{"\n"}
          fuel_g = energy_kWh × 200 (SFOC){"\n"}
          CO₂_g = fuel_g × 3.114 (HFO emission factor)
        </pre>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Puissance installée et vitesse de service par défaut tirées des
            tables IMO Annex 1, par classe de cargaison (tanker / container /
            LNG / vrac …).
          </li>
          <li>
            Pas de comptage des paires en gap &gt;6 h ou à vitesse &lt;0.5
            kn (navire à quai ou ancré — la consommation auxiliaire stationnaire
            n&apos;est pas modélisée en v1).
          </li>
          <li>
            Précision indicative ±25 % — suffisant pour ranking flotte,
            comparaison voyages, dépistage chartering. Pour reporting
            réglementaire, croiser avec EU MRV (à venir).
          </li>
          <li>
            Endpoint{" "}
            <code className="rounded bg-slate-800 px-1 text-[11px]">
              GET /api/vessels/{"{mmsi}"}/emissions?days=30
            </code>{" "}
            (par navire) et{" "}
            <code className="rounded bg-slate-800 px-1 text-[11px]">
              GET /api/fleet/emissions?days=30
            </code>{" "}
            (agrégat watchlist utilisateur).
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.compliance.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.compliance.solas")}</li>
          <li>{tp("methodology.compliance.gdpr")}</li>
          <li>{tp("methodology.compliance.sanctions")}</li>
          <li>
            {tp("methodology.compliance.legalIntro")}{" "}
            <Link href="/legal" className="text-sky-400 hover:underline">
              {tp("methodology.compliance.legalLabel")}
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <Attributions />
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
