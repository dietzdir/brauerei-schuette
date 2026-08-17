"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query } from "firebase/firestore";
import { initialProducts } from "@/lib/firebase/seed";
import { seedProductsServerAction } from "@/app/actions/seed";
import { ProductCard } from "./ProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Beer, GlassWater } from "lucide-react";

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
              className="h-full flex items-center justify-center rounded-none uppercase tracking-wider text-xs font-bold transition-all data-active:bg-[#0f4851] data-active:text-white data-active:shadow-none text-[#505c5f] hover:text-[#0f4851]"
            >
              Alle
            </TabsTrigger>
            <TabsTrigger 
              value="Beer" 
              className="h-full flex items-center justify-center gap-1.5 rounded-none uppercase tracking-wider text-xs font-bold transition-all data-active:bg-[#0f4851] data-active:text-white data-active:shadow-none text-[#505c5f] hover:text-[#0f4851]"
            >
              <Beer className="size-3.5" />
              Biere
            </TabsTrigger>
            <TabsTrigger 
              value="Lemonade" 
              className="h-full flex items-center justify-center gap-1.5 rounded-none uppercase tracking-wider text-xs font-bold transition-all data-active:bg-[#0f4851] data-active:text-white data-active:shadow-none text-[#505c5f] hover:text-[#0f4851]"
            >
              <GlassWater className="size-3.5" />
              Brausen
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#505c5f]" />
          <Input
            placeholder="Sorten durchsuchen..."
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
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 space-y-4 animate-pulse">
              <div className="w-full h-48 bg-muted/60 rounded-xl" />
              <div className="space-y-2">
                <div className="h-6 w-2/3 bg-muted rounded-md" />
                <div className="h-4 w-1/2 bg-muted/60 rounded-md" />
              </div>
              <div className="h-16 bg-muted/40 rounded-xl" />
              <div className="h-10 bg-muted/70 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl p-8">
          <Beer className="size-10 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="text-lg font-semibold">Keine Sorten gefunden</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Versuchen Sie einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
