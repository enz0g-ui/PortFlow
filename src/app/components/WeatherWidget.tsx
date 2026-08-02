"use client";

import { useI18n } from "@/lib/i18n/context";

interface Weather {
  temperature: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  waveHeight: number | null;
  waveDirection: number | null;
  fetchedAt: number;
}

interface Props {
  data: Weather | null;
  /** "card" (par défaut) ou "strip" = bandeau horizontal translucide posé au
   *  bas du panneau globe (handoff §5.9). */
  variant?: "card" | "strip";
  /** Vitesse moyenne dans le chenal (kn), affichée dans la variante bandeau. */
  channelSpeed?: number | null;
}

function tone(windKn: number): "good" | "warn" | "bad" {
  if (windKn >= 35) return "bad";
  if (windKn >= 22) return "warn";
  return "good";
}

const compass = (deg: number) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
};

export function WeatherWidget({ data, variant = "card", channelSpeed }: Props) {
  const { t } = useI18n();
  if (!data) {
    if (variant === "strip") return null;
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-500">
        {t("weather.loading")}
      </div>
    );
  }
  const wTone = tone(data.windSpeed);
  const windColor =
    wTone === "good"
      ? "text-emerald-400"
      : wTone === "warn"
        ? "text-amber-400"
        : "text-rose-400";

  // Bandeau horizontal (handoff §5.9) : VENT · TEMP · HOULE · CHENAL, séparés
  // par des filets verticaux, sur fond translucide flouté au bas du globe.
  if (variant === "strip") {
    return (
      <div className="pf-wx-strip">
        <div className="pf-wx-grp">
          <span className="pf-wx-lbl">{t("weather.wind")}</span>
          <span className={`pf-wx-val ${windColor}`}>
            {data.windSpeed.toFixed(0)}
            <span className="pf-wx-unit">kn</span>
          </span>
          <span className="pf-wx-det">
            {compass(data.windDirection)} ({Math.round(data.windDirection)}°)
            {data.windGust > data.windSpeed + 2 ? (
              <span className="ms-1.5 text-amber-400">
                {t("weather.gust")} {data.windGust.toFixed(0)}
              </span>
            ) : null}
          </span>
        </div>
        <span className="pf-wx-sep" />
        <div className="pf-wx-grp">
          <span className="pf-wx-lbl">{t("weather.temp")}</span>
          <span className="pf-wx-val text-slate-100">{data.temperature.toFixed(0)}°</span>
          <span className="pf-wx-det">
            ☁ {Math.round(data.cloudCover)}% · ☂ {data.precipitation.toFixed(1)} mm
          </span>
        </div>
        {data.waveHeight != null ? (
          <>
            <span className="pf-wx-sep" />
            <div className="pf-wx-grp">
              <span className="pf-wx-lbl">{t("weather.wave")}</span>
              <span className="pf-wx-val text-slate-100">
                {data.waveHeight.toFixed(1)}
                <span className="pf-wx-unit">m</span>
              </span>
              {data.waveDirection != null ? (
                <span className="pf-wx-det">{compass(data.waveDirection)}</span>
              ) : null}
            </div>
          </>
        ) : null}
        {channelSpeed != null ? (
          <>
            <span className="pf-wx-sep" />
            <div className="pf-wx-grp">
              <span className="pf-wx-lbl">{t("channel.avgSpeed")}</span>
              <span className="pf-wx-val text-slate-100">
                {channelSpeed.toFixed(1)}
                <span className="pf-wx-unit">kn</span>
              </span>
            </div>
          </>
        ) : null}
        <span className="pf-wx-src">{t("weather.opMeteo")}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          {t("weather.title")}
        </span>
        <span className="text-slate-500">
          {t("weather.opMeteo")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[10px] uppercase text-slate-500">
            {t("weather.wind")}
          </div>
          <div className={`text-2xl font-semibold tabular-nums ${windColor}`}>
            {data.windSpeed.toFixed(0)}{" "}
            <span className="text-xs text-slate-500">kn</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span
              className="inline-block"
              style={{
                transform: `rotate(${data.windDirection + 180}deg)`,
              }}
              aria-hidden
            >
              ↓
            </span>
            <span>
              {compass(data.windDirection)} ({Math.round(data.windDirection)}°)
            </span>
            {data.windGust > data.windSpeed + 2 ? (
              <span className="ms-2 text-amber-400">
                {t("weather.gust")} {data.windGust.toFixed(0)}
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">
            {t("weather.temp")}
          </div>
          <div className="text-2xl font-semibold tabular-nums text-slate-100">
            {data.temperature.toFixed(0)}°
          </div>
          <div className="text-[11px] text-slate-400">
            ☁ {Math.round(data.cloudCover)}% · ☂{" "}
            {data.precipitation.toFixed(1)} mm
          </div>
        </div>
      </div>
      {data.waveHeight != null ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span>{t("weather.wave")}</span>
          <span className="font-semibold text-slate-200">
            {data.waveHeight.toFixed(1)} m
          </span>
          {data.waveDirection != null ? (
            <span>{compass(data.waveDirection)}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
