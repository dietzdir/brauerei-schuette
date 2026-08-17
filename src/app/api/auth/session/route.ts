import { NextResponse } from "next/server";
import { jwtVerify, importX509, decodeProtectedHeader } from "jose";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedCerts: Record<string, string> | null = null;
let certsFetchedAt = 0;

async function getGoogleCerts() {
  const now = Date.now();
  if (!cachedCerts || now - certsFetchedAt > 3600 * 1000) {
    const res = await fetch(GOOGLE_CERTS_URL);
    cachedCerts = await res.json();
    certsFetchedAt = now;
  }
  return cachedCerts;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "No ID token provided" }, { status: 401 });
    }

    const header = decodeProtectedHeader(idToken);
    const kid = header.kid;
    if (!kid) {
      return NextResponse.json({ error: "Invalid token header" }, { status: 401 });
    }

    const certs = await getGoogleCerts();
    const cert = certs![kid];
    if (!cert) {
      return NextResponse.json({ error: "Public cert not found" }, { status: 401 });
    }

    const publicKey = await importX509(cert, "RS256");
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brauerei-schuette";

    const { payload } = await jwtVerify(idToken, publicKey, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });

    if (payload.admin !== true) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

    const response = NextResponse.json({ success: true });

    // Set the session cookie with the verified ID token
    const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
    response.cookies.set("session", idToken, {
      maxAge: expiresIn,
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
