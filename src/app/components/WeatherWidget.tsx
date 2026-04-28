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

export function WeatherWidget({ data }: Props) {
  const { t } = useI18n();
  if (!data) {
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
