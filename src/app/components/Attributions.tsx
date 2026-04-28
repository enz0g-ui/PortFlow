"use client";

import Link from "next/link";

export function Attributions({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="text-[10px] leading-relaxed text-slate-500">
        Données AIS{" "}
        <a
          className="hover:text-slate-300"
          href="https://aisstream.io"
          target="_blank"
          rel="noreferrer"
        >
          aisstream.io
        </a>{" "}
        · Météo{" "}
        <a
          className="hover:text-slate-300"
          href="https://open-meteo.com"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo
        </a>{" "}
        (CC-BY 4.0) · Imagerie Copernicus Sentinel-1 · Cartes ©{" "}
        <a
          className="hover:text-slate-300"
          href="https://carto.com/attributions"
          target="_blank"
          rel="noreferrer"
        >
          CARTO
        </a>{" "}
        +{" "}
        <a
          className="hover:text-slate-300"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>{" "}
        · VIIRS VBD © Payne Institute / Colorado School of Mines (licence requise) ·{" "}
        <strong className="text-amber-400">Not for navigation.</strong>{" "}
        <Link href="/legal" className="underline hover:text-slate-300">
          Mentions légales
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs text-slate-300">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
        Attributions & licences
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-slate-400">
        <li>
          <strong>AIS terrestre</strong> :{" "}
          <a
            className="text-sky-400 hover:underline"
            href="https://aisstream.io"
            target="_blank"
            rel="noreferrer"
          >
            aisstream.io
          </a>{" "}
          — flux communautaire AIS (terms of use libres pour usage technique
          dérivé).
        </li>
        <li>
          <strong>Météo</strong> :{" "}
          <a
            className="text-sky-400 hover:underline"
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>{" "}
          — données sous licence CC-BY 4.0. Source citée à chaque affichage.
        </li>
        <li>
          <strong>Imagerie radar</strong> : « Contains modified Copernicus
          Sentinel data », ESA — données ouvertes Copernicus.
        </li>
        <li>
          <strong>Cartographie</strong> : tuiles ©{" "}
          <a
            className="text-sky-400 hover:underline"
            href="https://carto.com/attributions"
            target="_blank"
            rel="noreferrer"
          >
            CARTO
          </a>{" "}
          (CC BY 3.0) sur fond ©{" "}
          <a
            className="text-sky-400 hover:underline"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors (ODbL 1.0).
        </li>
        <li>
          <strong>VIIRS Boat Detection</strong> : produit commercial du Payne
          Institute, Colorado School of Mines{" "}
          <a
            className="text-sky-400 hover:underline"
            href="https://payneinstitute.mines.edu/viirs-nightfire-licensing/"
            target="_blank"
            rel="noreferrer"
          >
            (licence requise)
          </a>{" "}
          — connecteur prêt côté code, activation après contrat. Citation à
          inclure : Elvidge, C.D., et al., « VIIRS Boat Detection (VBD) ».
        </li>
        <li>
          <strong>Données AIS satellite premium</strong> (Spire / MarineTraffic
          / Orbcomm) : aucune utilisation par défaut. Activation contractuelle
          requise — termes du fournisseur s&apos;appliquent.
        </li>
      </ul>
    </div>
  );
}
