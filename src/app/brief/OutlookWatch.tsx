"use client";

import { track } from "./track";
import { WatchButton } from "./WatchButton";

export function OutlookWatch({ mmsi, inPort }: { mmsi: number; inPort: boolean }) {
  return (
    <div onClickCapture={() => track("next.outlook_watch", mmsi)}>
      <WatchButton
        mmsi={mmsi}
        label={inPort ? "◉ Watch this ship" : "◉ Alert me on arrival"}
        className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
      />
    </div>
  );
}
