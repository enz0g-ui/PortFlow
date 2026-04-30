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
  bookmarkedIds?: ReadonlySet<string>;
  onToggleBookmark?: (portId: string) => void;
  bookmarksEnabled?: boolean;
  accessiblePortIds?: "all" | string[];
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

export function PortSelector({
  ports,
  selectedId,
  onSelect,
  bookmarkedIds,
  onToggleBookmark,
  bookmarksEnabled = false,
  accessiblePortIds,
}: Props) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<PortRegion | "all">("all");
  const [strategicOnly, setStrategicOnly] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = ports.find((p) => p.id === selectedId);
  const isBookmarked = (id: string) => bookmarkedIds?.has(id) ?? false;
  const isAccessible = (id: string): boolean => {
    if (!accessiblePortIds || accessiblePortIds === "all") return true;
    return accessiblePortIds.includes(id);
  };
  const limitedAccess =
    accessiblePortIds !== undefined && accessiblePortIds !== "all";

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
      if (bookmarkedOnly && !isBookmarked(p.id)) return false;
      if (strategicOnly && !p.strategic) return false;
      if (region !== "all" && p.region !== region) return false;
      if (q && !searchableText(p).includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ports, query, region, strategicOnly, bookmarkedOnly, bookmarkedIds]);

  const bookmarkedList = useMemo(() => {
    if (!bookmarkedIds || bookmarkedIds.size === 0) return [];
    return ports
      .filter((p) => bookmarkedIds.has(p.id))
      .sort((a, b) => {
        if (b.vesselCount !== a.vesselCount) return b.vesselCount - a.vesselCount;
        return a.name.localeCompare(b.name);
      });
  }, [ports, bookmarkedIds]);

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
        const aAcc = isAccessible(a.id) ? 0 : 1;
        const bAcc = isAccessible(b.id) ? 0 : 1;
        if (aAcc !== bAcc) return aAcc - bAcc;
        if (b.vesselCount !== a.vesselCount) return b.vesselCount - a.vesselCount;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, accessiblePortIds]);

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
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={strategicOnly}
                  onChange={(e) => setStrategicOnly(e.target.checked)}
                  className="accent-sky-500"
                />
                ★ {t("filter.starredOnly")}
              </label>
              {bookmarksEnabled ? (
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={bookmarkedOnly}
                    onChange={(e) => setBookmarkedOnly(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span className="text-sky-400">●</span>{" "}
                  {t("filter.myPortsOnly")}
                  {bookmarkedIds && bookmarkedIds.size > 0 ? (
                    <span className="text-slate-500">
                      ({bookmarkedIds.size})
                    </span>
                  ) : null}
                </label>
              ) : null}
            </div>
          </div>

          <div className="scroll-thin max-h-[400px] overflow-y-auto">
            {bookmarksEnabled &&
            !bookmarkedOnly &&
            !query &&
            region === "all" &&
            !strategicOnly &&
            bookmarkedList.length > 0 ? (
              <div>
                <div className="sticky top-0 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-wider text-sky-400">
                  ● {t("port.section.mine")} · {bookmarkedList.length}
                </div>
                {bookmarkedList.map((p) => (
                  <PortRow
                    key={`bm-${p.id}`}
                    port={p}
                    locale={locale}
                    selected={p.id === selectedId}
                    bookmarked
                    bookmarksEnabled={bookmarksEnabled}
                    accessible={isAccessible(p.id)}
                    onSelect={(id) => {
                      onSelect(id);
                      setOpen(false);
                    }}
                    onToggleBookmark={onToggleBookmark}
                    bookmarkAddLabel={t("port.bookmark.add")}
                    bookmarkRemoveLabel={t("port.bookmark.remove")}
                  />
                ))}
              </div>
            ) : null}

            {REGION_ORDER.map((r) => {
              const list = grouped[r];
              if (list.length === 0) return null;
              return (
                <div key={r}>
                  <div className="sticky top-0 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                    {t(`region.${r}`)} · {list.length}
                  </div>
                  {list.map((p) => (
                    <PortRow
                      key={p.id}
                      port={p}
                      locale={locale}
                      selected={p.id === selectedId}
                      bookmarked={isBookmarked(p.id)}
                      bookmarksEnabled={bookmarksEnabled}
                      accessible={isAccessible(p.id)}
                      onSelect={(id) => {
                        onSelect(id);
                        setOpen(false);
                      }}
                      onToggleBookmark={onToggleBookmark}
                      bookmarkAddLabel={t("port.bookmark.add")}
                      bookmarkRemoveLabel={t("port.bookmark.remove")}
                    />
                  ))}
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

function PortRow({
  port,
  locale,
  selected,
  bookmarked,
  bookmarksEnabled,
  accessible = true,
  onSelect,
  onToggleBookmark,
  bookmarkAddLabel,
  bookmarkRemoveLabel,
}: {
  port: PortInfo;
  locale: Locale;
  selected: boolean;
  bookmarked: boolean;
  bookmarksEnabled: boolean;
  accessible?: boolean;
  onSelect: (id: string) => void;
  onToggleBookmark?: (id: string) => void;
  bookmarkAddLabel: string;
  bookmarkRemoveLabel: string;
}) {
  const l = localized(port, locale);
  return (
    <div
      className={`flex w-full items-start gap-2 transition-colors ${
        !accessible
          ? "bg-slate-950/40 hover:bg-slate-900/60"
          : selected
            ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
            : "hover:bg-slate-800/60"
      }`}
    >
      <button
        onClick={() => onSelect(port.id)}
        className="flex flex-1 items-start gap-3 px-3 py-2 text-left"
      >
        <span
          className={`text-xl leading-none transition-all ${
            !accessible ? "grayscale opacity-40" : ""
          }`}
        >
          {port.flag}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`flex items-center gap-1.5 text-sm font-semibold ${
                accessible ? "text-slate-100" : "text-slate-500"
              }`}
            >
              {!accessible ? (
                <span
                  className="text-amber-400"
                  title="Plan supérieur requis"
                  aria-label="Verrouillé"
                >
                  🔒
                </span>
              ) : null}
              {l.name}
              {port.strategic ? (
                <span className="ml-1 text-amber-400" title="Strategic">
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
                {LOCALE_FLAGS[port.nativeLocale]}
              </span>
            </span>
          </div>
          <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
            {l.blurb}
          </div>
          <div className="mt-1 text-[10px] tabular-nums text-slate-500">
            {port.vesselCount} navires
          </div>
        </div>
      </button>
      {bookmarksEnabled && onToggleBookmark ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(port.id);
          }}
          title={bookmarked ? bookmarkRemoveLabel : bookmarkAddLabel}
          aria-label={bookmarked ? bookmarkRemoveLabel : bookmarkAddLabel}
          className={`mt-2 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors ${
            bookmarked
              ? "text-sky-400 hover:bg-sky-500/20"
              : "text-slate-600 hover:text-sky-400 hover:bg-slate-700"
          }`}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
            {bookmarked ? (
              <path d="M3 2v12.5l5-3 5 3V2H3z" />
            ) : (
              <path
                d="M3.5 2v11.5l4.5-2.7 4.5 2.7V2h-9zm1 1h7v9.2L8 10.5l-3.5 1.7V3z"
                fillRule="evenodd"
              />
            )}
          </svg>
        </button>
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
