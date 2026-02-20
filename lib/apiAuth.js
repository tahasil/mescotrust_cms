import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

/**
 * Get session from JWT in API route. Returns null if not authenticated.
 */
export async function getSession(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token;
}

/**
 * Require auth in API route. Returns NextResponse with 401 if not authenticated.
 */
export async function requireAuth(req) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
