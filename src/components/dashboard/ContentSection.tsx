"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, qs } from "@/lib/api";
import { cx, compact, dateShort, money } from "@/lib/format";
import { useAsync, useDebounced } from "@/lib/hooks";
import type { ContentRow, Page } from "@/lib/types";
import { useApp } from "../AppContext";
import { useToast } from "../Toast";
import { Button, Card, ConfirmDialog, ContentBadge, EmptyState, ErrorState, inputCls, LinkButton, Pagination, Skeleton, Thumb } from "../ui";

const PAGE_SIZE = 6;
const COLS: { key: string; label: string; right?: boolean }[] = [
  { key: "title", label: "Content" },
  { key: "price", label: "Price", right: true },
  { key: "views", label: "Views", right: true },
  { key: "purchases", label: "Purchases", right: true },
  { key: "revenue", label: "Revenue", right: true },
  { key: "status", label: "Status" },
];

export function ContentSection() {
  const { version } = useApp();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const [target, setTarget] = useState<ContentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setPage(1), [dq, status, sort, dir]);
  const { data, error, loading, reload } = useAsync(
    () => api<Page<ContentRow>>(`/api/content?${qs({ q: dq, status, sort, dir, page, pageSize: PAGE_SIZE })}`),
    [dq, status, sort, dir, page, version]
  );

  function toggleSort(key: string) {
    if (sort === key) setDir(dir === "asc" ? "desc" : "asc");
    else { setSort(key); setDir(key === "title" ? "asc" : "desc"); }
  }

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await api(`/api/content/${target.id}`, { method: "DELETE" });
      toast.success(`Deleted “${target.title}”.`);
      setTarget(null);
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't delete. Try again.");
    }
    setDeleting(false);
  }

  const filtered = q !== "" || status !== "all";
  const rows = data?.items ?? [];

  return (
    <Card>
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Your content</h2>
          <LinkButton href="/content/new" variant="primary" className="hidden sm:inline-flex">New video</LinkButton>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input type="search" aria-label="Search content by title" placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls()} />
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls()}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
          <div className="flex gap-2 md:hidden">
            <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} className={cx(inputCls(), "flex-1")}>
              {[["createdAt", "Newest"], ...COLS.map((c) => [c.key, c.label])].map(([k, l]) => <option key={k} value={k}>Sort: {l}</option>)}
            </select>
            <Button aria-label={`Sort direction: ${dir === "asc" ? "ascending" : "descending"}`} onClick={() => setDir(dir === "asc" ? "desc" : "asc")}>{dir === "asc" ? "↑" : "↓"}</Button>
          </div>
        </div>
      </div>

      <div aria-busy={loading} className={cx(loading && data && "opacity-60 transition-opacity")}>
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : rows.length === 0 ? (
          filtered ? (
            <EmptyState title="No videos match" body="Try a different search or clear the filters." action={<Button onClick={() => { setQ(""); setStatus("all"); }}>Clear filters</Button>} />
          ) : (
            <EmptyState title="No videos yet" body="Upload your first video and save it as a draft. You can publish once your identity is verified." action={<LinkButton href="/content/new" variant="primary">Create your first video</LinkButton>} />
          )
        ) : (
          <>
            {error && <p role="alert" className="mx-4 mb-2 rounded-lg bg-danger-tint px-3 py-2 text-xs text-danger">Couldn’t refresh: {error.message} Showing the last loaded results.</p>}
            {/* Desktop/tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-line bg-canvas/60 text-left text-xs text-ink-soft">
                    {COLS.map((c) => (
                      <th key={c.key} scope="col" className={cx("px-4 py-2.5 font-semibold", c.right && "text-right")} aria-sort={sort === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"}>
                        <button onClick={() => toggleSort(c.key)} className="inline-flex min-h-[32px] items-center gap-1 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                          {c.label}<span aria-hidden className="w-3 text-brand">{sort === c.key ? (dir === "asc" ? "↑" : "↓") : ""}</span>
                        </button>
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="max-w-[320px] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={r.thumbnail} title={r.title} className="w-24 shrink-0" />
                          <div className="min-w-0">
                            <Link href={`/content/${r.id}`} className="line-clamp-2 font-semibold hover:text-brand-dark">{r.title}</Link>
                            <p className="text-xs text-ink-faint">{r.status === "scheduled" && r.scheduledFor ? `Goes live ${dateShort(r.scheduledFor)}` : `Created ${dateShort(r.createdAt)}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tnum px-4 py-3 text-right">{r.price ? money(r.price) : "—"}</td>
                      <td className="tnum px-4 py-3 text-right">{compact(r.views)}</td>
                      <td className="tnum px-4 py-3 text-right">{r.purchases}</td>
                      <td className="tnum px-4 py-3 text-right font-semibold">{money(r.revenue)}</td>
                      <td className="px-4 py-3"><ContentBadge s={r.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/content/${r.id}`} className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-canvas">View</Link>
                          <Link href={`/content/${r.id}/edit`} className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-canvas">Edit</Link>
                          <button onClick={() => setTarget(r)} aria-label={`Delete ${r.title}`} className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-danger hover:bg-danger-tint">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex gap-3">
                    <Thumb src={r.thumbnail} title={r.title} className="w-28 shrink-0 self-start" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/content/${r.id}`} className="line-clamp-2 text-sm font-semibold">{r.title}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <ContentBadge s={r.status} />
                        <span className="tnum text-xs text-ink-soft">{r.price ? money(r.price) : "No price"}</span>
                      </div>
                    </div>
                  </div>
                  <dl className="tnum mt-3 grid grid-cols-3 gap-2 rounded-lg bg-canvas px-3 py-2 text-center text-xs">
                    <div><dt className="text-ink-faint">Views</dt><dd className="font-semibold">{compact(r.views)}</dd></div>
                    <div><dt className="text-ink-faint">Purchases</dt><dd className="font-semibold">{r.purchases}</dd></div>
                    <div><dt className="text-ink-faint">Revenue</dt><dd className="font-semibold">{money(r.revenue)}</dd></div>
                  </dl>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <LinkButton href={`/content/${r.id}`}>View</LinkButton>
                    <LinkButton href={`/content/${r.id}/edit`}>Edit</LinkButton>
                    <Button onClick={() => setTarget(r)} className="!text-danger" aria-label={`Delete ${r.title}`}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        title={`Delete “${target?.title ?? ""}”?`}
        body={<>This removes the video from your content{target && target.purchases > 0 ? <>. Its {target.purchases} past purchase{target.purchases === 1 ? "" : "s"} stay in your purchase history and revenue totals</> : ""}. This can’t be undone.</>}
        confirmLabel="Delete video"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setTarget(null)}
      />
    </Card>
  );
}
