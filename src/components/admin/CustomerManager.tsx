"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, Order, AdminNote } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar as CalendarIcon,
  Trash2,
  Loader2,
  Users,
  Package,
  StickyNote,
  Save,
  ChevronRight,
} from "lucide-react";
import { formatContainerType, formatPrice } from "@/lib/utils";
import { deleteCustomer } from "@/app/actions/deleteCustomer";
import { toast } from "sonner";

export function CustomerManager() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load registered customers (non-anonymous)
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("isAnonymous", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCustomers: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        fetchedCustomers.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      // Sort alphabetically by displayName
      fetchedCustomers.sort((a, b) => {
        const nameA = (a.displayName || a.email || "").toLowerCase();
        const nameB = (b.displayName || b.email || "").toLowerCase();
        return nameA.localeCompare(nameB, "de");
      });
      setCustomers(fetchedCustomers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load customer orders when detail sheet opens
  const loadCustomerOrders = useCallback(async (uid: string) => {
    setOrdersLoading(true);
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      orders.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setCustomerOrders(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      setCustomerOrders([]);
    }
    setOrdersLoading(false);
  }, []);

  // Load admin notes from separate collection
  const loadAdminNotes = useCallback(async (uid: string) => {
    try {
      const noteDoc = await getDoc(doc(db, "adminNotes", uid));
      if (noteDoc.exists()) {
        setAdminNotes((noteDoc.data() as AdminNote).notes || "");
      } else {
        setAdminNotes("");
      }
    } catch (error) {
      console.error("Error fetching admin notes:", error);
      setAdminNotes("");
    }
  }, []);

  const handleSelectCustomer = useCallback((customer: UserProfile) => {
    setSelectedCustomer(customer);
    setSheetOpen(true);
    setNotesSaved(false);
    loadCustomerOrders(customer.uid);
    loadAdminNotes(customer.uid);
  }, [loadCustomerOrders, loadAdminNotes]);

  const handleSaveNotes = useCallback(async () => {
    if (!selectedCustomer) return;
    setNotesSaving(true);
    try {
      await setDoc(doc(db, "adminNotes", selectedCustomer.uid), {
        uid: selectedCustomer.uid,
        notes: adminNotes,
        updatedAt: Timestamp.now(),
      });
      setNotesSaved(true);
      toast.success("Anmerkungen gespeichert.");
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
      notesTimeoutRef.current = setTimeout(() => setNotesSaved(false), 2500);
    } catch (error) {
      console.error("Error saving admin notes:", error);
      toast.error("Fehler beim Speichern der Anmerkungen.");
    }
    setNotesSaving(false);
  }, [selectedCustomer, adminNotes]);

  const handleDeleteCustomer = useCallback(async () => {
    if (!selectedCustomer) return;
    setDeleting(true);
    try {
      const result = await deleteCustomer(selectedCustomer.uid);
      if (result.success) {
        toast.success(`Kunde „${selectedCustomer.displayName || selectedCustomer.email || "Konto"}“ wurde gelöscht.`);
        setDeleteDialogOpen(false);
        setSheetOpen(false);
        setSelectedCustomer(null);
      } else {
        toast.error(result.error || "Fehler beim Löschen des Kunden.");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
    }
    setDeleting(false);
  }, [selectedCustomer]);


  // Filter customers by search query
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phoneNumber || "").toLowerCase().includes(q) ||
      (c.companyName || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "–";
    try {
      const ts = timestamp as { toMillis: () => number };
      return new Date(ts.toMillis()).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "–";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Offen";
      case "ready": return "Abholbereit";
      case "completed": return "Abgeschlossen";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-[#0f4851] text-white";
      case "ready": return "bg-[#00A8BC] text-white";
      case "completed": return "bg-[#c8d3d5] text-[#0f4851]";
      default: return "bg-[#eeeeee] text-[#505c5f]";
    }
  };

  if (loading) {
    return (
      <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
        <Loader2 className="size-6 mx-auto animate-spin text-[#00A8BC] mb-3" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Lade Kunden…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#505c5f]" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Kunden durchsuchen (Name, E-Mail, Telefon)…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-none border-[#c8d3d5] bg-white text-sm font-medium text-[#1a1c1c] placeholder:text-[#505c5f]/60 h-10"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Customer Count */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#505c5f]">
        <Users className="size-4" aria-hidden="true" />
        <span className="tabular-nums">{filteredCustomers.length} {filteredCustomers.length === 1 ? "Kunde" : "Kunden"}</span>
        {searchQuery && <span className="font-normal normal-case tracking-normal">für „{searchQuery}"</span>}
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
          <Users className="size-12 mx-auto text-[#c8d3d5] mb-3" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
            {searchQuery ? "Keine Kunden für diese Suche gefunden." : "Noch keine registrierten Kunden vorhanden."}
          </p>
        </div>
      ) : (
        <div className="border border-[#c8d3d5] bg-white divide-y divide-[#c8d3d5]">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.uid}
              onClick={() => handleSelectCustomer(customer)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#f9f9f9] transition-colors duration-150 group"
            >
              {/* Avatar */}
              <div className="size-10 shrink-0 rounded-full bg-[#0f4851]/10 flex items-center justify-center">
                <User className="size-5 text-[#0f4851]" aria-hidden="true" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-sm uppercase tracking-wide text-[#0f4851] truncate">
                    {customer.displayName || "Unbenannt"}
                  </p>
                  {customer.customerType === "business" && (
                    <span className="shrink-0 rounded-none px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#0f4851]/10 text-[#0f4851]">
                      Geschäftskunde
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-[#505c5f]">
                  {customer.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="size-3 shrink-0" aria-hidden="true" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phoneNumber && (
                    <span className="flex items-center gap-1 shrink-0 tabular-nums">
                      <Phone className="size-3" aria-hidden="true" />
                      {customer.phoneNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="size-4 text-[#c8d3d5] group-hover:text-[#0f4851] transition-colors duration-150 shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {/* Customer Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-[#f9f9f9] border-l border-[#c8d3d5] rounded-none p-0">
          {selectedCustomer && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pb-4 bg-white border-b border-[#c8d3d5]">
                <SheetTitle className="font-heading text-xl uppercase tracking-wide text-[#0f4851]">
                  {selectedCustomer.displayName || "Unbenannt"}
                </SheetTitle>
                <SheetDescription className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">
                  {selectedCustomer.customerType === "business" ? "Geschäftskunde" : "Privatkunde"} · Registriert seit {formatDate(selectedCustomer.createdAt)}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Details */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] mb-3 flex items-center gap-1.5">
                    <User className="size-3.5" aria-hidden="true" />
                    Kontaktdaten
                  </h3>
                  <div className="bg-white border border-[#c8d3d5] divide-y divide-[#c8d3d5]">
                    {selectedCustomer.companyName && (
                      <div className="flex items-center gap-3 p-3 text-sm">
                        <Building className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-[#1a1c1c]">{selectedCustomer.companyName}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3 p-3 text-sm">
                        <Mail className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <a href={`mailto:${selectedCustomer.email}`} className="text-[#00A8BC] hover:underline font-bold break-all">
                          {selectedCustomer.email}
                        </a>
                      </div>
                    )}
                    {selectedCustomer.phoneNumber && (
                      <div className="flex items-center gap-3 p-3 text-sm">
                        <Phone className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <a href={`tel:${selectedCustomer.phoneNumber}`} className="text-[#00A8BC] hover:underline font-bold tabular-nums">
                          {selectedCustomer.phoneNumber}
                        </a>
                      </div>
                    )}
                    {(selectedCustomer.street || selectedCustomer.city) && (
                      <div className="flex items-start gap-3 p-3 text-sm">
                        <MapPin className="size-4 text-[#00A8BC] shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-[#1a1c1c]">
                          {selectedCustomer.street} {selectedCustomer.houseNumber}
                          {(selectedCustomer.street || selectedCustomer.houseNumber) && <br />}
                          {selectedCustomer.zipCode} {selectedCustomer.city}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 text-sm">
                      <CalendarIcon className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                      <span className="text-[#505c5f] tabular-nums">Registriert: {formatDate(selectedCustomer.createdAt)}</span>
                    </div>
                  </div>
                </section>

                {/* Admin Notes (separate collection) */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] mb-3 flex items-center gap-1.5">
                    <StickyNote className="size-3.5" aria-hidden="true" />
                    Interne Anmerkungen
                  </h3>
                  <div className="bg-white border border-[#c8d3d5] p-3 space-y-2">
                    <textarea
                      value={adminNotes}
                      onChange={(e) => {
                        setAdminNotes(e.target.value);
                        setNotesSaved(false);
                      }}
                      placeholder="Interne Notizen zu diesem Kunden…"
                      rows={4}
                      className="w-full text-sm text-[#1a1c1c] bg-[#f9f9f9] border border-[#c8d3d5] p-3 resize-y focus:outline-none focus:border-[#00A8BC] focus:ring-1 focus:ring-[#00A8BC]/30 placeholder:text-[#505c5f]/50 rounded-none"
                      spellCheck={true}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#505c5f] uppercase tracking-wider">
                        Nur für Admins sichtbar – nicht für den Kunden
                      </p>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={notesSaving}
                        className={`rounded-none text-xs font-bold uppercase tracking-wider h-8 px-4 transition-colors duration-150 ${
                          notesSaved
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-[#0f4851] hover:bg-[#174e56] text-white"
                        }`}
                      >
                        {notesSaving ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : notesSaved ? (
                          <>✓ Gespeichert</>
                        ) : (
                          <>
                            <Save className="size-3.5 mr-1" aria-hidden="true" />
                            Speichern
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Order History */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] mb-3 flex items-center gap-1.5">
                    <Package className="size-3.5" aria-hidden="true" />
                    Bestellhistorie
                  </h3>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-[#00A8BC]" aria-hidden="true" />
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="bg-white border border-dashed border-[#c8d3d5] p-6 text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                        Keine Bestellungen vorhanden.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="bg-white border border-[#c8d3d5] p-4 space-y-3">
                          {/* Order header */}
                          <div className="flex items-center justify-between">
                            <span className={`rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                            <span className="text-[11px] font-bold text-[#505c5f] tabular-nums">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>

                          {/* Order items */}
                          <ul className="text-xs text-[#1a1c1c] space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between border-b border-[#f0f2f3] pb-1 last:border-0">
                                <span>
                                  {item.quantity}× {item.productName}{" "}
                                  <span className="text-[10px] text-[#505c5f]">
                                    ({formatContainerType(item.variantType)})
                                  </span>
                                </span>
                                <span className="font-bold text-[#0f4851] tabular-nums">
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {/* Order total */}
                          {order.grandTotalCents != null && (
                            <div className="flex justify-between border-t border-[#c8d3d5] pt-2 text-xs font-bold">
                              <span className="text-[#505c5f] uppercase tracking-wider">Gesamt</span>
                              <span className="text-[#0f4851] tabular-nums">{formatPrice(order.grandTotalCents)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Delete Section */}
                <section className="border-t border-[#c8d3d5] pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-destructive mb-3 flex items-center gap-1.5">
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Gefahrenzone
                  </h3>
                  <div className="bg-white border border-destructive/30 p-4">
                    <p className="text-xs text-[#505c5f] mb-3">
                      Das Löschen eines Kunden entfernt den Firebase-Account, alle Profildaten und interne Anmerkungen unwiderruflich.
                      Bestellungen bleiben zur Nachverfolgung erhalten.
                    </p>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="w-full rounded-none border-destructive text-destructive hover:bg-destructive hover:text-white font-bold uppercase tracking-wider text-xs h-9 transition-colors duration-150"
                      >
                        <Trash2 className="size-3.5 mr-1.5" aria-hidden="true" />
                        Kunden endgültig löschen
                      </Button>
                      <AlertDialogContent className="rounded-none border-[#c8d3d5]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
                            Kunden löschen?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-[#505c5f]">
                            Möchten Sie <strong className="text-[#1a1c1c]">{selectedCustomer.displayName || selectedCustomer.email}</strong> endgültig löschen?
                            <br /><br />
                            Diese Aktion entfernt den Firebase-Account, alle Profildaten und interne Anmerkungen. <strong>Sie kann nicht rückgängig gemacht werden.</strong>
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
                            onClick={handleDeleteCustomer}
                            disabled={deleting}
                            className="rounded-none bg-destructive hover:bg-destructive/90 text-white font-bold uppercase tracking-wider text-xs"
                          >
                            {deleting ? (
                              <Loader2 className="size-3.5 animate-spin mr-1" aria-hidden="true" />
                            ) : (
                              <Trash2 className="size-3.5 mr-1" aria-hidden="true" />
                            )}
                            Endgültig löschen
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
