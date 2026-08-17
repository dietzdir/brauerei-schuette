import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';

// Placeholder for the path to your downloaded service account key JSON file
// Download this from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
const SERVICE_ACCOUNT_PATH = './service-account-key.json';

// Placeholder for the email you want to make an admin
const TARGET_EMAIL = 'admin@example.com';

async function setAdminClaim() {
  try {
    const serviceAccount = JSON.parse(
      await readFile(new URL(SERVICE_ACCOUNT_PATH, import.meta.url))
    );

    initializeApp({
      credential: cert(serviceAccount)
    });

    console.log(`Looking up user by email: ${TARGET_EMAIL}`);
    const user = await getAuth().getUserByEmail(TARGET_EMAIL);

    console.log(`Setting custom admin claim for UID: ${user.uid}`);
    await getAuth().setCustomUserClaims(user.uid, { admin: true });

    console.log('Successfully set admin claim!');
  } catch (error) {
    console.error('Error setting admin claim:', error);
  }
}

setAdminClaim();
