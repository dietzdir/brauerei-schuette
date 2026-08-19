import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  collection,
  doc,
  Firestore,
} from "firebase/firestore";
import { Product, Order, UserProfile, StoreSettings } from "@/types";

export const productConverter: FirestoreDataConverter<Product> = {
  toFirestore(product: Product): DocumentData {
    const { id, ...data } = product;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Product {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name || "",
      category: data.category || "Beer",
      variants: data.variants || [],
      description: data.description,
      ingredients: data.ingredients,
      alcohol: data.alcohol,
      color: data.color,
      flavorProfile: data.flavorProfile,
      depositInfo: data.depositInfo,
      image: data.image,
      isAiGenerated: data.isAiGenerated,
      badge: data.badge,
      isActive: data.isActive !== false,
    };
  },
};

export const orderConverter: FirestoreDataConverter<Order> = {
  toFirestore(order: Order): DocumentData {
    const { id, ...data } = order;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Order {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId || "",
      customerName: data.customerName || "",
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      street: data.street,
      houseNumber: data.houseNumber,
      zipCode: data.zipCode,
      city: data.city,
      customerType: data.customerType || "private",
      companyName: data.companyName,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      status: data.status || "pending",
      createdAt: data.createdAt,
      items: data.items || [],
      itemsTotalCents: data.itemsTotalCents,
      depositTotalCents: data.depositTotalCents,
      grandTotalCents: data.grandTotalCents,
    };
  },
};

export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(profile: UserProfile): DocumentData {
    const { ...data } = profile;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): UserProfile {
    const data = snapshot.data(options);
    return {
      uid: snapshot.id,
      customerType: data.customerType || "private",
      companyName: data.companyName,
      displayName: data.displayName,
      photoURL: data.photoURL,
      email: data.email,
      phoneNumber: data.phoneNumber,
      street: data.street,
      houseNumber: data.houseNumber,
      zipCode: data.zipCode,
      city: data.city,
      isAnonymous: data.isAnonymous ?? true,
      createdAt: data.createdAt,
    };
  },
};

export const storeSettingsConverter: FirestoreDataConverter<StoreSettings> = {
  toFirestore(settings: StoreSettings): DocumentData {
    return { ...settings };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): StoreSettings {
    const data = snapshot.data(options);
    return {
      regularDayOfWeek: data?.regularDayOfWeek ?? 5,
      regularOpenTime: data?.regularOpenTime ?? "14:00",
      regularCloseTime: data?.regularCloseTime ?? "19:00",
      exceptions: data?.exceptions ?? [],
      bannerNotice: data?.bannerNotice,
      bannerLookaheadDays: data?.bannerLookaheadDays ?? 14,
    };
  },
};

// Helper methods to get typed collections/documents
export function getProductsCollection(db: Firestore) {
  return collection(db, "products").withConverter(productConverter);
}

export function getOrdersCollection(db: Firestore) {
  return collection(db, "orders").withConverter(orderConverter);
}

export function getUsersCollection(db: Firestore) {
  return collection(db, "users").withConverter(userProfileConverter);
}

export function getStoreSettingsDoc(db: Firestore) {
  return doc(db, "settings", "store").withConverter(storeSettingsConverter);
}
