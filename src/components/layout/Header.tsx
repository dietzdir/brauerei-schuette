"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, History } from "lucide-react";

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
}

export function Header({ onOpenAuth, onOpenCart, onOpenOrders }: HeaderProps) {
  const { user, profile } = useAuth();
  const { totalCount } = useCart();

  const isAnonymous = user?.isAnonymous ?? true;
  const displayName = isAnonymous 
    ? "Anmelden / Registrieren" 
    : (profile?.displayName || user?.email?.split("@")[0] || "Konto");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#c8d3d5] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo with official emblem */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0">
          <div className="relative size-9 sm:size-11 overflow-hidden shrink-0">
            <Image
              src="/images/schuette-logo.jpg"
              alt="Handwerksbrauerei Schütte Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-base sm:text-xl tracking-wide sm:tracking-wider uppercase leading-tight text-[#0f4851] truncate">
              <span className="hidden sm:inline">Handwerksbrauerei Schütte</span>
              <span className="sm:hidden">Brauerei Schütte</span>
            </h1>
            <p className="hidden md:block text-[11px] text-[#505c5f] font-medium tracking-wide uppercase mt-0.5 truncate">
              Brauerei Rottmersleben • Regionale Braukunst
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* User Account Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAuth}
            aria-label="Kundenkonto öffnen"
            className="flex items-center gap-1.5 text-xs h-9 px-2.5 sm:px-3 bg-white border-[#c8d3d5] hover:bg-[#f3f3f3] rounded-none font-medium text-[#1a1c1c]"
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="size-4 rounded-none shrink-0" />
            ) : (
              <User className="size-3.5 text-[#505c5f] shrink-0" />
            )}
            <span className="hidden sm:inline max-w-[150px] md:max-w-[200px] truncate">
              {displayName}
            </span>
            <span className="sm:hidden text-[11px] font-semibold">
              {isAnonymous ? "Login" : "Konto"}
            </span>
          </Button>

          {/* Orders History Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenOrders}
            aria-label="Bestellhistorie öffnen"
            className="flex items-center gap-1.5 text-xs h-9 px-2.5 sm:px-3 bg-white border-[#c8d3d5] hover:bg-[#f3f3f3] rounded-none font-medium text-[#1a1c1c]"
          >
            <History className="size-3.5 text-[#505c5f]" />
            <span className="hidden md:inline uppercase tracking-wider font-semibold text-[11px]">Bestellungen</span>
          </Button>

          {/* Cart Trigger Button */}
          <Button
            size="sm"
            onClick={onOpenCart}
            aria-label="Warenkorb öffnen"
            className="relative flex items-center gap-1.5 text-xs font-bold h-9 px-3 sm:px-4 bg-[#00a8bc] hover:bg-[#0092a4] text-white rounded-none shadow-xs uppercase tracking-wider transition-all"
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Warenkorb</span>
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center size-5 text-[11px] font-black rounded-none bg-[#0f4851] text-white ml-0.5 animate-in zoom-in-75 duration-200">
                {totalCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
