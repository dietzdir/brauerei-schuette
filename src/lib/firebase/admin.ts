import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

let adminApp: App;

if (getApps().length === 0) {
  let serviceAccount = null;

  // 1. Try env variable (for Vercel production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.warn("Konnte FIREBASE_SERVICE_ACCOUNT_KEY nicht parsen.");
    }
  } 
  // 2. Try local file (for local development)
  else {
    try {
      const localPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(localPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      }
    } catch (e) {
      console.warn("Konnte lokale serviceAccountKey.json nicht laden.", e);
    }
  }

  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brauerei-schuette",
    });
  } else {
    // Fallback without credentials
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brauerei-schuette",
    });
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb: Firestore = getFirestore(adminApp);
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Already initialized, safe to ignore in Next.js dev
}
export const adminAuth: Auth = getAuth(adminApp);
