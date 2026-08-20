import { adminDb } from "../src/lib/firebase/admin";

async function fixDirkProfile() {
  const dirkUid = "sL5pUAPn9RP0c54Z6UH6KTIqZyn2";
  const userRef = adminDb.collection("users").doc(dirkUid);
  
  // Restore Dirk's correct data (remove Andreas' contaminated fields)
  await userRef.update({
    displayName: "Dirk Dietz",
    phoneNumber: "01755887198",
  });

  console.log("✅ Dirk's profile has been restored.");
  
  // Verify
  const snap = await userRef.get();
  console.log("Restored profile:", JSON.stringify(snap.data(), null, 2));
}

fixDirkProfile();
