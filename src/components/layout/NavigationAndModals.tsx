"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OrdersDrawer } from "@/components/orders/OrdersDrawer";
import { useCart } from "@/lib/cart/CartContext";

export function NavigationAndModals() {
  const [authOpen, setAuthOpen] = useState(false);
  const { isOpen: cartOpen, setIsOpen: setCartOpen } = useCart();
  const [ordersOpen, setOrdersOpen] = useState(false);

  return (
    <>
      <Header
        onOpenAuth={() => setAuthOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
      />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onOpenOrders={() => setOrdersOpen(true)}
      />
      <OrdersDrawer open={ordersOpen} onOpenChange={setOrdersOpen} />
    </>
  );
}
