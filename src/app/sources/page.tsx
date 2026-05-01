"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Attributions } from "../components/Attributions";

interface SourceInfo {
  id: string;
  label: string;
  tier: "ais-terrestrial" | "ais-satellite" | "sar" | "optical-night";
  tariff: "free" | "free-with-key" | "paid";
  description: string;
  homepage: string;
  envKeys: string[];
  hasFetchScenes: boolean;
  hasFetchFixes: boolean;
  integration: "live" | "in-progress" | "planned";
  integrationEta?: string;
  status: {
    active: boolean;
    configured: boolean;
    reason?: string;
    lastSyncAt?: number;
    lastError?: string;
  };
}

const INTEGRATION_BADGE_KEYS: Record<
  SourceInfo["integration"],
  { keyLabel: string; cls: string }
> = {
  live: {
    keyLabel: "sources.integration.live",
    cls: "border-emerald-700 bg-emerald-500/10 text-emerald-300",
  },
  "in-progress": {
    keyLabel: "sources.integration.inProgress",
    cls: "border-amber-700 bg-amber-500/10 text-amber-300",
  },
  planned: {
    keyLabel: "sources.integration.planned",
    cls: "border-slate-700 bg-slate-800/40 text-slate-400",
  },
};

interface Resp {
  sources: SourceInfo[];
}

interface UserKey {
  sourceId: string;
  envKeyName: string;
  masked: string;
  configuredAt: number;
}

interface UserIntegrations {
  keys: UserKey[];
  canByoKey: boolean;
  tier: string;
}

interface MeResp {
  authenticated: boolean;
  tier: string;
  portsAccessible?: "all" | string[];
  portsLimit?: number | "all";
  limits?: { apiAccess: boolean; sarFusion: boolean };
}

const TIER_DISPLAY: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  pro: "Pro+",
  enterprise: "Enterprise",
};

const TIER_KEY: Record<SourceInfo["tier"], string> = {
  "ais-terrestrial": "sources.tier.aisTerrestrial",
  "ais-satellite": "sources.tier.aisSatellite",
  sar: "sources.tier.sar",
  "optical-night": "sources.tier.opticalNight",
};

const TARIFF_KEY: Record<
  SourceInfo["tariff"],
  { keyLabel: string; cls: string }
> = {
  free: {
    keyLabel: "sources.tariff.free",
    cls: "bg-emerald-500/10 text-emerald-300 border-emerald-700",
  },
  "free-with-key": {
    keyLabel: "sources.tariff.freeWithKey",
    cls: "bg-sky-500/10 text-sky-300 border-sky-700",
  },
  paid: {
    keyLabel: "sources.tariff.paid",
    cls: "bg-amber-500/10 text-amber-300 border-amber-700",
  },
};

function userAccessLine(
  src: SourceInfo,
  me: MeResp | null,
  tp: (k: string, p?: Record<string, string | number>) => string,
): string | null {
  if (!me || !me.authenticated) return null;
  if (!src.status.active) return null;
  const tier = TIER_DISPLAY[me.tier] ?? me.tier;
  const apiNote = me.limits?.apiAccess
    ? tp("sources.access.apiYes")
    : tp("sources.access.apiNo");

  if (me.portsAccessible === "all") {
    return tp("sources.access.allPorts", { tier, apiNote });
  }

  const count = me.portsAccessible?.length ?? 0;
  const max = typeof me.portsLimit === "number" ? me.portsLimit : null;

  if (count === 0) {
    return max
      ? tp("sources.access.emptyMax", { tier, max })
      : tp("sources.access.empty", { tier });
  }

  const plural = count > 1 ? "s" : "";
  return max
    ? tp("sources.access.partial", { tier, count, max, plural, apiNote })
    : tp("sources.access.partialNoMax", { tier, count, plural, apiNote });
}

