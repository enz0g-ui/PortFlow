/**
 * Data briefs — short, dated, sourced posts that cross a real Port Flow signal
 * with the maritime news. Figures here are FROZEN at authoring time (a brief is
 * a point-in-time snapshot, like a press clipping) — never auto-updated. The
 * live, current figures for composing the NEXT post live on /news/signals.
 *
 * Integrity rules (see audit §4.6):
 *  - Only publish what the data genuinely supports. One solid brief beats five
 *    shaky ones.
 *  - Describe the observable, never the intent ("AIS off 14h off X", not
 *    "vessel X is evading sanctions"). Add a disclaimer where relevant.
 *  - Date and keep everything — the archive is the long-term asset.
 */

export interface BriefStat {
  label: string;
  value: string;
  sub?: string;
}

export interface Brief {
  slug: string;
  title: string;
  dek: string;
  /** ISO date, e.g. "2026-06-12". */
  publishedAt: string;
  tags: string[];
  /** "The news" — 1-3 short paragraphs of context. */
  event?: string[];
  eventSource?: { label: string; url: string };
  /** Lead-in to the data section. */
  dataIntro?: string;
  /** Frozen figures captured from the live signals at authoring time. */
  stats?: BriefStat[];
  /** "What it implies" — 1-2 short paragraphs for a trader / charterer. */
  implication?: string[];
  /** Copy-paste-ready LinkedIn line. */
  punchline: string;
  disclaimer?: string;
}

export const BRIEFS: Brief[] = [
  {
    slug: "predicted-vs-broadcast-eta-june-2026",
    title: "We checked our ETA against the ship's own: 2.8 h vs 32.8 h",
    dek: "Across 371 closed voyages to Rotterdam over the last 30 days, Port Flow's predicted ETA was off by 2.8 hours on average. The crew-broadcast ETA those same ships transmit was off by 32.8.",
    publishedAt: "2026-06-12",
    tags: ["eta", "benchmark"],
    event: [
      "Every tanker broadcasts an ETA in its AIS message — typed in by the crew. Desks lean on it for berth planning, demurrage and cargo timing, even though everyone knows it drifts.",
      "We measured how far. For every voyage that actually closed at Rotterdam in the last 30 days, we compared two ETAs against the real arrival: ours, and the ship's own broadcast.",
    ],
    eventSource: { label: "the live benchmark", url: "https://portflow.uk/precision" },
    dataIntro: "Mean absolute error, same 371 closed voyages, last 30 days:",
    stats: [
      { label: "Port Flow predicted ETA", value: "2.8 h", sub: "mean absolute error" },
      { label: "Broadcast (crew) ETA", value: "32.8 h", sub: "same voyages" },
      { label: "Sample", value: "371 voyages", sub: "Rotterdam · 30 days" },
    ],
    implication: [
      "On a single voyage that's the difference between holding a berth slot and missing it — and between budgeting demurrage and eating it.",
      "We're not asking you to take our word for it: the number is published and updates as voyages close. Check it yourself.",
    ],
    punchline:
      "We checked our predicted ETA against the ship's own broadcast ETA over 371 closed voyages at Rotterdam: 2.8 h average error vs 32.8 h. We publish the number, updated as voyages close. portflow.uk/precision",
    disclaimer:
      "Both figures are mean absolute error on the same voyage set; broadcast ETAs more than 7 days off (AIS sentinel/placeholder values) are excluded from both. Public AIS, Rotterdam, 30-day window — snapshot dated 12 June 2026.",
  },
  {
    slug: "introducing-data-briefs",
    title: "Port Flow data briefs: the numbers behind the maritime news",
    dek: "Each brief crosses a real Port Flow signal with the story you're already reading — port congestion, chokepoint transits, AIS gaps, ETA accuracy. Observed, dated, sourced.",
    publishedAt: "2026-06-12",
    tags: ["about"],
    event: [
      "The maritime headlines tell you something happened. They rarely tell you what the data underneath is doing — how many vessels are actually waiting, how many transits a strait saw this week, how far off the declared ETAs really are.",
      "That's the gap these briefs fill. Port Flow already computes those signals live across 51 ports and 12 chokepoints. Each brief takes one of them, ties it to the news, and states the number — nothing inflated, nothing inferred.",
    ],
    dataIntro: "What you'll find in every brief:",
    stats: [
      { label: "The signal", value: "One real figure", sub: "congestion, transits, AIS gaps, ETA error" },
      { label: "The context", value: "Tied to the news", sub: "with a link to the source" },
      { label: "The method", value: "Open & dated", sub: "observable only — never intent" },
    ],
    implication: [
      "If you trade, charter, insure or screen tankers, the point is simple: you can check the number yourself, on a live desk, in one click — no signup.",
    ],
    punchline:
      "We're publishing data briefs — the real numbers behind maritime headlines: port congestion, chokepoint transits, AIS gaps, ETA accuracy. Observed, dated, sourced. portflow.uk/news",
    disclaimer:
      "Coverage is public AIS; where it's thin (parts of the Med and the Gulf), we say so rather than overstate. We describe what the data shows, not why.",
  },
];

export function listBriefs(): Brief[] {
  return [...BRIEFS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBrief(slug: string): Brief | undefined {
  return BRIEFS.find((b) => b.slug === slug);
}
