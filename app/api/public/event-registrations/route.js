import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EventRegistration from "@/models/EventRegistration";
import ThemeConfig from "@/models/ThemeConfig";
import { sendEventRegistrationAck } from "@/lib/email";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

// Per-IP rate limit so the public endpoint can't be flooded
const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function POST(req) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();

    // Honeypot — silent reject if a hidden field was filled
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true, id: null }, { status: 201 });
    }

    const eventTitle = (body.eventTitle || "").trim();
    const eventDate = (body.eventDate || "").trim();
    const eventId = (body.eventId || "").trim();
    const eventSlug = (body.eventSlug || "").trim().toLowerCase();

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const phone = (body.phone || "").trim();
    const school = (body.school || "").trim();
    const classOrYear = (body.classOrYear || "").trim();
    const message = (body.message || "").trim();

    if (!eventTitle) {
      return NextResponse.json({ error: "Event title is required" }, { status: 400 });
    }
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await connectDB();
    const registration = await EventRegistration.create({
      eventTitle,
      eventDate,
      eventId,
      eventSlug,
      payload: { name, email, phone, school, classOrYear, message },
      page: (body.page || "").trim(),
      source: (body.source || "EventRegistrationForm").trim(),
    });

    // Best-effort acknowledgement email — never blocks the response
    try {
      const theme = await ThemeConfig.findOne({}).lean();
      const orgInfo = theme
        ? {
            siteTitle: theme.siteTitle,
            footerEmail: theme.footerEmail,
            footerPhone: theme.footerPhone,
            footerAddress: theme.footerAddress,
            logoLightUrl: theme.logoLightUrl,
            logoImageUrl: theme.logoImageUrl,
          }
        : {};
      await sendEventRegistrationAck(registration.toObject(), orgInfo);
    } catch (e) {
      console.error("[EventRegistration] Email send failed:", e?.message || e);
    }

    return NextResponse.json(
      { success: true, id: registration._id },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
