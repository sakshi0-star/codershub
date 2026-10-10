"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { bytes, cx } from "@/lib/format";
import type { IdType, PersonalInfo, Verification } from "@/lib/types";
import { simulateUpload } from "@/lib/upload";
import { Errors, ID_TYPES, LIMITS, validatePersonal } from "@/lib/validation";
import { useApp } from "./AppContext";
import { Alert, Button, Card, Field, inputCls, LinkButton, ProgressBar, Spinner } from "./ui";

const COUNTRIES = ["Australia", "Brazil", "Canada", "France", "Germany", "India", "Japan", "Kenya", "Mexico", "Nigeria", "United Kingdom", "United States"];
const STEPS = ["Your details", "ID document", "Identity check", "Confirmation"];
const KEY = "verify-wizard";

interface Saved { step: number; personal: PersonalInfo; idType?: IdType; doc?: { name: string; size: number }; selfie: boolean }
const blank: Saved = { step: 1, personal: { fullName: "", dateOfBirth: "", country: "", address: "" }, selfie: false };

export function VerifyWizard() {
  const { verification, setVerification } = useApp();
  const [s, setS] = useState<Saved>(blank);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Resume after refresh. Files can't be restored, only their names; the user re-confirms by continuing.
  useEffect(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) setS(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready && !justSubmitted) sessionStorage.setItem(KEY, JSON.stringify(s)); }, [s, ready, justSubmitted]);
  useEffect(() => { headingRef.current?.focus(); }, [s.step, justSubmitted]);

  if (!ready || !verification) return <Card className="p-6"><Spinner /></Card>;

  const done = justSubmitted || verification.status !== "unverified";
  if (done) return <Confirmation v={verification} fresh={justSubmitted} headingRef={headingRef} />;

  const patch = (p: Partial<Saved>) => setS((x) => ({ ...x, ...p }));
  const go = (n: number) => { setErrors({}); patch({ step: n }); };

  function next1() {
    const e = validatePersonal(s.personal);
    setErrors(e);
    if (!Object.keys(e).length) go(2);
  }
  function next2() {
    const e: Errors = {};
    if (!s.idType) e.idType = "Choose the document you’ll upload.";
    if (!s.doc) e.document = "Upload a photo or scan of your document.";
    setErrors(e);
    if (!Object.keys(e).length) go(3);
  }
  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const v = await api<Verification>("/api/verification", { method: "POST", json: { personal: s.personal, idType: s.idType, documentName: s.doc?.name, selfieCompleted: s.selfie } });
      sessionStorage.removeItem(KEY);
      setVerification(v);
      setJustSubmitted(true);
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        const f = e.fields;
        setErrors(f);
        go(f.fullName || f.dateOfBirth || f.country || f.address ? 1 : f.idType || f.document ? 2 : 3);
        setSubmitError(e.message);
      } else setSubmitError(e instanceof ApiError ? e.message : "Something went wrong. Your details are saved; try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Progress">
        {STEPS.map((l, i) => (
          <li key={l} aria-current={s.step === i + 1 ? "step" : undefined}>
            <div className={cx("h-1.5 rounded-full", s.step > i + 1 ? "bg-brand" : s.step === i + 1 ? "bg-brand" : "bg-line")} />
            <p className={cx("mt-1.5 text-[11px] font-semibold sm:text-xs", s.step === i + 1 ? "text-ink" : "text-ink-faint")}><span className="sr-only">Step {i + 1}: </span>{l}</p>
          </li>
        ))}
      </ol>
      {submitError && <Alert kind="error" title={submitError} />}

      <Card className="p-4 sm:p-6">
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">{STEPS[s.step - 1]}</h2>

        {s.step === 1 && (
          <div className="mt-4 grid gap-4">
            <p className="text-sm text-ink-soft">Use the details on your government ID.</p>
            <Field label="Full legal name" htmlFor="fullName" error={errors.fullName}>
              <input id="fullName" autoComplete="name" className={inputCls(errors.fullName)} value={s.personal.fullName} onChange={(e) => patch({ personal: { ...s.personal, fullName: e.target.value } })} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullName-err" : undefined} />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth}>
              <input id="dateOfBirth" type="date" autoComplete="bday" className={inputCls(errors.dateOfBirth)} value={s.personal.dateOfBirth} onChange={(e) => patch({ personal: { ...s.personal, dateOfBirth: e.target.value } })} aria-invalid={!!errors.dateOfBirth} aria-describedby={errors.dateOfBirth ? "dateOfBirth-err" : undefined} />
            </Field>
            <Field label="Country of residence" htmlFor="country" error={errors.country}>
              <select id="country" autoComplete="country-name" className={inputCls(errors.country)} value={s.personal.country} onChange={(e) => patch({ personal: { ...s.personal, country: e.target.value } })} aria-invalid={!!errors.country} aria-describedby={errors.country ? "country-err" : undefined}>
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Street address" htmlFor="address" error={errors.address}>
              <input id="address" autoComplete="street-address" className={inputCls(errors.address)} value={s.personal.address} onChange={(e) => patch({ personal: { ...s.personal, address: e.target.value } })} aria-invalid={!!errors.address} aria-describedby={errors.address ? "address-err" : undefined} />
            </Field>
          </div>
        )}

        {s.step === 2 && <DocStep s={s} patch={patch} errors={errors} />}

        {s.step === 3 && <SelfieStep done={s.selfie} onDone={() => patch({ selfie: true })} />}
      </Card>

      <div className="flex gap-2 sm:justify-between">
        {s.step > 1 ? <Button className="flex-1 sm:flex-none" onClick={() => go(s.step - 1)} disabled={submitting}>Back</Button> : <LinkButton href="/" className="flex-1 sm:flex-none">Not now</LinkButton>}
        {s.step === 1 && <Button variant="primary" className="flex-1 sm:flex-none" onClick={next1}>Continue</Button>}
        {s.step === 2 && <Button variant="primary" className="flex-1 sm:flex-none" onClick={next2}>Continue</Button>}
        {s.step === 3 && <Button variant="primary" className="flex-1 sm:flex-none" onClick={submit} disabled={!s.selfie} busy={submitting}>Submit for review</Button>}
      </div>
    </div>
  );
}

