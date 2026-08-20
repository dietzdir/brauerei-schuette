import { adminDb } from "../src/lib/firebase/admin";

async function inspectProfiles() {
  // Check Andreas's profile
  const andreasQuery = await adminDb.collection("users").where("email", "==", "info@rottmersleber-brauerei.de").get();
  console.log("=== ANDREAS PROFILES ===");
  andreasQuery.forEach(doc => {
    console.log(`UID: ${doc.id}`, JSON.stringify(doc.data(), null, 2));
  });

  // Check Dirk's profile
  const dirkQuery = await adminDb.collection("users").where("email", "==", "dirkdietz22@gmail.com").get();
  console.log("\n=== DIRK PROFILES ===");
  dirkQuery.forEach(doc => {
    console.log(`UID: ${doc.id}`, JSON.stringify(doc.data(), null, 2));
  });
}

inspectProfiles();
