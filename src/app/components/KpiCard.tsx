interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
  active?: boolean;
  onClick?: () => void;
}

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-slate-100",
  good: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-rose-300",
};

/**
 * KPI strip cell — mockup « la preuve d'abord » : mono label uppercase,
 * mono number, dense bordered cell. Reads as a connected instrument strip
 * rather than a floating card.
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  active = false,
  onClick,
}: Props) {
  const interactive = typeof onClick === "function";
  const baseCls =
    "rounded-md border bg-slate-900 px-3.5 py-2.5 text-left transition-colors";
  const stateCls = active
    ? "border-sky-500 ring-1 ring-sky-500/40"
    : "border-slate-800";
  const hoverCls = interactive ? "cursor-pointer hover:border-sky-500" : "";
  const cls = `${baseCls} ${stateCls} ${hoverCls}`;

  const inner = (
    <>
      <div
        className={`font-mono text-[9px] font-medium uppercase tracking-[0.1em] ${
          tone === "bad" ? "text-rose-300/90" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div className={`font-mono text-[21px] font-semibold tabular-nums ${toneClass[tone]}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 font-mono text-[10px] text-slate-500">{hint}</div>
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