function DocStep({ s, patch, errors }: { s: Saved; patch: (p: Partial<Saved>) => void; errors: Errors }) {
  const [pct, setPct] = useState<number | null>(null);
  const [fileErr, setFileErr] = useState("");
  const ac = useRef<AbortController>();
  useEffect(() => () => ac.current?.abort(), []);

  async function pick(f?: File) {
    if (!f) return;
    setFileErr("");
    if (!/^(image\/(png|jpe?g)|application\/pdf)$/.test(f.type)) return setFileErr("Use a JPG, PNG or PDF.");
    if (f.size > LIMITS.maxDocBytes) return setFileErr("File is larger than 10 MB.");
    ac.current = new AbortController();
    setPct(0);
    patch({ doc: undefined });
    try {
      await simulateUpload(f.size, { signal: ac.current.signal, onProgress: (p) => setPct(p.pct) });
      patch({ doc: { name: f.name, size: f.size } });
    } catch { /* cancelled */ }
    setPct(null);
  }

  return (
    <div className="mt-4 grid gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Document type</legend>
        <div className="grid gap-2">
          {ID_TYPES.map((t) => (
            <label key={t.value} className={cx("flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-3 focus-within:outline focus-within:outline-2 focus-within:outline-brand", s.idType === t.value ? "border-brand bg-brand-tint" : "border-line")}>
              <input type="radio" name="idType" className="h-4 w-4 accent-[#0E7C7B]" checked={s.idType === t.value} onChange={() => patch({ idType: t.value })} />
              <span className="text-sm font-semibold">{t.label}</span>
            </label>
          ))}
        </div>
        {errors.idType && <p className="mt-1 text-xs font-medium text-danger">{errors.idType}</p>}
      </fieldset>

      <div>
        <p className="mb-1.5 text-sm font-semibold" id="doc-label">Upload document</p>
        {s.doc && pct === null ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ok/40 bg-ok-tint px-3 py-3">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-ok">{s.doc.name}</p><p className="text-xs text-ink-soft">{bytes(s.doc.size)} · Uploaded</p></div>
            <Button variant="ghost" onClick={() => patch({ doc: undefined })}>Replace</Button>
          </div>
        ) : pct !== null ? (
          <div className="rounded-lg border border-line p-3" aria-live="polite">
            <ProgressBar value={pct} label="Document upload progress" />
            <div className="mt-1.5 flex items-center justify-between text-xs text-ink-soft"><span>Uploading…</span><span className="tnum">{Math.round(pct)}%</span></div>
          </div>
        ) : (
          <label className={cx("flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 text-center focus-within:outline focus-within:outline-2 focus-within:outline-brand", errors.document || fileErr ? "border-danger" : "border-line hover:bg-canvas")}>
            <span className="text-sm font-semibold">Tap to choose a file</span>
            <span className="text-xs text-ink-faint">JPG, PNG or PDF, up to 10 MB. Make sure all four corners are visible.</span>
            <input type="file" accept="image/png,image/jpeg,application/pdf" className="sr-only" aria-labelledby="doc-label" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        )}
        {(fileErr || errors.document) && <p className="mt-1 text-xs font-medium text-danger">{fileErr || errors.document}</p>}
      </div>
    </div>
  );
}

