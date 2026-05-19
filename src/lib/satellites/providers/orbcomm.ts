import type { SatelliteSource, SourceStatus } from "../types";

export const orbcommSource: SatelliteSource = {
  id: "orbcomm",
  label: "Orbcomm",
  tier: "ais-satellite",
  tariff: "paid",
  description:
    "Historic S-AIS leader, now operated by S&P Global (Maritime AIS division acquired November 2025). Useful as a redundancy feed for critical zones (Hormuz, Bab el-Mandeb, Gulf of Mexico). Connector planned — activation on contracted client request.",
  homepage: "https://www.orbcomm.com/en/networks/satellite-ais",
  envKeys: ["ORBCOMM_API_TOKEN"],
  integration: "planned",
  status(): SourceStatus {
    const configured = !!process.env.ORBCOMM_API_TOKEN;
    return {
      active: false,
      configured,
      reason:
        "Connector not yet implemented. Available on contracted client request — BYO key required.",
    };
  },
};
