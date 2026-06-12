"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked — user can select manually */
        }
      }}
      className={
        className ||
        "rounded border border-sky-700 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 hover:border-sky-500 hover:text-sky-100"
      }
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}
