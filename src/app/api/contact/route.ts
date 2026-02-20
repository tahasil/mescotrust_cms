import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactSubmission } from "@/models";

const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;
const store = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return false;
  if (now > entry.resetAt) {
    store.delete(key);
    return false;
  }
  return entry.count >= RATE_LIMIT;
}

function recordRequest(key: string): void {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count++;
}

export async function POST(req: NextRequest) {
  const key = getClientKey(req);
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  recordRequest(key);
  await connectDB();
  const payload = JSON.stringify({ name, email, message });
  await ContactSubmission.create({ payload, formId: "default" });
  return NextResponse.json({ ok: true });
}
