import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Unique build ID generated when the server process boots
const SERVER_BUILD_ID =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.BUILD_ID ||
  `build_${Date.now()}`;

export async function GET() {
  return NextResponse.json(
    {
      buildId: SERVER_BUILD_ID,
      timestamp: Date.now(),
      status: "ok",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
