"use client";
import { api } from "@/lib/api";
import { money, num } from "@/lib/format";
import { useAsync } from "@/lib/hooks";
import type { Overview as O } from "@/lib/types";
import { useApp } from "../AppContext";
import { Card, ErrorState, Skeleton } from "../ui";

export function OverviewCards() {
  const { version } = useApp();
  const { data, error, loading, reload } = useAsync(() => api<O>("/api/overview"), [version]);

  if (error && !data) return <Card><ErrorState error={error} onRetry={reload} compact /></Card>;
  const items = data && [
    { label: "Total revenue", value: money(data.totalRevenue), sub: "Completed purchases" },
    { label: "Revenue this month", value: money(data.revenueThisMonth), sub: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
    { label: "Total content", value: num(data.totalContent), sub: `${data.publishedContent} published` },
    { label: "Total purchases", value: num(data.totalPurchases), sub: "Completed only" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy={loading}>
      {(items ?? Array.from({ length: 4 })).map((it, i) => (
        <Card key={i} className="p-4">
          {it ? (
            <>
              <dt className="text-xs font-semibold text-ink-soft">{it.label}</dt>
              <dd className="tnum mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">{it.value}</dd>
              <dd className="mt-0.5 text-xs text-ink-faint">{it.sub}</dd>
            </>
          ) : (
            <>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-3 w-20" />
            </>
          )}
        </Card>
      ))}
    </dl>
  );
}
