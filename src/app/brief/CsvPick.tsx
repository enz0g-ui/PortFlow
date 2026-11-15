"use client";

import { useRef, useState } from "react";

// Import d'une liste de flotte (CSV / TXT exporté d'Excel ou d'un outil
// d'affrètement). On cherche sur chaque ligne un IMO (7 chiffres), sinon un
// MMSI (9 chiffres), sinon la première colonne (nom). Tout reste dans le
// navigateur : le fichier n'est pas envoyé, seul le champ est rempli.

function extract(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length && out.length < 50; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const imo = line.match(/(?:^|[^\d])(\d{7})(?!\d)/);
    const mmsi = line.match(/(?:^|[^\d])(\d{9})(?!\d)/);
    let v = imo?.[1] ?? mmsi?.[1] ?? null;
    if (!v) {
      const first = line.split(/[;,\t]/)[0]?.replace(/^"|"$/g, "").trim() ?? "";
      // Ligne d'en-tête probable : on l'ignore.
      if (i === 0 && /name|vessel|ship|navire|imo|mmsi/i.test(first)) continue;
      if (first.length >= 2 && first.length <= 40) v = first;
    }
    if (v && !seen.has(v.toUpperCase())) {
      seen.add(v.toUpperCase());
      out.push(v);
    }
  }
  return out;
}

export function CsvPick({ target = "pf-screen" }: { target?: string }) {
  const input = useRef<HTMLInputElement | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2_000_000) return setMsg("File too large (2 MB max)");
    const items = extract(await f.text());
    const ta = document.getElementById(target) as HTMLTextAreaElement | null;
    if (!ta || items.length === 0) return setMsg("No IMO, MMSI or name found in that file");
    ta.value = items.join("\n");
    setMsg(`${items.length} vessel${items.length > 1 ? "s" : ""} loaded — press Screen`);
    ta.focus();
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="rounded border border-slate-700 px-2 py-0.5 text-slate-300 hover:border-sky-500 hover:text-sky-300"
      >
        ⇪ Import a fleet list (CSV)
      </button>
      <input
        ref={input}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {msg ? <span className="text-slate-400">{msg}</span> : null}
    </span>
  );
}
