"use client";

import { useI18n } from "@/lib/i18n/context";

interface AccuracyResp {
  windowDays: number;
  sampleCount: number;
  rmseHours: number | null;
  maeHours: number | null;
  baselineRmseHours: number | null;
  baselineCount?: number;
}

interface Props {
  data: AccuracyResp | null;
}

const MIN_BASELINE_N = 20;

function fmtH(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(2)} h`;
}

function tone(rmse: number | null, baseline: number | null): "good" | "warn" {
  if (rmse === null || baseline === null) return "warn";
  return rmse < baseline ? "good" : "warn";
}

export function AccuracyPanel({ data }: Props) {
  const { t } = useI18n();
  const rmse = data?.rmseHours ?? null;
  const baseline = data?.baselineRmseHours ?? null;
  const baselineN = data?.baselineCount ?? 0;
  const baselineMeaningful = baselineN >= MIN_BASELINE_N;
  const tnone = tone(rmse, baselineMeaningful ? baseline : null);
  const delta =
    rmse !== null && baseline !== null && baselineMeaningful
      ? ((rmse - baseline) / baseline) * 100
      : null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          {t("section.accuracy")}
        </span>
        <span className="text-slate-500">
          {t("accuracy.samples", { n: data?.sampleCount ?? 0 })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase text-slate-500">
            {t("accuracy.modelRmse")}
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums ${
              tnone === "good" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {fmtH(rmse)}
          </div>
          <div className="text-[10px] text-slate-500">
            MAE {fmtH(data?.maeHours ?? null)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">
            {t("accuracy.broadcastRmse")}
          </div>
          {baselineMeaningful ? (
            <>
              <div className="text-2xl font-semibold tabular-nums text-slate-300">
                {fmtH(baseline)}
              </div>
              <div className="text-[10px] text-slate-500">
                {t("accuracy.broadcastN", { n: baselineN })}
              </div>
            </>
          ) : (
            <>
              <div className="text-base font-medium text-slate-400">
                {t("accuracy.broadcastInsufficient")}
              </div>
              <div className="text-[10px] text-slate-500">
                {t("accuracy.broadcastDisclaimer", {
                  n: baselineN,
                  min: MIN_BASELINE_N,
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {delta !== null ? (
        <div className="mt-2 rounded border border-slate-800 bg-slate-950/40 px-2 py-1 text-xs text-slate-300">
          {delta < 0 ? (
            <span className="text-emerald-400">
              {t("accuracy.beats", { pct: Math.abs(delta).toFixed(1) })}
            </span>
          ) : (
            <span className="text-amber-400">
              {t("accuracy.behind", { pct: delta.toFixed(1) })}
            </span>
          )}{" "}
          {t("accuracy.suffix")}
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">
          {!baselineMeaningful && baseline !== null
            ? t("accuracy.waitingSample")
            : t("accuracy.notEnough")}
        </div>
      )}
    </div>
  );
}
