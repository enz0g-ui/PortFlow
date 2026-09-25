import type { Metadata } from "next";
import Dashboard, { type KpiResponse, type VoyagesResp } from "../Dashboard";
import { computeKpiSnapshot } from "@/lib/kpi";
import { computeActiveVoyages } from "@/lib/active-voyages";
import { meta } from "@/lib/store";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";

// The live dashboard — the product itself. Kept out of the index: it's an
// interactive tool, not content. The marketing landing at `/` is the
// indexable, conversion-oriented front door.
export const metadata: Metadata = {
  title: "Live dashboard",
  robots: { index: false, follow: false },
};

// Snapshot KPI calculé à la requête, dans le même process que le worker AIS
// (pm2 fork unique) : lecture mémoire, coût nul. Toujours dynamique — un
// rendu statique servirait des chiffres figés.
export const dynamic = "force-dynamic";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const requested = typeof sp.port === "string" ? sp.port : undefined;
  const portId = requested && getPort(requested) ? requested : DEFAULT_PORT_ID;

  let initialKpi: KpiResponse | null = null;
  let initialVoyages: VoyagesResp | null = null;
  try {
    initialKpi = {
      port: portId,
      snapshot: computeKpiSnapshot(portId),
      worker: meta.status(),
    };
    // Même calcul que /api/voyages/active (une requête SQL bornée à 500
    // lignes + lecture mémoire) : les tuiles « voyages actifs » et « en
    // attente en rade » arrivent avec leurs chiffres dans le HTML.
    initialVoyages = computeActiveVoyages(portId) as VoyagesResp | null;
  } catch {
    // Store pas encore hydraté (tout premier instant après un boot) : le
    // client retombe sur le comportement d'origine, tirets puis polling.
  }

  return (
    <Dashboard
      initialPort={portId}
      initialKpi={initialKpi}
      initialVoyages={initialVoyages}
    />
  );
}
