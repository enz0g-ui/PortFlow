import type { Metadata } from "next";
import { IsoOverview } from "./IsoOverview";

export const metadata: Metadata = {
  title: "Live overview — isometric map",
  description:
    "Real-time isometric overview of European tanker traffic: live AIS vessel counts across the North Atlantic and Mediterranean hubs tracked by Port Flow.",
};

export default function OverviewPage() {
  return <IsoOverview />;
}
