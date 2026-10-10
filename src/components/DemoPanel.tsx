"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { VerificationStatus } from "@/lib/types";
import { useApp } from "./AppContext";
import { useToast } from "./Toast";
import { Button, ConfirmDialog, Modal } from "./ui";

/** Reviewer-facing controls to reach every state in the brief without editing code. */
export function DemoPanel() {
  const { verification, settings, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  async function update(body: object) {
    try {
      await api("/api/demo/state", { method: "POST", json: body });
      await refresh();
    } catch {
      toast.error("Could not update demo controls.");
    }
  }
  async function reset() {
    setBusy(true);
    try {
      await api("/api/demo/reset", { method: "POST" });
      sessionStorage.removeItem("verify-wizard");
      await refresh();
      toast.success("Demo data reset.");
      setConfirmReset(false);
      setOpen(false);
    } catch {
      toast.error("Reset failed.");
    }
    setBusy(false);
  }

  const vs: { v: VerificationStatus; l: string }[] = [
    { v: "unverified", l: "Not verified" },
    { v: "in_review", l: "In review" },
    { v: "verified", l: "Verified" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[68px] right-3 z-40 flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:bottom-4"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 7h10M18 7h2M4 17h2M10 17h10" strokeLinecap="round" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
        Demo controls
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Demo controls" labelledBy="demo-title" footer={<>
        <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset demo data</Button>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </>}>
        <div className="space-y-5 text-ink">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Verification status</legend>
            <div className="grid grid-cols-3 gap-2">
              {vs.map((o) => (
                <button key={o.v} aria-pressed={verification?.status === o.v} onClick={() => update({ verification: o.v })}
                  className={`min-h-[44px] rounded-lg border px-2 text-xs font-semibold ${verification?.status === o.v ? "border-brand bg-brand-tint text-brand-dark" : "border-line bg-white"}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-faint">“In review” simulates the wait after submitting; set Verified to approve.</p>
          </fieldset>

          <div>
            <label htmlFor="latency" className="mb-1.5 block text-sm font-semibold">API latency</label>
            <select id="latency" className="min-h-[44px] w-full rounded-lg border border-line bg-white px-3 text-base sm:text-sm" value={settings?.latencyMs ?? 0} onChange={(e) => update({ latencyMs: Number(e.target.value) })}>
              <option value={0}>None</option>
              <option value={1200}>Slow (1.2 s) shows loading states</option>
              <option value={4000}>Very slow (4 s)</option>
            </select>
          </div>

          <Toggle label="Fail API requests" hint="Dashboard, lists and saving return 503, which shows error states." checked={!!settings?.failRequests} onChange={(v) => update({ failRequests: v })} />
          <Toggle label="Fail next video upload" hint="Upload stops part-way; Retry resumes from the last part." checked={!!settings?.failNextUpload} onChange={(v) => update({ failNextUpload: v })} />
        </div>
      </Modal>

      <ConfirmDialog open={confirmReset} title="Reset all demo data?" body="Content, purchases and verification return to the seeded starting state. Your edits will be lost." confirmLabel="Reset" busy={busy} onConfirm={reset} onCancel={() => setConfirmReset(false)} />
    </>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${checked ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
