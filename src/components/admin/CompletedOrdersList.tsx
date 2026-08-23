"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Package,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar as CalendarIcon,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Wrench,
} from "lucide-react";

import { formatContainerType, formatPrice } from "@/lib/utils";
import { deleteOrder } from "@/app/actions/deleteOrder";
import { toast } from "sonner";

export function CompletedOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load completed orders
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "==", "completed")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((docSnap) => {
        fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      // Sort by createdAt descending
      fetchedOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching completed orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerEmail || "").toLowerCase().includes(q) ||
        (o.id || "").toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSelectOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  }, []);

  const handleDeleteOrder = useCallback(async () => {
    if (!selectedOrder) return;
    setDeleting(true);
    try {
      const result = await deleteOrder(selectedOrder.id);
      if (result.success) {
        toast.success(`Bestellung #${selectedOrder.id.slice(0, 8)} wurde gelöscht.`);
        setDeleteDialogOpen(false);
        setSheetOpen(false);
        setSelectedOrder(null);
      } else {
        toast.error(result.error || "Fehler beim Löschen der Bestellung.");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
    }
    setDeleting(false);
  }, [selectedOrder]);


  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "–";
    try {
      const ts = timestamp as { toMillis: () => number };
      return new Date(ts.toMillis()).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "–";
    }
  };

  const calculateTotal = (order: Order) => {
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const rentalsTotal = (order.rentalItems || []).reduce((sum, r) => sum + r.rentalPriceCents, 0);
    return itemsTotal + rentalsTotal;
  };


  if (loading) {
    return (
      <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white mt-8">
        <Loader2 className="size-6 mx-auto animate-spin text-[#00A8BC] mb-3" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Lade abgeschlossene Bestellungen…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8 pt-8 border-t border-[#c8d3d5]">
      <div>
        <h2 className="font-heading text-2xl uppercase tracking-wide text-[#0f4851] mb-2">Abgeschlossene Bestellungen</h2>
        <p className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">Historie aller erfolgreich abgewickelten Reservierungen.</p>
      </div>

      <div className="relative max-w-sm mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#505c5f]" aria-hidden="true" />
        <input
          type="search"
          placeholder="Suchen (Name, E-Mail, ID)…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 rounded-none border border-[#c8d3d5] bg-white text-sm font-medium text-[#1a1c1c] placeholder:text-[#505c5f]/60 h-10 px-3 focus:outline-none focus:border-[#00A8BC] focus:ring-1 focus:ring-[#00A8BC]/30"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
          <Package className="size-12 mx-auto text-[#c8d3d5] mb-3" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
            {searchQuery ? "Keine Bestellungen für diese Suche gefunden." : "Noch keine abgeschlossenen Bestellungen vorhanden."}
          </p>
        </div>
      ) : (
        <div className="border border-[#c8d3d5] bg-white divide-y divide-[#c8d3d5]">
          {paginatedOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => handleSelectOrder(order)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#f9f9f9] active:scale-[0.99] transition-all duration-150 group"
            >
              <div className="size-10 shrink-0 rounded-full bg-[#0f4851]/10 flex items-center justify-center">
                <Package className="size-5 text-[#0f4851]" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-sm uppercase tracking-wide text-[#0f4851] truncate">
                    {order.customerName || "Unbenannt"}
                  </p>
                  <span className="text-xs font-bold text-[#0f4851] tabular-nums">
                    {formatPrice(calculateTotal(order))}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-[#505c5f]">
                  <span className="flex items-center gap-1 shrink-0 tabular-nums">
                    <CalendarIcon className="size-3" aria-hidden="true" />
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="truncate">ID: {order.id.slice(0, 8)}...</span>
                </div>
              </div>

              <ChevronRight className="size-4 text-[#c8d3d5] group-hover:text-[#0f4851] transition-colors duration-150 shrink-0" aria-hidden="true" />
            </button>
          ))}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 bg-[#f9f9f9]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-none text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee]"
              >
                <ChevronLeft className="size-4 mr-1" aria-hidden="true" />
                Zurück
              </Button>
              <span className="text-xs font-bold text-[#505c5f] tabular-nums">
                Seite {currentPage} von {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-none text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee]"
              >
                Weiter
                <ChevronRight className="size-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-[#f9f9f9] border-l border-[#c8d3d5] rounded-none p-0">
          {selectedOrder && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pb-4 bg-white border-b border-[#c8d3d5]">
                <SheetTitle className="font-heading text-xl uppercase tracking-wide text-[#0f4851]">
                  Bestellung #{selectedOrder.id.slice(0, 8)}
                </SheetTitle>
                <SheetDescription className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">
                  Vom {formatDate(selectedOrder.createdAt)}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer Details */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] mb-3 flex items-center gap-1.5">
                    Kunde
                  </h3>
                  <div className="bg-white border border-[#c8d3d5] divide-y divide-[#c8d3d5]">
                    <div className="p-3 text-sm font-semibold text-[#1a1c1c]">
                      {selectedOrder.customerName}
                      <span className="ml-2 rounded-none px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#0f4851]/10 text-[#0f4851]">
                        {selectedOrder.customerType === "business" ? "Geschäftskunde" : "Privatkunde"}
                      </span>
                    </div>
                    {selectedOrder.companyName && (
                      <div className="flex items-center gap-3 p-3 text-sm">
                        <Building className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <span className="text-[#1a1c1c]">{selectedOrder.companyName}</span>
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-3 p-3 text-sm">
                        <Mail className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <a href={`mailto:${selectedOrder.customerEmail}`} className="text-[#00A8BC] hover:underline font-bold break-all">
                          {selectedOrder.customerEmail}
                        </a>
                      </div>
                    )}
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-3 p-3 text-sm">
                        <Phone className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <a href={`tel:${selectedOrder.customerPhone}`} className="text-[#00A8BC] hover:underline font-bold tabular-nums">
                          {selectedOrder.customerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                {/* Order Items */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] mb-3 flex items-center gap-1.5">
                    <Package className="size-3.5" aria-hidden="true" />
                    Artikel
                  </h3>
                  <div className="bg-white border border-[#c8d3d5] p-4 space-y-3">
                    <ul className="text-xs text-[#1a1c1c] space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between border-b border-[#f0f2f3] pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-semibold">{item.quantity}× {item.productName}</span>
                            <br/>
                            <span className="text-[10px] text-[#505c5f]">
                              {formatContainerType(item.variantType)} à {formatPrice(item.unitPrice)}
                            </span>
                          </div>
                          <span className="font-bold text-[#0f4851] tabular-nums mt-1">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </li>
                      ))}
                      {selectedOrder.rentalItems && selectedOrder.rentalItems.map((rental, rIdx) => (
                        <li key={`rental-${rIdx}`} className="flex justify-between items-start border border-[#00A8BC]/40 bg-[#f0f7f8] p-2 rounded-none">
                          <div>
                            <span className="font-bold text-[#0f4851] flex items-center gap-1.5">
                              <Wrench className="size-3 text-[#00A8BC]" aria-hidden="true" />
                              1× {rental.rentalName}
                            </span>
                            <span className="text-[10px] text-[#505c5f] block mt-0.5 font-medium">
                              {rental.depositCents > 0 
                                ? `Mietgerät (zzgl. ${formatPrice(rental.depositCents)} Kaution vor Ort)` 
                                : "Mietgerät (ohne Kaution)"}
                            </span>
                          </div>
                          <span className="font-bold text-[#0f4851] tabular-nums mt-0.5">
                            {formatPrice(rental.rentalPriceCents)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between border-t border-[#c8d3d5] pt-3 text-sm font-bold">
                      <span className="text-[#505c5f] uppercase tracking-wider text-xs mt-0.5">Gesamt</span>
                      <span className="text-[#0f4851] tabular-nums text-base">{formatPrice(calculateTotal(selectedOrder))}</span>
                    </div>
                  </div>
                </section>

                {/* Delete Section */}
                <section className="border-t border-[#c8d3d5] pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-destructive mb-3 flex items-center gap-1.5">
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Gefahrenzone
                  </h3>
                  <div className="bg-white border border-destructive/30 p-4">
                    <p className="text-xs text-[#505c5f] mb-3">
                      Das Löschen dieser Bestellung entfernt sie unwiderruflich aus der Datenbank.
                      Statistiken könnten dadurch beeinflusst werden.
                    </p>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="w-full rounded-none border-destructive text-destructive hover:bg-destructive hover:text-white font-bold uppercase tracking-wider text-xs h-9 transition-colors duration-150"
                      >
                        <Trash2 className="size-3.5 mr-1.5" aria-hidden="true" />
                        Bestellung löschen
                      </Button>
                      <AlertDialogContent className="rounded-none border-[#c8d3d5]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
                            Bestellung löschen?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-[#505c5f]">
                            Möchten Sie die Bestellung <strong>#{selectedOrder.id.slice(0, 8)}</strong> von <strong className="text-[#1a1c1c]">{selectedOrder.customerName}</strong> endgültig löschen?
                            <br /><br />
                            <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            className="rounded-none border-[#c8d3d5] font-bold uppercase tracking-wider text-xs"
                            disabled={deleting}
                          >
                            Abbrechen
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteOrder}
                            disabled={deleting}
                            className="rounded-none bg-destructive hover:bg-destructive/90 text-white font-bold uppercase tracking-wider text-xs"
                          >
                            {deleting ? (
                              <Loader2 className="size-3.5 animate-spin mr-1" aria-hidden="true" />
                            ) : (
                              <Trash2 className="size-3.5 mr-1" aria-hidden="true" />
                            )}
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </section>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
