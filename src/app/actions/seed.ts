"use server";

import { adminDb } from "@/lib/firebase/admin";
import { initialProducts } from "@/lib/firebase/seed";

export async function seedProductsServerAction() {
  try {
    const batch = adminDb.batch();
    for (const prod of initialProducts) {
      const id = prod.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = adminDb.collection("products").doc(id);
      batch.set(docRef, { ...prod, id }, { merge: true });
    }
    await batch.commit();
    console.log("Seeding / updating products completed successfully.");
  } catch (error) {
    console.error("Error in seedProductsServerAction:", error);
  }
}
