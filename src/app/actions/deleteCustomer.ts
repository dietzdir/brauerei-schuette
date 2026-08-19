"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

/**
 * Deletes a customer completely:
 * 1. Verifies the caller is an admin (via session cookie)
 * 2. Deletes the Firebase Auth user
 * 3. Deletes the Firestore users/{uid} document
 * 4. Deletes the Firestore adminNotes/{uid} document (if exists)
 */
export async function deleteCustomer(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return { success: false, error: "Keine gültige Sitzung gefunden." };
    }

    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
      return { success: false, error: "Ungültige Sitzung." };
    }

    if (!decodedClaims.admin) {
      return { success: false, error: "Nur Administratoren dürfen Kunden löschen." };
    }

    // 2. Prevent self-deletion
    if (decodedClaims.uid === uid) {
      return { success: false, error: "Sie können Ihren eigenen Account nicht löschen." };
    }

    // 3. Delete Firebase Auth user
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: unknown) {
      // If the auth user doesn't exist, continue with Firestore cleanup
      const errorCode = (authError as { code?: string })?.code;
      if (errorCode !== "auth/user-not-found") {
        console.error("Error deleting auth user:", authError);
        return { success: false, error: "Fehler beim Löschen des Auth-Accounts." };
      }
    }

    // 4. Delete Firestore user document
    try {
      await adminDb.collection("users").doc(uid).delete();
    } catch (firestoreError) {
      console.error("Error deleting Firestore user document:", firestoreError);
      // Auth user is already deleted, but log the Firestore error
    }

    // 5. Delete admin notes document (if exists)
    try {
      await adminDb.collection("adminNotes").doc(uid).delete();
    } catch (notesError) {
      console.error("Error deleting admin notes:", notesError);
      // Non-critical, continue
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting customer:", error);
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
