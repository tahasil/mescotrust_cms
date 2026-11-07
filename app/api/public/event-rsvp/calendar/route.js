import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";
import { getEventEndAt, getEventStartAt } from "@/components/events/eventDisplay";
import { buildEventIcs } from "@/lib/events/rsvp";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";

/** `GET ?slug=...` — the event as an .ics file, for "Add to calendar" links. */
export async function GET(req) {
  try {
    const slug = (new URL(req.url).searchParams.get("slug") || "").trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await connectDB();
    const event = await Event.findOne({ slug, status: "published" }).lean();
    const ics = event
      ? buildEventIcs({
          event,
          startAt: getEventStartAt(event),
          endAt: getEventEndAt(event),
          url: `${getSiteUrl()}/events/${event.slug}`,
        })
      : "";
    if (!ics) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("[EventRsvp] Calendar failed:", err?.message || err);
    return NextResponse.json({ error: "Could not build calendar file" }, { status: 500 });
  }
}
