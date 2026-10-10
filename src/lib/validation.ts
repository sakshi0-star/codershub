import type { ContentStatus, IdType, PersonalInfo } from "./types";

export const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descMin: 20,
  descMax: 2000,
  priceMinCents: 99,
  priceMaxCents: 49999,
  maxVideoBytes: 5 * 1024 ** 3,
  maxImageBytes: 5 * 1024 ** 2,
  maxDocBytes: 10 * 1024 ** 2,
  minScheduleLeadMs: 5 * 60 * 1000,
};
export const VIDEO_EXT = [".mp4", ".mov", ".webm", ".mkv"];
export const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID card" },
  { value: "drivers_license", label: "Driver's license" },
];

export type Errors = Record<string, string>;

export interface ContentInput {
  title?: unknown;
  description?: unknown;
  price?: unknown; // cents
  thumbnail?: unknown;
  videoName?: unknown;
  videoSize?: unknown;
  status?: unknown;
  scheduledFor?: unknown;
}

const isStr = (v: unknown): v is string => typeof v === "string";

/**
 * Drafts only need a title so creators can save work-in-progress.
 * Anything that goes live (published / scheduled) needs the full set.
 */
export function validateContent(input: ContentInput, now = Date.now()): Errors {
  const e: Errors = {};
  const status = input.status as ContentStatus;
  if (!["draft", "published", "scheduled"].includes(status)) e.status = "Choose a publication status.";
  const strict = status === "published" || status === "scheduled";

  const title = isStr(input.title) ? input.title.trim() : "";
  if (!title) e.title = "Add a title.";
  else if (title.length < LIMITS.titleMin) e.title = `Title needs at least ${LIMITS.titleMin} characters.`;
  else if (title.length > LIMITS.titleMax) e.title = `Title can be at most ${LIMITS.titleMax} characters.`;

  const desc = isStr(input.description) ? input.description.trim() : "";
  if (desc.length > LIMITS.descMax) e.description = `Description can be at most ${LIMITS.descMax} characters.`;
  else if (strict && desc.length < LIMITS.descMin) e.description = `Describe the video in at least ${LIMITS.descMin} characters.`;

  const price = input.price;
  if (price === undefined || price === null || price === "") {
    if (strict) e.price = "Set a price.";
  } else if (typeof price !== "number" || !Number.isInteger(price)) e.price = "Enter a valid price.";
  else if (price < LIMITS.priceMinCents || price > LIMITS.priceMaxCents)
    e.price = `Price must be between $${(LIMITS.priceMinCents / 100).toFixed(2)} and $${(LIMITS.priceMaxCents / 100).toFixed(2)}.`;

  if (strict && !(isStr(input.thumbnail) && input.thumbnail)) e.thumbnail = "Add a thumbnail image.";
  if (strict && !(isStr(input.videoName) && input.videoName)) e.video = "Upload the video file.";
  if (typeof input.videoSize === "number" && input.videoSize > LIMITS.maxVideoBytes) e.video = "Video is larger than the 5 GB limit.";

  if (status === "scheduled") {
    const t = isStr(input.scheduledFor) ? Date.parse(input.scheduledFor) : NaN;
    if (Number.isNaN(t)) e.scheduledFor = "Pick a publication date and time.";
    else if (t < now + LIMITS.minScheduleLeadMs) e.scheduledFor = "Schedule at least 5 minutes from now.";
  }
  return e;
}

export function validateVideoFile(f: { name: string; size: number }): string | null {
  const ok = VIDEO_EXT.some((x) => f.name.toLowerCase().endsWith(x));
  if (!ok) return `Unsupported format. Use ${VIDEO_EXT.join(", ")}.`;
  if (f.size === 0) return "This file is empty.";
  if (f.size > LIMITS.maxVideoBytes) return "Video is larger than the 5 GB limit.";
  return null;
}

export function validateImageFile(f: { type: string; size: number }, max = LIMITS.maxImageBytes): string | null {
  if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return "Use a PNG, JPG or WebP image.";
  if (f.size > max) return `Image is larger than ${Math.round(max / 1024 ** 2)} MB.`;
  return null;
}

export function validatePersonal(p: Partial<PersonalInfo>, now = new Date()): Errors {
  const e: Errors = {};
  if (!p.fullName || p.fullName.trim().split(/\s+/).length < 2) e.fullName = "Enter your first and last name as on your ID.";
  if (!p.dateOfBirth) e.dateOfBirth = "Enter your date of birth.";
  else {
    const dob = new Date(p.dateOfBirth);
    const eighteen = new Date(now);
    eighteen.setFullYear(now.getFullYear() - 18);
    if (Number.isNaN(dob.getTime()) || dob > now) e.dateOfBirth = "Enter a valid date of birth.";
    else if (dob > eighteen) e.dateOfBirth = "You must be 18 or older to publish.";
  }
  if (!p.country) e.country = "Select your country.";
  if (!p.address || p.address.trim().length < 5) e.address = "Enter your street address.";
  return e;
}
