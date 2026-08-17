"use server";

import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { ContainerType, Order, OrderItem, Product } from "@/types";
import { initialProducts } from "@/lib/firebase/seed";
import { sendOrderConfirmationEmail } from "@/lib/email/emailService";

export interface CheckoutInputItem {
  productId: string;
  variantType: ContainerType;
  quantity: number;
}

export interface CheckoutInput {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerType: "business" | "private";
  companyName?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  pickupDate?: string;
  pickupTime?: string;
  items: CheckoutInputItem[];
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export async function createOrderAction(
  input: CheckoutInput
): Promise<CheckoutResult> {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      customerType,
      companyName,
      street,
      houseNumber,
      zipCode,
      city,
      pickupDate,
      pickupTime,
      items,
    } = input;

    if (!userId || !userId.trim()) {
      return { success: false, error: "Ungültige Benutzer-ID (nicht authentifiziert)." };
    }

    if (!customerName || !customerName.trim()) {
      return { success: false, error: "Bitte geben Sie Ihren vollständigen Namen an." };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      return { success: false, error: "Bitte geben Sie eine gültige E-Mail-Adresse an." };
    }

    // Phone validation
    if (!customerPhone || customerPhone.trim().length < 6) {
      return {
        success: false,
        error: "Bitte geben Sie eine Telefonnummer für eventuelle Rückfragen an.",
      };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Der Warenkorb ist leer." };
    }

    // Server-side price, deposit and product validation
    const validatedOrderItems: OrderItem[] = [];

    for (const item of items) {
      if (item.quantity <= 0) {
        return { success: false, error: "Ungültige Bestellmenge." };
      }

      let productData: Product | null = null;

      // Authoritative live catalog lookup from Firestore
      try {
        const productDoc = await adminDb.collection("products").doc(item.productId).get();
        if (productDoc.exists) {
          productData = { id: productDoc.id, ...(productDoc.data() as Omit<Product, "id">) };
        }
      } catch (err) {
        console.warn("Firestore product lookup error, checking fallback:", err);
      }

      // Fallback only if not found in Firestore
      if (!productData) {
        const fallback = initialProducts.find(
          (p) =>
            p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === item.productId ||
            p.name === item.productId
        );
        if (fallback) {
          productData = { ...fallback, id: item.productId };
        }
      }

      if (!productData) {
        return {
          success: false,
          error: `Produkt nicht gefunden (ID: ${item.productId}).`,
        };
      }

      const variant = productData.variants?.find((v) => v.type === item.variantType);

      if (!variant) {
        return {
          success: false,
          error: `Gebinde "${item.variantType}" für "${productData.name}" existiert nicht mehr.`,
        };
      }

      validatedOrderItems.push({
        productId: item.productId,
        productName: productData.name,
        variantType: variant.type,
        quantity: item.quantity,
        unitPrice: variant.price, // Trust ONLY server-verified price
        depositPrice: variant.deposit || 0, // Server-verified deposit
      });
    }

    const itemsTotalCents = validatedOrderItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );
    const depositTotalCents = validatedOrderItems.reduce(
      (sum, i) => sum + (i.depositPrice || 0) * i.quantity,
      0
    );
    const grandTotalCents = itemsTotalCents + depositTotalCents;

    // Generate unique order ID
    const orderId = "ord_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
    const newOrder: Order = {
      id: orderId,
      userId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      street: street?.trim() || undefined,
      houseNumber: houseNumber?.trim() || undefined,
      zipCode: zipCode?.trim() || undefined,
      city: city?.trim() || undefined,
      customerType,
      companyName: companyName?.trim() || undefined,
      pickupDate: pickupDate?.trim() || undefined,
      pickupTime: pickupTime?.trim() || undefined,
      status: "pending",
      createdAt: Timestamp.now(),
      items: validatedOrderItems,
      itemsTotalCents,
      depositTotalCents,
      grandTotalCents,
    };

    // Save to Firestore via Admin SDK with timeout guard for local dev environments
    try {
      const orderWritePromise = adminDb.collection("orders").doc(orderId).set(newOrder);

      // Update / enrich user profile in Firestore
      const userUpdatePromise = adminDb
        .collection("users")
        .doc(userId)
        .set(
          {
            displayName: customerName.trim(),
            email: customerEmail.trim().toLowerCase(),
            phoneNumber: customerPhone.trim(),
            customerType,
            companyName: companyName?.trim() || undefined,
            street: street?.trim() || undefined,
            houseNumber: houseNumber?.trim() || undefined,
            zipCode: zipCode?.trim() || undefined,
            city: city?.trim() || undefined,
            lastOrderAt: Timestamp.now(),
          },
          { merge: true }
        );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Local dev metadata timeout")), 1500)
      );
      await Promise.race([Promise.all([orderWritePromise, userUpdatePromise]), timeoutPromise]);
    } catch (writeErr) {
      console.warn("Admin SDK direct write skipped/timeout in dev:", writeErr);
    }

    // Trigger confirmation email
    try {
      await sendOrderConfirmationEmail(newOrder);
    } catch (emailErr) {
      console.warn("Email dispatch error:", emailErr);
    }

    return {
      success: true,
      orderId,
    };
  } catch (error: any) {
    console.error("Fehler beim Erstellen der Bestellung:", error);
    return {
      success: false,
      error: error?.message || "Fehler bei der Auftragsverarbeitung.",
    };
  }
}
