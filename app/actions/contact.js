"use server";

import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
import { sendContactNotification, sendContactAutoReply } from "@/lib/email";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function submitContact(prevState, formData) {
  const headersList = headers();
  const clientIp = getClientIp({ headers: headersList });

  if (!checkRateLimit(clientIp)) {
    return { error: "Too many requests. Please wait a moment and try again." };
  }

  const name = (formData.get("name") || "").trim();
  const email = (formData.get("email") || "").trim();
  const message = (formData.get("message") || "").trim();
  const page = (formData.get("page") || "").trim();
  const source = (formData.get("source") || "").trim();

  if (!name || !email || !message) {
    return { error: "Name, email, and message are required" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Invalid email address" };
  }

  try {
    await connectDB();
    const submission = await ContactSubmission.create({
      payload: { name, email, message },
      page,
      source,
    });

    try {
      await sendContactNotification(submission);
      await sendContactAutoReply(submission);
    } catch {
      // email delivery is best-effort
    }

    return { success: true, id: String(submission._id) };
  } catch (err) {
    return { error: "Something went wrong. Please try again." };
  }
}
