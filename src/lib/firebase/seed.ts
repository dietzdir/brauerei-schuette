import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection } from "firebase/firestore";
import { Product } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBcBycmgKHcMw6FIg6Rh9HV4WzA924F_uM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "brauerei-schuette.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brauerei-schuette",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "brauerei-schuette.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "841287897950",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:841287897950:web:ba8cf5253e48d90d0b35cf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialProducts: Omit<Product, "id">[] = [
  {
    name: "Börde Hell",
    category: "Beer",
    alcohol: "4,8 % vol.",
    color: "Hellgelb, golden",
    flavorProfile: "Leicht gehopft, sanfte Malznote, erfrischend süffig",
    description:
      "Ein leicht gehopftes, vollmundiges Bier in herrlich hellgelber, goldener Farbe. Der sanfte Hopfenanteil und die ausgewogene Malzigkeit sorgen für ein harmonisches Geschmackserlebnis – erfrischend, süffig und wunderbar aromatisch.",
    depositInfo: "0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/5-liter-fass.jpg",
    variants: [
      { type: "0.75l bottle", price: 400, deposit: 100, sku: "BH-075" },
      { type: "5l keg", price: 1950, deposit: 25, sku: "BH-5L" },
      { type: "10l keg", price: 3400, deposit: 2000, sku: "BH-10L" },
      { type: "30l keg", price: 8500, deposit: 2000, sku: "BH-30L" },
      { type: "50l keg", price: 13500, deposit: 2000, sku: "BH-50L" },
    ],
  },
  {
    name: "Börde Dunkel",
    category: "Beer",
    alcohol: "4,8 % vol.",
    color: "Tief bernsteinfarben",
    flavorProfile: "Vollmundig, reiches Malzaroma, sanfte Hopfennote",
    description:
      "Ein vollmundiges, leicht gehopftes Bier in tief bernsteinfarbener Optik mit reichem, malzigem Aroma. Perfekt für alle, die ein geschmackvolles Bier mit angenehmer Tiefe und ausgewogener Balance schätzen.",
    depositInfo: "0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/5-liter-fass.jpg",
    variants: [
      { type: "0.75l bottle", price: 400, deposit: 100, sku: "BD-075" },
      { type: "5l keg", price: 2100, deposit: 25, sku: "BD-5L" },
      { type: "10l keg", price: 3600, deposit: 2000, sku: "BD-10L" },
      { type: "30l keg", price: 8900, deposit: 2000, sku: "BD-30L" },
      { type: "50l keg", price: 13900, deposit: 2000, sku: "BD-50L" },
    ],
  },
  {
    name: "Börde Pils",
    category: "Beer",
    alcohol: "4,9 % vol.",
    color: "Klassisches Strohgelb, glanzfein",
    flavorProfile: "Feinherb, kräuterig-frischer Aromahopfen, schlanker Körper",
    description:
      "Klassisch handwerklich gebrautes Pilsner mit spritziger Kohlensäure und markanter, feinherber Hopfennote aus feinsten Aromahopfen. Frisch gezapft ein unverwechselbar klarer Genuss.",
    depositInfo: "0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/5-liter-fass.jpg",
    variants: [
      { type: "0.75l bottle", price: 400, deposit: 100, sku: "BP-075" },
      { type: "5l keg", price: 1950, deposit: 25, sku: "BP-5L" },
      { type: "10l keg", price: 3400, deposit: 2000, sku: "BP-10L" },
      { type: "30l keg", price: 8500, deposit: 2000, sku: "BP-30L" },
      { type: "50l keg", price: 13500, deposit: 2000, sku: "BP-50L" },
    ],
  },
  {
    name: "Cold Pale Ale",
    category: "Beer",
    alcohol: "5,2 % vol.",
    color: "Leuchtend goldgelb",
    flavorProfile: "Kaltgehopft, fruchtige Zitrusnoten, knackig trocken",
    description:
      "Modern interpretiertes Pale Ale, kalt vergoren und reichhaltig aroma-kaltgehopft. Begeistert mit intensiven Fruchtaromen von Grapefruit und Maracuja bei gleichzeitig erfrischend trockenem Abgang.",
    depositInfo: "0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/5-liter-fass.jpg",
    variants: [
      { type: "0.75l bottle", price: 450, deposit: 100, sku: "CPA-075" },
      { type: "5l keg", price: 2300, deposit: 25, sku: "CPA-5L" },
      { type: "10l keg", price: 3900, deposit: 2000, sku: "CPA-10L" },
      { type: "30l keg", price: 9500, deposit: 2000, sku: "CPA-30L" },
      { type: "50l keg", price: 14900, deposit: 2000, sku: "CPA-50L" },
    ],
  },
  {
    name: "Wakatu Lager",
    category: "Beer",
    alcohol: "5,0 % vol.",
    color: "Sonniges Gold",
    flavorProfile: "Neuseeländischer Wakatu-Hopfen, Limette & blumig",
    description:
      "Gebraut mit dem neuseeländischen Aromahopfen Wakatu. Verleiht diesem untergärigen Lagerbier eine subtile, elegante Note von frischer Limette und floralen Nuancen. Außergewöhnlich geschmeidig.",
    depositInfo: "0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/5-liter-fass.jpg",
    variants: [
      { type: "0.75l bottle", price: 450, deposit: 100, sku: "WL-075" },
      { type: "5l keg", price: 2300, deposit: 25, sku: "WL-5L" },
      { type: "10l keg", price: 3900, deposit: 2000, sku: "WL-10L" },
      { type: "30l keg", price: 9500, deposit: 2000, sku: "WL-30L" },
      { type: "50l keg", price: 14900, deposit: 2000, sku: "WL-50L" },
    ],
  },
  {
    name: "Hefeweizen",
    category: "Beer",
    alcohol: "5,3 % vol.",
    color: "Goldgelb mit feinem Kupferstich",
    flavorProfile: "Fruchtig-würzig, Banane & Nelke, feinperlig",
    description:
      "Obergäriger Klassiker mit charakteristischen Noten von reifer Banane und Nelke. Ausgewogen, hefetrüb und wunderbar erfrischend – der perfekte Begleiter für sonnige Tage.",
    depositInfo: "0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/5-liter-fass.jpg",
    variants: [
      { type: "0.75l bottle", price: 400, deposit: 100, sku: "HW-075" },
      { type: "5l keg", price: 2100, deposit: 25, sku: "HW-5L" },
      { type: "10l keg", price: 3600, deposit: 2000, sku: "HW-10L" },
      { type: "30l keg", price: 8900, deposit: 2000, sku: "HW-30L" },
      { type: "50l keg", price: 13900, deposit: 2000, sku: "HW-50L" },
    ],
  },
  {
    name: "Fassbrause Himbeere & Kirsch",
    category: "Lemonade",
    alcohol: "Alkoholfrei",
    color: "Rubinrot",
    flavorProfile: "Spritzig, fruchtige Himbeere & saftige Kirsche, frech & erfrischend",
    description:
      "ZISCH! BLÜH! HMMMM! – Handgemachte Fassbrause aus Rottmersleben mit dem vollen Aroma von sonnengereiften Himbeeren und dunklen Kirschen. Aus dem Fass hergestellt, alkoholfrei und spritzig.",
    depositInfo: "0,33l Flasche zzgl. 0,08 € Pfand | 0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/fassbrause.jpg",
    variants: [
      { type: "0.33l bottle", price: 250, deposit: 8, sku: "FB-HK-033" },
      { type: "0.75l bottle", price: 400, deposit: 100, sku: "FB-HK-075" },
    ],
  },
  {
    name: "Fassbrause Holunderblüte & Birne",
    category: "Lemonade",
    alcohol: "Alkoholfrei",
    color: "Helles Strohgelb",
    flavorProfile: "Feine Holunderblüte, fruchtige Birne, herrlich blumig & frisch",
    description:
      "ZISCH! BLÜH! HMMMM! – Eine elegante Komposition aus aromatischen Holunderblüten und saftiger Birne. Frisch und belebend, traditionell im Fass gereift.",
    depositInfo: "0,33l Flasche zzgl. 0,08 € Pfand | 0,75l Flasche zzgl. 1,- € Pfand",
    image: "/images/fassbrause.jpg",
    variants: [
      { type: "0.33l bottle", price: 250, deposit: 8, sku: "FB-HB-033" },
      { type: "0.75l bottle", price: 400, deposit: 100, sku: "FB-HB-075" },
    ],
  },
  {
    name: "Hopfenwasser",
    category: "Lemonade",
    alcohol: "0,0 % vol. (Alkoholfrei)",
    color: "Kristallklar",
    flavorProfile: "Aroma-Hopfen, spritzig, herb-erfrischend, 0% Zucker",
    description:
      "Unser neues Getränk für heiße Tage! Spritziges Brauwasser verfeinert mit feinstem Aroma-Hopfen. Der ideale Durstlöscher – 100% alkoholfrei, komplett ohne Zucker oder Süßstoffe.",
    depositInfo: "0,33l Flasche zzgl. 0,08 € Pfand",
    image: "/images/hopfenwasser.jpg",
    variants: [
      { type: "0.33l bottle", price: 142, deposit: 8, sku: "HWASSER-033" },
    ],
  },
];

export async function seedProductsIfEmpty() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    if (snapshot.empty) {
      console.log("Products collection is empty. Seeding initial brewery catalog...");
      for (const prod of initialProducts) {
        const id = prod.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        await setDoc(doc(db, "products", id), {
          ...prod,
          id,
        });
        console.log(`Added product: ${prod.name}`);
      }
      console.log("Seeding complete!");
    }
  } catch (error) {
    console.error("Error checking/seeding products:", error);
  }
}

export { initialProducts };
