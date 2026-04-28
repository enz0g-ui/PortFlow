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
  good: "text-emerald-400",
  warn: "text-amber-400",
  bad: "text-rose-400",
};

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
    "rounded-lg border bg-slate-900/60 px-4 py-3 text-left transition-colors";
  const stateCls = active
    ? "border-sky-500 ring-1 ring-sky-500/40"
    : "border-slate-800";
  const hoverCls = interactive ? "cursor-pointer hover:border-sky-500" : "";
  const cls = `${baseCls} ${stateCls} ${hoverCls}`;

  const inner = (
    <>
      <div className="text-xs uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass[tone]}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
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
