/**
 * Event RSVP rules (UAT NEW-06): Yes / Maybe / No replies on the public event
 * page. Pure functions and constants only, so client components can import
 * this and scripts can `require` it. Signing lives in `rsvpToken.js`.
 */

export const ATTENDANCE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export const ATTENDANCE_VALUES = ATTENDANCE_OPTIONS.map((option) => option.value);

/** "Maybe" holds a seat: planners treat it as a likely attendee. */
export const SEAT_ATTENDANCE = ["yes", "maybe"];

/** Waitlisted and cancelled replies don't hold a seat, whatever they answered. */
export const SEAT_STATUSES = ["new", "confirmed"];

export const RSVP_SOURCE = "EventRsvp";

export function normalizeAttendance(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ATTENDANCE_VALUES.includes(normalized) ? normalized : "";
}

export function getAttendanceLabel(value) {
  return ATTENDANCE_OPTIONS.find((option) => option.value === value)?.label || "";
}

/** A whole number of at least 1, or null for "no limit". */
export function normalizeRsvpCapacity(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function holdsSeat(reply) {
  return (
    SEAT_ATTENDANCE.includes(reply?.attendance) &&
    SEAT_STATUSES.includes(reply?.status)
  );
}

export function getSeatFilter(eventId) {
  return {
    eventId: String(eventId),
    attendance: { $in: SEAT_ATTENDANCE },
    status: { $in: SEAT_STATUSES },
  };
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Replies close at the admin's closing date or when the event ends, whichever
 * comes first. Not at the start: some events run for months, and registration
 * on those stays open while they're on. An event with neither date stays open
 * until RSVP is switched off.
 */
export function getRsvpState({ event, endAt = null, seatsTaken = 0, now = new Date() }) {
  const enabled = event?.rsvpEnabled === true;
  const capacity = normalizeRsvpCapacity(event?.rsvpCapacity);
  const limits = [toDate(event?.rsvpClosesAt), toDate(endAt)].filter(Boolean);
  const closesAt = limits.length
    ? new Date(Math.min(...limits.map((date) => date.getTime())))
    : null;

  return {
    enabled,
    open: enabled && (!closesAt || now < closesAt),
    full: capacity !== null && seatsTaken >= capacity,
    capacity,
    closesAt,
  };
}

function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545: lines over 75 octets continue on the next line after a space. */
function foldIcsLine(line) {
  const encoder = new TextEncoder();
  let folded = "";
  let octets = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (octets + size > 74) {
      folded += "\r\n ";
      octets = 1;
    }
    folded += character;
    octets += size;
  }
  return folded;
}

function formatIcsInstant(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatIcsDay(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function isUtcMidnight(date) {
  return date.getTime() % 86_400_000 === 0;
}

const DAY_MS = 86_400_000;
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Add-to-calendar file. METHOD:PUBLISH, not REQUEST, because this is a copy of
 * the event for the attendee's calendar, not an invitation expecting a reply.
 * Returns "" when the event has no start date to put on a calendar.
 */
export function buildEventIcs({ event, startAt, endAt = null, url = "", now = new Date() }) {
  const start = toDate(startAt);
  if (!start) return "";
  const end = toDate(endAt);
  const allDay = isUtcMidnight(start);

  const timing = allDay
    ? [
        `DTSTART;VALUE=DATE:${formatIcsDay(start)}`,
        // DTEND is exclusive for all-day events.
        `DTEND;VALUE=DATE:${formatIcsDay(new Date((end && end > start ? end : start).getTime() + DAY_MS))}`,
      ]
    : [
        `DTSTART:${formatIcsInstant(start)}`,
        `DTEND:${formatIcsInstant(end && end > start ? end : new Date(start.getTime() + DEFAULT_DURATION_MS))}`,
      ];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MESCO Trust//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event?._id || event?.slug || "mesco"}@mescotrust.org`,
    `DTSTAMP:${formatIcsInstant(toDate(now) || new Date())}`,
    ...timing,
    `SUMMARY:${escapeIcsText(event?.title || "MESCO Trust event")}`,
    ...(event?.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    ...(event?.location || event?.isOnline
      ? [`LOCATION:${escapeIcsText(event.isOnline ? "Online" : event.location)}`]
      : []),
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
