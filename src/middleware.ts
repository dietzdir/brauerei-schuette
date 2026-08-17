import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, importX509, decodeProtectedHeader } from 'jose';

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> | null = null;
let certsFetchedAt = 0;

async function getGoogleCerts() {
  const now = Date.now();
  // Refresh cache every hour
  if (!cachedCerts || now - certsFetchedAt > 3600 * 1000) {
    const res = await fetch(GOOGLE_CERTS_URL);
    cachedCerts = await res.json();
    certsFetchedAt = now;
  }
  return cachedCerts;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const header = decodeProtectedHeader(sessionCookie);
      const kid = header.kid;
      if (!kid) throw new Error("No kid found in JWT header");

      const certs = await getGoogleCerts();
      const cert = certs![kid];
      if (!cert) throw new Error("Public cert not found for kid");

      const publicKey = await importX509(cert, 'RS256');
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'brauerei-schuette';

      const { payload } = await jwtVerify(sessionCookie, publicKey, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ['RS256'],
      });

      if (payload.admin !== true) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Valid admin session, proceed
      return NextResponse.next();
    } catch (error) {
      console.error('Session cookie verification failed in middleware:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
