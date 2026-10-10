import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { HttpError, readJson, route } from "@/lib/http";
import { listParams, paginate, sortBy } from "@/lib/query";
import { checkPublishRule } from "@/lib/rules";
import { enrichContent } from "@/lib/stats";
import { ContentInput, validateContent } from "@/lib/validation";
import type { Content, ContentRow, ContentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = route((req) => {
  const db = getDb();
  const { q, status, sort, dir, page, pageSize } = listParams(req.url);
  let rows: ContentRow[] = enrichContent(db.content, db.purchases);
  if (status !== "all") rows = rows.filter((r) => r.status === status);
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q));
  const key = (["title", "price", "views", "purchases", "revenue", "createdAt", "status"].includes(sort) ? sort : "createdAt") as keyof ContentRow;
  rows = sortBy(rows, key, dir);
  return NextResponse.json(paginate(rows, page, pageSize));
}, { chaos: true });

export const POST = route(async (req) => {
  const db = getDb();
  const input = await readJson<ContentInput & { durationSec?: number }>(req);

  // 1) Publishing rule: unverified creators may only save drafts.
  const rule = checkPublishRule(db.verification.status, input.status as ContentStatus);
  if (!rule.ok) throw new HttpError(403, rule.code, rule.message, undefined, { verification: rule.verification });

  // 2) Field validation
  const fields = validateContent(input);
  if (Object.keys(fields).length) throw new HttpError(422, "VALIDATION_FAILED", "Fix the highlighted fields and try again.", fields);

  const now = new Date().toISOString();
  const item: Content = {
    id: `cnt_${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    title: String(input.title).trim(),
    description: String(input.description ?? "").trim(),
    price: typeof input.price === "number" ? input.price : 0,
    thumbnail: String(input.thumbnail ?? "gradient:0"),
    videoName: String(input.videoName ?? ""),
    videoSize: Number(input.videoSize ?? 0),
    durationSec: Number(input.durationSec ?? 0),
    views: 0,
    status: input.status as ContentStatus,
    scheduledFor: input.status === "scheduled" ? String(input.scheduledFor) : undefined,
    createdAt: now,
    updatedAt: now,
  };
  db.content.unshift(item);
  persist();
  return NextResponse.json(item, { status: 201 });
}, { chaos: true });
