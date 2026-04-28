import type { SatelliteSource, SourceStatus } from "../types";

export const orbcommSource: SatelliteSource = {
  id: "orbcomm",
  label: "Orbcomm",
  tier: "ais-satellite",
  tariff: "paid",
  description:
    "Historic S-AIS leader, complementary to Spire. Useful as a redundancy feed for critical zones (Hormuz, Bab el-Mandeb, Gulf of Mexico).",
  homepage: "https://www.orbcomm.com/en/networks/satellite-ais",
  envKeys: ["ORBCOMM_API_TOKEN"],
  status(): SourceStatus {
    const configured = !!process.env.ORBCOMM_API_TOKEN;
    return {
      active: configured,
      configured,
      reason: configured
        ? "configured — connector implementation pending vendor docs"
        : "set ORBCOMM_API_TOKEN once contract is signed",
    };
  },
};
