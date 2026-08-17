"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ContainerType, OrderItem } from "@/types";

export interface CartItem extends OrderItem {
  id: string; // unique composite key: `${productId}_${variantType}`
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  itemsTotalCents: number;
  depositTotalCents: number;
  grandTotalCents: number;
  totalCents: number; // alias for grandTotalCents
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "brauerei_schuette_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<CartItem, "id">) => {
    const id = `${item.productId}_${item.variantType}`;
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
          unitPrice: item.unitPrice,
          depositPrice: item.depositPrice,
        };
        return updated;
      }
      return [...prev, { ...item, id }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotalCents = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const depositTotalCents = items.reduce(
    (sum, item) => sum + (item.depositPrice || 0) * item.quantity,
    0
  );
  const grandTotalCents = itemsTotalCents + depositTotalCents;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        itemsTotalCents,
        depositTotalCents,
        grandTotalCents,
        totalCents: grandTotalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
