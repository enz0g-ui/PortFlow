import type { SatelliteSource, SourceStatus } from "../types";

export const viirsSource: SatelliteSource = {
  id: "viirs",
  label: "VIIRS Boat Detection (VBD)",
  tier: "optical-night",
  tariff: "paid",
  description:
    "VIIRS Day/Night Band detects vessel lights at night — précieux pour fishing fleets et dark fleets (navires AIS éteints). Désormais sous licence commerciale via le Payne Institute (Colorado School of Mines) — pricing sur demande. Pour une alternative gratuite couvrant un cas d'usage similaire, voir Sentinel-1 SAR.",
  homepage: "https://payneinstitute.mines.edu/viirs-nightfire-licensing/",
  envKeys: ["EOG_LICENSE_KEY"],
  integration: "planned",
  integrationEta: "Q4 2026",
  status(): SourceStatus {
    const configured = !!process.env.EOG_LICENSE_KEY;
    return {
      active: false,
      configured,
      reason: configured
        ? "Licence Payne configurée mais le pull NetCDF nightly n'est pas encore codé — intégration finale Q4 2026."
        : "Licence commerciale Payne Institute requise. Pour la détection dark fleet aujourd'hui, voir Sentinel-1 SAR (déjà intégré et live).",
    };
  },
};
