export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>, public data?: Record<string, unknown>) {
    super(message);
  }
}

/** Typed fetch wrapper. Network failures and non-2xx both surface as ApiError. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Can't reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error ?? {};
    throw new ApiError(res.status, e.code ?? "UNKNOWN", e.message ?? "Something went wrong.", e.fields, e);
  }
  return body as T;
}

export const qs = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();
