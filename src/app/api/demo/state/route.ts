import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { HttpError, readJson, route } from "@/lib/http";
import type { DemoSettings, VerificationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = route(() => NextResponse.json({ settings: getDb().settings, verification: getDb().verification }), { latency: false });

/** Demo-only controls. A real product would not ship this route. */
export const POST = route(async (req) => {
  const db = getDb();
  const body = await readJson<Partial<DemoSettings> & { verification?: VerificationStatus }>(req);
  if (body.verification) {
    if (!["unverified", "in_review", "verified"].includes(body.verification)) throw new HttpError(400, "BAD_REQUEST", "Unknown verification status.");
    db.verification = body.verification === "unverified" ? { status: "unverified" } : { ...db.verification, status: body.verification };
  }
  if (typeof body.latencyMs === "number") db.settings.latencyMs = Math.min(Math.max(body.latencyMs, 0), 10_000);
  if (typeof body.failRequests === "boolean") db.settings.failRequests = body.failRequests;
  if (typeof body.failNextUpload === "boolean") db.settings.failNextUpload = body.failNextUpload;
  persist();
  return NextResponse.json({ settings: db.settings, verification: db.verification });
}, { latency: false });
