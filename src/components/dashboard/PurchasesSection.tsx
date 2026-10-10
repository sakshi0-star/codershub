"use client";
import { useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { cx, dateTime, money } from "@/lib/format";
import { useAsync, useDebounced } from "@/lib/hooks";
import type { Page, Purchase } from "@/lib/types";
import { useApp } from "../AppContext";
import { Button, Card, EmptyState, ErrorState, inputCls, Pagination, PurchaseBadge, Skeleton } from "../ui";

const PAGE_SIZE = 8;

export function PurchasesSection() {
  const { version } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  useEffect(() => setPage(1), [dq, status, sort, dir]);

  const { data, error, loading, reload } = useAsync(
    () => api<Page<Purchase>>(`/api/purchases?${qs({ q: dq, status, sort, dir, page, pageSize: PAGE_SIZE })}`),
    [dq, status, sort, dir, page, version]
  );
  const rows = data?.items ?? [];
  const th = (key: string, label: string, right?: boolean) => (
    <th scope="col" className={cx("px-4 py-2.5 font-semibold", right && "text-right")} aria-sort={sort === key ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button className="inline-flex min-h-[32px] items-center gap-1 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        onClick={() => (sort === key ? setDir(dir === "asc" ? "desc" : "asc") : (setSort(key), setDir("desc")))}>
        {label}<span aria-hidden className="w-3 text-brand">{sort === key ? (dir === "asc" ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );

  return (
    <Card>
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Recent purchases</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input type="search" aria-label="Search purchases" placeholder="Search by video or country" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls()} />
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls()}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <div className="flex gap-2 md:hidden">
            <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} className={cx(inputCls(), "flex-1")}>
              <option value="createdAt">Sort: Date</option>
              <option value="amount">Sort: Amount</option>
              <option value="country">Sort: Country</option>
            </select>
            <Button aria-label={`Sort direction: ${dir === "asc" ? "ascending" : "descending"}`} onClick={() => setDir(dir === "asc" ? "desc" : "asc")}>{dir === "asc" ? "↑" : "↓"}</Button>
          </div>
        </div>
      </div>

      <div aria-busy={loading} className={cx(loading && data && "opacity-60 transition-opacity")}>
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No purchases found" body={q || status !== "all" ? "Nothing matches these filters." : "Purchases appear here once viewers buy your content."} action={q || status !== "all" ? <Button onClick={() => { setQ(""); setStatus("all"); }}>Clear filters</Button> : undefined} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead><tr className="border-y border-line bg-canvas/60 text-left text-xs text-ink-soft">
                  {th("createdAt", "Date")}{th("contentTitle", "Content")}{th("amount", "Amount", true)}{th("country", "Country")}{th("status", "Status")}
                </tr></thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{dateTime(p.createdAt)}</td>
                      <td className="max-w-[300px] truncate px-4 py-3 font-medium">{p.contentTitle}</td>
                      <td className="tnum px-4 py-3 text-right font-semibold">{money(p.amount)}</td>
                      <td className="px-4 py-3">{p.country}</td>
                      <td className="px-4 py-3"><PurchaseBadge s={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.contentTitle}</p>
                    <p className="text-xs text-ink-faint">{dateTime(p.createdAt)} · {p.country}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-sm font-semibold">{money(p.amount)}</p>
                    <PurchaseBadge s={p.status} />
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </div>
    </Card>
  );
}
