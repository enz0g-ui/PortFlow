"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

interface AccuracyResp {
  windowDays: number;
  sampleCount: number;
  rmseHours: number | null;
  maeHours: number | null;
  baselineRmseHours: number | null;
  baselineMaeHours?: number | null;
  baselineCount?: number;
  baselineExcluded?: number;
  modelRmseOnBaselineHours?: number | null;
  modelMaeOnBaselineHours?: number | null;
}

interface Props {
  data: AccuracyResp | null;
}

const MIN_BASELINE_N = 20;

function fmtH(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(1)} h`;
}

export function AccuracyPanel({ data }: Props) {
  const { t } = useI18n();

  const baselineN = data?.baselineCount ?? 0;
  const excluded = data?.baselineExcluded ?? 0;
  const baselineMeaningful = baselineN >= MIN_BASELINE_N;

  // Head-to-head is computed on the SAME voyage set (vessels that broadcast a
  // usable, non-sentinel ETA), so the displayed model + broadcast figures and
  // the headline % are mutually consistent. Lead with MAE (robust to the long
  // tail of stale broadcasts); RMSE shown as the secondary line.
  const ourMae = baselineMeaningful
    ? (data?.modelMaeOnBaselineHours ?? null)
    : (data?.maeHours ?? null);
  const ourRmse = baselineMeaningful
    ? (data?.modelRmseOnBaselineHours ?? null)
    : (data?.rmseHours ?? null);
  const bcastMae = data?.baselineMaeHours ?? null;
  const bcastRmse = data?.baselineRmseHours ?? null;

  const delta =
    baselineMeaningful && ourMae !== null && bcastMae !== null && bcastMae > 0
      ? ((bcastMae - ourMae) / bcastMae) * 100
      : null;
  const ourBeats = delta !== null && delta > 0;

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
            {t("accuracy.ourEta")}
          </div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-400">
            {fmtH(ourMae)}
          </div>
          <div className="text-[10px] text-slate-500">
            MAE · RMSE {fmtH(ourRmse)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">
            {t("accuracy.broadcastEta")}
          </div>
          {baselineMeaningful ? (
            <>
              <div className="text-2xl font-semibold tabular-nums text-slate-300">
                {fmtH(bcastMae)}
              </div>
              <div className="text-[10px] text-slate-500">
                MAE · RMSE {fmtH(bcastRmse)}
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
        <>
          <div className="mt-2 rounded border border-slate-800 bg-slate-950/40 px-2 py-1 text-xs">
            {ourBeats ? (
              <span className="text-emerald-400">
                {t("accuracy.beats", { pct: Math.abs(delta).toFixed(1) })}
              </span>
            ) : (
              <span className="text-amber-400">
                {t("accuracy.behind", { pct: Math.abs(delta).toFixed(1) })}
              </span>
            )}{" "}
            <span className="text-slate-300">{t("accuracy.suffix")}</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {t("accuracy.basis", { n: baselineN })}
            {excluded > 0 ? ` · ${t("accuracy.excluded", { n: excluded })}` : ""}{" "}
            <Link href="/methodology" className="text-sky-500 hover:underline">
              {t("accuracy.methodologyLink")}
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-2 text-xs text-slate-500">
          {!baselineMeaningful
            ? t("accuracy.waitingSample")
            : t("accuracy.notEnough")}
        </div>
      )}
    </div>
  );
}
