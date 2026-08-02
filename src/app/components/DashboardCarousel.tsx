"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Carrousel de captures du dashboard sur la landing (demande initiale de la
 * refonte : « des captures d'un dashboard qui claque qui tournent gentiment
 * en boucle »). Crossfade doux toutes les ~5,5 s, points cliquables, tout le
 * cadre est un lien vers /app. Auto-rotation coupée si prefers-reduced-motion.
 * Images statiques dans public/carousel/ (recapturées à chaque refonte).
 */
const SLIDES = [
  {
    src: "/carousel/globe.jpg",
    alt: "Port Flow live dashboard — world AIS mesh on an interactive globe",
    caption: "The AIS mesh — 51 ports on one globe, live vessel counts",
  },
  {
    src: "/carousel/port.jpg",
    alt: "Port Flow live dashboard — Rotterdam port view with colour-coded vessels",
    caption: "Port view — every vessel colour-coded, zones and trails live",
  },
  {
    src: "/carousel/analytics.jpg",
    alt: "Port Flow live dashboard — flows, fleet mix and dark-fleet signals",
    caption: "Flows, fleet mix, dark-fleet signals — the numbers behind the map",
  },
];

const INTERVAL_MS = 5_500;

export function DashboardCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % SLIDES.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      <Link
        href="/app"
        className="group relative block overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-[0_40px_70px_-40px_rgba(0,0,0,1)]"
        aria-label="Open the live dashboard"
      >
        {/* ratio stable pour éviter tout layout shift */}
        <div className="relative aspect-[1204/860] w-full">
          {SLIDES.map((s, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* voile bas pour la légende */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-5 py-3.5">
            <p className="font-mono text-[11.5px] text-slate-300">
              {SLIDES[idx].caption}
            </p>
            <span className="whitespace-nowrap rounded-md border border-sky-600/50 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors group-hover:border-sky-400 group-hover:text-sky-200">
              Open the live dashboard →
            </span>
          </div>
        </div>
      </Link>
      <div className="mt-3 flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx
                ? "w-6 bg-sky-400"
                : "w-3 bg-slate-700 hover:bg-slate-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
