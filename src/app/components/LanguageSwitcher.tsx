"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  type Locale,
} from "@/lib/i18n/messages";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sky-500"
      >
        <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
        <span className="font-medium uppercase">{locale}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-[2000] mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {(LOCALES as readonly Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                l === locale ? "bg-sky-500/10 text-sky-300" : "text-slate-200"
              }`}
            >
              <span className="text-base">{LOCALE_FLAGS[l]}</span>
              <span className="flex-1">{LOCALE_NAMES[l]}</span>
              <span className="text-[10px] uppercase text-slate-500">{l}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
