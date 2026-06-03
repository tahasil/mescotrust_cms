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

export function formatLocationLine(event) {
  if (event?.isOnline) return "Online";
  const loc = (event?.location || "").trim();
  return loc || "";
}

function getStartOfTodayUtc(baseDate = new Date()) {
  return new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
    ),
  );
}

function toValidDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Mirrors events listing logic:
 * - if endDate exists, event is past when endDate < start of today (UTC)
 * - otherwise fallback to startDate for past detection
 */
export function isEventPast(event, baseDate = new Date()) {
  const todayStart = getStartOfTodayUtc(baseDate);
  const endDate = toValidDate(event?.endDate);
  if (endDate) return endDate < todayStart;

  const startDate = toValidDate(event?.startDate);
  if (startDate) return startDate < todayStart;

  return false;
}
