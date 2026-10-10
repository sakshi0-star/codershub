import type { Content, ContentRow, Overview, Purchase, SeriesPoint } from "./types";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Only completed purchases count towards revenue (pending/failed/refunded do not). */
export function computeOverview(content: Content[], purchases: Purchase[], now = new Date()): Overview {
  const done = purchases.filter((p) => p.status === "completed");
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const inMonth = done.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getUTCFullYear() === y && d.getUTCMonth() === m;
  });
  const sum = (xs: Purchase[]) => xs.reduce((a, p) => a + p.amount, 0);
  return {
    totalRevenue: sum(done),
    revenueThisMonth: sum(inMonth),
    totalContent: content.length,
    totalPurchases: done.length,
    publishedContent: content.filter((c) => c.status === "published").length,
  };
}

export function computeSeries(purchases: Purchase[], days: number, now = new Date()): SeriesPoint[] {
  const map = new Map<string, SeriesPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    map.set(dayKey(d), { date: dayKey(d), revenue: 0, purchases: 0 });
  }
  for (const p of purchases) {
    if (p.status !== "completed") continue;
    const pt = map.get(p.createdAt.slice(0, 10));
    if (pt) {
      pt.revenue += p.amount;
      pt.purchases += 1;
    }
  }
  return [...map.values()];
}

export function enrichContent(content: Content[], purchases: Purchase[]): ContentRow[] {
  const agg = new Map<string, { n: number; rev: number }>();
  for (const p of purchases) {
    if (p.status !== "completed") continue;
    const a = agg.get(p.contentId) ?? { n: 0, rev: 0 };
    a.n += 1;
    a.rev += p.amount;
    agg.set(p.contentId, a);
  }
  return content.map((c) => ({ ...c, purchases: agg.get(c.id)?.n ?? 0, revenue: agg.get(c.id)?.rev ?? 0 }));
}
