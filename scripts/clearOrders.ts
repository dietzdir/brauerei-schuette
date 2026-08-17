import { adminDb } from "../src/lib/firebase/admin";

async function main() {
  console.log("Fetching all orders from Firestore...");
  const snapshot = await adminDb.collection("orders").get();
  
  if (snapshot.empty) {
    console.log("No orders found in Firestore.");
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} orders. Deleting...`);
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Successfully deleted all ${snapshot.size} orders from Firestore.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error deleting orders:", err);
  process.exit(1);
});
