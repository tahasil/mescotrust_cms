import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import VolunteersFeedbackSubmission from "@/models/VolunteersFeedbackSubmission";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 5 });
export const dynamic = "force-dynamic";

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function validName(value) {
  return /^[A-Za-z]+(?:[A-Za-z .'-]*[A-Za-z])?$/.test(value);
}

export async function POST(req) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const honeypot = normalizeText(body?.volunteersFeedbackTrap || body?.website);
    if (honeypot) {
      return NextResponse.json(
        { error: "Invalid submission. Please try again." },
        { status: 400 },
      );
    }

    const name = normalizeText(body?.name);
    const email = normalizeText(body?.email).toLowerCase();
    const phone = normalizeText(body?.phone);
    const msg = normalizeText(body?.message);
    const page = normalizeText(body?.page);
    const source = normalizeText(body?.source || "volunteers-feedback");

    if (!name || !email || !phone || !msg) {
      return NextResponse.json(
        { error: "Name, email, phone, and message are required" },
        { status: 400 },
      );
    }
    if (!validName(name)) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!validPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    await connectDB();
    const submission = await VolunteersFeedbackSubmission.create({
      payload: {
        name,
        email,
        phone,
        message: msg,
      },
      page,
      source,
    });

    return NextResponse.json(
      {
        success: true,
        id: submission._id,
        message: "Thank you for your feedback.",
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
