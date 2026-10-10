"use client";
import { ContentSection } from "@/components/dashboard/ContentSection";
import { OverviewCards } from "@/components/dashboard/Overview";
import { PurchasesSection } from "@/components/dashboard/PurchasesSection";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { VerificationBanner } from "@/components/VerificationBanner";
import { LinkButton } from "@/components/ui";

export default function Dashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-soft">How your videos are performing.</p>
        </div>
        <LinkButton href="/content/new" variant="primary" className="hidden sm:inline-flex">New video</LinkButton>
      </div>
      <VerificationBanner />
      <OverviewCards />
      <RevenueChart />
      <ContentSection />
      <PurchasesSection />
    </div>
  );
}
