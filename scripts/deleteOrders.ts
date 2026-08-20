import { adminDb } from "../src/lib/firebase/admin";

async function deleteOrders() {
  const ordersRef = adminDb.collection("orders");
  const snapshot = await ordersRef.get();

  if (snapshot.empty) {
    console.log("No orders found to delete.");
    return;
  }

  console.log(`Deleting ${snapshot.docs.length} test orders...`);
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    console.log(`Deleting order: ${doc.id} (${doc.data().customerName})`);
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log("Successfully deleted all test orders.");
}

deleteOrders();
