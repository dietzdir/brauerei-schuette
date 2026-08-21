"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ContainerType, OrderItem } from "@/types";

export interface CartItem extends OrderItem {
  id: string; // unique composite key: `${productId}_${variantType}`
}

export interface RentalCartItem {
  rentalId: string;
  rentalName: string;
  rentalPriceCents: number;
  depositCents: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  rentalItem: RentalCartItem | null;
  addItem: (item: Omit<CartItem, "id">, options?: { openDrawer?: boolean }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  addRentalItem: (item: RentalCartItem, options?: { openDrawer?: boolean }) => void;
  removeRentalItem: () => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  lastAddedItemId: string | null;
  totalCount: number;
  itemsTotalCents: number;
  depositTotalCents: number;
  grandTotalCents: number;
  totalCents: number; // alias for grandTotalCents
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "brauerei_schuette_cart_v2";
const RENTAL_STORAGE_KEY = "brauerei_schuette_rental_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [rentalItem, setRentalItem] = useState<RentalCartItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const highlightTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
      const savedRental = localStorage.getItem(RENTAL_STORAGE_KEY);
      if (savedRental) {
        setRentalItem(JSON.parse(savedRental));
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

  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (rentalItem) {
        localStorage.setItem(RENTAL_STORAGE_KEY, JSON.stringify(rentalItem));
      } else {
        localStorage.removeItem(RENTAL_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save rental to localStorage", e);
    }
  }, [rentalItem, isLoaded]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (
    item: Omit<CartItem, "id">,
    options: { openDrawer?: boolean } = { openDrawer: true }
  ) => {
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

    setLastAddedItemId(id);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setLastAddedItemId(null);
    }, 4000);

    if (options.openDrawer !== false) {
      setIsOpen(true);
    }
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

  const addRentalItem = (
    item: RentalCartItem,
    options: { openDrawer?: boolean } = { openDrawer: true }
  ) => {
    setRentalItem(item);
    setLastAddedItemId(`rental_${item.rentalId}`);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setLastAddedItemId(null);
    }, 4000);

    if (options.openDrawer !== false) {
      setIsOpen(true);
    }
  };

  const removeRentalItem = () => {
    setRentalItem(null);
  };

  const clearCart = () => {
    setItems([]);
    setRentalItem(null);
  };

  const totalCount =
    items.reduce((sum, item) => sum + item.quantity, 0) + (rentalItem ? 1 : 0);
  const itemsTotalCents =
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) +
    (rentalItem ? rentalItem.rentalPriceCents : 0);
  const depositTotalCents = items.reduce(
    (sum, item) => sum + (item.depositPrice || 0) * item.quantity,
    0
  );
  const grandTotalCents = itemsTotalCents + depositTotalCents;

  return (
    <CartContext.Provider
      value={{
        items,
        rentalItem,
        addItem,
        removeItem,
        updateQuantity,
        addRentalItem,
        removeRentalItem,
        clearCart,
        isOpen,
        setIsOpen,
        openCart,
        closeCart,
        lastAddedItemId,
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