const CHECKS = ["Finding your face", "Checking you’re live", "Matching with your ID"];
function SelfieStep({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "running">("idle");
  const [i, setI] = useState(0);
  useEffect(() => {
    if (phase !== "running") return;
    if (i >= CHECKS.length) { onDone(); setPhase("idle"); return; }
    const t = setTimeout(() => setI((x) => x + 1), 1100);
    return () => clearTimeout(t);
  }, [phase, i, onDone]);

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-ink-soft">We’ll compare a quick selfie with your ID. This is a simulation: no camera is used and nothing is recorded.</p>
      <div className="grid place-items-center rounded-xl bg-ink py-8" aria-hidden>
        <div className={cx("grid h-32 w-32 place-items-center rounded-full border-4", done ? "border-ok" : phase === "running" ? "animate-pulse border-brand" : "border-white/30")}>
          <svg className="h-16 w-16 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="9" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm" aria-live="polite">
        {(phase === "running" || done) && CHECKS.map((c, n) => (
          <li key={c} className="flex items-center gap-2">
            {done || n < i ? <span className="text-ok" aria-hidden>✓</span> : n === i ? <Spinner className="text-brand" /> : <span className="w-4" />}
            <span className={done || n <= i ? "text-ink" : "text-ink-faint"}>{c}</span>
          </li>
        ))}
        {done && <li className="pt-1 font-semibold text-ok">Identity check complete</li>}
      </ul>
      {!done && <Button variant="primary" className="w-full sm:w-auto" onClick={() => { setI(0); setPhase("running"); }} disabled={phase === "running"} busy={phase === "running"}>{phase === "running" ? "Checking…" : "Start identity check"}</Button>}
    </div>
  );
}

function Confirmation({ v, fresh, headingRef }: { v: Verification; fresh: boolean; headingRef: React.RefObject<HTMLHeadingElement> }) {
  const verified = v.status === "verified";
  return (
    <Card className="p-6 text-center sm:p-10">
      <div className={cx("mx-auto grid h-14 w-14 place-items-center rounded-full", verified ? "bg-ok-tint text-ok" : "bg-amber-tint text-amber")} aria-hidden>
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{verified ? <path d="m5 12 5 5 9-10" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}</svg>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-xl font-bold outline-none">{verified ? "You’re verified" : fresh ? "Verification submitted" : "Verification in review"}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
        {verified ? "You can now publish and schedule your videos." : "We’re reviewing your documents, which usually takes 1–2 business days. You can keep creating drafts meanwhile, and publishing unlocks once you’re approved."}
      </p>
      {v.submittedAt && !verified && <p className="mt-1 text-xs text-ink-faint">Submitted {new Date(v.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>}
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <LinkButton href="/content/new" variant="primary">{verified ? "Publish a video" : "Create a draft"}</LinkButton>
        <LinkButton href="/">Back to dashboard</LinkButton>
      </div>
      {!verified && <p className="mt-4 text-xs text-ink-faint">Reviewing the demo? Use <strong>Demo controls</strong> to mark this account as Verified.</p>}
    </Card>
  );
}
