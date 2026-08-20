"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { de } from "date-fns/locale";
import { DateRange } from "react-day-picker";

type TimePreset = "7d" | "30d" | "90d" | "ytd" | "all" | "custom";

const STATUS_COLORS = {
  pending: "#0f4851",
  ready: "#00A8BC",
  completed: "#8a9a9d",
};

export function StatisticsManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Subscribe to ALL orders (including completed) in realtime
  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        // Sort descending by date
        fetched.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
          return tB - tA;
        });
        setOrders(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading orders for statistics:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Calculate start & end dates based on active preset
  const dateInterval = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (preset === "custom" && customRange?.from) {
      const from = new Date(customRange.from);
      from.setHours(0, 0, 0, 0);
      const to = customRange.to
        ? new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate(), 23, 59, 59, 999)
        : new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate(), 23, 59, 59, 999);
      return { from, to };
    }

    if (preset === "7d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to: end };
    }

    if (preset === "30d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to: end };
    }

    if (preset === "90d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 89);
      from.setHours(0, 0, 0, 0);
      return { from, to: end };
    }

    if (preset === "ytd") {
      const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { from, to: end };
    }

    // "all"
    return { from: new Date(0), to: new Date(8640000000000000) };
  }, [preset, customRange]);

  // Filter orders by date interval
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = order.createdAt?.toDate
        ? order.createdAt.toDate()
        : order.createdAt?.toMillis
        ? new Date(order.createdAt.toMillis())
        : new Date(order.createdAt);
      return orderDate >= dateInterval.from && orderDate <= dateInterval.to;
    });
  }, [orders, dateInterval]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenueCents = filteredOrders.reduce((sum, o) => {
      return sum + (o.grandTotalCents || o.itemsTotalCents || 0);
    }, 0);

    const avgOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

    const uniqueCustomers = new Set<string>();
    filteredOrders.forEach((o) => {
      if (o.customerEmail) {
        uniqueCustomers.add(o.customerEmail.toLowerCase().trim());
      } else if (o.userId) {
        uniqueCustomers.add(o.userId);
      } else {
        uniqueCustomers.add(o.customerName.toLowerCase().trim());
      }
    });

    return {
      totalRevenueCents,
      totalOrders,
      avgOrderValueCents,
      totalCustomers: uniqueCustomers.size,
    };
  }, [filteredOrders]);

  // Chart 1: Product Ranking (Renner & Penner)
  const productRankingData = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenueCents: number }>();

    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = item.productName || "Unbekannt";
        const existing = productMap.get(key) || { name: key, quantity: 0, revenueCents: 0 };
        existing.quantity += item.quantity || 1;
        existing.revenueCents += (item.unitPrice || 0) * (item.quantity || 1);
        productMap.set(key, existing);
      });
    });

    const list = Array.from(productMap.values());
    list.sort((a, b) => b.quantity - a.quantity);
    return list.slice(0, 8); // Top 8
  }, [filteredOrders]);

  // Chart 2: Revenue Trend over Time
  const revenueTrendData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const map = new Map<string, { dateLabel: string; sortKey: string; revenueEur: number; ordersCount: number }>();

    // Determine grouping granularity based on days difference
    const diffDays = Math.ceil(
      (dateInterval.to.getTime() - dateInterval.from.getTime()) / (1000 * 60 * 60 * 24)
    );

    filteredOrders.forEach((order) => {
      const d = order.createdAt?.toDate
        ? order.createdAt.toDate()
        : order.createdAt?.toMillis
        ? new Date(order.createdAt.toMillis())
        : new Date(order.createdAt);

      let key: string;
      let label: string;

      if (diffDays <= 35) {
        // Daily grouping (DD.MM.)
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        key = `${y}-${m}-${day}`;
        label = `${day}.${m}.`;
      } else if (diffDays <= 180) {
        // Weekly grouping
        const y = d.getFullYear();
        const firstDayOfYear = new Date(y, 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${y}-W${String(weekNum).padStart(2, "0")}`;
        label = `KW ${weekNum}`;
      } else {
        // Monthly grouping (MM/YY)
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        key = `${y}-${m}`;
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        label = `${monthNames[d.getMonth()]} '${String(y).slice(-2)}`;
      }

      const revEur = ((order.grandTotalCents || order.itemsTotalCents || 0) / 100);
      const existing = map.get(key) || { dateLabel: label, sortKey: key, revenueEur: 0, ordersCount: 0 };
      existing.revenueEur += revEur;
      existing.ordersCount += 1;
      map.set(key, existing);
    });

    const result = Array.from(map.values());
    result.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return result.map((r) => ({
      ...r,
      revenueEur: Number(r.revenueEur.toFixed(2)),
    }));
  }, [filteredOrders, dateInterval]);

  // Chart 3: Top Customers
  const topCustomersData = useMemo(() => {
    const customerMap = new Map<string, { name: string; orderCount: number; totalSpentEur: number }>();

    filteredOrders.forEach((order) => {
      const name = order.customerName?.trim() || "Gast";
      const key = order.customerEmail ? order.customerEmail.toLowerCase().trim() : name;

      const existing = customerMap.get(key) || { name, orderCount: 0, totalSpentEur: 0 };
      existing.orderCount += 1;
      existing.totalSpentEur += ((order.grandTotalCents || order.itemsTotalCents || 0) / 100);
      customerMap.set(key, existing);
    });

    const list = Array.from(customerMap.values());
    list.sort((a, b) => b.orderCount - a.orderCount || b.totalSpentEur - a.totalSpentEur);
    return list.slice(0, 8).map((c) => ({
      ...c,
      totalSpentEur: Number(c.totalSpentEur.toFixed(2)),
    }));
  }, [filteredOrders]);

  // Chart 4: Order Status Distribution
  const statusDistributionData = useMemo(() => {
    const counts = { pending: 0, ready: 0, completed: 0 };
    filteredOrders.forEach((o) => {
      if (o.status === "ready") counts.ready += 1;
      else if (o.status === "completed") counts.completed += 1;
      else counts.pending += 1;
    });

    return [
      { name: "Offen", value: counts.pending, color: STATUS_COLORS.pending, key: "pending" },
      { name: "Abholbereit", value: counts.ready, color: STATUS_COLORS.ready, key: "ready" },
      { name: "Abgeschlossen", value: counts.completed, color: STATUS_COLORS.completed, key: "completed" },
    ].filter((item) => item.value > 0);
  }, [filteredOrders]);

  const formatPresetLabel = () => {
    if (preset === "7d") return "Letzte 7 Tage";
    if (preset === "30d") return "Letzte 30 Tage";
    if (preset === "90d") return "Letzte 90 Tage";
    if (preset === "ytd") return "Dieses Jahr";
    if (preset === "all") return "Gesamter Zeitraum";
    if (preset === "custom" && customRange?.from) {
      const fromStr = customRange.from.toLocaleDateString("de-DE");
      const toStr = customRange.to ? customRange.to.toLocaleDateString("de-DE") : fromStr;
      return `${fromStr} – ${toStr}`;
    }
    return "Benutzerdefiniert";
  };

  if (loading) {
    return (
      <div className="rounded-none border border-dashed border-[#c8d3d5] p-12 text-center bg-white">
        <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Lade Statistiken…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-none border border-[#c8d3d5] bg-white p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-[#0f4851] shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
              Bestell- & Umsatzstatistiken
            </h2>
            <p className="text-[11px] font-bold text-[#505c5f] uppercase tracking-wider">
              Aktiver Zeitraum: <span className="text-[#0f4851]">{formatPresetLabel()}</span> ({filteredOrders.length} {filteredOrders.length === 1 ? "Bestellung" : "Bestellungen"})
            </p>
          </div>
        </div>

        {/* Filter Buttons & Datepicker */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPreset("7d")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              preset === "7d"
                ? "bg-[#0f4851] text-white"
                : "bg-[#f9f9f9] text-[#505c5f] hover:bg-[#eeeeee] border border-[#c8d3d5]"
            }`}
          >
            7 Tage
          </button>
          <button
            type="button"
            onClick={() => setPreset("30d")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              preset === "30d"
                ? "bg-[#0f4851] text-white"
                : "bg-[#f9f9f9] text-[#505c5f] hover:bg-[#eeeeee] border border-[#c8d3d5]"
            }`}
          >
            30 Tage
          </button>
          <button
            type="button"
            onClick={() => setPreset("90d")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              preset === "90d"
                ? "bg-[#0f4851] text-white"
                : "bg-[#f9f9f9] text-[#505c5f] hover:bg-[#eeeeee] border border-[#c8d3d5]"
            }`}
          >
            90 Tage
          </button>
          <button
            type="button"
            onClick={() => setPreset("ytd")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              preset === "ytd"
                ? "bg-[#0f4851] text-white"
                : "bg-[#f9f9f9] text-[#505c5f] hover:bg-[#eeeeee] border border-[#c8d3d5]"
            }`}
          >
            Dieses Jahr
          </button>
          <button
            type="button"
            onClick={() => setPreset("all")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              preset === "all"
                ? "bg-[#0f4851] text-white"
                : "bg-[#f9f9f9] text-[#505c5f] hover:bg-[#eeeeee] border border-[#c8d3d5]"
            }`}
          >
            Alle
          </button>

          {/* Custom Date Range Popover */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                preset === "custom"
                  ? "bg-[#00A8BC] text-white"
                  : "bg-[#f9f9f9] text-[#505c5f] hover:bg-[#eeeeee] border border-[#c8d3d5]"
              }`}
            >
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              <span>{preset === "custom" && customRange?.from ? "Eigener Zeitraum" : "Zeitraum wählen"}</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-white border border-[#c8d3d5] rounded-none shadow-lg" align="end">
              <div className="space-y-3">
                <div className="border-b border-[#c8d3d5] pb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0f4851]">
                    Benutzerdefinierten Datumsbereich wählen
                  </p>
                </div>
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={(range) => {
                    setCustomRange(range);
                    if (range?.from) {
                      setPreset("custom");
                    }
                  }}
                  locale={de}
                  numberOfMonths={2}
                  className="p-0"
                />
                <div className="flex justify-end gap-2 border-t border-[#c8d3d5] pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-[#c8d3d5] text-xs font-bold uppercase"
                    onClick={() => {
                      setCustomRange(undefined);
                      setPreset("30d");
                      setIsCalendarOpen(false);
                    }}
                  >
                    Zurücksetzen
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#0f4851] hover:bg-[#174e56] text-white rounded-none text-xs font-bold uppercase"
                    onClick={() => setIsCalendarOpen(false)}
                  >
                    Übernehmen
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Gesamtumsatz */}
        <div className="flex flex-col justify-between rounded-none border border-[#c8d3d5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Gesamtumsatz</span>
            <div className="p-2 bg-[#0f4851]/10 text-[#0f4851]">
              <DollarSign className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl lg:text-3xl text-[#0f4851] tabular-nums">
              {formatPrice(kpis.totalRevenueCents)}
            </div>
            <p className="text-[11px] font-semibold text-[#505c5f] mt-0.5">
              Im ausgewählten Zeitraum
            </p>
          </div>
        </div>

        {/* Card 2: Bestellungen */}
        <div className="flex flex-col justify-between rounded-none border border-[#c8d3d5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Bestellungen</span>
            <div className="p-2 bg-[#00A8BC]/10 text-[#00A8BC]">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl lg:text-3xl text-[#0f4851] tabular-nums">
              {kpis.totalOrders}
            </div>
            <p className="text-[11px] font-semibold text-[#505c5f] mt-0.5">
              Aufgegebene Reservierungen
            </p>
          </div>
        </div>

        {/* Card 3: Ø Bestellwert */}
        <div className="flex flex-col justify-between rounded-none border border-[#c8d3d5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Ø Bestellwert</span>
            <div className="p-2 bg-[#0f4851]/10 text-[#0f4851]">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl lg:text-3xl text-[#0f4851] tabular-nums">
              {formatPrice(kpis.avgOrderValueCents)}
            </div>
            <p className="text-[11px] font-semibold text-[#505c5f] mt-0.5">
              Pro Bestellung
            </p>
          </div>
        </div>

        {/* Card 4: Aktive Kunden */}
        <div className="flex flex-col justify-between rounded-none border border-[#c8d3d5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Aktive Kunden</span>
            <div className="p-2 bg-[#00A8BC]/10 text-[#00A8BC]">
              <Users className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl lg:text-3xl text-[#0f4851] tabular-nums">
              {kpis.totalCustomers}
            </div>
            <p className="text-[11px] font-semibold text-[#505c5f] mt-0.5">
              Eindeutige Besteller
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid (2x2) */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-none border border-dashed border-[#c8d3d5] p-16 text-center bg-white">
          <BarChart3 className="mx-auto size-10 text-[#8a9a9d] mb-3" aria-hidden="true" />
          <h3 className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
            Keine Daten für diesen Zeitraum
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#505c5f] mt-1">
            Wähle einen anderen Zeitraum oder erstelle neue Bestellungen, um Auswertungen zu sehen.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-none border-[#0f4851] text-[#0f4851] font-bold uppercase tracking-wider text-xs"
            onClick={() => setPreset("all")}
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Gesamten Zeitraum anzeigen
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Chart 1: Renner & Penner (Produkt-Ranking) */}
          <div className="rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#c8d3d5] pb-3 mb-4">
                <div>
                  <h3 className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
                    Renner & Penner
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#505c5f]">
                    Meistverkaufte Produkte (nach Stückzahl)
                  </p>
                </div>
                <Package className="size-5 text-[#00A8BC]" aria-hidden="true" />
              </div>

              {productRankingData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#505c5f]">
                  Keine Produktdaten vorhanden
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productRankingData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e9ea" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#505c5f" }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11, fill: "#1a1c1c" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #c8d3d5",
                          borderRadius: 0,
                          fontSize: "12px",
                        }}
                        formatter={(value: any) => [`${value} Stück`, "Menge"]}
                      />
                      <Bar dataKey="quantity" fill="#0f4851" radius={[0, 2, 2, 0]} name="Stückzahl" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5e9ea] text-[11px] text-[#505c5f] flex justify-between font-semibold">
              <span>Top-Verkaufshit: <strong className="text-[#0f4851]">{productRankingData[0]?.name || "-"}</strong></span>
              <span>{productRankingData[0]?.quantity || 0} Einheiten</span>
            </div>
          </div>

          {/* Chart 2: Umsatzverlauf */}
          <div className="rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#c8d3d5] pb-3 mb-4">
                <div>
                  <h3 className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
                    Umsatzverlauf
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#505c5f]">
                    Entwicklung über den Zeitverlauf (€)
                  </p>
                </div>
                <TrendingUp className="size-5 text-[#00A8BC]" aria-hidden="true" />
              </div>

              {revenueTrendData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#505c5f]">
                  Keine Umsatzdaten vorhanden
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A8BC" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00A8BC" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9ea" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: "#505c5f" }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#505c5f" }}
                        tickFormatter={(val) => `${val} €`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #c8d3d5",
                          borderRadius: 0,
                          fontSize: "12px",
                        }}
                        formatter={(val: any) => [`${Number(val).toFixed(2)} €`, "Umsatz"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenueEur"
                        stroke="#00A8BC"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Umsatz"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5e9ea] text-[11px] text-[#505c5f] flex justify-between font-semibold">
              <span>Zeitraum-Umsatz:</span>
              <strong className="text-[#0f4851]">{formatPrice(kpis.totalRevenueCents)}</strong>
            </div>
          </div>

          {/* Chart 3: Top Kunden */}
          <div className="rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#c8d3d5] pb-3 mb-4">
                <div>
                  <h3 className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
                    Top-Besteller
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#505c5f]">
                    Kunden mit den meisten Bestellungen
                  </p>
                </div>
                <Users className="size-5 text-[#00A8BC]" aria-hidden="true" />
              </div>

              {topCustomersData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#505c5f]">
                  Keine Kundendaten vorhanden
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCustomersData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e9ea" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#505c5f" }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11, fill: "#1a1c1c" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #c8d3d5",
                          borderRadius: 0,
                          fontSize: "12px",
                        }}
                        formatter={(value: any, name: any) => [
                          name === "orderCount" ? `${value} Bestellungen` : `${value} €`,
                          name === "orderCount" ? "Anzahl" : "Umsatz",
                        ]}
                      />
                      <Bar dataKey="orderCount" fill="#00A8BC" radius={[0, 2, 2, 0]} name="orderCount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5e9ea] text-[11px] text-[#505c5f] flex justify-between font-semibold">
              <span>Aktivster Kunde: <strong className="text-[#0f4851]">{topCustomersData[0]?.name || "-"}</strong></span>
              <span>{topCustomersData[0]?.orderCount || 0} Bestellungen</span>
            </div>
          </div>

          {/* Chart 4: Bestellstatus-Verteilung */}
          <div className="rounded-none border border-[#c8d3d5] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#c8d3d5] pb-3 mb-4">
                <div>
                  <h3 className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
                    Status-Verteilung
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#505c5f]">
                    Verhältnis Offen / Bereit / Abgeschlossen
                  </p>
                </div>
                <PieChartIcon className="size-5 text-[#00A8BC]" aria-hidden="true" />
              </div>

              {statusDistributionData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#505c5f]">
                  Keine Statusdaten vorhanden
                </div>
              ) : (
                <div className="h-72 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #c8d3d5",
                          borderRadius: 0,
                          fontSize: "12px",
                        }}
                        formatter={(val: any) => [`${val} Bestellungen`, "Anzahl"]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-[#1a1c1c] font-medium">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5e9ea] text-[11px] text-[#505c5f] flex justify-between font-semibold">
              <span>Gesamte Reservierungen:</span>
              <strong className="text-[#0f4851]">{filteredOrders.length}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
