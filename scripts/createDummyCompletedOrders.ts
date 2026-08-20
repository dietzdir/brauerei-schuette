import { adminDb } from "../src/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

async function createDummyOrders() {
  console.log("Generating 15 dummy completed orders...");
  const dummyIds = [];

  for (let i = 1; i <= 15; i++) {
    const orderRef = adminDb.collection("orders").doc(`dummy-completed-order-${i}`);
    dummyIds.push(orderRef.id);

    await orderRef.set({
      userId: "dummy-user-id",
      customerName: `Test Kunde ${i}`,
      customerEmail: `test${i}@example.com`,
      customerPhone: `0123456789${i}`,
      customerType: "private",
      status: "completed",
      isDummy: true, // Marker for easy cleanup
      createdAt: Timestamp.fromMillis(Date.now() - i * 1000 * 60 * 60 * 24), // spread over past 15 days
      items: [
        {
          productId: "dummy-product",
          productName: "Börde Pils",
          variantType: "0.75l bottle (6-crate)",
          quantity: 2,
          unitPrice: 1500, // 15,00 €
        }
      ]
    });
  }

  console.log("✅ Successfully created 15 dummy orders for testing.");
  console.log("To clean up later, you can run a script that deletes where isDummy == true, or use the UI.");
}

createDummyOrders().catch(console.error);
