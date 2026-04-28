"use client";

import { use, useEffect, useState } from "react";
import { CongestionGauge } from "../../components/CongestionGauge";
import { WeatherWidget } from "../../components/WeatherWidget";

interface KpiResp {
  snapshot: {
    totalVessels: number;
    anchored: number;
    underway: number;
    moored: number;
    inboundLastHour: number;
  };
}

interface WeatherResp {
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

export default function WidgetPage({
  params,
}: {
  params: Promise<{ port: string }>;
}) {
  const { port } = use(params);
  const [kpi, setKpi] = useState<KpiResp | null>(null);
  const [weather, setWeather] = useState<WeatherResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [kr, wr] = await Promise.all([
          fetch(`/api/kpis?port=${port}`, { cache: "no-store" }),
          fetch(`/api/weather?port=${port}`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (kr.ok) setKpi(await kr.json());
        if (wr.ok) setWeather(await wr.json());
      } catch {
        /* keep last */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [port]);

  return (
    <div className="bg-slate-950 p-3" style={{ minHeight: "100vh" }}>
      <div className="mb-2 flex items-baseline justify-between text-[10px] text-slate-500">
        <span className="uppercase tracking-wider">Port Flow · {port}</span>
        <a
          href={`/?port=${port}`}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 hover:underline"
        >
          détails →
        </a>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <CongestionGauge
          anchored={kpi?.snapshot.anchored ?? 0}
          total={kpi?.snapshot.totalVessels ?? 0}
        />
        <WeatherWidget data={weather} />
      </div>
      <div className="mt-2 text-center text-[9px] text-slate-600">
        Powered by{" "}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-400"
        >
          portflow.io
        </a>
      </div>
    </div>
  );
}
