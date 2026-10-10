"use client";
import { useApp } from "./AppContext";
import { Alert, LinkButton } from "./ui";

export function VerificationBanner() {
  const { verification } = useApp();
  if (!verification || verification.status === "verified") return null;
  const review = verification.status === "in_review";
  return (
    <Alert kind="warn" title={review ? "Your verification is in review" : "Verify your identity to publish"}
      action={review ? undefined : <LinkButton href="/verify" variant="primary" className="sm:shrink-0">Verify identity</LinkButton>}>
      {review ? "We’ll let you know once it’s approved. Until then you can keep creating drafts." : "You can create drafts now. Publishing and scheduling unlock after verification, which takes about 3 minutes."}
    </Alert>
  );
}
