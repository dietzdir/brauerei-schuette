import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, importX509, decodeProtectedHeader } from 'jose';

const PUBLIC_KEYS_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

// Cache the keys in memory to avoid fetching on every request
let cachedKeys: Record<string, string> | null = null;
let keysFetchedAt = 0;

async function getPublicKeys() {
  const now = Date.now();
  // Refresh cache every hour
  if (!cachedKeys || now - keysFetchedAt > 3600 * 1000) {
    const res = await fetch(PUBLIC_KEYS_URL);
    cachedKeys = await res.json();
    keysFetchedAt = now;
  }
  return cachedKeys;
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

      const keys = await getPublicKeys();
      const cert = keys![kid];
      if (!cert) throw new Error("Public key not found for kid");

      const publicKey = await importX509(cert, 'RS256');

      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'brauerei-schuette';
      
      const { payload } = await jwtVerify(sessionCookie, publicKey, {
        issuer: `https://session.firebase.google.com/${projectId}`,
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
