import { Timestamp } from "firebase/firestore";

export type ContainerType =
  | "0.75l bottle"
  | "0.33l bottle"
  | "5l keg"
  | "10l keg"
  | "30l keg"
  | "50l keg";

export interface ProductVariant {
  type: ContainerType;
  price: number; // EUR cents (integer)
  deposit?: number; // EUR cents (deposit per unit, e.g. 100 for 1,00 €)
  sku?: string;
  isActive?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: "Beer" | "Lemonade";
  variants: ProductVariant[];
  description?: string;
  ingredients?: string;
  alcohol?: string;
  color?: string;
  flavorProfile?: string;
  depositInfo?: string;
  image?: string;
  isAiGenerated?: boolean;
  badge?: string;
  isActive?: boolean;
}

export interface UserProfile {
  uid: string;
  customerType: "business" | "private";
  companyName?: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  phoneNumber?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  isAnonymous: boolean;
  createdAt: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantType: ContainerType;
  quantity: number;
  unitPrice: number; // EUR cents
  depositPrice?: number; // EUR cents
}

export type OpeningHourExceptionType = "closed" | "special_open" | "altered_hours";

export interface OpeningHourException {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: OpeningHourExceptionType;
  openTime?: string; // e.g. "14:00"
  closeTime?: string; // e.g. "19:00"
  note?: string; // e.g. "Betriebsurlaub" or "Ersatztag für Feiertag"
}

export interface StoreSettings {
  regularDayOfWeek?: number; // 5 = Friday (0=Sun, 1=Mon, ..., 5=Fri)
  regularOpenTime?: string; // "14:00"
  regularCloseTime?: string; // "19:00"
  exceptions: OpeningHourException[];
  bannerNotice?: string; // Optional custom broadcast message
  bannerLookaheadDays?: number; // Days to look ahead for displaying exceptions in the banner
}

export interface RentalItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isAiGenerated?: boolean;
  rentalPriceCents: number; // EUR cents (e.g. 2500 for 25,00 €)
  depositCents: number; // EUR cents (e.g. 5000 for 50,00 €) - Kaution informativ
  totalStock: number; // e.g. 3
  isActive: boolean;
}

export interface OrderRentalItem {
  rentalId: string;
  rentalName: string;
  rentalPriceCents: number;
  depositCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  customerType: "business" | "private";
  companyName?: string;
  pickupDate?: string; // formatted e.g. "Fr., 24.10.2025" or ISO string
  pickupTime?: string; // e.g. "14:00 - 19:00 Uhr"
  status: "pending" | "ready" | "completed";
  createdAt: any;
  items: OrderItem[];
  rentalItems?: OrderRentalItem[];
  itemsTotalCents?: number;
  depositTotalCents?: number;
  grandTotalCents?: number;
}

export interface AdminNote {
  uid: string;          // matches the userId from users collection
  notes: string;        // admin-only internal notes about this customer
  updatedAt: any;       // Timestamp of last update
}

