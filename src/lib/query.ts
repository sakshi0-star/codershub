import type { Page } from "./types";

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const size = Math.min(Math.max(pageSize || 10, 1), 50);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(page || 1, 1), pages);
  return { items: items.slice((p - 1) * size, p * size), total: items.length, page: p, pageSize: size };
}

export function sortBy<T>(items: T[], key: keyof T, dir: "asc" | "desc"): T[] {
  const m = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (typeof x === "number" && typeof y === "number") return (x - y) * m;
    return String(x ?? "").localeCompare(String(y ?? "")) * m;
  });
}

export function listParams(url: string) {
  const sp = new URL(url).searchParams;
  return {
    q: (sp.get("q") ?? "").trim().toLowerCase(),
    status: sp.get("status") ?? "all",
    sort: sp.get("sort") ?? "",
    dir: (sp.get("dir") === "asc" ? "asc" : "desc") as "asc" | "desc",
    page: Number(sp.get("page") ?? 1),
    pageSize: Number(sp.get("pageSize") ?? 10),
  };
}
