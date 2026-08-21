import { adminDb } from "../src/lib/firebase/admin";

async function seedRentals() {
  const rentalsRef = adminDb.collection("rentals");
  
  const sampleRentals = [
    {
      id: "zapfanlage",
      name: "Profi-Bierzapfanlage mit Durchlaufkühler",
      description:
        "Kompakte, leistungsstarke Trockenkühl-Zapfanlage für 5l, 10l, 30l und 50l Fässer. Inklusive Zapfhahn, Tropfblech, CO2-Druckminderer und passenden Schläuchen. Binnen weniger Minuten einsatzbereit.",
      image: "/images/zapfanlage.jpg",
      isAiGenerated: true,
      rentalPriceCents: 2500,
      depositCents: 5000,
      totalStock: 3,
      isActive: true,
    },
    {
      id: "bierzeltgarnitur",
      name: "Bierzeltgarnitur (1 Tisch + 2 Bänke)",
      description:
        "Stabile, wetterfest lasierte Holzgarnitur für bis zu 10 Personen. Klappbar für einfachen Transport im PKW/Kombi. Tisch: 220 x 50 cm, Bänke: 220 x 25 cm.",
      image: "",
      isAiGenerated: false,
      rentalPriceCents: 1500,
      depositCents: 2000,
      totalStock: 5,
      isActive: true,
    },
  ];

  for (const item of sampleRentals) {
    await rentalsRef.doc(item.id).set(item, { merge: true });
    console.log(`Seeded rental item: ${item.name} (${item.id})`);
  }

  const snapshot = await rentalsRef.get();
  console.log(`Total rentals in Firestore: ${snapshot.size}`);
  snapshot.forEach((doc) => {
    console.log(` - ${doc.id}: ${doc.data().name} (${doc.data().rentalPriceCents / 100} €)`);
  });
}

seedRentals().then(() => process.exit(0)).catch((err) => {
  console.error("Error seeding rentals:", err);
  process.exit(1);
});
