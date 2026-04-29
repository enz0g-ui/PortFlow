"use client";

import { useEffect, useState } from "react";

type Kind = "slack" | "discord" | "telegram" | "email" | "webhook";
type EventName = "vessel.arrived" | "vessel.departed" | "vessel.anomaly";

interface Alert {
  id: number;
  kind: Kind;
  target_url: string;
  event: EventName;
  watchlist_only: number;
  port_filter: string | null;
  active: number;
  last_fired_at: number | null;
  last_status: number | null;
  label: string | null;
}

interface ListResp {
  alerts: Alert[];
  max: number;
  allowed: boolean;
  tier: string;
}

export function AlertsSection() {
  const [data, setData] = useState<ListResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    kind: "slack" as Kind,
    targetUrl: "",
    event: "vessel.arrived" as EventName,
    watchlistOnly: true,
    label: "",
  });

  const load = async () => {
    try {
      const r = await fetch("/api/user/alerts", { cache: "no-store" });
      if (!r.ok) return;
      setData((await r.json()) as ListResp);
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
      const r = await fetch("/api/user/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `error ${r.status}`);
        return;
      }
      setForm({ ...form, targetUrl: "", label: "" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await fetch(`/api/user/alerts?id=${id}`, { method: "DELETE" });
    await load();
  };

  const toggle = async (id: number, active: boolean) => {
    await fetch("/api/user/alerts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await load();
  };

  if (!data) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Alertes
        </h2>
        <p className="text-xs text-slate-500">…</p>
      </section>
    );
  }

  if (!data.allowed) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Alertes Slack / Discord / webhook
        </h2>
        <p className="text-xs text-slate-400">
          Disponible à partir du plan <strong>Starter</strong>. Reçois une
          notification quand un navire de ta flotte arrive, quitte, ou présente
          une anomalie.
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

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Alertes ({data.alerts.length} / {data.max})
        </h2>
        <span className="text-[10px] text-slate-500">
          Slack / Discord / webhook
        </span>
      </div>

      {data.alerts.length > 0 ? (
        <ul className="mb-4 space-y-1.5 text-xs">
          {data.alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded border border-slate-800 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-sky-300">
                    {a.kind}
                  </span>
                  <span className="text-slate-300">{a.event}</span>
                  {a.watchlist_only ? (
                    <span className="text-[10px] text-slate-500">
                      · ma flotte
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400">
                      · tous navires
                    </span>
                  )}
                  {a.port_filter ? (
                    <span className="text-[10px] text-slate-500">
                      · {a.port_filter}
                    </span>
                  ) : null}
                </div>
                {a.label ? (
                  <div className="text-[10px] text-slate-500">{a.label}</div>
                ) : null}
                <div className="truncate text-[10px] font-mono text-slate-600">
                  {a.target_url}
                </div>
                {a.last_fired_at ? (
                  <div className="text-[10px] text-slate-500">
                    last fire: {new Date(a.last_fired_at).toLocaleString()}
                    {" · "}
                    status {a.last_status}
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => toggle(a.id, !a.active)}
                className={`rounded border px-2 py-0.5 text-[10px] ${
                  a.active
                    ? "border-emerald-700 text-emerald-400"
                    : "border-slate-700 text-slate-500"
                }`}
              >
                {a.active ? "actif" : "off"}
              </button>
              <button
                onClick={() => remove(a.id)}
                className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-rose-500 hover:text-rose-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {data.alerts.length < data.max ? (
        <form onSubmit={submit} className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.kind}
              onChange={(e) =>
                setForm({ ...form, kind: e.target.value as Kind })
              }
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
            >
              <option value="slack">Slack incoming webhook</option>
              <option value="telegram">Telegram bot</option>
              <option value="email">Email</option>
              <option value="discord">Discord webhook</option>
              <option value="webhook">Generic webhook (JSON)</option>
            </select>
            <select
              value={form.event}
              onChange={(e) =>
                setForm({ ...form, event: e.target.value as EventName })
              }
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
            >
              <option value="vessel.arrived">vessel.arrived</option>
              <option value="vessel.departed">vessel.departed</option>
              <option value="vessel.anomaly">vessel.anomaly</option>
            </select>
          </div>
          <input
            type={form.kind === "email" ? "email" : "url"}
            required
            placeholder={
              form.kind === "telegram"
                ? "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>"
                : form.kind === "slack"
                  ? "https://hooks.slack.com/services/…"
                  : form.kind === "discord"
                    ? "https://discord.com/api/webhooks/…"
                    : form.kind === "email"
                      ? "you@example.com"
                      : "https://your-server.example/webhook"
            }
            value={form.targetUrl}
            onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono"
          />
          {form.kind === "telegram" ? (
            <p className="text-[10px] text-slate-500">
              Crée un bot via @BotFather, envoie-lui /start, récupère le chat_id
              via{" "}
              <code className="rounded bg-slate-800 px-1">
                https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
              </code>
              .
            </p>
          ) : null}
          <input
            type="text"
            placeholder="label (optional)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
          />
          <label className="flex items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              checked={form.watchlistOnly}
              onChange={(e) =>
                setForm({ ...form, watchlistOnly: e.target.checked })
              }
              className="accent-sky-500"
            />
            Seulement les navires de ma flotte
          </label>
          {error ? (
            <div className="text-[11px] text-rose-400">{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? "…" : "Ajouter l'alerte"}
          </button>
        </form>
      ) : (
        <p className="text-[11px] text-slate-500">
          Limite atteinte ({data.max}). Supprime une alerte ou passe en plan
          supérieur.
        </p>
      )}
    </section>
  );
}
