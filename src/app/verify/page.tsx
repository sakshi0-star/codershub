import { VerifyWizard } from "@/components/VerifyWizard";

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verify your identity</h1>
        <p className="text-sm text-ink-soft">Required to publish or schedule videos. Drafts don’t need it.</p>
      </div>
      <VerifyWizard />
    </div>
  );
}
