"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppContext";
import { DemoPanel } from "./DemoPanel";
import { VerificationBadge } from "./ui";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/content/new", label: "New video", icon: "M12 5v14M5 12h14" },
  { href: "/verify", label: "Verification", icon: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4" },
];

const active = (path: string, href: string) => (href === "/" ? path === "/" || path.startsWith("/content/") && !path.startsWith("/content/new") : path.startsWith(href));

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { verification } = useApp();
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white" aria-hidden>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            CreatorHub
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined}
                className={cx("rounded-lg px-3 py-2 text-sm font-semibold", active(path, n.href) ? "bg-brand-tint text-brand-dark" : "text-ink-soft hover:bg-canvas")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/verify" aria-label="Verification status" className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            {verification ? <VerificationBadge s={verification.status} /> : <span className="inline-block h-6 w-20 animate-pulse rounded-full bg-line" />}
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-5 sm:py-8">{children}</main>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-3">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={active(path, n.href) ? "page" : undefined}
                className={cx("flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active(path, n.href) ? "text-brand-dark" : "text-ink-soft")}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={n.icon} /></svg>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <DemoPanel />
    </div>
  );
}
