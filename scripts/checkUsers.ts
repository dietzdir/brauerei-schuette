import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount),
}) : getApps()[0];

const auth = getAuth(app);

async function listEmailUsers(nextPageToken?: string) {
  const result = await auth.listUsers(1000, nextPageToken);
  result.users.forEach((u) => {
    if (u.email || u.customClaims) {
      console.log(`- Email: "${u.email}", UID: ${u.uid}, Claims: ${JSON.stringify(u.customClaims)}`);
    }
  });
  if (result.pageToken) {
    await listEmailUsers(result.pageToken);
  }
}

listEmailUsers().catch(console.error);
