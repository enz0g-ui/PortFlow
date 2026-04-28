"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALE_FLAGS, type Locale } from "@/lib/i18n/messages";

export type PortRegion =
  | "northern-europe"
  | "mediterranean"
  | "americas"
  | "middle-east"
  | "asia"
  | "africa"
  | "chokepoint";

export interface PortInfo {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: PortRegion;
  strategic: boolean;
  nativeLocale: Locale;
  names: Partial<Record<Locale, string>>;
  countryNames: Partial<Record<Locale, string>>;
  blurb: string;
  blurbs?: Partial<Record<Locale, string>> | null;
  vesselCount: number;
}

interface Props {
  ports: PortInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const REGION_ORDER: PortRegion[] = [
  "northern-europe",
  "mediterranean",
  "americas",
  "middle-east",
  "asia",
  "africa",
  "chokepoint",
];

function localized(
  port: PortInfo,
  locale: Locale,
): {
  name: string;
  country: string;
  blurb: string;
  nativeName?: string;
} {
  const name = port.names[locale] ?? port.name;
  const country = port.countryNames[locale] ?? port.country;
  const blurb = port.blurbs?.[locale] ?? port.blurb;
  const nativeName =
    port.nativeLocale !== locale ? port.names[port.nativeLocale] : undefined;
  return { name, country, blurb, nativeName };
}

function searchableText(port: PortInfo): string {
  const parts: string[] = [
    port.name,
    port.country,
    port.id,
    ...Object.values(port.names),
    ...Object.values(port.countryNames),
  ].filter((x): x is string => typeof x === "string");
  return parts.join(" ").toLowerCase();
}

export function PortSelector({ ports, selectedId, onSelect }: Props) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<PortRegion | "all">("all");
  const [strategicOnly, setStrategicOnly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = ports.find((p) => p.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ports.filter((p) => {
      if (strategicOnly && !p.strategic) return false;
      if (region !== "all" && p.region !== region) return false;
      if (q && !searchableText(p).includes(q)) return false;
      return true;
    });
  }, [ports, query, region, strategicOnly]);

  const grouped = useMemo(() => {
    const map: Record<PortRegion, PortInfo[]> = {
      "northern-europe": [],
      mediterranean: [],
      americas: [],
      "middle-east": [],
      asia: [],
      africa: [],
      chokepoint: [],
    };
    for (const p of filtered) map[p.region].push(p);
    for (const arr of Object.values(map)) {
      arr.sort((a, b) => {
        if (b.vesselCount !== a.vesselCount) return b.vesselCount - a.vesselCount;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [filtered]);

  const sel = selected ? localized(selected, locale) : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm hover:border-sky-500"
      >
        <span className="text-lg leading-none">{selected?.flag}</span>
        <span className="font-semibold">{sel?.name ?? "—"}</span>
        {selected?.strategic ? (
          <span className="text-amber-400" title="Strategic">
            ★
          </span>
        ) : null}
        {sel?.nativeName ? (
          <span className="text-xs italic text-slate-400">
            ({sel.nativeName})
          </span>
        ) : null}
        <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] tabular-nums text-slate-400">
          {selected?.vesselCount ?? 0}
        </span>
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 12 12"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-[2000] mt-1 max-h-[600px] w-[460px] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          <div className="border-b border-slate-800 p-3 space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              <FilterChip
                active={region === "all"}
                onClick={() => setRegion("all")}
              >
                {t("region.all")} ({ports.length})
              </FilterChip>
              {REGION_ORDER.map((r) => {
                const count = ports.filter((p) => p.region === r).length;
                if (count === 0) return null;
                return (
                  <FilterChip
                    key={r}
                    active={region === r}
                    onClick={() => setRegion(r)}
                  >
                    {t(`region.${r}`)} ({count})
                  </FilterChip>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-400">
              <input
                type="checkbox"
                checked={strategicOnly}
                onChange={(e) => setStrategicOnly(e.target.checked)}
                className="accent-sky-500"
              />
              ★ {t("filter.starredOnly")}
            </label>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {REGION_ORDER.map((r) => {
              const list = grouped[r];
              if (list.length === 0) return null;
              return (
                <div key={r}>
                  <div className="sticky top-0 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                    {t(`region.${r}`)} · {list.length}
                  </div>
                  {list.map((p) => {
                    const l = localized(p, locale);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelect(p.id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-slate-800 ${
                          p.id === selectedId ? "bg-sky-500/10" : ""
                        }`}
                      >
                        <span className="text-xl leading-none">{p.flag}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-semibold text-slate-100">
                              {l.name}
                              {p.strategic ? (
                                <span
                                  className="ml-1 text-amber-400"
                                  title="Strategic"
                                >
                                  ★
                                </span>
                              ) : null}
                              {l.nativeName ? (
                                <span className="ml-2 text-xs italic text-slate-400">
                                  {l.nativeName}
                                </span>
                              ) : null}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {l.country}{" "}
                              <span className="ml-1 text-slate-600">
                                {LOCALE_FLAGS[p.nativeLocale]}
                              </span>
                            </span>
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                            {l.blurb}
                          </div>
                          <div className="mt-1 text-[10px] tabular-nums text-slate-500">
                            {p.vesselCount} navires
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                —
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
        active
          ? "bg-sky-500/20 text-sky-300"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
