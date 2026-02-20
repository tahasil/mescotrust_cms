import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
import { sendContactNotification, sendContactAutoReply } from "@/lib/email";

const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function getClientId(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(clientId) {
  const now = Date.now();
  const bucket = RATE_LIMIT_MAP.get(clientId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count++;
  RATE_LIMIT_MAP.set(clientId, bucket);
  if (bucket.count > RATE_LIMIT_MAX) {
    return false;
  }
  return true;
}

export async function POST(req) {
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await connectDB();
    const submission = await ContactSubmission.create({
      payload: { name, email, message },
      page: body.page || "",
      source: body.source || "",
    });

    try {
      await sendContactNotification(submission);
      await sendContactAutoReply(submission);
    } catch (e) {
      console.error("Email send failed:", e);
    }

    return NextResponse.json({ success: true, id: submission._id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
