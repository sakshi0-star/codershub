import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { route } from "@/lib/http";
import { computeOverview } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const GET = route(() => {
  const db = getDb();
  return NextResponse.json(computeOverview(db.content, db.purchases));
}, { chaos: true, latency: true });
