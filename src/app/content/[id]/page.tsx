"use client";
import Link from "next/link";
import { Card, ContentBadge, ErrorState, LinkButton, Skeleton, Thumb } from "@/components/ui";
import { api } from "@/lib/api";
import { bytes, compact, dateShort, duration, money } from "@/lib/format";
import { useAsync } from "@/lib/hooks";
import type { ContentRow } from "@/lib/types";

export default function ContentDetail({ params }: { params: { id: string } }) {
  const { data: c, error, reload } = useAsync(() => api<ContentRow>(`/api/content/${params.id}`), [params.id]);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="text-sm font-semibold text-brand-dark">‹ Dashboard</Link>
      {error ? <Card><ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} /></Card>
        : !c ? <><Skeleton className="aspect-video w-full" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-24" /></>
        : (
          <>
            <div className="relative overflow-hidden rounded-xl bg-ink">
              <Thumb src={c.thumbnail} title={c.title} className="w-full !rounded-none opacity-70" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white">Playback preview is simulated in this demo</span>
              </div>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                  <ContentBadge s={c.status} />
                  {c.price > 0 && <span>{money(c.price)}</span>}
                  {c.durationSec > 0 && <span>· {duration(c.durationSec)}</span>}
                  {c.status === "scheduled" && c.scheduledFor && <span>· Goes live {dateShort(c.scheduledFor)}</span>}
                </div>
              </div>
              <LinkButton href={`/content/${c.id}/edit`} variant="primary">Edit</LinkButton>
            </div>
            <dl className="tnum grid grid-cols-3 gap-3">
              {[["Views", compact(c.views)], ["Purchases", String(c.purchases)], ["Revenue", money(c.revenue)]].map(([k, v]) => (
                <Card key={k} className="p-4"><dt className="text-xs font-semibold text-ink-soft">{k}</dt><dd className="mt-1 text-xl font-bold">{v}</dd></Card>
              ))}
            </dl>
            <Card className="space-y-3 p-4 sm:p-5">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="whitespace-pre-line text-sm text-ink-soft">{c.description || "No description yet."}</p>
              <p className="border-t border-line pt-3 text-xs text-ink-faint">{c.videoName ? `${c.videoName} · ${bytes(c.videoSize)}` : "No video uploaded yet"} · Created {dateShort(c.createdAt)}</p>
            </Card>
          </>
        )}
    </div>
  );
}
