"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PortInfo {
  id: string;
  name: string;
  flag: string;
  country: string;
  region: string;
  strategic?: boolean;
  vesselCount?: number;
}

interface PortsResp {
  ports: PortInfo[];
}

const SUGGESTED: Array<{ id: string; reason: string }> = [
  { id: "rotterdam", reason: "ARA hub n°1 — pétrochimie + LNG" },
  { id: "antwerp", reason: "ARA hub — chemicals + container" },
  { id: "hormuz", reason: "Chokepoint pétrolier critique" },
  { id: "singapore", reason: "Hub bunkering + transbordement Asie" },
  { id: "fujairah", reason: "Bunkering Moyen-Orient + STS zone" },
  { id: "rasLaffan", reason: "LNG export n°1 mondial" },
  { id: "houston", reason: "Crude + product US Gulf" },
  { id: "shanghai", reason: "Container n°1 mondial" },
];

function WelcomeInner() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [allPorts, setAllPorts] = useState<PortInfo[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [savingPorts, setSavingPorts] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ports", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: PortsResp | null) => {
        if (cancelled || !json) return;
        setAllPorts(json.ports);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/watchlist/ports", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) {
          if (!cancelled) router.replace("/sign-in?redirect_url=/welcome");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  const togglePort = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const savePorts = async () => {
    setSavingPorts(true);
    try {
      for (const id of picked) {
        await fetch("/api/user/watchlist/ports", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ portId: id }),
        });
      }
      setStep(3);
    } finally {
      setSavingPorts(false);
    }
  };

  const finish = () => {
    const first = picked.values().next().value;
    router.replace(first ? `/?port=${first}` : "/");
  };

  return (
    <main className="mx-auto flex w-full max-w-[900px] flex-col gap-8 p-6 pt-12">
      <header className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Setup · {step}/3</div>
        <button
          onClick={() => {
            setSkipped(true);
            router.replace("/");
          }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Passer →
        </button>
      </header>

      {step === 1 ? (
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenue sur Port Flow 👋
            </h1>
            <p className="mt-2 text-slate-300">
              En 90 secondes, on configure ton dashboard pour qu&apos;il te soit
              utile dès aujourd&apos;hui.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-sky-400">①</span>
              <span>
                Choisis tes <strong>3 ports prioritaires</strong> (Free) — ils
                seront tes favoris dès le dashboard
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-400">②</span>
              <span>
                Découvre les <strong>features clés</strong> — précision ETA,
                demurrage risk, alertes
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-400">③</span>
              <span>
                Tu saisiras une <strong>API key + alerte</strong> dès que tu
                upgrade
              </span>
            </li>
          </ul>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-400"
            >
              Démarrer →
            </button>
            <Link
              href="/"
              className="rounded border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-sky-500"
            >
              Aller direct au dashboard
            </Link>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Tes 3 ports prioritaires
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Le plan Free te donne accès à 3 ports. Choisis les plus
              pertinents pour ton activité — tu pourras les modifier à tout
              moment depuis le sélecteur de port.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sélection : {picked.size}/3
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Suggestions stratégiques
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED.map(({ id, reason }) => {
                const port = allPorts.find((p) => p.id === id);
                if (!port) return null;
                const isPicked = picked.has(id);
                const isFull = picked.size >= 3 && !isPicked;
                return (
                  <button
                    key={id}
                    onClick={() => togglePort(id)}
                    disabled={isFull}
                    className={`flex items-start gap-2 rounded border px-3 py-2 text-left transition-colors ${
                      isPicked
                        ? "border-sky-500 bg-sky-500/10"
                        : isFull
                          ? "border-slate-800 bg-slate-900/30 opacity-40"
                          : "border-slate-800 bg-slate-900/60 hover:border-sky-700"
                    }`}
                  >
                    <span className="text-lg leading-none">{port.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-100">
                        {port.name}
                        {isPicked ? (
                          <span className="ml-2 text-sky-400">✓</span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {reason}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <details className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs">
            <summary className="cursor-pointer text-slate-400">
              Voir les 51 ports disponibles
            </summary>
            <div className="mt-3 grid max-h-60 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 scroll-thin">
              {allPorts
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => {
                  const isPicked = picked.has(p.id);
                  const isFull = picked.size >= 3 && !isPicked;
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePort(p.id)}
                      disabled={isFull}
                      className={`flex items-center gap-2 rounded px-2 py-1 text-left text-[11px] ${
                        isPicked
                          ? "bg-sky-500/15 text-sky-300"
                          : isFull
                            ? "text-slate-600"
                            : "text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{p.flag}</span>
                      <span className="flex-1 truncate">{p.name}</span>
                      {isPicked ? <span className="text-sky-400">✓</span> : null}
                    </button>
                  );
                })}
            </div>
          </details>

          <div className="flex gap-3">
            <button
              onClick={savePorts}
              disabled={picked.size === 0 || savingPorts}
              className="rounded bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
            >
              {savingPorts
                ? "…"
                : picked.size === 0
                  ? "Choisis au moins 1 port"
                  : `Suivant — ${picked.size} port${picked.size > 1 ? "s" : ""} →`}
            </button>
            <button
              onClick={() => setStep(1)}
              className="rounded border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-sky-500"
            >
              ← Retour
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Tu es prêt 🚀
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Voilà ce que tu peux faire dès maintenant :
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card
              title="Tracker un navire"
              body="Clique l'icône 📌 sur n'importe quelle ligne de la table Voyages actifs. Il apparaît dans /fleet."
              cta="Aller au dashboard →"
              href="/"
            />
            <Card
              title="Mesurer la précision"
              body="La page /precision publie le RMSE 30j vs ETA broadcast — ce qu'aucun concurrent ne fait."
              cta="Voir /precision →"
              href={`/precision?port=${picked.values().next().value ?? "rotterdam"}`}
            />
            <Card
              title="Évaluer un risque"
              body="Sur la fiche d'un navire à quai, le score demurrage estime la proba de retard."
              cta="Comprendre l'algo →"
              href="/methodology"
            />
            <Card
              title="Quand tu seras prêt"
              body="Plan Starter (129€) débloque alertes Slack/Telegram/email + API + 25 navires watchlist."
              cta="Voir les tarifs →"
              href="/pricing"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={finish}
              className="rounded bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-400"
            >
              Lancer le dashboard →
            </button>
          </div>
        </section>
      ) : null}

      {skipped ? (
        <p className="text-[11px] text-slate-500">Setup ignoré.</p>
      ) : null}
    </main>
  );
}

function Card({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mb-3 text-xs text-slate-400">{body}</p>
      <Link href={href} className="text-xs text-sky-400 hover:underline">
        {cta}
      </Link>
    </article>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          …
        </div>
      }
    >
      <WelcomeInner />
    </Suspense>
  );
}
