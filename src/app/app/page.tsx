import type { Metadata } from "next";
import Dashboard from "../Dashboard";

// The live dashboard — the product itself. Kept out of the index: it's an
// interactive tool, not content. The marketing landing at `/` is the
// indexable, conversion-oriented front door.
export const metadata: Metadata = {
  title: "Live dashboard",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <Dashboard />;
}
