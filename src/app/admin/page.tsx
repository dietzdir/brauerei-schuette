"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { formatContainerType, formatPrice } from "@/lib/utils";
import { Phone, Mail, MapPin, Building, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CatalogManager = dynamic(
  () => import("@/components/admin/CatalogManager").then((mod) => mod.CatalogManager),
  {
    loading: () => (
      <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
        <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Lade Katalog-Manager…</p>
      </div>
    ),
  }
);

const OpeningHoursManager = dynamic(
  () => import("@/components/admin/OpeningHoursManager").then((mod) => mod.OpeningHoursManager),
  {
    loading: () => (
      <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
        <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Lade Öffnungszeiten-Manager…</p>
      </div>
    ),
  }
);

const CustomerManager = dynamic(
  () => import("@/components/admin/CustomerManager").then((mod) => mod.CustomerManager),
  {
    loading: () => (
      <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
        <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Lade Kundenverwaltung…</p>
      </div>
    ),
  }
);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Note: The middleware protects the route from unauthenticated users,
    // but we can also ensure the query works. Since this is an admin query,
    // Firestore rules should allow reads where admin == true.
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "ready"])
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
      console.error("Error fetching pending orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "ready" | "completed") => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Fehler beim Aktualisieren des Status.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const generateMailtoLink = (order: Order) => {
    const subject = encodeURIComponent(`Ihre Reservierung #${order.id.slice(0, 8).toUpperCase()} bei Brauerei Schütte`);
    const dateStr = new Date(order.createdAt.toMillis()).toLocaleString("de-DE", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    
    let body = `Hallo ${order.customerName},\n\n`;
    body += `vielen Dank für Ihre Reservierung vom ${dateStr} Uhr.\n\n`;
    if (order.pickupDate) {
      body += `Gewünschter Abholtermin: ${order.pickupDate}${order.pickupTime ? ` (${order.pickupTime})` : ""}\n\n`;
    }
    body += `Ihre bestellten Artikel:\n`;
    order.items.forEach(item => {
      body += `- ${item.quantity}x ${item.productName} (${formatContainerType(item.variantType)})\n`;
    });
    body += `\nWir freuen uns auf Ihren Besuch!\n\n`;
    body += `Viele Grüße\nIhr Team der Brauerei Schütte`;
    
    return `mailto:${order.customerEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9]">
        <p className="font-heading uppercase tracking-wider text-lg text-[#0f4851]">Lade Bestellungen…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="container mx-auto p-4 py-8 md:p-8 max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#c8d3d5] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#0f4851]/10 text-[#0f4851] text-xs font-bold uppercase tracking-widest mb-1">
              Brauerei-Verwaltung
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wide text-[#0f4851]">Admin Dashboard</h1>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">Verwalte Bestellungen, Kunden, deinen Produkt-Katalog und Sonderöffnungszeiten.</p>
          </div>
          <Button variant="outline" className="rounded-none border-[#c8d3d5] bg-white text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee]" onClick={handleLogout}>
            Abmelden
          </Button>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-4 bg-[#eeeeee] border border-[#c8d3d5] rounded-none p-1">
            <TabsTrigger value="orders" className="rounded-none font-bold uppercase tracking-wider text-xs data-[state=active]:bg-[#0f4851] data-[state=active]:text-white transition-colors">Bestellungen</TabsTrigger>
            <TabsTrigger value="customers" className="rounded-none font-bold uppercase tracking-wider text-xs data-[state=active]:bg-[#0f4851] data-[state=active]:text-white transition-colors">Kunden</TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-none font-bold uppercase tracking-wider text-xs data-[state=active]:bg-[#0f4851] data-[state=active]:text-white transition-colors">Katalog</TabsTrigger>
            <TabsTrigger value="hours" className="rounded-none font-bold uppercase tracking-wider text-xs data-[state=active]:bg-[#0f4851] data-[state=active]:text-white transition-colors">Öffnungszeiten</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {orders.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
            <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Keine ausstehenden Reservierungen gefunden.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col justify-between rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      order.status === "ready" 
                        ? "bg-[#00A8BC] text-white" 
                        : "bg-[#0f4851] text-white"
                    }`}>
                      {order.status === "pending" ? "OFFEN" : order.status === "ready" ? "ABHOLBEREIT" : "ABGESCHLOSSEN"}
                    </span>
                    <span className="text-[11px] font-bold text-[#505c5f] tabular-nums">
                      {new Date(order.createdAt.toMillis()).toLocaleString("de-DE")}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="mb-1 font-heading text-xl uppercase tracking-wide text-[#0f4851]">{order.customerName}</h3>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#505c5f]">Typ: {order.customerType === "business" ? "🏢 Geschäftskunde" : "👤 Privatkunde"}</p>
                    
                    {order.pickupDate && (
                      <div className="mb-3 p-3 rounded-none bg-[#f9f9f9] border border-[#c8d3d5] flex items-center gap-2 text-xs font-bold text-[#0f4851]">
                        <Calendar className="size-4 text-[#00A8BC] shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">Abholung: {order.pickupDate} {order.pickupTime ? `(${order.pickupTime})` : ""}</span>
                      </div>
                    )}

                    <div className="space-y-2 rounded-none bg-[#f9f9f9] p-3 text-xs text-[#505c5f] border border-[#c8d3d5]">
                      {order.companyName && (
                        <div className="flex items-start gap-2 font-semibold text-[#1a1c1c]">
                          <Building className="mt-0.5 size-4 shrink-0 text-[#00A8BC]" aria-hidden="true" />
                          <span>{order.companyName}</span>
                        </div>
                      )}
                      {(order.street || order.city) && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-[#00A8BC]" aria-hidden="true" />
                          <span>
                            {order.street} {order.houseNumber}
                            <br />
                            {order.zipCode} {order.city}
                          </span>
                        </div>
                      )}
                      {order.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 shrink-0 text-[#00A8BC]" aria-hidden="true" />
                          <a href={`tel:${order.customerPhone}`} className="text-[#00A8BC] hover:underline font-bold tabular-nums">
                            {order.customerPhone}
                          </a>
                        </div>
                      )}
                      {order.customerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="size-4 shrink-0 text-[#00A8BC]" aria-hidden="true" />
                          <a href={generateMailtoLink(order)} className="text-[#00A8BC] hover:underline font-bold break-all">
                            {order.customerEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f4851]">Artikel:</h4>
                    <ul className="text-xs text-[#1a1c1c] space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between border-b border-[#c8d3d5] pb-1 last:border-0">
                          <span>{item.quantity}x {item.productName} <span className="text-[10px] text-[#505c5f]">({formatContainerType(item.variantType)})</span></span>
                          <span className="font-bold text-[#0f4851] tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col gap-2 border-t border-[#c8d3d5] pt-4">
                  {order.status === "pending" ? (
                    <Button 
                      className="w-full bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-9 shadow-xs" 
                      onClick={() => updateOrderStatus(order.id, "ready")}
                    >
                      Als Abholbereit markieren
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full rounded-none border-[#c8d3d5] bg-white text-[#0f4851] hover:bg-[#eeeeee] font-bold uppercase tracking-wider text-xs h-9" 
                      onClick={() => updateOrderStatus(order.id, "pending")}
                    >
                      Zurück auf OFFEN setzen
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="w-full rounded-none border-[#0f4851] bg-[#0f4851] text-white hover:bg-[#174e56] font-bold uppercase tracking-wider text-xs h-9" 
                    onClick={() => updateOrderStatus(order.id, "completed")}
                  >
                    Als Abgeschlossen markieren
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManager />
          </TabsContent>

          <TabsContent value="catalog">
            <CatalogManager />
          </TabsContent>

          <TabsContent value="hours">
            <OpeningHoursManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


