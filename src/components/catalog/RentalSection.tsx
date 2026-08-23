"use client";

import React, { useEffect, useState, ViewTransition } from "react";
import Image from "next/image";
import { RentalItem } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useCart } from "@/lib/cart/CartContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Wrench,
  Plus,
  Minus,
  Check,
  Info,
  Sparkles,
} from "lucide-react";

export function RentalSection() {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { rentalItems, addRentalItem, updateRentalQuantity } = useCart();
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "rentals"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: RentalItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<RentalItem, "id">) });
        });
        setRentals(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore rentals listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const activeRentals = rentals.filter((r) => r.isActive !== false);

  if (!loading && activeRentals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-6 border-t border-[#c8d3d5]">
      <div>
        <h3 className="font-heading text-3xl uppercase tracking-wider text-[#0f4851]">
          Zubehör & Verleih
        </h3>
        <p className="text-xs text-[#505c5f] mt-1">
          Ergänzen Sie Ihre Reservierung mit unserem Verleihangebot.
        </p>
      </div>


      {loading ? (
        <div className="border border-[#c8d3d5] bg-white p-6 animate-pulse rounded-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 aspect-16/9 bg-[#f4f6f7]" />
            <div className="md:col-span-7 space-y-3">
              <div className="h-6 w-2/3 bg-[#f4f6f7]" />
              <div className="h-4 w-full bg-[#f4f6f7]" />
              <div className="h-4 w-4/5 bg-[#f4f6f7]" />
              <div className="h-10 w-48 bg-[#f4f6f7] mt-4" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRentals.map((rental) => {
            const cartItem = rentalItems.find((r) => r.rentalId === rental.id);
            const isInCart = Boolean(cartItem && cartItem.quantity > 0);
            const currentQty = cartItem?.quantity || 0;
            const maxStock = typeof rental.totalStock === "number" && rental.totalStock > 0 ? rental.totalStock : 99;

            return (
              <Card
                key={rental.id}
                className={`overflow-hidden rounded-none border transition-all duration-200 bg-white shadow-xs p-0 ${
                  isInCart
                    ? "border-[#00A8BC] ring-1 ring-[#00A8BC]"
                    : "border-[#c8d3d5] hover:border-[#0f4851]"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
                  {/* Left: Image (16:9 on mobile, fills column on desktop) */}
                  <div className="md:col-span-5 relative bg-[#f4f6f7] overflow-hidden flex items-center justify-center min-h-[220px] md:min-h-full border-b md:border-b-0 md:border-r border-[#c8d3d5]">
                    {rental.image ? (
                      <ViewTransition name={`rental-img-${rental.id}`} share="morph">
                        <div className="relative w-full h-full aspect-16/9 md:aspect-auto min-h-[220px]">
                          <Image
                            src={rental.image}
                            alt={rental.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 40vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                        </div>
                      </ViewTransition>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#505c5f]">
                        <Wrench className="size-12 text-[#0f4851]/40 mb-2" />
                        <span className="text-xs font-semibold">Brauerei Schütte Verleih</span>
                      </div>
                    )}

                    {/* AI Generated Badge */}
                    {rental.image && rental.isAiGenerated && (
                      <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
                        <span className="inline-flex items-center gap-1 bg-black/65 backdrop-blur-xs text-white/95 text-[10px] font-medium px-2 py-0.5 rounded-none border border-white/20 shadow-xs select-none">
                          <Sparkles className="size-2.5 text-amber-300 shrink-0" aria-hidden="true" />
                          <span>KI-Symbolbild</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Content & Controls */}
                  <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-end">
                        <span className="text-[11px] font-semibold text-[#505c5f] tabular-nums">
                          Bestand: {rental.totalStock} Stück
                        </span>
                      </div>

                      <h4 className="font-heading text-xl sm:text-2xl uppercase tracking-wide text-[#0f4851] mt-1 leading-tight">
                        {rental.name}
                      </h4>

                      {rental.description && (
                        <p className="text-xs text-[#505c5f] mt-1.5 leading-relaxed">
                          {rental.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Action Section */}
                    <div className="pt-4 border-t border-[#c8d3d5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f9f9f9] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 mt-4">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                            Mietgebühr:
                          </span>
                          <span className="font-heading text-3xl tracking-wide text-[#0f4851] tabular-nums">
                            {formatPrice(rental.rentalPriceCents)}
                          </span>
                        </div>
                        {rental.depositCents > 0 && (
                          <p className="text-[11px] text-[#505c5f] flex items-center gap-1 font-medium mt-0.5">
                            <Info className="size-3 text-[#00A8BC] shrink-0" aria-hidden="true" />
                            <span>zzgl. {formatPrice(rental.depositCents)} Kaution bei Abholung</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isInCart ? (
                          <div className="flex items-center border border-[#c8d3d5] bg-white rounded-none h-10 shadow-2xs">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Menge für Mietartikel ${rental.name} verringern`}
                              disabled={currentQty <= 1}
                              onClick={() => updateRentalQuantity(rental.id, currentQty - 1)}
                              className="size-9 rounded-none text-[#0f4851] hover:bg-[#eeeeee] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#00A8BC] focus-visible:outline-none cursor-pointer"
                            >
                              <Minus className="size-3.5" aria-hidden="true" />
                            </Button>
                            <div
                              role="status"
                              aria-live="polite"
                              aria-label={`Ausgewählte Menge für ${rental.name}: ${currentQty}`}
                              className="w-10 text-center text-xs font-bold text-[#0f4851] tabular-nums select-none"
                            >
                              {currentQty}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Menge für Mietartikel ${rental.name} erhöhen`}
                              disabled={currentQty >= maxStock}
                              onClick={() => updateRentalQuantity(rental.id, currentQty + 1)}
                              className="size-9 rounded-none text-[#0f4851] hover:bg-[#eeeeee] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#00A8BC] focus-visible:outline-none cursor-pointer"
                            >
                              <Plus className="size-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => {
                              addRentalItem({
                                rentalId: rental.id,
                                rentalName: rental.name,
                                rentalPriceCents: rental.rentalPriceCents,
                                depositCents: rental.depositCents,
                                image: rental.image,
                                quantity: 1,
                                totalStock: maxStock,
                              });
                              setJustAddedId(rental.id);
                              setTimeout(() => setJustAddedId(null), 1500);
                            }}
                            aria-label={`Mietartikel ${rental.name} zur Reservierung hinzufügen`}
                            className="w-full sm:w-auto bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-10 px-6 shadow-xs transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#0f4851] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
                          >
                            <Plus className="size-4" aria-hidden="true" />
                            <span>Zur Reservierung hinzufügen</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
