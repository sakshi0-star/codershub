import type { ContentStatus, VerificationStatus } from "./types";

/** Statuses that make content (or a promise of content) public. */
export function requiresVerification(target: ContentStatus): boolean {
  return target === "published" || target === "scheduled";
}

export function isVerified(v: VerificationStatus): boolean {
  return v === "verified";
}

export type PublishCheck =
  | { ok: true }
  | { ok: false; code: "VERIFICATION_REQUIRED"; verification: VerificationStatus; message: string };

/**
 * THE publishing rule. Single source of truth, used by the API routes.
 * Drafts are always allowed; publishing or scheduling needs a verified creator.
 */
export function checkPublishRule(verification: VerificationStatus, target: ContentStatus): PublishCheck {
  if (!requiresVerification(target) || isVerified(verification)) return { ok: true };
  return {
    ok: false,
    code: "VERIFICATION_REQUIRED",
    verification,
    message:
      verification === "in_review"
        ? "Your identity verification is still being reviewed. You can publish as soon as it is approved."
        : "Verify your identity before publishing or scheduling content. You can keep working on drafts in the meantime.",
  };
}
