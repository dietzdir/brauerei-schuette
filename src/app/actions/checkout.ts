"use server";

import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { ContainerType, Order, OrderItem, OrderRentalItem, Product, RentalItem } from "@/types";
import { initialProducts, initialRentals } from "@/lib/firebase/seed";
import { sendOrderConfirmationEmail } from "@/lib/email/emailService";

export interface CheckoutInputItem {
  productId: string;
  variantType: ContainerType;
  quantity: number;
}

export interface CheckoutInputRentalItem {
  rentalId: string;
  quantity?: number;
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
  rentalItems?: (CheckoutInputRentalItem | string)[];
  rentalItemIds?: string[];
  rentalItemId?: string; // backwards compatibility
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
      rentalItems: inputRentalItems,
      rentalItemIds: inputRentalIds,
      rentalItemId,
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

    const requestedRentals: { rentalId: string; quantity: number }[] = [];
    if (inputRentalItems && inputRentalItems.length > 0) {
      inputRentalItems.forEach((r) => {
        if (typeof r === "string" && r.trim()) {
          requestedRentals.push({ rentalId: r.trim(), quantity: 1 });
        } else if (r && typeof r === "object" && r.rentalId) {
          requestedRentals.push({
            rentalId: r.rentalId.trim(),
            quantity: typeof r.quantity === "number" && r.quantity > 0 ? r.quantity : 1,
          });
        }
      });
    } else if (inputRentalIds && inputRentalIds.length > 0) {
      inputRentalIds.forEach((id) => {
        if (id && id.trim()) {
          requestedRentals.push({ rentalId: id.trim(), quantity: 1 });
        }
      });
    } else if (rentalItemId && rentalItemId.trim()) {
      requestedRentals.push({ rentalId: rentalItemId.trim(), quantity: 1 });
    }

    if ((!items || items.length === 0) && requestedRentals.length === 0) {
      return { success: false, error: "Der Warenkorb ist leer." };
    }

    // Server-side price, deposit and product validation
    const validatedOrderItems: OrderItem[] = [];

    if (items && items.length > 0) {
      const itemValidationResults = await Promise.all(
        items.map(async (item) => {
          if (item.quantity <= 0) {
            return { error: "Ungültige Bestellmenge." };
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
              error: `Produkt nicht gefunden (ID: ${item.productId}).`,
            };
          }

          const variant = productData.variants?.find((v) => v.type === item.variantType);

          if (!variant) {
            return {
              error: `Gebinde "${item.variantType}" für "${productData.name}" existiert nicht mehr.`,
            };
          }

          const orderItem: OrderItem = {
            productId: item.productId,
            productName: productData.name,
            variantType: variant.type,
            quantity: item.quantity,
            unitPrice: variant.price, // Trust ONLY server-verified price
            depositPrice: variant.deposit || 0, // Server-verified deposit
          };

          return { item: orderItem };
        })
      );

