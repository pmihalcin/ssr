"use client";

import { useEffect, useState } from "react";
import { formatMs, markHydrated, observeTimings, type Timings } from "./timing";

const rows: { key: keyof Timings; label: string; help: string }[] = [
  { key: "ttfb", label: "TTFB", help: "Time to first byte: how long the server took to start sending the page." },
  { key: "fcp", label: "FCP", help: "First Contentful Paint: when the browser first painted any content." },
  { key: "hydrated", label: "Hydrated", help: "React finished hydrating (CSR: finished its first render)." },
  { key: "dataVisible", label: "Data visible", help: "The Orders first appeared on screen." },
];

export function TimingOverlay({ observe = observeTimings }: { observe?: (onChange: (timings: Timings) => void) => () => void }) {
  const [timings, setTimings] = useState<Timings>({});
  const [latency, setLatency] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    markHydrated();
    setLatency(new URLSearchParams(window.location.search).get("latency"));
    return observe(setTimings);
  }, [observe]);

  return (
    <aside
      aria-label="Initial Load timings"
      className="fixed right-2 bottom-2 z-50 rounded border border-slate-300 bg-white/95 p-2 text-xs shadow"
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
        className="font-medium text-slate-700"
      >
        Timings {collapsed ? "▸" : "▾"}
      </button>
      {!collapsed && (
        <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-3 tabular-nums">
          {rows.map(({ key, label, help }) => (
            <div key={key} className="contents">
              <dt title={help} className="cursor-help text-slate-500">
                {label}
              </dt>
              <dd className="text-right">{formatMs(timings[key])}</dd>
            </div>
          ))}
          {latency && (
            <div className="contents">
              <dt title="The delay the API was asked to wait for with ?latency." className="cursor-help text-slate-500">
                Latency
              </dt>
              <dd className="text-right">{latency} ms</dd>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}
