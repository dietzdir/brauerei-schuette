"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OrdersDrawer } from "@/components/orders/OrdersDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { Beer, ShieldCheck, Truck, Clock, Calendar, Sparkles, AlertCircle } from "lucide-react";
import {
  subscribeStoreSettings,
  calculatePickupSlots,
  DEFAULT_STORE_SETTINGS,
  PickupSlot,
  getWeekdayPlural,
} from "@/lib/openingHours";
import { StoreSettings } from "@/types";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [slots, setSlots] = useState<PickupSlot[]>([]);

  useEffect(() => {
    const unsub = subscribeStoreSettings((data) => {
      setSettings(data);
      const computed = calculatePickupSlots(data, 4);
      setSlots(computed);
    });
    return () => unsub();
  }, []);

  const nextSlot = slots[0];
  const dayPlural = getWeekdayPlural(settings.regularDayOfWeek ?? 5);
  const dayPluralCap = dayPlural.charAt(0).toUpperCase() + dayPlural.slice(1);
  const regularHoursText = `${dayPluralCap} ${settings.regularOpenTime || "14:00"} – ${settings.regularCloseTime || "19:00"} Uhr`;

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + (settings.bannerLookaheadDays ?? 14));
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const upcomingExceptions = (settings.exceptions || [])
    .filter(ex => ex.date >= new Date().toISOString().split("T")[0] && ex.date <= maxDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-amber-100 selection:text-amber-900">
      {/* Header Navigation */}
      <Header
        onOpenAuth={() => setAuthOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">

        {/* Dynamic Exception Banner */}
        {upcomingExceptions.length > 0 && (
          <div className="bg-[#eeeeee] border border-[#c8d3d5] rounded-none p-4 sm:p-5 flex flex-col gap-2 shadow-xs text-[#1a1c1c]">
            <div className="flex items-center gap-3.5 mb-1">
              <div className="size-10 rounded-none bg-[#0f4851] text-[#00A8BC] flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="size-5" />
              </div>
              <div className="font-bold text-sm tracking-wider uppercase text-[#0f4851]">
                Wichtige Hinweise zu den Öffnungszeiten
              </div>
            </div>
            <div className="space-y-1.5 sm:ml-[54px]">
              {upcomingExceptions.map((ex) => {
                const dateObj = new Date(ex.date + "T00:00:00");
                const dayStr = dateObj.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
                const dateShort = dateObj.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
                const dateFormatted = `Am ${dayStr}., ${dateShort}`;
                
                let typeText = "";
                let timeText = "";
                if (ex.type === "closed") {
                  typeText = "Geschlossen";
                } else if (ex.type === "special_open") {
                  typeText = "Sonderöffnung";
                  timeText = ex.openTime && ex.closeTime ? `${ex.openTime} - ${ex.closeTime} Uhr` : "";
                } else {
                  typeText = "Geänderte Uhrzeit";
                  timeText = ex.openTime && ex.closeTime ? `${ex.openTime} - ${ex.closeTime} Uhr` : "";
                }

                const details = [timeText, ex.note].filter(Boolean).join(", ");
                const displayReason = details ? ` (${details})` : "";
                
                return (
                  <p key={ex.id} className="text-sm font-semibold leading-snug flex items-start gap-2 text-[#1a1c1c]">
                    <span className="shrink-0 text-[#00A8BC] font-bold mt-0.5">•</span>
                    <span>{dateFormatted}: {typeText}{displayReason}</span>
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Prominent Werksverkauf Announcement Banner */}
        <div className={`bg-white border ${nextSlot?.isSpecial ? 'border-[#00A8BC]' : 'border-[#c8d3d5]'} rounded-none p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs`}>
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 text-left">
            <div className="size-10 sm:size-12 rounded-none bg-[#0f4851] text-[#00A8BC] flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
              <Clock className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-lg sm:text-2xl tracking-wide uppercase text-[#1a1c1c] leading-tight">
                {nextSlot ? (
                  <>
                    Nächster Verkauf: <span className="text-[#00A8BC]">{nextSlot.formattedDate}</span> ({nextSlot.timeRange})
                  </>
                ) : (
                  `Immer ${regularHoursText}`
                )}
              </h3>
              <p className="text-xs text-[#505c5f] mt-1 font-medium leading-normal">
                {nextSlot?.note ? (
                  <span className="font-bold text-[#0f4851] mr-2">
                    ★ {nextSlot.note}
                  </span>
                ) : null}
                Handwerksbrauerei Schütte &bull; Zum Siekweg 2, 39343 Rottmersleben
              </p>
            </div>
          </div>
          <div className="hidden sm:block shrink-0">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f4851] bg-[#eeeeee] px-4 py-2.5 rounded-none border border-[#c8d3d5]">
              <Beer className="size-4 text-[#00A8BC]" />
              Online reservieren & vor Ort abholen
            </span>
          </div>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
          <div className="hidden sm:flex items-center gap-3 p-4 rounded-none border border-[#c8d3d5] bg-white shadow-2xs">
            <div className="size-10 rounded-none bg-[#0f4851] text-[#00A8BC] flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-xs text-[#0f4851]">Flexible Gebinde</h4>
              <p className="text-[11px] text-[#505c5f]">Vom 6er-Träger bis zum 50l Fass</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 p-4 rounded-none border border-[#c8d3d5] bg-white shadow-2xs">
            <div className="size-10 rounded-none bg-[#0f4851] text-[#00A8BC] flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-xs text-[#0f4851]">Werksverkauf</h4>
              <p className="text-[11px] text-[#00A8BC] font-bold">{regularHoursText}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-none border border-[#c8d3d5] bg-white shadow-2xs">
            <div className="size-10 rounded-none bg-[#0f4851] text-[#00A8BC] flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-xs text-[#0f4851]">Einfache Vorbestellung</h4>
              <p className="text-[11px] text-[#505c5f]">Direkt online als Gast oder Stammkunde</p>
            </div>
          </div>
        </div>

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
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onOpenOrders={() => setOrdersOpen(true)}
      />
      <OrdersDrawer open={ordersOpen} onOpenChange={setOrdersOpen} />
    </div>
  );
}