export default function SourcesPage() {
  const { tp } = useI18n();
  const [data, setData] = useState<Resp | null>(null);
  const [userInt, setUserInt] = useState<UserIntegrations | null>(null);
  const [userIntUnauth, setUserIntUnauth] = useState(false);
  const [me, setMe] = useState<MeResp | null>(null);

  const loadUserInt = async () => {
    try {
      const r = await fetch("/api/user/integrations", { cache: "no-store" });
      if (r.status === 401) {
        setUserIntUnauth(true);
        return;
      }
      if (!r.ok) return;
      setUserInt((await r.json()) as UserIntegrations);
      setUserIntUnauth(false);
    } catch {
      /* ignore */
    }
    try {
      const r = await fetch("/api/user/me", { cache: "no-store" });
      if (r.ok) setMe((await r.json()) as MeResp);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/sources", { cache: "no-store" });
        if (!r.ok) return;
        const json = (await r.json()) as Resp;
        if (!cancelled) setData(json);
      } catch {
        /* ignore */
      }
    };
    load();
    loadUserInt();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const userKeyByEnv = (envKeyName: string): UserKey | undefined =>
    userInt?.keys.find((k) => k.envKeyName === envKeyName);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          {tp("sources.backLink")}
        </Link>
        <Link
          href="/methodology"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("sources.methodologyLink")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("sources.title")}
        </h1>
        <p className="text-sm text-slate-300">{tp("sources.lead")}</p>
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
          <strong className="text-slate-200">
            {tp("sources.howRead.title")}
          </strong>{" "}
          <span className="rounded border border-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300">
            {tp("sources.howRead.activeBadge")}
          </span>{" "}
          {tp("sources.howRead.activeDesc")}{" "}
          <span className="rounded border border-sky-700 bg-sky-500/10 px-1.5 py-0.5 text-sky-300">
            {tp("sources.howRead.byoBadge")}
          </span>{" "}
          {tp("sources.howRead.byoDesc")}{" "}
          <strong className="text-slate-200">
            {tp("sources.howRead.view")}
          </strong>{" "}
          {tp("sources.howRead.viewDesc")}{" "}
          <strong className="text-slate-200">
            {tp("sources.howRead.api")}
          </strong>{" "}
          {tp("sources.howRead.apiDesc")}{" "}
          <strong className="text-slate-200">
            {tp("sources.howRead.byoOwn")}
          </strong>{" "}
          {tp("sources.howRead.byoOwnDesc")}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data?.sources.map((s) => (
          <article
            key={s.id}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {s.label}
                </h2>
                <div className="text-[11px] text-slate-500">
                  {tp(TIER_KEY[s.tier])}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    TARIFF_KEY[s.tariff].cls
                  }`}
                >
                  {tp(TARIFF_KEY[s.tariff].keyLabel)}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                    INTEGRATION_BADGE_KEYS[s.integration].cls
                  }`}
                  title={
                    s.integrationEta
                      ? tp("sources.integration.etaTitle", {
                          eta: s.integrationEta,
                        })
                      : undefined
                  }
                >
                  {tp(INTEGRATION_BADGE_KEYS[s.integration].keyLabel)}
                  {s.integration !== "live" && s.integrationEta
                    ? ` · ${s.integrationEta}`
                    : ""}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400">{s.description}</p>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  s.status.active
                    ? "border-emerald-700 text-emerald-300"
                    : s.status.configured
                      ? "border-sky-700 text-sky-300"
                      : "border-slate-700 text-slate-400"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {s.status.active
                  ? tp("sources.status.active")
                  : s.status.configured
                    ? tp("sources.status.configured")
                    : tp("sources.status.inactive")}
              </span>
              {s.status.lastSyncAt ? (
                <span className="text-slate-500">
                  {tp("sources.status.syncPrefix")}{" "}
                  {new Date(s.status.lastSyncAt).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              ) : null}
              {s.status.lastError ? (
                <span className="text-rose-400">⚠ {s.status.lastError}</span>
              ) : null}
            </div>

            {s.status.reason ? (
              <p className="mt-2 text-[11px] italic text-slate-500">
                {s.status.reason}
              </p>
            ) : null}

            {userAccessLine(s, me, tp) ? (
              <p className="mt-2 rounded border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-300">
                {userAccessLine(s, me, tp)}
              </p>
            ) : null}

            {s.envKeys.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {s.envKeys.map((k) => (
                  <KeyRowEditor
                    key={k}
                    sourceId={s.id}
                    envKeyName={k}
                    operatorConfigured={s.status.configured}
                    userKey={userKeyByEnv(k)}
                    canByoKey={userInt?.canByoKey ?? false}
                    isAuthenticated={!userIntUnauth}
                    onChanged={loadUserInt}
                  />
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-3 text-xs">
              <a
                href={s.homepage}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline"
              >
                {s.homepage.replace(/^https?:\/\//, "")} ↗
              </a>
              {s.hasFetchScenes ? (
                <span className="text-slate-500">{tp("sources.scenesApi")}</span>
              ) : null}
              {s.hasFetchFixes ? (
                <span className="text-slate-500">{tp("sources.fixesApi")}</span>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("sources.recommendation.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>{tp("sources.recommendation.demo")}</li>
          <li>{tp("sources.recommendation.production")}</li>
          <li>{tp("sources.recommendation.redundancy")}</li>
          <li>{tp("sources.recommendation.darkFleet")}</li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}

function UserKeyRow({
  sourceId,
  envKeyName,
  userKey,
  onChanged,
  sourceLabel,
}: {
  sourceId: string;
  envKeyName: string;
  userKey: UserKey;
  onChanged: () => void;
  sourceLabel: React.ReactNode;
}) {
  const { tp } = useI18n();
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const remove = async () => {
    setBusy(true);
    try {
      await fetch(
        `/api/user/integrations?sourceId=${encodeURIComponent(sourceId)}&envKeyName=${encodeURIComponent(envKeyName)}`,
        { method: "DELETE" },
      );
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/user/integrations/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceId, envKeyName }),
      });
      const json = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      setTestResult({
        ok: json.ok ?? false,
        message: json.message ?? json.error ?? "no response",
      });
    } catch (err) {
      setTestResult({ ok: false, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded border border-emerald-700/40 bg-emerald-500/5 px-2 py-1.5">
      <div className="flex items-center gap-2">
        {sourceLabel}
        <span className="font-mono text-[11px] text-emerald-300">
          {userKey.masked}
        </span>
        <span className="text-[10px] text-slate-500">
          {tp("sources.byo.yourKey")}
        </span>
        <button
          onClick={test}
          disabled={busy}
          className="ml-auto rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:border-sky-500 disabled:opacity-50"
        >
          {tp("sources.byo.test")}
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-rose-500 hover:text-rose-400 disabled:opacity-50"
        >
          ✕
        </button>
      </div>
      {testResult ? (
        <div
          className={`mt-1.5 text-[10px] ${
            testResult.ok ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {testResult.ok ? "✓ " : "✗ "}
          {testResult.message}
        </div>
      ) : null}
    </div>
  );
}

function KeyRowEditor({
  sourceId,
  envKeyName,
  operatorConfigured,
  userKey,
  canByoKey,
  isAuthenticated,
  onChanged,
}: {
  sourceId: string;
  envKeyName: string;
  operatorConfigured: boolean;
  userKey?: UserKey;
  canByoKey: boolean;
  isAuthenticated: boolean;
  onChanged: () => void;
}) {
  const { tp } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/user/integrations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceId, envKeyName, value: value.trim() }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `error ${r.status}`);
        return;
      }
      setValue("");
      setEditing(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const sourceLabel = (
    <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
      {envKeyName}
    </code>
  );

  if (userKey) {
    return (
      <UserKeyRow
        sourceId={sourceId}
        envKeyName={envKeyName}
        userKey={userKey}
        onChanged={onChanged}
        sourceLabel={sourceLabel}
      />
    );
  }

  if (operatorConfigured) {
    return (
      <div className="flex items-center gap-2 rounded border border-slate-800 px-2 py-1.5">
        {sourceLabel}
        <span className="text-[10px] text-slate-500">
          {tp("sources.byo.providedByOp")}
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !canByoKey) {
    return null;
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded border border-slate-800 px-2 py-1.5">
        {sourceLabel}
        <button
          onClick={() => setEditing(true)}
          className="text-[10px] text-sky-400 hover:underline"
        >
          {tp("sources.byo.addKey")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded border border-sky-700/40 bg-sky-500/5 px-2 py-1.5"
    >
      {sourceLabel}
      <input
        type="password"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={tp("sources.byo.placeholder")}
        className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="rounded bg-sky-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-sky-400 disabled:opacity-50"
      >
        ✓
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setValue("");
          setError(null);
        }}
        className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400"
      >
        ✕
      </button>
      {error ? (
        <span className="text-[10px] text-rose-400">{error}</span>
      ) : null}
    </form>
  );
}
