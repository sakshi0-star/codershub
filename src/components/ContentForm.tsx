"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { bytes, cx } from "@/lib/format";
import { toThumbnail, readDuration } from "@/lib/media";
import { requiresVerification } from "@/lib/rules";
import type { Content, ContentStatus } from "@/lib/types";
import { simulateUpload, UploadFailed, UploadProgress } from "@/lib/upload";
import { LIMITS, validateContent, validateImageFile, validateVideoFile, Errors } from "@/lib/validation";
import { useApp } from "./AppContext";
import { useToast } from "./Toast";
import { UnverifiedPublishModal } from "./UnverifiedPublishModal";
import { Alert, Button, Field, inputCls, ProgressBar, Thumb } from "./ui";

type UploadState = { kind: "idle" } | { kind: "uploading"; p: UploadProgress } | { kind: "failed"; resumeAt: number; p: UploadProgress } | { kind: "done" };
const toLocalInput = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function ContentForm({ initial }: { initial?: Content }) {
  const router = useRouter();
  const toast = useToast();
  const { verification, settings, refresh } = useApp();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ? (initial.price / 100).toFixed(2) : "");
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "draft");
  const [scheduledFor, setScheduledFor] = useState(toLocalInput(initial?.scheduledFor));
  const [thumb, setThumb] = useState(initial?.thumbnail ?? "");
  const [video, setVideo] = useState<{ name: string; size: number; duration: number; file?: File } | null>(initial?.videoName ? { name: initial.videoName, size: initial.videoSize, duration: initial.durationSec } : null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [upload, setUpload] = useState<UploadState>(initial?.videoName ? { kind: "done" } : { kind: "idle" });
  const [gate, setGate] = useState(false);
  const [dirty, setDirty] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nav = useRef(false);

  const touch = () => setDirty(true);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty && !nav.current) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  useEffect(() => () => abort.current?.abort(), []);

  const cents = useMemo(() => (price.trim() === "" || isNaN(Number(price)) ? (price.trim() === "" ? undefined : NaN) : Math.round(Number(price) * 100)), [price]);
  const payload = (s: ContentStatus) => ({
    title, description, price: Number.isNaN(cents) ? "x" : cents, thumbnail: thumb || undefined, videoName: video?.name,
    videoSize: video?.size, status: s, scheduledFor: s === "scheduled" && scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
  });

  function focusFirst(e: Errors) {
    const order = ["title", "description", "price", "thumbnail", "video", "scheduledFor"];
    const k = order.find((x) => e[x]);
    if (k) formRef.current?.querySelector<HTMLElement>(`[data-field="${k}"]`)?.focus();
  }

  async function pickThumb(f?: File) {
    if (!f) return;
    const err = validateImageFile(f);
    if (err) return setErrors((e) => ({ ...e, thumbnail: err }));
    try { setThumb(await toThumbnail(f)); setErrors((e) => { const { thumbnail: _t, ...r } = e; return r; }); touch(); }
    catch { setErrors((e) => ({ ...e, thumbnail: "We couldn't read that image. Try another file." })); }
  }

  async function pickVideo(f?: File) {
    if (!f) return;
    const err = validateVideoFile(f);
    if (err) return setErrors((e) => ({ ...e, video: err }));
    setErrors((e) => { const { video: _v, ...r } = e; return r; });
    setVideo({ name: f.name, size: f.size, duration: 0, file: f });
    setUpload({ kind: "idle" });
    touch();
    const d = await readDuration(f);
    setVideo((v) => (v && v.file === f ? { ...v, duration: d } : v));
  }

  async function runUpload(resumeAt = 0): Promise<boolean> {
    if (!video?.file) return true;
    abort.current = new AbortController();
    const failAt = settings?.failNextUpload && resumeAt === 0 ? 0.6 : undefined;
    try {
      await simulateUpload(video.size, { startAt: resumeAt, failAt, signal: abort.current.signal, onProgress: (p) => setUpload({ kind: "uploading", p }) });
      setUpload({ kind: "done" });
      return true;
    } catch (e) {
      if (e instanceof UploadFailed) {
        if (failAt !== undefined) await api("/api/demo/state", { method: "POST", json: { failNextUpload: false } }).then(refresh).catch(() => {});
        setUpload((u) => ({ kind: "failed", resumeAt: e.resumeAt, p: u.kind === "uploading" ? u.p : { pct: e.resumeAt * 100, part: 0, parts: 0 } }));
      } else setUpload({ kind: "idle" });
      return false;
    }
  }

  async function submit(target: ContentStatus = status, after?: string) {
    setFormError("");
    const p = payload(target);
    const errs = validateContent(p);
    if (!video && target !== "draft" && !errs.video) errs.video = "Upload the video file.";
    if (Object.keys(errs).length) { setErrors(errs); setFormError("Fix the highlighted fields to continue."); requestAnimationFrame(() => focusFirst(errs)); return; }
    setErrors({});

    if (requiresVerification(target) && verification && verification.status !== "verified") { setGate(true); return; }

    setSaving(true);
    if (upload.kind !== "done" && video?.file) {
      const resume = upload.kind === "failed" ? upload.resumeAt : 0;
      if (!(await runUpload(resume))) { setSaving(false); return; }
    }
    try {
      const body = { ...p, durationSec: video?.duration ?? 0 };
      await api<Content>(initial ? `/api/content/${initial.id}` : "/api/content", { method: initial ? "PATCH" : "POST", json: body });
      nav.current = true;
      toast.success(target === "published" ? "Published." : target === "scheduled" ? "Scheduled for publication." : "Draft saved.");
      router.push(after ?? "/");
    } catch (e) {
      setSaving(false);
      if (e instanceof ApiError) {
        if (e.code === "VERIFICATION_REQUIRED") { await refresh(); setGate(true); return; }
        if (e.code === "VALIDATION_FAILED" && e.fields) { setErrors(e.fields); setFormError(e.message); requestAnimationFrame(() => focusFirst(e.fields!)); return; }
        setFormError(e.message);
      } else setFormError("Something went wrong. Your work is still here; try saving again.");
    }
  }

  async function gateAction(after?: string) {
    setGate(false);
    setStatus("draft");
    await submit("draft", after);
  }

  const err = (k: string) => errors[k];
  const desc = (k: string, hint?: boolean) => (err(k) ? `${k}-err` : hint ? `${k}-hint` : undefined);
  const locked = verification && verification.status !== "verified";
  const uploading = upload.kind === "uploading";
  const submitLabel = saving ? (uploading ? "Uploading video…" : "Saving…") : status === "published" ? "Publish" : status === "scheduled" ? "Schedule" : "Save draft";

  return (
    <form ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-5">
      {formError && <Alert kind="error" title={formError} />}

      <div className="grid gap-5 rounded-xl bg-white p-4 shadow-panel sm:p-6">
        <Field label="Title" htmlFor="title" error={err("title")} hint={`${title.trim().length}/${LIMITS.titleMax}`}>
          <input id="title" data-field="title" className={inputCls(err("title"))} value={title} maxLength={LIMITS.titleMax + 20} onChange={(e) => { setTitle(e.target.value); touch(); }} aria-invalid={!!err("title")} aria-describedby={desc("title", true)} placeholder="e.g. Street photography in low light" />
        </Field>
        <Field label="Description" htmlFor="description" error={err("description")} hint="Required to publish. Tell viewers what they’ll learn.">
          <textarea id="description" data-field="description" rows={4} className={cx(inputCls(err("description")), "py-2.5")} value={description} onChange={(e) => { setDescription(e.target.value); touch(); }} aria-invalid={!!err("description")} aria-describedby={desc("description", true)} />
        </Field>
        <Field label="Price (USD)" htmlFor="price" error={err("price")} hint="Between $0.99 and $499.99. Required to publish.">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden>$</span>
            <input id="price" data-field="price" inputMode="decimal" className={cx(inputCls(err("price")), "pl-7")} value={price} onChange={(e) => { setPrice(e.target.value.replace(/[^0-9.]/g, "")); touch(); }} aria-invalid={!!err("price")} aria-describedby={desc("price", true)} placeholder="19.99" />
          </div>
        </Field>

        {/* Thumbnail */}
        <div>
          <p className="mb-1.5 text-sm font-semibold" id="thumb-label">Thumbnail</p>
          <div className="flex items-center gap-4">
            {thumb ? <Thumb src={thumb} title={title || "Thumbnail"} className="w-40 shrink-0" /> : <div className="grid aspect-video w-40 shrink-0 place-items-center rounded-md border border-dashed border-line text-xs text-ink-faint">No image</div>}
            <div>
              <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border border-line bg-white px-4 text-sm font-semibold hover:bg-canvas focus-within:outline focus-within:outline-2 focus-within:outline-brand">
                {thumb ? "Replace image" : "Choose image"}
                <input data-field="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-labelledby="thumb-label" aria-describedby={desc("thumbnail")} onChange={(e) => { void pickThumb(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <p className="mt-1 text-xs text-ink-faint">PNG, JPG or WebP, up to 5 MB. 16:9 works best.</p>
            </div>
          </div>
          {err("thumbnail") && <p id="thumbnail-err" className="mt-1 text-xs font-medium text-danger">{err("thumbnail")}</p>}
        </div>

        {/* Video */}
        <div>
          <p className="mb-1.5 text-sm font-semibold" id="video-label">Video</p>
          {!video ? (
            <label className={cx("flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 text-center focus-within:outline focus-within:outline-2 focus-within:outline-brand", err("video") ? "border-danger bg-danger-tint/40" : "border-line hover:bg-canvas")}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void pickVideo(e.dataTransfer.files?.[0]); }}>
              <span className="text-sm font-semibold">Tap to choose a video, or drop it here</span>
              <span className="text-xs text-ink-faint">MP4, MOV, WebM or MKV, up to 5 GB</span>
              <input data-field="video" type="file" accept="video/*,.mkv" className="sr-only" aria-labelledby="video-label" aria-describedby={desc("video")} onChange={(e) => { void pickVideo(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          ) : (
            <div className="rounded-lg border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{video.name}</p>
                  <p className="text-xs text-ink-faint">{bytes(video.size)}{upload.kind === "done" && video.file ? " · Uploaded" : upload.kind === "done" ? " · Already uploaded" : ""}</p>
                </div>
                {!uploading && !saving && <Button variant="ghost" onClick={() => { setVideo(null); setUpload({ kind: "idle" }); touch(); }}>Remove</Button>}
              </div>
              {(upload.kind === "uploading" || upload.kind === "failed") && (
                <div className="mt-3 space-y-1.5" aria-live="polite">
                  <ProgressBar value={upload.p.pct} label="Upload progress" tone={upload.kind === "failed" ? "danger" : "brand"} />
                  <div className="flex items-center justify-between text-xs">
                    <span className={upload.kind === "failed" ? "font-medium text-danger" : "text-ink-soft"}>
                      {upload.kind === "failed" ? "Upload interrupted" : `Uploading part ${upload.p.part} of ${upload.p.parts}`}
                    </span>
                    <span className="tnum text-ink-soft">{Math.round(upload.p.pct)}%</span>
                  </div>
                  {upload.kind === "uploading" && <Button variant="ghost" className="!min-h-[36px]" onClick={() => abort.current?.abort()}>Cancel upload</Button>}
                </div>
              )}
              {upload.kind === "failed" && (
                <div className="mt-2">
                  <Alert kind="error" title="Connection lost" action={<Button onClick={() => void submit()} disabled={saving}>Resume upload</Button>}>
                    Parts already sent are kept, so resuming continues from {Math.round(upload.resumeAt * 100)}%.
                  </Alert>
                </div>
              )}
            </div>
          )}
          {err("video") && <p id="video-err" className="mt-1 text-xs font-medium text-danger">{err("video")}</p>}
        </div>
      </div>

      {/* Publication */}
      <fieldset className="rounded-xl bg-white p-4 shadow-panel sm:p-6">
        <legend className="px-0 text-sm font-semibold">Publication</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {([["draft", "Save as draft", "Only you can see it"], ["published", "Publish now", locked ? "Requires verification" : "Visible to viewers"], ["scheduled", "Schedule", locked ? "Requires verification" : "Goes live at a set time"]] as const).map(([v, l, h]) => (
            <label key={v} className={cx("flex min-h-[56px] cursor-pointer items-start gap-3 rounded-lg border p-3 focus-within:outline focus-within:outline-2 focus-within:outline-brand", status === v ? "border-brand bg-brand-tint" : "border-line")}>
              <input type="radio" name="status" value={v} checked={status === v} onChange={() => { setStatus(v); touch(); }} className="mt-1 h-4 w-4 accent-[#0E7C7B]" />
              <span><span className="block text-sm font-semibold">{l}</span><span className={cx("block text-xs", locked && v !== "draft" ? "text-amber" : "text-ink-faint")}>{h}</span></span>
            </label>
          ))}
        </div>
        {status === "scheduled" && (
          <div className="mt-4 max-w-xs">
            <Field label="Publish on" htmlFor="scheduledFor" error={err("scheduledFor")}>
              <input id="scheduledFor" data-field="scheduledFor" type="datetime-local" className={inputCls(err("scheduledFor"))} value={scheduledFor} onChange={(e) => { setScheduledFor(e.target.value); touch(); }} aria-invalid={!!err("scheduledFor")} aria-describedby={desc("scheduledFor")} />
            </Field>
          </div>
        )}
      </fieldset>

      <div className="sticky bottom-[64px] z-20 -mx-4 flex gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <Button type="button" className="flex-1 sm:flex-none" onClick={() => { nav.current = true; router.push("/"); }} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="primary" className="flex-1 sm:flex-none sm:min-w-[160px]" busy={saving}>{submitLabel}</Button>
      </div>

      <UnverifiedPublishModal open={gate} status={verification?.status ?? "unverified"} busy={saving}
        onKeepEditing={() => setGate(false)} onSaveDraft={() => void gateAction()} onSaveDraftAndVerify={() => void gateAction("/verify")} />
    </form>
  );
}
