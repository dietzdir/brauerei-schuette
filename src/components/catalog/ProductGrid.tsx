"use client";

import React, { useEffect, useState, ViewTransition } from "react";
import { Product } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query } from "firebase/firestore";
import { ProductCard } from "./ProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Beer, GlassWater } from "lucide-react";

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Beer" | "Lemonade">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((docSnap) => {
          prods.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) });
        });
        setProducts(prods);
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore products listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((p) => {
    // Only show active products (default is true if not set)
    if (p.isActive === false) return false;

    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants.some((v) =>
        v.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <Tabs
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-[340px] bg-[#eeeeee] border border-[#c8d3d5] rounded-none p-1 h-10 group-data-horizontal/tabs:h-10 items-center">
            <TabsTrigger 
              value="all" 
              className="h-full flex items-center justify-center rounded-none uppercase tracking-wider text-xs font-bold transition-colors duration-150 data-active:bg-[#0f4851] data-active:text-white data-active:shadow-none text-[#505c5f] hover:text-[#0f4851]"
            >
              Alle
            </TabsTrigger>
            <TabsTrigger 
              value="Beer" 
              className="h-full flex items-center justify-center gap-1.5 rounded-none uppercase tracking-wider text-xs font-bold transition-colors duration-150 data-active:bg-[#0f4851] data-active:text-white data-active:shadow-none text-[#505c5f] hover:text-[#0f4851]"
            >
              <Beer className="size-3.5" aria-hidden="true" />
              Biere
            </TabsTrigger>
            <TabsTrigger 
              value="Lemonade" 
              className="h-full flex items-center justify-center gap-1.5 rounded-none uppercase tracking-wider text-xs font-bold transition-colors duration-150 data-active:bg-[#0f4851] data-active:text-white data-active:shadow-none text-[#505c5f] hover:text-[#0f4851]"
            >
              <GlassWater className="size-3.5" aria-hidden="true" />
              Brausen
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#505c5f]" aria-hidden="true" />
          <Input
            aria-label="Sorten durchsuchen"
            placeholder="Sorten durchsuchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white rounded-none border-[#c8d3d5] h-10 text-xs font-medium"
          />
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-none border border-[#c8d3d5] bg-white p-4 space-y-4 animate-pulse">
              <div className="w-full aspect-16/9 bg-[#f4f6f7] rounded-none" />
              <div className="space-y-2">
                <div className="h-6 w-2/3 bg-[#f4f6f7]" />
                <div className="h-4 w-1/2 bg-[#f4f6f7]" />
              </div>
              <div className="h-16 bg-[#f4f6f7]" />
              <div className="h-10 bg-[#f4f6f7]" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-[#c8d3d5] rounded-none p-8">
          <Beer className="size-10 mx-auto text-[#505c5f]/60 mb-3" aria-hidden="true" />
          <h3 className="text-lg font-bold font-heading uppercase text-[#0f4851]">Keine Sorten gefunden</h3>
          <p className="text-xs text-[#505c5f] mt-1">
            Versuchen Sie einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ViewTransition key={product.id}>
              <ProductCard product={product} />
            </ViewTransition>
          ))}
        </div>
      )}
    </section>
  );
}

