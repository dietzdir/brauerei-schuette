"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInAnonymously, 
  linkWithCredential, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  AuthCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  deleteUser,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  getAdditionalUserInfo
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  linkAccount: (credential: AuthCredential) => Promise<User>;
  linkWithEmailPassword: (email: string, pass: string) => Promise<User>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  registerWithEmailPassword: (email: string, pass: string, customerType?: "business" | "private", companyName?: string, displayName?: string, phoneNumber?: string, street?: string, houseNumber?: string, zipCode?: string, city?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function cleanData<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

function getBestUserDisplayName(user: User, additionalInfo?: any): string {
  const addProfile = additionalInfo?.profile;
  const fromAdditional = addProfile?.name || (addProfile?.given_name ? `${addProfile.given_name} ${addProfile.family_name || ""}`.trim() : undefined);
  if (fromAdditional) return fromAdditional;
  if (user.displayName && user.displayName !== "Gast") return user.displayName;
  for (const p of user.providerData || []) {
    if (p.displayName && p.displayName !== "Gast") return p.displayName;
  }
  return user.email?.split("@")[0] || (user.isAnonymous ? "Gast" : "Kunde");
}

function getBestUserPhotoURL(user: User, additionalInfo?: any): string | undefined {
  const addProfile = additionalInfo?.profile;
  const fromAdditional = addProfile?.picture || (addProfile as any)?.avatar_url;
  if (fromAdditional) return fromAdditional;
  if (user.photoURL) return user.photoURL;
  for (const p of user.providerData || []) {
    if (p.photoURL) return p.photoURL;
  }
  return undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or sync user profile in Firestore
  const syncProfile = async (currentUser: User) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      const bestName = getBestUserDisplayName(currentUser);
      const bestPhoto = getBestUserPhotoURL(currentUser);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        
        // Auto-heal "Gast" or fallback email prefix if better name is available from provider
        if (!currentUser.isAnonymous) {
          if (data.displayName === "Gast" || (data.displayName === currentUser.email?.split("@")[0] && bestName !== data.displayName)) {
            updates.displayName = bestName;
            updates.isAnonymous = false;
          }
        }

        if (currentUser.email && data.email !== currentUser.email) {
          updates.email = currentUser.email;
        }

        if (bestPhoto && data.photoURL !== bestPhoto) {
          updates.photoURL = bestPhoto;
        }

        if (Object.keys(updates).length > 0) {
          Object.assign(data, updates);
          await setDoc(userRef, updates, { merge: true });
        }
        
        setProfile(data);
      } else {
        const initialProfile: UserProfile = cleanData({
          uid: currentUser.uid,
          customerType: "private",
          isAnonymous: currentUser.isAnonymous,
          email: currentUser.email || undefined,
          displayName: bestName,
          photoURL: bestPhoto,
          createdAt: serverTimestamp() as any,
        });
        await setDoc(userRef, initialProfile, { merge: true });
        setProfile(initialProfile);
      }
    } catch (err) {
      console.error("Error syncing profile:", err);
    }
  };

  const syncSessionCookie = async (currentUser: User): Promise<boolean> => {
    try {
      // Only mint session cookies for non-anonymous users to save backend calls,
      // as anonymous users will never be admins.
      if (currentUser.isAnonymous) return false;
      const idToken = await currentUser.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to sync session cookie", e);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await syncProfile(currentUser);
        await syncSessionCookie(currentUser);
        setLoading(false);
      } else {
        // Automatically sign in anonymously if unauthenticated
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Failed to sign in anonymously:", error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const linkAccount = async (credential: AuthCredential): Promise<User> => {
    if (!auth.currentUser) {
      throw new Error("Kein Benutzer angemeldet.");
    }
    const userCredential = await linkWithCredential(auth.currentUser, credential);
    setUser(userCredential.user);
    await syncProfile(userCredential.user);
    return userCredential.user;
  };

  const linkWithEmailPassword = async (email: string, pass: string): Promise<User> => {
    const credential = EmailAuthProvider.credential(email, pass);
    return await linkAccount(credential);
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    setUser(userCredential.user);
    await syncProfile(userCredential.user);
    await syncSessionCookie(userCredential.user);
    return userCredential.user;
  };

  const handleSocialLogin = async (provider: any) => {
    // Preserve any existing in-memory profile data (e.g. from checkout or guest session)
    const prevProfile = profile;

    // Standard direct sign-in with popup (handles both new registrations and existing logins in one click)
    const userCredential = await signInWithPopup(auth, provider);

    const additional = getAdditionalUserInfo(userCredential);
    const newName = getBestUserDisplayName(userCredential.user, additional);
    const newPhoto = getBestUserPhotoURL(userCredential.user, additional);

    const userRef = doc(db, "users", userCredential.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newProf: UserProfile = cleanData({
        uid: userCredential.user.uid,
        customerType: prevProfile?.customerType || "private",
        companyName: prevProfile?.companyName || undefined,
        phoneNumber: prevProfile?.phoneNumber || undefined,
        street: prevProfile?.street || undefined,
        houseNumber: prevProfile?.houseNumber || undefined,
        zipCode: prevProfile?.zipCode || undefined,
        city: prevProfile?.city || undefined,
        isAnonymous: false,
        displayName: newName,
        photoURL: newPhoto,
        email: userCredential.user.email || undefined,
        createdAt: serverTimestamp() as any,
      });
      await setDoc(userRef, newProf);
      setProfile(newProf);
    } else {
      const existingData = userSnap.data() as UserProfile;
      const updates: Partial<UserProfile> = {};
      if (
        existingData.displayName === "Gast" ||
        existingData.displayName === userCredential.user.email?.split("@")[0]
      ) {
        updates.displayName = newName;
      }
      if (newPhoto && existingData.photoURL !== newPhoto) {
        updates.photoURL = newPhoto;
      }
      if (prevProfile?.phoneNumber && !existingData.phoneNumber) {
        updates.phoneNumber = prevProfile.phoneNumber;
      }
      if (prevProfile?.street && !existingData.street) {
        updates.street = prevProfile.street;
      }
      if (prevProfile?.houseNumber && !existingData.houseNumber) {
        updates.houseNumber = prevProfile.houseNumber;
      }
      if (prevProfile?.zipCode && !existingData.zipCode) {
        updates.zipCode = prevProfile.zipCode;
      }
      if (prevProfile?.city && !existingData.city) {
        updates.city = prevProfile.city;
      }
      if (prevProfile?.companyName && !existingData.companyName) {
        updates.companyName = prevProfile.companyName;
      }
      if (Object.keys(updates).length > 0) {
        await setDoc(userRef, updates, { merge: true });
      }
      await syncProfile(userCredential.user);
    }

    setUser(userCredential.user);
    return userCredential.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return handleSocialLogin(provider);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    const currentUser = auth.currentUser;
    const uid = currentUser.uid;

    // 1. Delete Firestore user document while still authenticated
    try {
      const userRef = doc(db, "users", uid);
      await deleteDoc(userRef);
    } catch (firestoreErr) {
      console.warn("Could not delete Firestore user doc:", firestoreErr);
    }

    // 2. Delete Firebase Auth user
    try {
      await deleteUser(currentUser);
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        const isGoogle = currentUser.providerData.some((p) => p.providerId === "google.com");
        if (isGoogle) {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(currentUser, provider);
          await deleteUser(currentUser);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    setProfile(null);
    setUser(null);

    // 3. Re-initialize clean anonymous visitor session
    try {
      await signInAnonymously(auth);
    } catch (anonErr) {
      console.warn("Failed to sign in anonymously after delete:", anonErr);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const registerWithEmailPassword = async (
    email: string, 
    pass: string,
    customerType: "business" | "private" = "private",
    companyName?: string,
    displayName?: string,
    phoneNumber?: string,
    street?: string,
    houseNumber?: string,
    zipCode?: string,
    city?: string
  ): Promise<User> => {
    // If the current user is anonymous, link to keep the same session and history
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      const linkedUser = await linkWithEmailPassword(email, pass);
      const userRef = doc(db, "users", linkedUser.uid);
      const updateData = { 
        customerType, 
        companyName: companyName || null, 
        isAnonymous: false,
        email,
        ...(displayName ? { displayName } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(street ? { street } : {}),
        ...(houseNumber ? { houseNumber } : {}),
        ...(zipCode ? { zipCode } : {}),
        ...(city ? { city } : {})
      };
      await setDoc(userRef, updateData, { merge: true });
      await syncProfile(linkedUser);
      return linkedUser;
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const userRef = doc(db, "users", userCredential.user.uid);
      const newProf: UserProfile = cleanData({
        uid: userCredential.user.uid,
        customerType,
        companyName: companyName || undefined,
        isAnonymous: false,
        displayName: displayName || email.split("@")[0],
        email,
        phoneNumber,
        street,
        houseNumber,
        zipCode,
        city,
        createdAt: serverTimestamp() as any,
      });
      await setDoc(userRef, newProf);
      setProfile(newProf);
      return userCredential.user;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Failed to clear session cookie", e);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const cleaned = cleanData(data);
      if (Object.keys(cleaned).length > 0) {
        await setDoc(userRef, cleaned, { merge: true });
      }
      setProfile((prev) => (prev ? { ...prev, ...cleaned } : null));
    } catch (e) {
      console.error("Failed to update profile", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        linkAccount,
        linkWithEmailPassword,
        loginWithEmailPassword,
        loginWithGoogle,
        deleteAccount,
        resetPassword,
        registerWithEmailPassword,
        logout,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
