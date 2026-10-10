import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { HttpError, readJson, route } from "@/lib/http";
import { ID_TYPES, validatePersonal } from "@/lib/validation";
import type { IdType, PersonalInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = route(() => NextResponse.json(getDb().verification));

/** Submits the whole verification. Server re-validates; nothing is trusted from the wizard. */
export const POST = route(async (req) => {
  const db = getDb();
  if (db.verification.status === "verified") throw new HttpError(409, "ALREADY_VERIFIED", "Your account is already verified.");
  const body = await readJson<{ personal?: PersonalInfo; idType?: IdType; documentName?: string; selfieCompleted?: boolean }>(req);
  const fields: Record<string, string> = validatePersonal(body.personal ?? {});
  if (!ID_TYPES.some((t) => t.value === body.idType)) fields.idType = "Choose an ID type.";
  if (!body.documentName) fields.document = "Upload your ID document.";
  if (!body.selfieCompleted) fields.selfie = "Complete the identity check.";
  if (Object.keys(fields).length) throw new HttpError(422, "VALIDATION_FAILED", "Some verification details are missing or invalid.", fields);

  db.verification = {
    status: "in_review",
    personal: body.personal,
    idType: body.idType,
    documentName: body.documentName,
    selfieCompleted: true,
    submittedAt: new Date().toISOString(),
  };
  persist();
  return NextResponse.json(db.verification, { status: 201 });
});
