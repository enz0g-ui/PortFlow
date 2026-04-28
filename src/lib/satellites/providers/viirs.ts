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
  status(): SourceStatus {
    const configured = !!process.env.EOG_LICENSE_KEY;
    return {
      active: false,
      configured,
      reason: configured
        ? "license configured — connector ready, daily VBD pull pending implementation"
        : "licence commerciale Payne Institute requise — set EOG_LICENSE_KEY après contrat. Alternative gratuite : Sentinel-1 SAR (déjà intégré).",
    };
  },
};
