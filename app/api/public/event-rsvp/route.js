import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { sendEventRsvpEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import {
  formatEventDateRange,
  formatLocationLine,
  getEventEndAt,
} from "@/components/events/eventDisplay";
import {
  RSVP_SOURCE,
  SEAT_ATTENDANCE,
  getRsvpState,
  getSeatFilter,
  holdsSeat,
  normalizeAttendance,
  normalizeRsvpCapacity,
} from "@/lib/events/rsvp";
import { getRsvpKey, issueRsvpToken, readRsvpToken } from "@/lib/events/rsvpToken";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";
import ThemeConfig from "@/models/ThemeConfig";

export const dynamic = "force-dynamic";

// Sized for a whole college or office replying from one shared network. The
// honeypot and one reply per email guard the rest, and the cooldown below stops
// repeat replies being used to flood someone's inbox.
const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 60 });
const CHANGE_LINK_COOLDOWN_MS = 10 * 60 * 1000;

const NO_STORE = { "Cache-Control": "no-store" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s()-]{6,19}$/;

function reply(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

async function loadRsvpEvent(slug) {
  if (!slug) return null;
  return Event.findOne({ slug, status: "published" }).lean();
}

async function loadState(event) {
  const capacity = normalizeRsvpCapacity(event.rsvpCapacity);
  const seatsTaken = capacity
    ? await EventRegistration.countDocuments(getSeatFilter(event._id))
    : 0;
  return getRsvpState({ event, endAt: getEventEndAt(event), seatsTaken });
}

async function findTokenReply(token, event, key) {
  const parsed = readRsvpToken(token, key);
  if (!parsed || parsed.eventId !== String(event._id)) return null;
  if (!mongoose.Types.ObjectId.isValid(parsed.registrationId)) return null;
  return EventRegistration.findOne({
    _id: parsed.registrationId,
    eventId: parsed.eventId,
    attendance: { $exists: true },
  });
}

/** Email failures never fail the reply: it's saved and the admin can see it. */
async function emailReply(kind, registration, event, key) {
  try {
    const siteUrl = getSiteUrl();
    const token = key ? issueRsvpToken(registration._id, event._id, key) : "";
    const theme = await ThemeConfig.findOne({}).select("siteTitle footerEmail").lean();
    await sendEventRsvpEmail(
      {
        kind,
        to: registration.payload.email,
        name: registration.payload.name,
        attendance: registration.attendance,
        eventTitle: event.title,
        eventDate: registration.eventDate,
        venue: event.isOnline ? "Online" : formatLocationLine(event),
        changeUrl: token
          ? `${siteUrl}/events/${event.slug}?rsvp=${encodeURIComponent(token)}`
          : "",
        calendarUrl: event.startDate
          ? `${siteUrl}/api/public/event-rsvp/calendar?slug=${encodeURIComponent(event.slug)}`
          : "",
      },
      theme || {},
    );
  } catch (err) {
    console.error("[EventRsvp] Email failed:", err?.message || err);
  }
}

/** `GET ?slug=...&token=...` — whether replies are open, plus the holder's reply. */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get("slug") || "").trim().toLowerCase();
    const token = searchParams.get("token") || "";

    await connectDB();
    const event = await loadRsvpEvent(slug);
    if (!event?.rsvpEnabled) return reply({ enabled: false });

    const state = await loadState(event);
    const existing = token ? await findTokenReply(token, event, getRsvpKey()) : null;

    return reply({
      enabled: true,
      open: state.open,
      full: state.full,
      closesAt: state.closesAt,
      tokenInvalid: Boolean(token) && !existing,
      reply: existing
        ? {
            attendance: existing.attendance,
            name: existing.payload.name,
            email: existing.payload.email,
            phone: existing.payload.phone,
          }
        : null,
    });
  } catch (err) {
    console.error("[EventRsvp] GET failed:", err?.message || err);
    return reply({ error: "Could not load RSVP details" }, 500);
  }
}

