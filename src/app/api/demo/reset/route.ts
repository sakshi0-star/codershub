import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db";
import { route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const POST = route(() => {
  const db = resetDb();
  return NextResponse.json({ ok: true, content: db.content.length, purchases: db.purchases.length });
}, { latency: false });
