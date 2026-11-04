import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getHistoryKey,
  getSessionCookieOptions,
  isSecureRequest,
  readHistorySession,
} from "@/lib/donations/donorHistoryAuth";

/** Shared response helpers for the `/api/public/donor-history` routes. */

export function jsonNoStore(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

export function historyUnavailable(reason) {
  if (reason) console.error("[donor-history] unavailable:", reason);
  return jsonNoStore(
    { error: "Donation history is temporarily unavailable. Please try again later." },
    { status: 503 },
  );
}

/** `{ key, session }`; `key` is "" when NEXTAUTH_SECRET is missing. */
export function getHistorySession(req) {
  const key = getHistoryKey();
  if (!key) return { key: "", session: null };
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value || "";
  return { key, session: token ? readHistorySession(token, key) : null };
}

export function setHistorySessionCookie(res, req, token) {
  res.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions({ secure: isSecureRequest(req) }),
  );
  return res;
}

export function signedOutResponse(req, body = { signedIn: false }, status = 401) {
  const res = jsonNoStore(body, { status });
  res.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    getSessionCookieOptions({ secure: isSecureRequest(req), maxAgeSeconds: 0 }),
  );
  return res;
}

export async function readJsonBody(req) {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
