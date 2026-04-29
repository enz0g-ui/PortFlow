"use client";

import { useEffect, useState } from "react";

interface MaskedKey {
  id: string;
  label: string | null;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
}

interface Resp {
  keys: MaskedKey[];
  max: number;
  allowed: boolean;
  tier: string;
}

export function ApiKeysSection() {
  const [data, setData] = useState<Resp | null>(null);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [revealed, setRevealed] = useState<{ token: string; id: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/user/api-keys", { cache: "no-store" });
      if (!r.ok) return;
      setData((await r.json()) as Resp);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `error ${r.status}`);
        return;
      }
      const json = (await r.json()) as { key: MaskedKey; token: string };
      setRevealed({ token: json.token, id: json.key.id });
      setLabel("");
      setCreating(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cette clé ? L'action est irréversible.")) return;
    await fetch(`/api/user/api-keys?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  };

  if (!data) {
    return null;
  }

  if (!data.allowed) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Clés API
        </h2>
        <p className="text-xs text-slate-400">
          API publique disponible à partir du plan <strong>Starter</strong>.
          Permet d&apos;intégrer Port Flow dans ta stack (Excel, Notion, BI,
          backend interne).
        </p>
        <a
          href="/pricing"
          className="mt-3 inline-block rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400"
        >
          Voir les tarifs →
        </a>
      </section>
    );
  }

  const active = data.keys.filter((k) => !k.revokedAt);
  const revoked = data.keys.filter((k) => k.revokedAt);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Clés API ({active.length} / {data.max})
        </h2>
        <a
          href="/api-docs"
          className="text-[10px] text-sky-400 hover:underline"
        >
          Documentation →
        </a>
      </div>

      {revealed ? (
        <div className="mb-3 rounded border border-emerald-700/50 bg-emerald-500/10 p-3">
          <div className="mb-1 text-[11px] font-semibold text-emerald-300">
            Ta nouvelle clé — copie-la maintenant, elle ne sera plus affichée :
          </div>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-slate-950 px-2 py-1.5 font-mono text-xs text-emerald-200">
              {revealed.token}
            </code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(revealed.token);
              }}
              className="rounded border border-emerald-700 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-500/15"
            >
              Copier
            </button>
            <button
              onClick={() => setRevealed(null)}
              className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Test :{" "}
            <code className="rounded bg-slate-950 px-1 font-mono">
              curl -H &quot;Authorization: Bearer {revealed.token.slice(0, 12)}…&quot; https://portflow.uk/api/v1/ports
            </code>
          </div>
        </div>
      ) : null}

      {active.length > 0 ? (
        <ul className="mb-3 space-y-1.5 text-xs">
          {active.map((k) => (
            <li
              key={k.id}
              className="flex items-center gap-2 rounded border border-slate-800 px-2 py-1.5"
            >
              <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {k.prefix}…
              </code>
              <div className="min-w-0 flex-1">
                <div className="text-slate-200">{k.label || "—"}</div>
                <div className="text-[10px] text-slate-500">
                  créée {new Date(k.createdAt).toLocaleString()}
                  {k.lastUsedAt
                    ? ` · dernière utilisation ${new Date(k.lastUsedAt).toLocaleString()}`
                    : " · jamais utilisée"}
                </div>
              </div>
              <button
                onClick={() => revoke(k.id)}
                className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-rose-500 hover:text-rose-400"
              >
                Révoquer
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!creating && active.length < data.max ? (
        <button
          onClick={() => setCreating(true)}
          className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400"
        >
          + Créer une clé API
        </button>
      ) : null}

      {creating ? (
        <form onSubmit={submit} className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Label (ex: prod-zapier, n8n-staging)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? "…" : "Créer"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setLabel("");
              setError(null);
            }}
            className="rounded border border-slate-700 px-2 py-1.5 text-xs text-slate-400"
          >
            ✕
          </button>
          {error ? (
            <span className="text-[10px] text-rose-400">{error}</span>
          ) : null}
        </form>
      ) : null}

      {revoked.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-[10px] text-slate-500">
            Clés révoquées ({revoked.length})
          </summary>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-500">
            {revoked.map((k) => (
              <li key={k.id} className="flex items-center gap-2">
                <code className="rounded bg-slate-800 px-1 py-0.5 font-mono">
                  {k.prefix}…
                </code>
                <span>
                  {k.label || "—"} · révoquée{" "}
                  {k.revokedAt ? new Date(k.revokedAt).toLocaleString() : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
