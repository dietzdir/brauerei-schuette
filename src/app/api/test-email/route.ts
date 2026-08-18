import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email/emailService";
import { Order } from "@/types";
import { Timestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetEmail = searchParams.get("to") || "dirkdietz22@gmail.com";

  const testOrder: Order = {
    id: "test_" + Date.now().toString(36),
    userId: "test-user",
    customerName: "Dirk Dietz (Test)",
    customerEmail: targetEmail,
    customerPhone: "0170 1234567",
    customerType: "private",
    pickupDate: "Freitag, 21.08.2026",
    pickupTime: "14:00 – 19:00 Uhr",
    status: "pending",
    createdAt: Timestamp.now(),
    items: [
      {
        productId: "test-pils",
        productName: "Börde Pils",
        variantType: "0.75l bottle (6-crate)",
        quantity: 1,
        unitPrice: 450,
        depositPrice: 100,
      },
    ],
    itemsTotalCents: 450,
    depositTotalCents: 100,
    grandTotalCents: 550,
  };

  const res = await sendOrderConfirmationEmail(testOrder);

  return NextResponse.json({
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 7) + "..." : null,
    targetEmail,
    result: res,
  });
}
