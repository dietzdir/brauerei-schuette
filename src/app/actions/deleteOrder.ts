"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

/**
 * Deletes an order completely:
 * 1. Verifies the caller is an admin (via session cookie)
 * 2. Deletes the Firestore orders/{orderId} document
 */
export async function deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return { success: false, error: "Keine gültige Sitzung gefunden." };
    }

    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifyIdToken(sessionCookie, true);
    } catch {
      return { success: false, error: "Ungültige Sitzung." };
    }

    if (!decodedClaims.admin) {
      return { success: false, error: "Nur Administratoren dürfen Bestellungen löschen." };
    }

    // 2. Delete Firestore order document
    try {
      await adminDb.collection("orders").doc(orderId).delete();
    } catch (firestoreError) {
      console.error("Error deleting Firestore order document:", firestoreError);
      return { success: false, error: "Fehler beim Löschen der Bestellung aus der Datenbank." };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting order:", error);
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
