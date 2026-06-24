const DEFAULT_LOCALE = "en-IN";
const DEFAULT_TIME_ZONE = "Asia/Kolkata";

function getConfiguredLocale() {
  return (
    process.env.NEXT_PUBLIC_APP_LOCALE ||
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    DEFAULT_LOCALE
  );
}

function getConfiguredTimeZone() {
  return (
    process.env.NEXT_PUBLIC_APP_TIMEZONE ||
    process.env.NEXT_PUBLIC_TIMEZONE ||
    DEFAULT_TIME_ZONE
  );
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatter(options) {
  const locale = getConfiguredLocale();
  const timeZone = getConfiguredTimeZone();
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone });
  } catch {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      ...options,
      timeZone: DEFAULT_TIME_ZONE,
    });
  }
}

function partsMap(parts) {
  const out = {};
  for (const part of parts) {
    out[part.type] = part.value;
  }
  return out;
}

/**
 * Format date as "9 April 2026"
 * @param {string|Date|number} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  const date = toDate(dateStr);
  if (!date) return "-";

  const dateParts = partsMap(
    formatter({
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(date),
  );

  return `${dateParts.day} ${dateParts.month} ${dateParts.year}`;
}

/**
 * Format date with time as "9 April 2026, 9:25 AM"
 * @param {string|Date|number} dateStr
 * @returns {string}
 */
export function formatDateTime(dateStr) {
  const date = toDate(dateStr);
  if (!date) return "-";

  const dateParts = partsMap(
    formatter({
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(date),
  );
  const timeParts = partsMap(
    formatter({
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date),
  );

  const hour = String(timeParts.hour || "").trim();
  const minute = String(timeParts.minute || "").trim();
  const dayPeriod = String(timeParts.dayPeriod || "").trim().toUpperCase();

  return `${dateParts.day} ${dateParts.month} ${dateParts.year}, ${hour}:${minute} ${dayPeriod}`;
}

export function getConfiguredDateTimeMeta() {
  return {
    locale: getConfiguredLocale(),
    timeZone: getConfiguredTimeZone(),
  };
}
