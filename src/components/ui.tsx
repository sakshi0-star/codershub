"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ApiError } from "@/lib/api";
import { cx } from "@/lib/format";
import type { ContentStatus, PurchaseStatus, VerificationStatus } from "@/lib/types";

/* ---------- Buttons ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; busy?: boolean };
export function Button({ variant = "secondary", busy, className, children, disabled, ...p }: BtnProps) {
  return (
    <button
      {...p}
      disabled={disabled || busy}
      className={cx(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-brand text-white hover:bg-brand-dark",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-canvas",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        variant === "ghost" && "text-ink-soft hover:bg-canvas",
        className
      )}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "secondary", className, children }: { href: string; variant?: "primary" | "secondary"; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        variant === "primary" ? "bg-brand text-white hover:bg-brand-dark" : "border border-line bg-white text-ink hover:bg-canvas",
        className
      )}
    >
      {children}
    </Link>
  );
}

export const Spinner = ({ className }: { className?: string }) => (
  <svg className={cx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ---------- Status badges ---------- */
const tone = {
  green: "bg-ok-tint text-ok",
  amber: "bg-amber-tint text-amber",
  grey: "bg-canvas text-ink-soft ring-1 ring-inset ring-line",
  red: "bg-danger-tint text-danger",
  teal: "bg-brand-tint text-brand-dark",
};
export function Badge({ t, children }: { t: keyof typeof tone; children: React.ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tone[t])}>{children}</span>;
}
export const ContentBadge = ({ s }: { s: ContentStatus }) =>
  s === "published" ? <Badge t="green">Published</Badge> : s === "scheduled" ? <Badge t="amber">Scheduled</Badge> : <Badge t="grey">Draft</Badge>;
export const PurchaseBadge = ({ s }: { s: PurchaseStatus }) =>
  s === "completed" ? <Badge t="green">Completed</Badge> : s === "pending" ? <Badge t="amber">Pending</Badge> : s === "refunded" ? <Badge t="grey">Refunded</Badge> : <Badge t="red">Failed</Badge>;
export const VerificationBadge = ({ s }: { s: VerificationStatus }) =>
  s === "verified" ? <Badge t="green">Verified</Badge> : s === "in_review" ? <Badge t="amber">In review</Badge> : <Badge t="grey">Not verified</Badge>;

/* ---------- Thumbnail ---------- */
const GRADS = [
  ["#0E7C7B", "#16202E"], ["#B7791F", "#3C2A0B"], ["#4B5FD6", "#16202E"], ["#2E7D4F", "#0F2A1B"],
  ["#8A4FB5", "#251338"], ["#C0392B", "#3A1410"], ["#2B7A9B", "#102A38"], ["#6B7A1E", "#242B08"],
  ["#5A6B7B", "#1B2530"], ["#9A5B2E", "#2E1B0D"], ["#3E8E7E", "#12302A"], ["#7C4F8E", "#2A1832"],
  ["#4A7BB5", "#14263D"], ["#A04B66", "#35131F"],
];
export function Thumb({ src, title, className }: { src: string; title: string; className?: string }) {
  if (src.startsWith("gradient:")) {
    const [a, b] = GRADS[Number(src.split(":")[1]) % GRADS.length];
    return (
      <div className={cx("relative flex aspect-video items-end overflow-hidden rounded-md p-2 text-white", className)} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} role="img" aria-label={`Thumbnail for ${title}`}>
        <span className="line-clamp-2 text-[11px] font-semibold leading-tight opacity-90">{title}</span>
        <svg className="absolute right-2 top-2 h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`Thumbnail for ${title}`} className={cx("aspect-video rounded-md object-cover", className)} />;
}

/* ---------- States ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div className={cx("animate-pulse rounded-md bg-line/70", className)} aria-hidden />;

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-tint text-brand" aria-hidden>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></svg>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, compact }: { error: ApiError; onRetry?: () => void; compact?: boolean }) {
  return (
    <div role="alert" className={cx("flex flex-col items-center text-center", compact ? "px-4 py-6" : "px-6 py-12")}>
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-danger-tint text-danger" aria-hidden>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" strokeLinecap="round" /></svg>
      </div>
      <h3 className="text-base font-semibold">{error.status === 0 ? "You appear to be offline" : "We couldn't load this"}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{error.message}</p>
      {onRetry && <Button className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Alert({ kind = "info", title, children, action }: { kind?: "info" | "warn" | "error" | "success"; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const s = { info: "bg-brand-tint text-brand-dark", warn: "bg-amber-tint text-amber", error: "bg-danger-tint text-danger", success: "bg-ok-tint text-ok" }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cx("flex flex-col gap-3 rounded-lg px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between", s)}>
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <section className={cx("rounded-xl bg-white shadow-panel", className)}>{children}</section>
);

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, labelledBy = "modal-title" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="w-full max-w-md animate-rise rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h2 id={labelledBy} className="text-lg font-semibold">{title}</h2>
        <div className="mt-2 text-sm text-ink-soft">{children}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, busy, onConfirm, onCancel }: { open: boolean; title: string; body: React.ReactNode; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={<>
      <Button onClick={onCancel} disabled={busy}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} busy={busy}>{confirmLabel}</Button>
    </>}>
      {body}
    </Modal>
  );
}

/* ---------- Form bits ---------- */
export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
export const inputCls = (err?: string) =>
  cx("min-h-[44px] w-full rounded-lg border bg-white px-3 text-base text-ink placeholder:text-ink-faint focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-brand sm:text-sm", err ? "border-danger" : "border-line");

export function ProgressBar({ value, label, tone: t = "brand" }: { value: number; label: string; tone?: "brand" | "danger" }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className={cx("h-full rounded-full transition-[width] duration-200", t === "danger" ? "bg-danger" : "bg-brand")} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <span className="text-ink-soft">{from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <Button className="min-w-[44px]" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">‹</Button>
        <span className="min-w-[4rem] text-center text-ink-soft">{page} / {pages}</span>
        <Button className="min-w-[44px]" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">›</Button>
      </div>
    </nav>
  );
}
