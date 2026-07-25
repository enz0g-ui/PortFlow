import type { Metadata } from "next";
import { GlobeOverview } from "./GlobeOverview";

export const metadata: Metadata = {
  title: "Vue mondiale — maillage AIS temps réel",
  description:
    "Globe interactif du trafic tanker mondial : comptages AIS en direct sur 51 terminaux, grandes routes maritimes et voyages en approche, suivis par Port Flow.",
};

export default function OverviewPage() {
  return <GlobeOverview />;
}
