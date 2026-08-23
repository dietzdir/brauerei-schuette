import React, { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { RentalSection } from "@/components/catalog/RentalSection";
import { BenefitsBar } from "@/components/store/BenefitsBar";
import { StoreStatusCard, StoreStatusCardSkeleton } from "@/components/store/StoreStatusCard";
import { NavigationAndModals } from "@/components/layout/NavigationAndModals";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-amber-100 selection:text-amber-900">
      {/* Header Navigation & Drawers */}
      <NavigationAndModals />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Realtime Store Status Banner wrapped in Suspense for Instant Shell */}
        <Suspense fallback={<StoreStatusCardSkeleton />}>
          <StoreStatusCard />
        </Suspense>

        {/* Static Benefits Bar */}
        <BenefitsBar />

        {/* Product Catalog Grid */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-[#c8d3d5] pb-2">
            <h3 className="font-heading text-3xl uppercase tracking-wider text-[#0f4851]">
              Unser Sortiment
            </h3>
            <p className="text-xs text-[#505c5f]">
              Wählen Sie Ihre Sorte und das gewünschte Gebinde aus.
            </p>
          </div>
          <ProductGrid />
          <RentalSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
