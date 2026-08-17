import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ContainerType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatContainerType(type: ContainerType | string): string {
  switch (type) {
    case "0.75l bottle":
      return "0,75 Liter Flasche";
    case "0.33l bottle":
      return "0,33 Liter Flasche";
    case "5l keg":
      return "5 Liter Partyfass";
    case "10l keg":
      return "10 Liter Fass";
    case "30l keg":
      return "30 Liter Fass";
    case "50l keg":
      return "50 Liter Fass";
    default:
      return type;
  }
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export function getVolumeInLiters(type: ContainerType | string): number {
  switch (type) {
    case "0.75l bottle":
      return 0.75;
    case "0.75l bottle (6-crate)":
      return 4.5; // 6er Kasten (6 x 0,75l = 4,5 Liter)
    case "0.33l bottle":
      return 0.33;
    case "5l keg":
      return 5.0;
    case "10l keg":
      return 10.0;
    case "30l keg":
      return 30.0;
    case "50l keg":
      return 50.0;
    default: {
      const match = typeof type === "string" ? type.match(/(\d+(?:[.,]\d+)?)\s*l/i) : null;
      if (match && match[1]) {
        return parseFloat(match[1].replace(",", "."));
      }
      return 1.0;
    }
  }
}

export function formatBasePrice(priceCents: number, type: ContainerType | string): string {
  const liters = getVolumeInLiters(type);
  if (!liters || liters <= 0) return "";
  const pricePerLiterCents = Math.round(priceCents / liters);
  return `${formatPrice(pricePerLiterCents)} / Liter`;
}

export function getOrderTimestamp(createdAt: any, orderId?: string): number {
  if (createdAt) {
    if (typeof createdAt.toDate === "function") {
      try {
        const t = createdAt.toDate();
        if (t instanceof Date && !isNaN(t.getTime())) return t.getTime();
      } catch {}
    }
    if (typeof createdAt.toMillis === "function") {
      try {
        const m = createdAt.toMillis();
        if (typeof m === "number" && m > 0) return m;
      } catch {}
    }
    if (typeof createdAt === "number" && createdAt > 0) {
      return createdAt;
    }
    if (createdAt.millis && typeof createdAt.millis === "number") {
      return createdAt.millis;
    }
    if (createdAt.seconds && typeof createdAt.seconds === "number") {
      return createdAt.seconds * 1000;
    }
    if (typeof createdAt === "string" && !isNaN(Date.parse(createdAt))) {
      return new Date(createdAt).getTime();
    }
    if (createdAt instanceof Date && !isNaN(createdAt.getTime())) {
      return createdAt.getTime();
    }
  }

  // Recover creation timestamp from orderId (e.g. ord_2nfk_m1a2b3c)
  if (orderId && orderId.includes("_")) {
    const parts = orderId.split("_");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const parsed = parseInt(lastPart, 36);
      if (!isNaN(parsed) && parsed > 1500000000000 && parsed < 3000000000000) {
        return parsed;
      }
    }
  }

  return Date.now();
}

export function formatOrderDateTime(createdAt: any, orderId?: string): string {
  const timestamp = getOrderTimestamp(createdAt, orderId);
  const date = new Date(timestamp);

  const dateStr = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateStr}, ${timeStr} Uhr`;
}
