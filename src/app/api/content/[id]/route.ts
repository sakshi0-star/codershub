import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { HttpError, readJson, route } from "@/lib/http";
import { checkPublishRule } from "@/lib/rules";
import { enrichContent } from "@/lib/stats";
import { ContentInput, validateContent } from "@/lib/validation";
import type { ContentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function find(id: string) {
  const db = getDb();
  const idx = db.content.findIndex((c) => c.id === id);
  if (idx < 0) throw new HttpError(404, "NOT_FOUND", "This content no longer exists. It may have been deleted.");
  return { db, idx };
}

export const GET = route((_req, { params }) => {
  const { db, idx } = find(params.id);
  return NextResponse.json(enrichContent([db.content[idx]], db.purchases)[0]);
}, { chaos: true });

export const PATCH = route(async (req, { params }) => {
  const { db, idx } = find(params.id);
  const current = db.content[idx];
  const input = await readJson<ContentInput & { durationSec?: number }>(req);
  const target = (input.status ?? current.status) as ContentStatus;

  // Rule applies on a transition into published/scheduled, not on editing already-live content.
  if (target !== current.status) {
    const rule = checkPublishRule(db.verification.status, target);
    if (!rule.ok) throw new HttpError(403, rule.code, rule.message, undefined, { verification: rule.verification });
  }
  const merged = { ...current, ...input, status: target };
  const fields = validateContent(merged);
  if (Object.keys(fields).length) throw new HttpError(422, "VALIDATION_FAILED", "Fix the highlighted fields and try again.", fields);

  db.content[idx] = {
    ...current,
    title: String(merged.title).trim(),
    description: String(merged.description ?? "").trim(),
    price: typeof merged.price === "number" ? merged.price : 0,
    thumbnail: String(merged.thumbnail),
    videoName: String(merged.videoName ?? ""),
    videoSize: Number(merged.videoSize ?? 0),
    durationSec: Number(input.durationSec ?? current.durationSec),
    status: target,
    scheduledFor: target === "scheduled" ? String(merged.scheduledFor) : undefined,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return NextResponse.json(db.content[idx]);
}, { chaos: true });

export const DELETE = route((_req, { params }) => {
  const { db, idx } = find(params.id);
  db.content.splice(idx, 1);
  persist();
  return NextResponse.json({ ok: true });
}, { chaos: true });
