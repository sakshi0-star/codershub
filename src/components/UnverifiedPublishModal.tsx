"use client";
import type { VerificationStatus } from "@/lib/types";
import { Button, Modal } from "./ui";

/** Shown when an unverified creator tries to publish or schedule. Never loses their work. */
export function UnverifiedPublishModal({ open, status, busy, onKeepEditing, onSaveDraft, onSaveDraftAndVerify }: {
  open: boolean; status: VerificationStatus; busy: boolean; onKeepEditing: () => void; onSaveDraft: () => void; onSaveDraftAndVerify: () => void;
}) {
  const review = status === "in_review";
  return (
    <Modal open={open} onClose={onKeepEditing} title={review ? "Verification still in review" : "Verify your identity to publish"} footer={<>
      <Button onClick={onKeepEditing} disabled={busy}>Keep editing</Button>
      <Button onClick={onSaveDraft} disabled={busy} busy={busy && false}>Save as draft</Button>
      {!review && <Button variant="primary" onClick={onSaveDraftAndVerify} busy={busy}>Save draft &amp; verify</Button>}
    </>}>
      {review ? (
        <p>We’re reviewing your documents. Publishing unlocks as soon as you’re approved. Save this as a draft now and publish it later. Nothing you entered will be lost.</p>
      ) : (
        <>
          <p>Publishing and scheduling are available to verified creators. It takes about 3 minutes, and your video and details are kept as a draft meanwhile.</p>
          <p className="mt-2 font-medium text-ink">Nothing you entered will be lost.</p>
        </>
      )}
    </Modal>
  );
}
