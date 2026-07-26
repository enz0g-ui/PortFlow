interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
  active?: boolean;
  onClick?: () => void;
}

/**
 * Tuile KPI de la bande du haut — spec handoff « Modernisation dashboard »
 * (§3) : radius 14, --pf-panel-strong, ombre --pf-sh-tile, label Mono 9px
 * .17em, valeur 29px tabular-nums, hint Mono 10.5px. Le chrome vient de la
 * classe `.pf-kpi` (globals.css) ; ici on ne pilote que l'état + le ton.
 * Rendue sous `.pf-deck`, donc les tokens --pf-* sont disponibles.
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
  const cls = `pf-kpi${interactive ? " is-interactive" : ""}${active ? " is-active" : ""}`;

  const inner = (
    <>
      <div className={`pf-kpi__label${tone === "bad" ? " tone-bad" : ""}`}>
        {label}
      </div>
      <div className={`pf-kpi__value${tone !== "default" ? ` tone-${tone}` : ""}`}>
        {value}
      </div>
      {hint ? <div className="pf-kpi__hint">{hint}</div> : null}
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
