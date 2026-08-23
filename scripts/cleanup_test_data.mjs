import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const serviceAccountPath = path.join(projectRoot, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.warn("⚠️ serviceAccountKey.json not found in project root. Skipping Firestore DB cleanup.");
  process.exit(0);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(serviceAccount),
  projectId: "brauerei-schuette",
});

const db = getFirestore(app);

async function cleanTestData() {
  console.log("Searching for test orders in Firestore...");
  const ordersSnapshot = await db.collection("orders").get();
  let deletedOrdersCount = 0;

  for (const doc of ordersSnapshot.docs) {
    const data = doc.data();
    const email = (data.customerEmail || "").toLowerCase();
    const name = (data.customerName || "").toLowerCase();
    
    // Check if it's test data created during test runs
    if (
      email.includes("mustermann") ||
      email.includes("example.com") ||
      email.includes("test@") ||
      name.includes("mustermann") ||
      name.includes("testkunde") ||
      name.includes("test")
    ) {
      console.log(`Deleting test order: ${doc.id} (${data.customerName} - ${data.customerEmail})`);
      await doc.ref.delete();
      deletedOrdersCount++;
    }
  }

  console.log(`Finished: Deleted ${deletedOrdersCount} test order(s).`);

  console.log("Searching for test users in Firestore...");
  const usersSnapshot = await db.collection("users").get();
  let deletedUsersCount = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const email = (data.email || "").toLowerCase();
    const name = (data.displayName || "").toLowerCase();
    
    if (
      email.includes("mustermann") ||
      email.includes("example.com") ||
      name.includes("mustermann") ||
      name.includes("testkunde")
    ) {
      console.log(`Deleting test user doc: ${doc.id} (${data.displayName} - ${data.email})`);
      await doc.ref.delete();
      deletedUsersCount++;
    }
  }

  console.log(`Finished: Deleted ${deletedUsersCount} test user(s).`);
  process.exit(0);
}

cleanTestData().catch((err) => {
  console.error("Error cleaning test data:", err);
  process.exit(1);
});
