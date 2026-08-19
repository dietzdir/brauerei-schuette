import { adminDb, adminAuth } from "../src/lib/firebase/admin";

async function checkUsers() {
  const usersRef = adminDb.collection('users');
  const snapshot = await usersRef.where('email', '==', 'dirkdietz22@gmail.com').get();
  
  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }

  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });

  // Also check Auth
  try {
    const authUser = await adminAuth.getUserByEmail('dirkdietz22@gmail.com');
    console.log("Auth User:", authUser.toJSON());
  } catch (e) {
    console.log("Auth Error:", e);
  }
}

checkUsers();
