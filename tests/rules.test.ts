import { describe, expect, it } from "vitest";
import { checkPublishRule } from "../src/lib/rules";
import { validateContent, validatePersonal } from "../src/lib/validation";
import { computeOverview, computeSeries } from "../src/lib/stats";
import { buildSeed } from "../src/lib/seed";

describe("publishing rule", () => {
  it("lets unverified creators save drafts", () => {
    expect(checkPublishRule("unverified", "draft").ok).toBe(true);
  });
  it("blocks publishing and scheduling unless verified", () => {
    for (const s of ["unverified", "in_review"] as const) {
      expect(checkPublishRule(s, "published").ok).toBe(false);
      expect(checkPublishRule(s, "scheduled").ok).toBe(false);
    }
    expect(checkPublishRule("verified", "published").ok).toBe(true);
    expect(checkPublishRule("verified", "scheduled").ok).toBe(true);
  });
  it("explains the in-review case differently", () => {
    const r = checkPublishRule("in_review", "published");
    expect(!r.ok && r.message).toMatch(/reviewed/);
  });
});

describe("content validation", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  it("only needs a title for drafts", () => {
    expect(validateContent({ title: "My draft", status: "draft" }, now)).toEqual({});
  });
  it("requires the full set to publish", () => {
    const e = validateContent({ title: "Hello", status: "published" }, now);
    expect(Object.keys(e).sort()).toEqual(["description", "price", "thumbnail", "video"]);
  });
  it("rejects out-of-range prices and near-term schedules", () => {
    const base = { title: "Hello", description: "x".repeat(30), thumbnail: "t", videoName: "v.mp4" };
    expect(validateContent({ ...base, status: "published", price: 10 }, now).price).toBeDefined();
    expect(validateContent({ ...base, status: "scheduled", price: 500, scheduledFor: new Date(now + 60_000).toISOString() }, now).scheduledFor).toBeDefined();
    expect(validateContent({ ...base, status: "scheduled", price: 500, scheduledFor: new Date(now + 3_600_000).toISOString() }, now)).toEqual({});
  });
});

describe("verification validation", () => {
  it("requires adults", () => {
    const e = validatePersonal({ fullName: "Ada Lovelace", dateOfBirth: "2015-01-01", country: "UK", address: "1 Main Street" }, new Date("2026-10-09"));
    expect(e.dateOfBirth).toMatch(/18/);
  });
});

describe("seed + stats", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  const db = buildSeed(now);
  it("meets the brief's minimums with mixed statuses", () => {
    expect(db.content.length).toBeGreaterThanOrEqual(12);
    expect(db.purchases.length).toBeGreaterThanOrEqual(20);
    expect(new Set(db.content.map((c) => c.status)).size).toBe(3);
    expect(new Set(db.purchases.map((p) => p.status)).size).toBe(4);
  });
  it("counts only completed purchases as revenue", () => {
    const o = computeOverview(db.content, db.purchases, new Date(now));
    const manual = db.purchases.filter((p) => p.status === "completed").reduce((a, p) => a + p.amount, 0);
    expect(o.totalRevenue).toBe(manual);
    expect(o.revenueThisMonth).toBeGreaterThan(0);
    expect(o.revenueThisMonth).toBeLessThanOrEqual(o.totalRevenue);
  });
  it("builds a gap-free daily series", () => {
    const s = computeSeries(db.purchases, 30, new Date(now));
    expect(s).toHaveLength(30);
    expect(s.at(-1)?.date).toBe("2026-10-09");
  });
});
