const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function getEventImageSources(event) {
  const desktop = (event?.featuredImageDesktop || "").trim();
  const mobile = (event?.featuredImageMobile || "").trim() || desktop;
  return { desktop, mobile };
}

export function formatEventDayDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

export function formatEventDateRange(startDate, endDate) {
  const a = formatEventDayDate(startDate);
  const b = formatEventDayDate(endDate);
  if (!a && !b) return "";
  if (a && b && a !== b) return `${a} - ${b}`;
  return a || b;
}

export function formatEventDateTimeLine(event) {
  const datePart = formatEventDateRange(event?.startDate, event?.endDate);
  const timePart = (event?.time || "").trim();
  if (datePart && timePart) return `${datePart} | ${timePart}`;
  return datePart || timePart;
}

export function getEventStartTimeText(timeValue) {
  const [startTime] = splitEventTimeRange(timeValue);
  return startTime || "";
}

export function getEventEndTimeText(timeValue) {
  const [, endTime] = splitEventTimeRange(timeValue);
  return endTime || "";
}

export function formatLocationLine(event) {
  if (event?.isOnline) return "Online";
  const loc = (event?.location || "").trim();
  return loc || "";
}

function toValidDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function splitEventTimeRange(timeValue) {
  const raw = (timeValue || "").toString().trim();
  if (!raw) return [];
  return raw
    .split(/\s*(?:\u2013|-|to)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseTimePartToMinutes(timePart) {
  const raw = (timePart || "")
    .toString()
    .trim()
    .replace(/\./g, ":");
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] != null ? Number(match[2]) : 0;
  const meridiem = (match[3] || "").toLowerCase();

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (meridiem === "pm") hours += 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function parseEventTimeRange(timeValue) {
  const [start, end] = splitEventTimeRange(timeValue);
  return {
    startMinutes: parseTimePartToMinutes(start),
    endMinutes: parseTimePartToMinutes(end),
  };
}

function hasExplicitUtcTime(dateValue) {
  return (
    dateValue.getUTCHours() !== 0 ||
    dateValue.getUTCMinutes() !== 0 ||
    dateValue.getUTCSeconds() !== 0 ||
    dateValue.getUTCMilliseconds() !== 0
  );
}

function atUtcDayTime(dateValue, minutesFromMidnight = null, endOfDay = false) {
  const d = toValidDate(dateValue);
  if (!d) return null;

  // Prefer the persisted timestamp when DB already stores exact date-time.
  if (hasExplicitUtcTime(d)) return d;

  if (Number.isFinite(minutesFromMidnight)) {
    const hour = Math.floor(minutesFromMidnight / 60);
    const minute = minutesFromMidnight % 60;
    return new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        hour,
        minute,
        0,
        0,
      ),
    );
  }

  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    ),
  );
}

/**
 * Mirrors events listing logic:
 * - if endDate exists, event is past when current time is after endDate(+end time)
 * - otherwise fallback to startDate for past detection
 */
export function isEventPast(event, baseDate = new Date()) {
  const now = toValidDate(baseDate) || new Date();
  const { endMinutes } = parseEventTimeRange(event?.time);
  const endDate = toValidDate(event?.endDate);
  if (endDate) {
    const endAt = atUtcDayTime(endDate, endMinutes, true);
    return endAt ? endAt < now : false;
  }

  const startDate = toValidDate(event?.startDate);
  if (startDate) {
    const fallbackEndAt = atUtcDayTime(startDate, endMinutes, true);
    return fallbackEndAt ? fallbackEndAt < now : false;
  }

  return false;
}

function atUtcDayStart(value) {
  const date = toValidDate(value);
  if (!date) return null;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Date-only listing status. Start and end dates are inclusive, so an event
 * running 1–31 July remains live for the complete day on 31 July.
 */
export function getEventDateStatus(event, baseDate = new Date()) {
  const today = atUtcDayStart(baseDate) || atUtcDayStart(new Date());
  const start = atUtcDayStart(event?.startDate);
  const end = atUtcDayStart(event?.endDate) || start;

  if (!start && !end) return "undated";
  if (end && end < today) return "past";
  if (start && start > today) return "upcoming";
  if (start && end && start <= today && end >= today) return "live";
  return "undated";
}

/**
 * Registration should open only on/after the configured event start date-time.
 * If no startDate is configured, do not block registration by schedule.
 */
export function isEventStarted(event, baseDate = new Date()) {
  const now = toValidDate(baseDate) || new Date();
  const { startMinutes } = parseEventTimeRange(event?.time);
  const startDate = toValidDate(event?.startDate);
  if (!startDate) return true;
  const startAt = atUtcDayTime(startDate, startMinutes, false);
  return startAt ? startAt <= now : true;
}
