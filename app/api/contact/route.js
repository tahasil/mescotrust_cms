import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
import { sendContactNotification, sendContactAutoReply } from "@/lib/email";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import {
  getAiChatbotSettingsRaw,
  getChatbotNotificationOverrides,
} from "@/lib/aiChatbotService";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 5 });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeNotificationOverrides(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const recipientsInput = Array.isArray(input.recipients) ? input.recipients : [];
  const recipients = recipientsInput
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean)
    .filter((email) => EMAIL_RE.test(email))
    .slice(0, 20);
  const subjectPrefix = String(input.subjectPrefix || "").trim().slice(0, 80);
  if (!recipients.length && !subjectPrefix) return null;
  return {
    recipients,
    subjectPrefix,
  };
}

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
      const explicitOverrides = normalizeNotificationOverrides(body.notificationOverrides);
      let effectiveOverrides = explicitOverrides;
      if (!effectiveOverrides && String(body.source || "") === "chatbot-widget") {
        try {
          const chatbotSettings = await getAiChatbotSettingsRaw();
          effectiveOverrides = getChatbotNotificationOverrides(chatbotSettings);
        } catch {
          effectiveOverrides = null;
        }
      }

      await sendContactNotification(submission, effectiveOverrides || {});
      await sendContactAutoReply(submission);
    } catch (e) {
      console.error("Email send failed:", e);
    }

    return NextResponse.json({ success: true, id: submission._id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
