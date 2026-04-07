/**
 * Get ordinal suffix for a day number.
 */
function getOrdinalSuffix(day) {
  if (day === 1 || day === 21 || day === 31) return "st";
  if (day === 2 || day === 22) return "nd";
  if (day === 3 || day === 23) return "rd";
  return "th";
}

/**
 * Format date as JSX: 4<sup>th</sup> July 2026
 * @param {string|Date} dateStr
 * @returns {JSX.Element|string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return (
    <>
      {day}<sup>{suffix}</sup> {month} {year}
    </>
  );
}

/**
 * Format date with time as JSX: 4<sup>th</sup> July 2026, 6:01 PM
 * @param {string|Date} dateStr
 * @returns {JSX.Element|string}
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <>
      {day}<sup>{suffix}</sup> {month} {year}, {time}
    </>
  );
}
