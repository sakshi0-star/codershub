import { NextResponse } from "next/server";
import { getDb } from "./db";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>, public extra?: Record<string, unknown>) {
    super(message);
  }
}

type Ctx = { params: Record<string, string> };
type Handler = (req: Request, ctx: Ctx) => Promise<Response> | Response;

/**
 * Wraps a route handler with: demo latency, demo failure injection, and a uniform
 * error envelope: { error: { code, message, fields? } }.
 */
export function route(handler: Handler, opts: { chaos?: boolean; latency?: boolean } = { latency: true }) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const { settings } = getDb();
      if (opts.latency !== false && settings.latencyMs) await new Promise((r) => setTimeout(r, settings.latencyMs));
      if (opts.chaos && settings.failRequests) {
        throw new HttpError(503, "SERVICE_UNAVAILABLE", "The service is temporarily unavailable. Try again in a moment.");
      }
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: { code: e.code, message: e.message, fields: e.fields, ...e.extra } }, { status: e.status });
      }
      console.error(e);
      return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong on our side." } }, { status: 500 });
    }
  };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "BAD_JSON", "The request body is not valid JSON.");
  }
}
