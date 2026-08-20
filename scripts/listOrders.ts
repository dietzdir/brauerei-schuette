import { adminDb } from "../src/lib/firebase/admin";

async function listOrders() {
  const ordersRef = adminDb.collection("orders");
  const snapshot = await ordersRef.get();

  if (snapshot.empty) {
    console.log("No orders found.");
    return;
  }

  console.log(`Found ${snapshot.docs.length} orders:`);
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Customer: ${data.customerName} (${data.customerEmail}) | Status: ${data.status} | CreatedAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
  });
}

listOrders();
