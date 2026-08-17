import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Fehler: serviceAccountKey.json fehlt im Hauptverzeichnis.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount),
}) : getApps()[0];

const db = getFirestore(app);

async function main() {
  console.log("Fetching all orders from Firestore...");
  const snapshot = await db.collection("orders").get();
  
  if (snapshot.empty) {
    console.log("No orders found in Firestore.");
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} orders. Deleting...`);
  const batch = db.batch();
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
