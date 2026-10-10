import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { route } from "@/lib/http";
import { computeSeries } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const GET = route((req) => {
  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days") ?? 30), 7), 90);
  return NextResponse.json({ days, points: computeSeries(getDb().purchases, days) });
}, { chaos: true, latency: true });
