"use client";
import { ContentForm } from "@/components/ContentForm";
import { VerificationBanner } from "@/components/VerificationBanner";

export default function NewContent() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New video</h1>
        <p className="text-sm text-ink-soft">Add your details and video. Drafts are always saved privately.</p>
      </div>
      <VerificationBanner />
      <ContentForm />
    </div>
  );
}
