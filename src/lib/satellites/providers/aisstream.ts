import type { SatelliteSource } from "../types";

export const aisstreamSource: SatelliteSource = {
  id: "aisstream",
  label: "aisstream.io",
  tier: "ais-terrestrial",
  tariff: "free-with-key",
  description:
    "Community-fed terrestrial AIS websocket feed. Excellent coverage Europe / US, weak in Persian Gulf and parts of the Mediterranean.",
  homepage: "https://aisstream.io",
  envKeys: ["AISSTREAM_API_KEY"],
  status() {
    const ok = !!process.env.AISSTREAM_API_KEY;
    return {
      active: ok,
      configured: ok,
      reason: ok ? "primary live feed" : "set AISSTREAM_API_KEY in .env.local",
    };
  },
};
