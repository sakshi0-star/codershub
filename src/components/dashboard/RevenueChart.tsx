"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { cx, money } from "@/lib/format";
import { useAsync } from "@/lib/hooks";
import type { SeriesPoint } from "@/lib/types";
import { useApp } from "../AppContext";
import { Card, ErrorState, Skeleton } from "../ui";

const RANGES = [7, 30, 60];
type Metric = "revenue" | "purchases";

export function RevenueChart() {
  const { version } = useApp();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<Metric>("revenue");
  const [sel, setSel] = useState<number | null>(null);
  const { data, error, loading, reload } = useAsync(() => api<{ points: SeriesPoint[] }>(`/api/series?days=${days}`), [days, version]);

  const pts = data?.points ?? [];
  const val = (p: SeriesPoint) => (metric === "revenue" ? p.revenue : p.purchases);
  const fmt = (n: number) => (metric === "revenue" ? money(n) : `${n} purchase${n === 1 ? "" : "s"}`);
  const total = pts.reduce((a, p) => a + val(p), 0);
  const max = Math.max(1, ...pts.map(val));
  const niceMax = metric === "revenue" ? Math.ceil(max / 5000) * 5000 || 5000 : Math.max(2, Math.ceil(max / 2) * 2);

  const W = 640, H = 200, L = 44, B = 22, T = 8;
  const bw = pts.length ? (W - L) / pts.length : 0;
  const idx = sel ?? pts.length - 1;
  const active = pts[idx];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{metric === "revenue" ? "Revenue" : "Purchases"} over time</h2>
          <p className="tnum text-sm text-ink-soft">{data ? `${fmt(total)} in the last ${days} days` : "\u00A0"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Seg label="Metric" options={[["revenue", "Revenue"], ["purchases", "Purchases"]]} value={metric} onChange={(v) => setMetric(v as Metric)} />
          <Seg label="Range" options={RANGES.map((d) => [String(d), `${d}d`])} value={String(days)} onChange={(v) => { setDays(Number(v)); setSel(null); }} />
        </div>
      </div>

      <div className="mt-4" aria-busy={loading}>
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} compact />
        ) : !data ? (
          <Skeleton className="h-[200px] w-full" />
        ) : total === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">No completed purchases in this period.</p>
        ) : (
          <>
            <div className="tnum mb-1 min-h-[20px] text-xs text-ink-soft" aria-live="polite">
              {active && <><span className="font-semibold text-ink">{new Date(active.date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>{" · "}{fmt(val(active))}</>}
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className={cx("w-full touch-pan-y", loading && "opacity-60")} role="img" aria-label={`Bar chart of daily ${metric} for the last ${days} days. Total ${fmt(total)}.`}>
              {[0, 0.5, 1].map((f) => {
                const y = T + (H - B - T) * (1 - f);
                return (
                  <g key={f}>
                    <line x1={L} x2={W} y1={y} y2={y} stroke="#DDE2E8" strokeDasharray={f ? "3 3" : undefined} />
                    <text x={L - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#7B8696">{metric === "revenue" ? `$${Math.round((niceMax * f) / 100)}` : Math.round(niceMax * f)}</text>
                  </g>
                );
              })}
              {pts.map((p, i) => {
                const h = (val(p) / niceMax) * (H - B - T);
                const x = L + i * bw;
                return (
                  <g key={p.date} onPointerEnter={() => setSel(i)} onClick={() => setSel(i)}>
                    <rect x={x} y={T} width={bw} height={H - B - T} fill="transparent" />
                    <rect x={x + bw * 0.15} y={H - B - h} width={Math.max(bw * 0.7, 1)} height={h} rx={Math.min(3, bw / 3)} fill={i === idx ? "#0A5E5D" : "#0E7C7B"} opacity={i === idx ? 1 : 0.8} />
                  </g>
                );
              })}
              {[0, Math.floor(pts.length / 2), pts.length - 1].map((i) => (
                <text key={i} x={L + i * bw + bw / 2} y={H - 5} fontSize="11" fill="#7B8696" textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}>
                  {new Date(pts[i].date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </text>
              ))}
            </svg>
          </>
        )}
      </div>
    </Card>
  );
}

function Seg({ label, options, value, onChange }: { label: string; options: string[][]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-canvas p-0.5">
      {options.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}
          className={cx("min-h-[40px] rounded-md px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand", value === v ? "bg-white text-ink shadow-panel" : "text-ink-soft")}>
          {l}
        </button>
      ))}
    </div>
  );
}
