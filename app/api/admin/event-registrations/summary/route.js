import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { SEAT_ATTENDANCE, SEAT_STATUSES } from "@/lib/events/rsvp";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";

export const dynamic = "force-dynamic";

function countWhen(condition) {
  return { $sum: { $cond: [condition, 1, 0] } };
}

/**
 * RSVP totals per event, counted in the database so they stay right however
 * many replies an event gets. The list page only ever holds a page of rows.
 */
export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const groups = await EventRegistration.aggregate([
      { $match: { attendance: { $exists: true } } },
      {
        $group: {
          _id: "$eventId",
          title: { $last: "$eventTitle" },
          yes: countWhen({ $eq: ["$attendance", "yes"] }),
          maybe: countWhen({ $eq: ["$attendance", "maybe"] }),
          no: countWhen({ $eq: ["$attendance", "no"] }),
          seatsTaken: countWhen({
            $and: [
              { $in: ["$attendance", SEAT_ATTENDANCE] },
              { $in: ["$status", SEAT_STATUSES] },
            ],
          }),
          latestReplyAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { latestReplyAt: -1 } },
    ]);

    const events = await Event.find({ _id: { $in: groups.map((group) => group._id) } })
      .select("title rsvpCapacity")
      .lean();
    const eventsById = new Map(events.map((event) => [String(event._id), event]));

    return NextResponse.json({
      items: groups.map(({ _id, title, yes, maybe, no, seatsTaken }) => {
        const event = eventsById.get(String(_id));
        return {
          eventId: _id,
          title: event?.title || title || "",
          yes,
          maybe,
          no,
          seatsTaken,
          capacity: event?.rsvpCapacity ?? null,
        };
      }),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
