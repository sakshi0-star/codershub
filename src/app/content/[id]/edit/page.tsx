"use client";
import Link from "next/link";
import { ContentForm } from "@/components/ContentForm";
import { ErrorState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import type { ContentRow } from "@/lib/types";

export default function EditContent({ params }: { params: { id: string } }) {
  const { data, error, reload } = useAsync(() => api<ContentRow>(`/api/content/${params.id}`), [params.id]);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/" className="text-sm font-semibold text-brand-dark">‹ Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit video</h1>
      </div>
      {error ? <div className="rounded-xl bg-white shadow-panel"><ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} /></div>
        : !data ? <div className="space-y-3"><Skeleton className="h-64" /><Skeleton className="h-40" /></div>
        : <ContentForm initial={data} />}
    </div>
  );
}
