import fs from "fs";
import path from "path";
import { buildSeed } from "./seed";
import type { Db } from "./types";

/**
 * Tiny JSON-file store: survives refreshes and server restarts locally.
 * If the filesystem is read-only (e.g. serverless) it degrades to in-memory.
 */
const FILE = process.env.DATA_FILE || path.join(process.cwd(), ".data", "db.json");
const g = globalThis as unknown as { __creatorhub_db?: Db };

export function getDb(): Db {
  if (g.__creatorhub_db) return g.__creatorhub_db;
  try {
    g.__creatorhub_db = JSON.parse(fs.readFileSync(FILE, "utf8")) as Db;
  } catch {
    g.__creatorhub_db = buildSeed();
    persist();
  }
  return g.__creatorhub_db;
}

export function persist(): void {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(g.__creatorhub_db));
    fs.renameSync(tmp, FILE);
  } catch {
    console.warn("[db] could not write to disk; running in-memory only");
  }
}

export function resetDb(): Db {
  g.__creatorhub_db = buildSeed();
  persist();
  return g.__creatorhub_db;
}
