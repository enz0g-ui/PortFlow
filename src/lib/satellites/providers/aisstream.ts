import type { SatelliteSource } from "../types";

export const aisstreamSource: SatelliteSource = {
  id: "aisstream",
  label: "aisstream.io",
  tier: "ais-terrestrial",
  tariff: "free-with-key",
  description:
    "Community-fed terrestrial AIS websocket feed. Excellent coverage Europe / US, weaker in Persian Gulf and parts of the Mediterranean. Open beta — no SLA published by the upstream operator.",
  homepage: "https://aisstream.io",
  envKeys: ["AISSTREAM_API_KEY"],
  integration: "live",
  status() {
    const ok = !!process.env.AISSTREAM_API_KEY;
    return {
      active: ok,
      configured: ok,
      reason: ok ? "Primary live feed" : "Feed temporarily unavailable",
    };
  },
};