      for (const res of itemValidationResults) {
        if (res.error) {
          return { success: false, error: res.error };
        }
        if (res.item) {
          validatedOrderItems.push(res.item);
        }
      }
    }

    // Rental items validation & date-based availability checking
    const validatedRentalItems: OrderRentalItem[] = [];
    let rentalPriceTotalCents = 0;

    if (requestedRentals.length > 0) {
      if (!pickupDate || !pickupDate.trim()) {
        return {
          success: false,
          error: "Für die Reservierung von Mietartikeln muss ein gültiger Abholtermin gewählt sein.",
        };
      }

      // Pre-fetch active orders for this pickupDate once
      let existingOrdersForDate: Order[] = [];
      try {
        const existingOrdersSnapshot = await adminDb
          .collection("orders")
          .where("pickupDate", "==", pickupDate.trim())
          .where("status", "in", ["pending", "ready"])
          .get();

        existingOrdersSnapshot.forEach((docSnap) => {
          existingOrdersForDate.push(docSnap.data() as Order);
        });
      } catch (availErr) {
        console.warn("Error querying existing orders for date availability:", availErr);
      }

      for (const reqRental of requestedRentals) {
        const rId = reqRental.rentalId;
        const reqQty = reqRental.quantity || 1;

        let rentalData: RentalItem | null = null;
        try {
          const rentalDoc = await adminDb.collection("rentals").doc(rId).get();
          if (rentalDoc.exists) {
            rentalData = { id: rentalDoc.id, ...(rentalDoc.data() as Omit<RentalItem, "id">) };
          }
        } catch (err) {
          console.warn(`Firestore rental lookup error for ${rId}, checking fallback:`, err);
        }

        if (!rentalData) {
          const fallback = initialRentals.find((r) => r.id === rId);
          if (fallback) {
            rentalData = fallback;
          }
        }

        if (!rentalData) {
          return {
            success: false,
            error: `Mietartikel nicht gefunden (ID: ${rId}).`,
          };
        }

        if (rentalData.isActive === false) {
          return {
            success: false,
            error: `Der Mietartikel „${rentalData.name}“ ist aktuell leider nicht zur Vermietung verfügbar.`,
          };
        }

        // Count reservations for this specific rental item on pickupDate
        let reservedCount = 0;
        existingOrdersForDate.forEach((ord) => {
          if (ord.rentalItems && ord.rentalItems.length > 0) {
            ord.rentalItems.forEach((r) => {
              if (r.rentalId === rId) {
                reservedCount += typeof r.quantity === "number" && r.quantity > 0 ? r.quantity : 1;
              }
            });
          }
        });

        const totalStock = typeof rentalData.totalStock === "number" && rentalData.totalStock > 0 ? rentalData.totalStock : 1;
        const availableLeft = Math.max(0, totalStock - reservedCount);

        if (reqQty > totalStock) {
          return {
            success: false,
            error: `Von „${rentalData.name}“ können maximal ${totalStock} Stück ausgeliehen werden.`,
          };
        }

        if (reservedCount + reqQty > totalStock) {
          return {
            success: false,
            error: availableLeft > 0
              ? `Für den gewählten Abholtermin (${pickupDate.trim()}) sind nur noch ${availableLeft} von ${totalStock} „${rentalData.name}“ verfügbar (Sie haben ${reqQty} Stück ausgewählt). Bitte reduzieren Sie die Anzahl oder wählen Sie einen anderen Termin.`
              : `Für den gewählten Abholtermin (${pickupDate.trim()}) sind leider bereits alle „${rentalData.name}“ (${totalStock} Stück) vergeben. Bitte wählen Sie einen anderen Abholtermin oder entfernen Sie den Artikel aus dem Warenkorb.`,
          };
        }

        validatedRentalItems.push({
          rentalId: rentalData.id,
          rentalName: rentalData.name,
          rentalPriceCents: rentalData.rentalPriceCents,
          depositCents: rentalData.depositCents || 0,
          quantity: reqQty,
        });

        rentalPriceTotalCents += rentalData.rentalPriceCents * reqQty;
      }
    }


    const itemsTotalCents =
      validatedOrderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) +
      rentalPriceTotalCents;
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
      rentalItems: validatedRentalItems.length > 0 ? validatedRentalItems : undefined,
      itemsTotalCents,
      depositTotalCents,
      grandTotalCents,
    };


    // Save to Firestore via Admin SDK with timeout guard for local dev environments
    try {
      const orderWritePromise = adminDb.collection("orders").doc(orderId).set(newOrder);

      // Only update lastOrderAt — do NOT overwrite profile fields (displayName,
      // email, phone, address) from checkout form data. The checkout form captures
      // order-specific contact info which may differ from the user's stored profile
      // (e.g. ordering on behalf of someone else). Overwriting causes cross-user
      // data contamination when auth state is shared across browser tabs.
      const userUpdatePromise = adminDb
        .collection("users")
        .doc(userId)
        .set(
          {
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
