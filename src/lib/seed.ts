import type { Content, Db, Purchase, PurchaseStatus } from "./types";

/** Deterministic PRNG so every reset yields the same shape of data. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNTRIES = ["United States", "United Kingdom", "India", "Germany", "Brazil", "Canada", "Nigeria", "Japan", "France", "Australia", "Mexico", "Kenya"];
const DAY = 86_400_000;

const CATALOG: Omit<Content, "id" | "views" | "createdAt" | "updatedAt" | "thumbnail" | "videoName" | "videoSize">[] = [
  { title: "Street Photography in Low Light", description: "A 40-minute walkthrough of settings, framing and editing for night-time street photography.", price: 1999, durationSec: 2410, status: "published" },
  { title: "Sourdough From Scratch: Week One", description: "Build and maintain a starter, then bake your first loaf with minimal equipment.", price: 1499, durationSec: 1890, status: "published" },
  { title: "Learn Guitar Chords in 30 Days", description: "Daily bite-size lessons that take you from zero to playing full songs.", price: 2999, durationSec: 5400, status: "published" },
  { title: "Minimal Desk Setup Tour", description: "Cable management, lighting and ergonomics for a calm, focused workspace.", price: 499, durationSec: 780, status: "published" },
  { title: "Intro to Watercolor Landscapes", description: "Wet-on-wet techniques, colour mixing and composition for beginners.", price: 2499, durationSec: 3120, status: "published" },
  { title: "Budget Travel: 10 Days in Vietnam", description: "A full itinerary with costs, transport tips and hidden food spots.", price: 999, durationSec: 2250, status: "published" },
  { title: "Home Workout: No Equipment", description: "Four weeks of progressive bodyweight training with form breakdowns.", price: 1299, durationSec: 4020, status: "published" },
  { title: "Editing Video on Your Phone", description: "Pacing, captions and colour on mobile, start to finish in one project.", price: 799, durationSec: 1350, status: "published" },
  { title: "Advanced Pour-Over Techniques", description: "Grind, bloom and pour patterns explained with side-by-side tastings.", price: 1099, durationSec: 1620, status: "draft" },
  { title: "Behind the Scenes: My Studio Move", description: "Raw footage and notes from relocating a small production studio.", price: 599, durationSec: 960, status: "draft" },
  { title: "Beginner's Guide to Film Cameras", description: "", price: 0, durationSec: 0, status: "draft" },
  { title: "Color Grading Masterclass", description: "A complete grading workflow with LUT building and skin-tone control.", price: 3499, durationSec: 6300, status: "scheduled" },
  { title: "Urban Sketching Essentials", description: "Quick perspective, line weight and shading for sketching on location.", price: 1799, durationSec: 2700, status: "scheduled" },
  { title: "Podcast Audio Fixes in 15 Minutes", description: "Noise, echo and levelling fixes you can apply to any recording today.", price: 699, durationSec: 900, status: "scheduled" },
];

export function buildSeed(now = Date.now()): Db {
  const rand = mulberry32(2024);
  const content: Content[] = CATALOG.map((c, i) => {
    const created = now - (70 - i * 4) * DAY;
    const hasVideo = !(c.title.startsWith("Beginner"));
    return {
      ...c,
      id: `cnt_${String(i + 1).padStart(3, "0")}`,
      thumbnail: `gradient:${i}`,
      videoName: hasVideo ? `${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}.mp4` : "",
      videoSize: hasVideo ? Math.round((c.durationSec / 60) * 9.5 * 1024 ** 2) : 0,
      views: 0,
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(created + 2 * DAY).toISOString(),
      scheduledFor: c.status === "scheduled" ? new Date(now + (3 + i) * DAY).toISOString() : undefined,
    };
  });

  const published = content.filter((c) => c.status === "published");
  const weights = [9, 7, 12, 5, 6, 4, 6, 3];
  const total = weights.reduce((a, b) => a + b, 0);
  const pickContent = () => {
    let r = rand() * total;
    for (let i = 0; i < published.length; i++) {
      r -= weights[i];
      if (r <= 0) return published[i];
    }
    return published[0];
  };
  const pickStatus = (): PurchaseStatus => {
    const r = rand();
    return r < 0.78 ? "completed" : r < 0.87 ? "pending" : r < 0.95 ? "refunded" : "failed";
  };

  const purchases: Purchase[] = [];
  const N = 72;
  for (let i = 0; i < N; i++) {
    const c = pickContent();
    // First six are guaranteed completed and recent so "This month" and the chart's right edge are never empty
    const recent = i < 6;
    const daysAgo = recent ? i * 0.5 : Math.floor(Math.pow(rand(), 1.4) * 58) + 1;
    purchases.push({
      id: `pur_${String(i + 1).padStart(4, "0")}`,
      contentId: c.id,
      contentTitle: c.title,
      amount: c.price,
      country: COUNTRIES[Math.floor(rand() * COUNTRIES.length)],
      status: recent ? "completed" : pickStatus(),
      createdAt: new Date(now - daysAgo * DAY - Math.floor(rand() * 40_000_000)).toISOString(),
    });
  }
  purchases.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  for (const c of published) {
    const sold = purchases.filter((p) => p.contentId === c.id && p.status === "completed").length;
    c.views = Math.round(sold * (28 + rand() * 30) + rand() * 400);
  }

  return {
    content,
    purchases,
    verification: { status: "unverified" },
    settings: { latencyMs: 0, failRequests: false, failNextUpload: false },
  };
}
