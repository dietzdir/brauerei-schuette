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
  const { rentalItems, addRentalItem } = useCart();

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
    <section className="space-y-4 pt-6 border-t border-border">
      <div>
        <h3 className="font-heading text-3xl uppercase tracking-wider text-primary">
          Zubehör & Verleih
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ergänzen Sie Ihre Reservierung mit unserem Verleihangebot.
        </p>
      </div>

      {loading ? (
        <div className="border border-border bg-white p-6 animate-pulse rounded-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 aspect-16/9 bg-muted/40" />
            <div className="md:col-span-7 space-y-3">
              <div className="h-6 w-2/3 bg-muted/40" />
              <div className="h-4 w-full bg-muted/40" />
              <div className="h-4 w-4/5 bg-muted/40" />
              <div className="h-10 w-48 bg-muted/40 mt-4" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRentals.map((rental) => {
            const cartItem = rentalItems.find((r) => r.rentalId === rental.id);
            return (
              <RentalCardItem
                key={rental.id}
                rental={rental}
                cartItem={cartItem}
                onAddToCart={(qty) => {
                  const maxStock = typeof rental.totalStock === "number" && rental.totalStock > 0 ? rental.totalStock : 99;
                  addRentalItem({
                    rentalId: rental.id,
                    rentalName: rental.name,
                    rentalPriceCents: rental.rentalPriceCents,
                    depositCents: rental.depositCents,
                    image: rental.image,
                    quantity: qty,
                    totalStock: maxStock,
                  });
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

interface RentalCardItemProps {
  rental: RentalItem;
  cartItem?: { quantity: number };
  onAddToCart: (quantity: number) => void;
}

function RentalCardItem({ rental, cartItem, onAddToCart }: RentalCardItemProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const inCartQty = cartItem?.quantity || 0;
  const maxStock = typeof rental.totalStock === "number" && rental.totalStock > 0 ? rental.totalStock : 99;
  const remainingStock = Math.max(0, maxStock - inCartQty);
  const isStockLimitReached = inCartQty >= maxStock;

  const handleAdd = () => {
    if (isStockLimitReached || quantity <= 0) return;
    const qtyToAdd = Math.min(quantity, remainingStock);
    onAddToCart(qtyToAdd);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setQuantity(1);
    }, 1500);
  };

  return (
    <Card
      className={`overflow-hidden rounded-none border transition-all duration-200 bg-white shadow-xs p-0 ${
        inCartQty > 0
          ? "border-accent ring-1 ring-accent"
          : "border-border hover:border-primary"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
        {/* Left: Image (16:9 on mobile, fills column on desktop) */}
        <div className="md:col-span-5 relative bg-muted/30 overflow-hidden flex items-center justify-center min-h-[220px] md:min-h-full border-b md:border-b-0 md:border-r border-border">
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
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Wrench className="size-12 text-primary/40 mb-2" />
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {inCartQty > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold uppercase rounded-none border border-accent/30 tabular-nums">
                    <Check className="size-3 shrink-0" />
                    {inCartQty}x im Warenkorb
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                Bestand: {rental.totalStock} Stück
              </span>
            </div>

            <h4 className="font-heading text-xl sm:text-2xl uppercase tracking-wide text-primary mt-2 leading-tight">
              {rental.name}
            </h4>

            {rental.description && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {rental.description}
              </p>
            )}
          </div>

          {/* Price & Action Section */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 mt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mietgebühr:
                </span>
                <span className="font-heading text-3xl tracking-wide text-primary tabular-nums">
                  {formatPrice(rental.rentalPriceCents)}
                </span>
              </div>
              {rental.depositCents > 0 && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                  <Info className="size-3 text-accent shrink-0" aria-hidden="true" />
                  <span>zzgl. {formatPrice(rental.depositCents)} Kaution bei Abholung</span>
                </p>
              )}
            </div>

            {/* Stepper + In den Warenkorb Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center border border-border bg-white rounded-none h-10 shadow-2xs focus-within:ring-2 focus-within:ring-ring">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Menge für Mietartikel ${rental.name} verringern (aktuell: ${quantity})`}
                  disabled={quantity <= 1 || isStockLimitReached}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                >
                  <Minus className="size-3.5" aria-hidden="true" />
                </Button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={remainingStock > 0 ? remainingStock : 1}
                  value={quantity}
                  disabled={isStockLimitReached}
                  aria-label={`Menge in Stück für Mietartikel ${rental.name}`}
                  aria-valuenow={quantity}
                  aria-valuemin={1}
                  aria-valuemax={remainingStock > 0 ? remainingStock : 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      setQuantity(Math.min(val, remainingStock > 0 ? remainingStock : 1));
                    } else if (e.target.value === "") {
                      setQuantity(1);
                    }
                  }}
                  className="w-10 text-center text-xs font-bold text-primary bg-transparent outline-none focus-visible:bg-muted py-1.5 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Menge für Mietartikel ${rental.name} erhöhen (aktuell: ${quantity})`}
                  disabled={quantity >= remainingStock || isStockLimitReached}
                  onClick={() => setQuantity((prev) => Math.min(prev + 1, remainingStock))}
                  className="size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleAdd}
                disabled={isStockLimitReached}
                aria-label={justAdded ? `${quantity}x ${rental.name} im Warenkorb` : `${quantity}x ${rental.name} in den Warenkorb legen`}
                className={`flex-1 sm:flex-none font-bold uppercase tracking-wider text-xs h-10 px-5 rounded-none shadow-xs transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring ${
                  justAdded
                    ? "bg-emerald-800 text-white"
                    : isStockLimitReached
                    ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                    : "bg-primary hover:bg-[#165a65] text-primary-foreground"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    <span className="tabular-nums">{quantity}x Im Warenkorb</span>
                  </>
                ) : isStockLimitReached ? (
                  <span>Bestand im Warenkorb</span>
                ) : (
                  <>
                    <Plus className="size-4" aria-hidden="true" />
                    <span className="tabular-nums">{quantity > 1 ? `${quantity}x In den Warenkorb` : "In den Warenkorb"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
