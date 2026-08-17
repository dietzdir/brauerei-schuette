"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Order } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, PackageCheck, History, Calendar } from "lucide-react";
import { formatContainerType, formatPrice, formatOrderDateTime, getOrderTimestamp } from "@/lib/utils";

interface OrdersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function sortOrders(list: Order[]): Order[] {
  return [...list].sort((a, b) => {
    const timeA = getOrderTimestamp(a.createdAt, a.id);
    const timeB = getOrderTimestamp(b.createdAt, b.id);
    return timeB - timeA;
  });
}

export function OrdersDrawer({ open, onOpenChange }: OrdersDrawerProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersMap = new Map<string, Order>();

    const updateAndSetOrders = () => {
      const merged = Array.from(ordersMap.values());
      const sorted = sortOrders(merged);
      setOrders(sorted);
      setLoading(false);
    };

    // 1. Load locally cached orders first
    try {
      const cached = localStorage.getItem("schuette_user_orders");
      if (cached) {
        const localList: Order[] = JSON.parse(cached);
        localList.forEach((o) => {
          if (o && o.id) {
            ordersMap.set(o.id, o);
          }
        });
        updateAndSetOrders();
      }
    } catch (e) {
      console.warn("Could not read local order cache:", e);
    }

    const unsubscribes: (() => void)[] = [];

    // 2. Query orders for current user by UID
    try {
      const qUser = query(
        collection(db, "orders"),
        where("userId", "==", user.uid)
      );

      const unUser = onSnapshot(
        qUser,
        (snapshot) => {
          snapshot.forEach((doc) => {
            ordersMap.set(doc.id, { id: doc.id, ...(doc.data() as Omit<Order, "id">) });
          });
          updateAndSetOrders();
        },
        (err) => {
          console.warn("Could not listen to user orders:", err);
          updateAndSetOrders();
        }
      );
      unsubscribes.push(unUser);
    } catch (e) {
      console.error("Orders listener error:", e);
    }

    // 3. Also query orders by customerEmail if user is authenticated with email
    if (user.email) {
      try {
        const qEmail = query(
          collection(db, "orders"),
          where("customerEmail", "==", user.email.toLowerCase())
        );

        const unEmail = onSnapshot(
          qEmail,
          (snapshot) => {
            snapshot.forEach((doc) => {
              ordersMap.set(doc.id, { id: doc.id, ...(doc.data() as Omit<Order, "id">) });
            });
            updateAndSetOrders();
          },
          (err) => {
            console.warn("Could not listen to email orders:", err);
            updateAndSetOrders();
          }
        );
        unsubscribes.push(unEmail);
      } catch (e) {
        console.error("Email orders listener error:", e);
      }
    }

    return () => {
      unsubscribes.forEach((un) => un());
    };
  }, [open, user]);

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-white text-[#0f4851] border-[#c8d3d5] flex items-center gap-1 text-[11px] font-bold uppercase rounded-none">
            <Clock className="size-3 text-[#00A8BC]" />
            In Bearbeitung
          </Badge>
        );
      case "ready":
        return (
          <Badge variant="outline" className="bg-[#00A8BC]/15 text-[#0f4851] border-[#00A8BC] flex items-center gap-1 text-[11px] font-bold uppercase rounded-none">
            <PackageCheck className="size-3 text-[#00A8BC]" />
            Abholbereit
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-[#0f4851] text-white border-[#0f4851] flex items-center gap-1 text-[11px] font-bold uppercase rounded-none">
            <CheckCircle2 className="size-3 text-white" />
            Abgeschlossen
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-[#f9f9f9] p-6 rounded-none border-l border-[#c8d3d5]">
        <SheetHeader className="pb-4 border-b border-[#c8d3d5] pr-8">
          <div className="flex items-center gap-2">
            <History className="size-5 text-[#00A8BC]" />
            <SheetTitle className="font-heading text-xl sm:text-2xl uppercase tracking-wider text-[#0f4851]">Ihre Reservierungen</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-[#505c5f]">
            Übersicht aller getätigten Vorbestellungen und deren Status.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#505c5f] space-y-2">
              <Clock className="size-8 animate-spin text-[#00A8BC]" />
              <p className="text-xs font-bold uppercase tracking-wider">Reservierungen werden geladen...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-[#505c5f] space-y-3">
              <History className="size-12 mx-auto text-[#c8d3d5]" />
              <p className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">Keine Reservierungen gefunden</p>
              <p className="text-xs">
                Sie haben bisher noch keine Vorbestellungen aufgegeben oder sind als Gast unterwegs.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const itemsSum =
                order.itemsTotalCents ??
                order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

              const depositSum =
                order.depositTotalCents ??
                order.items.reduce(
                  (sum, item) => sum + (item.depositPrice || 0) * item.quantity,
                  0
                );

              const grandSum = order.grandTotalCents ?? itemsSum + depositSum;
              const orderDate = formatOrderDateTime(order.createdAt, order.id);

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-none border border-[#c8d3d5] bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-[#505c5f] block font-bold">
                        Bestell-Nr: #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs text-[#505c5f]">{orderDate}</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="text-xs text-[#505c5f]">
                    Besteller: <strong className="text-[#1a1c1c]">{order.customerName}</strong> (
                    {order.customerType === "business" ? "Geschäftskunde" : "Privatkunde"})
                  </div>

                  {order.pickupDate && (
                    <div className="p-2.5 rounded-none bg-[#f9f9f9] border border-[#c8d3d5] flex items-center gap-2 text-xs font-bold text-[#0f4851]">
                      <Calendar className="size-3.5 text-[#00A8BC] shrink-0" />
                      <span>Abholtermin: {order.pickupDate} {order.pickupTime ? `(${order.pickupTime})` : ""}</span>
                    </div>
                  )}

                  <Separator className="border-[#c8d3d5]" />

                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-[#1a1c1c] font-medium">
                          {item.quantity}x {item.productName}{" "}
                          <span className="text-[#505c5f]">
                            ({formatContainerType(item.variantType)})
                          </span>
                        </span>
                        <span className="font-bold text-[#0f4851]">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {depositSum > 0 && (
                    <div className="flex justify-between text-xs text-[#00A8BC]">
                      <span>Pfand (Gebinde/Flaschen):</span>
                      <span className="font-bold">+ {formatPrice(depositSum)}</span>
                    </div>
                  )}

                  <Separator className="border-[#c8d3d5]" />

                  <div className="flex justify-between items-center font-bold text-xs pt-1">
                    <span className="uppercase tracking-wider text-[#505c5f]">Gesamtsumme:</span>
                    <span className="font-heading text-xl text-[#0f4851]">
                      {formatPrice(grandSum)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
