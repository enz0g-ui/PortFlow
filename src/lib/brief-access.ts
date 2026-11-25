import type { Tier } from "./auth/tier";

// Accès aux fiches navire selon la formule (décision 25/11/2026) :
// gratuit = 30 derniers jours, sans rapport PDF ; toute formule payante
// (Starter et au-delà) = 90 et 180 jours + rapport PDF daté.
// Le verdict, lui, est toujours calculé sur la fenêtre de référence (90 j)
// pour ne jamais afficher « No alert » à tort à un compte gratuit.

export const BRIEF_FREE_DAYS = 30;
export const BRIEF_VERDICT_DAYS = 90;

export interface BriefAccess {
  paid: boolean;
  maxDays: number;
  report: boolean;
  defaultDays: number;
}

export function briefAccess(tier: Tier | null | undefined): BriefAccess {
  const paid = !!tier && tier !== "free";
  return paid
    ? { paid, maxDays: 180, report: true, defaultDays: 90 }
    : { paid, maxDays: BRIEF_FREE_DAYS, report: false, defaultDays: BRIEF_FREE_DAYS };
}
