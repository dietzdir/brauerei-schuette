import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "No ID token provided" }, { status: 401 });
    }

    // Verify the ID token first
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    
    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ success: true });

    // Set the cookie on the response
    response.cookies.set("session", sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge in NextResponse.cookies is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
