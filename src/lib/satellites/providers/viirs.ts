import type { SatelliteSource, SourceStatus } from "../types";

export const viirsSource: SatelliteSource = {
  id: "viirs",
  label: "VIIRS Boat Detection (VBD)",
  tier: "optical-night",
  tariff: "paid",
  description:
    "VIIRS Day/Night Band detects vessel lights at night — valuable for fishing fleets and dark fleets (AIS-off vessels). Commercial licence via the Payne Institute (Colorado School of Mines) — pricing on request. For free dark-fleet detection today, see Sentinel-1 SAR.",
  homepage: "https://payneinstitute.mines.edu/viirs-nightfire-licensing/",
  envKeys: ["EOG_LICENSE_KEY"],
  integration: "planned",
  status(): SourceStatus {
    const configured = !!process.env.EOG_LICENSE_KEY;
    return {
      active: false,
      configured,
      reason: configured
        ? "Payne licence configured — nightly NetCDF pull not yet implemented."
        : "Payne Institute commercial licence required. For dark-fleet detection today, see Sentinel-1 SAR (live).",
    };
  },
};
