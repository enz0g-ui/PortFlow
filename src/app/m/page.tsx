import type { Metadata } from "next";
import { MobileGlance } from "./MobileGlance";

// The phone-first glance view: watchlist ETAs + alerts, one thumb, one fetch.
// An app surface, not content — kept out of the index like /app.
export const metadata: Metadata = {
  title: "Mobile",
  robots: { index: false, follow: false },
};

export default function MobilePage() {
  return <MobileGlance />;
}
