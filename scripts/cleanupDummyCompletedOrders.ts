import { adminDb } from "../src/lib/firebase/admin";

async function cleanupDummyOrders() {
  console.log("Cleaning up dummy completed orders...");
  
  const snapshot = await adminDb.collection("orders").where("isDummy", "==", true).get();
  
  if (snapshot.empty) {
    console.log("No dummy orders found.");
    return;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Successfully deleted ${snapshot.size} dummy orders.`);
}

cleanupDummyOrders().catch(console.error);