export async function POST(req) {
  if (!checkRateLimit(getClientIp(req))) {
    return reply({ error: "Too many requests. Please try again in a minute." }, 429);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return reply({ error: "Invalid request" }, 400);
    }

    // Honeypot: look successful so bots don't adapt.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return reply({ success: true, status: "saved" });
    }

    const attendance = normalizeAttendance(body.attendance);
    if (!attendance) {
      return reply({ error: "Please choose Yes, Maybe or No" }, 400);
    }

    await connectDB();
    // The title, date and capacity all come from the event, never from the browser.
    const event = await loadRsvpEvent(String(body.slug || "").trim().toLowerCase());
    if (!event?.rsvpEnabled) {
      return reply({ error: "RSVP is not available for this event" }, 404);
    }

    const state = await loadState(event);
    if (!state.open) {
      return reply({ error: "RSVP for this event has closed", code: "closed" }, 409);
    }

    const key = getRsvpKey();
    const token = typeof body.token === "string" ? body.token : "";
    const tokenReply = token ? await findTokenReply(token, event, key) : null;
    if (token && !tokenReply) {
      return reply({ error: "This link is no longer valid", code: "invalid_token" }, 403);
    }

    const name = sanitizePlainText(String(body.name || "")).trim().slice(0, 120);
    const phone = sanitizePlainText(String(body.phone || "")).trim().slice(0, 30);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);

    if (!tokenReply) {
      if (!name) return reply({ error: "Please enter your name" }, 400);
      if (!EMAIL_PATTERN.test(email)) {
        return reply({ error: "Please enter a valid email address" }, 400);
      }
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      return reply({ error: "Please enter a valid phone number" }, 400);
    }

    const eventId = String(event._id);
    if (!tokenReply) {
      const existing = await EventRegistration.findOne({
        eventId,
        "payload.email": email,
        attendance: { $exists: true },
      });
      if (existing) {
        // Claimed atomically, so simultaneous repeats send one email at most.
        const claimed = await EventRegistration.findOneAndUpdate(
          {
            _id: existing._id,
            $or: [
              { rsvpLinkSentAt: null },
              { rsvpLinkSentAt: { $lt: new Date(Date.now() - CHANGE_LINK_COOLDOWN_MS) } },
            ],
          },
          { $set: { rsvpLinkSentAt: new Date() } },
        );
        if (claimed) await emailReply("change_link", existing, event, key);
        return reply({ success: true, status: "already_replied" });
      }
    }

    const needsSeat =
      SEAT_ATTENDANCE.includes(attendance) && !(tokenReply && holdsSeat(tokenReply));
    if (needsSeat && state.full) {
      return reply({ error: "This event is full", code: "full" }, 409);
    }

    if (tokenReply) {
      tokenReply.attendance = attendance;
      if (name) tokenReply.payload.name = name;
      if (body.phone !== undefined) tokenReply.payload.phone = phone;
      await tokenReply.save();
      await emailReply("confirmed", tokenReply, event, key);
      return reply({ success: true, status: "saved", attendance });
    }

    let created;
    try {
      created = await EventRegistration.create({
        eventTitle: event.title,
        eventDate: formatEventDateRange(event.startDate, event.endDate),
        eventId,
        eventSlug: event.slug,
        attendance,
        payload: { name, email, phone },
        page: `/events/${event.slug}`,
        source: RSVP_SOURCE,
      });
    } catch (err) {
      // Two replies from one email at once: the unique index lets only one in.
      if (err?.code === 11000) return reply({ success: true, status: "already_replied" });
      throw err;
    }

    // Concurrent replies can all pass the check above. Everyone sorts the same
    // way, so the earliest rows keep the seats and any overflow removes itself.
    if (needsSeat && state.capacity) {
      const seated = await EventRegistration.find(getSeatFilter(eventId))
        .sort({ _id: 1 })
        .limit(state.capacity)
        .select("_id")
        .lean();
      if (!seated.some((row) => String(row._id) === String(created._id))) {
        await EventRegistration.deleteOne({ _id: created._id });
        return reply({ error: "This event is full", code: "full" }, 409);
      }
    }

    await emailReply("confirmed", created, event, key);
    return reply({ success: true, status: "saved", attendance }, 201);
  } catch (err) {
    console.error("[EventRsvp] POST failed:", err?.message || err);
    return reply({ error: "Could not save your reply. Please try again." }, 500);
  }
}
