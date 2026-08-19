"use client";

import React, { useState, ViewTransition } from "react";
import Image from "next/image";
import { Product, ProductVariant } from "@/types";
import { useCart } from "@/lib/cart/CartContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatContainerType, formatPrice, formatBasePrice } from "@/lib/utils";
import { Hop, Plus, Minus, Check, Info, Droplets, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const availableVariants = product.variants.filter((v) => v.isActive !== false);
  const [selectedVariantType, setSelectedVariantType] = useState<string>(
    availableVariants[0]?.type || product.variants[0]?.type || "0.75l bottle"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant: ProductVariant | undefined =
    availableVariants.find((v) => v.type === selectedVariantType) || availableVariants[0];

  const formattedPrice = activeVariant ? formatPrice(activeVariant.price) : "—";
  const is075Bottle = activeVariant?.type === "0.75l bottle";

  const handleAddToCart = () => {
    if (!activeVariant || quantity < 1) return;

    addItem({
      productId: product.id,
      productName: product.name,
      variantType: activeVariant.type,
      quantity,
      unitPrice: activeVariant.price,
      depositPrice: activeVariant.deposit || 0,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const isBeer = product.category === "Beer";

  const depositText = activeVariant?.deposit
    ? `zzgl. ${formatPrice(activeVariant.deposit)} Pfand / Stück`
    : null;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-[border-color,box-shadow] duration-200 border border-[#c8d3d5] hover:border-[#0f4851] bg-white rounded-none group shadow-xs p-0 gap-0">
      {/* Product Image Header (Always 16:9 for uniform grid alignment) */}
      <div className="relative w-full aspect-16/9 bg-[#f4f6f7] overflow-hidden border-b border-[#c8d3d5] shrink-0 flex items-center justify-center">
        {product.image ? (
          <ViewTransition name={`product-img-${product.id}`} share="morph">
            <div className="relative w-full h-full">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </ViewTransition>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-[#f9fafb] to-[#edf1f2]">
            <Image
              src="/images/schuette-logo.jpg"
              alt="Brauerei Schütte"
              width={160}
              height={90}
              className="object-contain max-h-16 w-auto opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-[transform,opacity] duration-300 filter grayscale-[20%]"
            />
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
          {product.badge && (
            <Badge
              variant="secondary"
              className="bg-[#00A8BC] text-white border-0 font-bold uppercase tracking-wider text-[10px] rounded-none px-2 py-0.5"
            >
              <Hop className="size-3 mr-1 inline" aria-hidden="true" />
              {product.badge}
            </Badge>
          )}

          {product.alcohol && (
            <Badge variant="outline" className="text-[11px] font-bold bg-white text-[#0f4851] border-[#c8d3d5] rounded-none tabular-nums">
              {product.alcohol.includes("%") ? product.alcohol : `${product.alcohol} % vol.`}
            </Badge>
          )}
        </div>

        {product.image && product.isAiGenerated && (
          <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 bg-black/65 backdrop-blur-xs text-white/95 text-[10px] font-medium px-2 py-0.5 rounded-none border border-white/20 shadow-xs select-none">
              <Sparkles className="size-2.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>KI-Symbolbild</span>
            </span>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2 space-y-1 shrink-0 min-h-[4.5rem]">
        <CardTitle className="font-heading text-2xl tracking-wide uppercase text-[#0f4851] text-pretty">
          {product.name}
        </CardTitle>

        {product.flavorProfile && (
          <p className="text-xs font-semibold text-[#00A8BC] leading-snug">
            {product.flavorProfile}
          </p>
        )}
      </CardHeader>

      <CardContent className="px-4 space-y-4 pb-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2 min-h-[5.5rem]">
          {product.description && (
            <p className="text-xs text-[#505c5f] leading-relaxed font-normal">
              {product.description}
            </p>
          )}

          {product.color && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#505c5f] font-medium pt-1">
              <Droplets className="size-3.5 text-[#00A8BC] shrink-0" aria-hidden="true" />
              <span>Farbe: {product.color}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-[#f9f9f9] rounded-none space-y-3 border border-[#c8d3d5]">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#505c5f] block">Einzelpreis</span>
              {activeVariant && (
                <span className="text-[11px] text-[#505c5f] font-medium tabular-nums">
                  {formatBasePrice(activeVariant.price, activeVariant.type)}
                </span>
              )}
            </div>
            <span className="font-heading text-3xl tracking-wide text-[#0f4851] tabular-nums">
              {formattedPrice}
            </span>
          </div>

          {/* Container Select */}
          <div className="space-y-1">
            <label htmlFor={`variant-select-${product.id}`} className="text-[11px] font-bold uppercase tracking-wider text-[#505c5f] block">
              Gebinde / Größe:
            </label>
            <Select
              value={selectedVariantType}
              onValueChange={(val) => {
                if (val) {
                  setSelectedVariantType(val);
                }
              }}
            >
              <SelectTrigger id={`variant-select-${product.id}`} className="w-full bg-white h-9 text-xs rounded-none border-[#c8d3d5]">
                <SelectValue placeholder="Gebinde wählen">
                  {formatContainerType(selectedVariantType)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#c8d3d5]">
                {availableVariants.map((v) => (
                  <SelectItem key={v.type} value={v.type} className="text-xs rounded-none">
                    <div className="flex justify-between w-full gap-4 items-center">
                      <div>
                        <span className="font-medium">{formatContainerType(v.type)}</span>
                        <span className="text-[10px] text-[#505c5f] ml-1.5 tabular-nums">
                          ({formatBasePrice(v.price, v.type)})
                        </span>
                      </div>
                      <span className="font-bold text-[#0f4851] ml-2 tabular-nums">
                        {formatPrice(v.price)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Stepper & Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor={`quantity-input-${product.id}`} className="text-[11px] font-bold uppercase tracking-wider text-[#505c5f]">
                Bestellmenge:
              </label>
              {quantity > 1 && activeVariant && (
                <span className="text-[11px] font-bold text-[#00A8BC] tabular-nums">
                  Summe: {formatPrice(activeVariant.price * quantity)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#c8d3d5] rounded-none bg-white overflow-hidden shadow-2xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Menge für ${product.name} verringern`}
                  className="size-8 rounded-none text-[#505c5f] hover:text-[#1a1c1c] hover:bg-[#eeeeee]"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="size-3.5" aria-hidden="true" />
                </Button>
                <input
                  id={`quantity-input-${product.id}`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="999"
                  value={quantity}
                  aria-label={`Menge für ${product.name}`}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) setQuantity(val);
                    else if (e.target.value === "") setQuantity(1);
                  }}
                  className="w-12 text-center text-xs font-bold bg-transparent outline-none py-1.5 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Menge für ${product.name} erhöhen`}
                  className="size-8 rounded-none text-[#505c5f] hover:text-[#1a1c1c] hover:bg-[#eeeeee]"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </Button>
              </div>

              {/* Quick Presets only for 0.75l bottles (6er Kasten) */}
              {is075Bottle && (
                <div className="flex items-center gap-1">
                  {[6, 12, 24].map((cnt) => (
                    <Button
                      key={cnt}
                      type="button"
                      variant={quantity === cnt ? "default" : "outline"}
                      size="sm"
                      aria-label={`${cnt} Stück (${cnt === 6 ? "6er Kasten" : `${cnt}er`}) auswählen`}
                      onClick={() => setQuantity(cnt)}
                      className={`h-8 px-2 text-[11px] font-bold rounded-none uppercase tabular-nums ${
                        quantity === cnt ? "bg-[#0f4851] text-white" : "border-[#c8d3d5] text-[#0f4851]"
                      }`}
                    >
                      {cnt === 6 ? "6er Kasten" : `${cnt}er`}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {depositText && (
            <div className="flex items-center gap-1 text-[11px] text-[#505c5f] pt-0.5 font-medium">
              <Info className="size-3 text-[#00A8BC] shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{depositText}</span>
            </div>
          )}

          {/* LMIV & Allergen information */}
          <div className="pt-2 border-t border-[#c8d3d5] text-xs text-[#505c5f] leading-relaxed">
            <p>
              <span className="font-semibold text-[#1a1c1c]">Zutaten:</span>{" "}
              {(() => {
                const rawIngredients = product.ingredients?.trim() || (isBeer
                  ? "Brauwasser, Gerstenmalz, Hopfen, Hefe."
                  : "Wasser, Zucker, Kohlensäure, natürliches Aroma, Säuerungsmittel.");
                const allergenRegex = /(Gerstenmalz|Weizenmalz|Roggenmalz|Dinkelmalz|Hafermalz|Gluten|Sulfite|Hefe)/gi;
                const parts = rawIngredients.split(allergenRegex);
                return parts.map((part, i) =>
                  allergenRegex.test(part) ? (
                    <strong key={i} className="font-bold text-[#1a1c1c]">
                      {part}
                    </strong>
                  ) : (
                    part
                  )
                );
              })()}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-[#c8d3d5] bg-[#f9f9f9]">
        <Button
          onClick={handleAddToCart}
          aria-label={justAdded ? `${quantity}x ${product.name} im Warenkorb` : `${quantity}x ${product.name} in den Warenkorb legen`}
          className={`w-full font-bold uppercase tracking-wider transition-colors duration-150 h-10 rounded-none shadow-xs ${
            justAdded
              ? "bg-[#0f4851] text-white"
              : "bg-[#00a8bc] hover:bg-[#0092a4] text-white"
          }`}
          disabled={!activeVariant}
        >
          {justAdded ? (
            <>
              <Check className="size-4 mr-1.5" aria-hidden="true" />
              <span className="tabular-nums">{quantity}x Im Warenkorb</span>
            </>
          ) : (
            <>
              <Plus className="size-4 mr-1.5" aria-hidden="true" />
              <span className="tabular-nums">{quantity > 1 ? `${quantity}x In den Warenkorb` : "In den Warenkorb"}</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
