"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TRIED_KEY = "pf_autodemo_tried";

/**
 * Démarre automatiquement la démo anonyme quand un visiteur sans session
 * arrive sur /app — plus besoin de trouver le bouton « Try demo » (presque
 * jamais cliqué). Monté uniquement côté serveur pour les visiteurs sans
 * session (ni compte, ni cookie démo).
 *
 * Garde-fous :
 * - une seule tentative par onglet (sessionStorage) : si le cookie est
 *   bloqué, pas de boucle de rechargements ;
 * - navigateurs pilotés (navigator.webdriver) ignorés ;
 * - limite d'une démo par IP / 24 h côté serveur : en cas de 429 on laisse
 *   le tableau de bord en accès libre et on propose l'inscription.
 */
export function AutoDemo() {
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    try {
      if (navigator.webdriver) return;
      if (sessionStorage.getItem(TRIED_KEY)) return;
      sessionStorage.setItem(TRIED_KEY, "1");
    } catch {
      // Stockage indisponible (navigation privée stricte) : on tente une fois
      // quand même ; le rechargement aura le cookie, donc pas de boucle.
    }
    let cancelled = false;
    fetch("/api/auth/demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ anonymous: true, source: "auto" }),
    })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 429) {
          setRateLimited(true);
          return;
        }
        // Rechargement complet : les composants client se remontent avec le
        // cookie démo (sinon favoris et filtres restent verrouillés).
        if (res.ok) window.location.reload();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rateLimited) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-lg border border-sky-700/60 bg-sky-950/90 px-4 py-2 text-xs text-sky-100 shadow-lg backdrop-blur">
      Free preview already used from this network today.{" "}
      <Link
        href="/sign-up?from=demo"
        className="font-semibold text-sky-300 underline hover:text-sky-100"
      >
        Create a free account
      </Link>{" "}
      to keep exploring.
      <button
        type="button"
        onClick={() => setRateLimited(false)}
        aria-label="Dismiss"
        className="ml-3 text-sky-400 hover:text-sky-100"
      >
        ×
      </button>
    </div>
  );
}
