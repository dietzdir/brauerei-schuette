import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (sessionCookie) {
    try {
      let decoded;
      try {
        decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      } catch {
        decoded = await adminAuth.verifyIdToken(sessionCookie, false);
      }
      if (decoded?.uid) {
        await adminAuth.revokeRefreshTokens(decoded.uid);
      }
    } catch (e) {
      console.warn("Could not revoke tokens on logout:", e);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
