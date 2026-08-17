import { adminDb } from "../src/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

async function main() {
  const testOrders = [
    {
      id: "TEST_ORDER_1",
      userId: "test-user-1",
      customerName: "Alice Tester",
      customerType: "private",
      status: "pending",
      createdAt: Timestamp.now(),
      items: [
        {
          productId: "p1",
          productName: "Börde Pils",
          variantType: "0.75l bottle",
          quantity: 2,
          unitPrice: 200,
        },
        {
          productId: "p2",
          productName: "Börde Pils",
          variantType: "50l keg",
          quantity: 1,
          unitPrice: 5000,
        }
      ]
    },
    {
      id: "TEST_ORDER_2",
      userId: "test-user-2",
      customerName: "Bob Tester",
      customerType: "business",
      companyName: "Bob's Bar",
      status: "pending",
      createdAt: Timestamp.now(),
      items: [
        {
          productId: "p1",
          productName: "Börde Pils",
          variantType: "0.75l bottle",
          quantity: 5,
          unitPrice: 200,
        }
      ]
    },
    {
      id: "TEST_ORDER_3",
      userId: "test-user-3",
      customerName: "Charlie Tester",
      customerType: "private",
      status: "ready", // Should NOT be aggregated since it's ready, not pending
      createdAt: Timestamp.now(),
      items: [
        {
          productId: "p2",
          productName: "Börde Pils",
          variantType: "50l keg",
          quantity: 10,
          unitPrice: 5000,
        }
      ]
    }
  ];

  for (const order of testOrders) {
    await adminDb.collection("orders").doc(order.id).set(order);
    console.log(`Created test order ${order.id}`);
  }
}

main().catch(console.error);
