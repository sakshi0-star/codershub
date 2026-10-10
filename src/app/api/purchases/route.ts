import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { route } from "@/lib/http";
import { listParams, paginate, sortBy } from "@/lib/query";
import type { Purchase } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = route((req) => {
  const { q, status, sort, dir, page, pageSize } = listParams(req.url);
  let rows: Purchase[] = getDb().purchases;
  if (status !== "all") rows = rows.filter((r) => r.status === status);
  if (q) rows = rows.filter((r) => r.contentTitle.toLowerCase().includes(q) || r.country.toLowerCase().includes(q) || r.id.includes(q));
  const key = (["createdAt", "amount", "contentTitle", "country", "status"].includes(sort) ? sort : "createdAt") as keyof Purchase;
  return NextResponse.json(paginate(sortBy(rows, key, dir), page, pageSize));
}, { chaos: true });
