import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
import { sendContactNotification, sendContactAutoReply } from "@/lib/email";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function POST(req) {
  const clientId = getClientIp(req);
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
