import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Fehler: Die Datei serviceAccountKey.json fehlt im Hauptverzeichnis.");
  process.exit(1);
}

const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
let serviceAccount;

try {
  serviceAccount = JSON.parse(fileContent);
} catch (e) {
  console.error("\nFEHLER: Deine serviceAccountKey.json ist keine gültige JSON-Datei.");
  console.error("Es sieht so aus, als hättest du den JavaScript-Code (var admin = require...) aus der Firebase Console kopiert.");
  console.error("Bitte klicke stattdessen auf 'Neuen privaten Schlüssel generieren'. Dadurch wird eine .json Datei heruntergeladen.");
  console.error("Kopiere den *Inhalt dieser heruntergeladenen Datei* in deine serviceAccountKey.json.\n");
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth(app);

async function setAdminClaim(identifier: string) {
  try {
    let uid = identifier;
    
    // Check if the identifier is an email address
    if (identifier.includes("@")) {
      const userRecord = await auth.getUserByEmail(identifier);
      uid = userRecord.uid;
      console.log(`E-Mail gefunden. Zugehörige UID: ${uid}`);
    }

    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`\nERFOLG! Admin-Rechte wurden für den Benutzer (UID: ${uid}) gesetzt.`);
    
    // Fetch to verify
    const user = await auth.getUser(uid);
    console.log("Aktuelle Claims:", user.customClaims);
    console.log("\nDu kannst dich nun im Browser einmal abmelden und wieder anmelden, um das Admin-Dashboard zu öffnen!");
  } catch (error: any) {
    console.error("Fehler beim Setzen der Admin-Rechte:", error.message || error);
  }
}

const targetInput = process.argv[2];
if (!targetInput) {
  console.log("Benutzung: npx tsx scripts/setAdmin.ts <DEINE_EMAIL_ODER_UID>");
  process.exit(1);
}

setAdminClaim(targetInput);
