/**
 * Builds the registration URL used by event detail views. Event records remain
 * the source of truth; local registration pages receive the event context as
 * query parameters while external URLs are left untouched.
 */
export function buildEventRegistrationHref(registrationLink, event, dateRange) {
  const link = String(registrationLink || "").trim();
  if (!link || !link.startsWith("/")) return link;

  const [pathOnly, existingQuery = ""] = link.split("?");
  const params = new URLSearchParams(existingQuery);
  if (event?.title) params.set("event", String(event.title).trim());
  if (dateRange) params.set("date", dateRange);
  if (event?._id) params.set("eventId", String(event._id));
  if (event?.slug) params.set("eventSlug", String(event.slug).trim());
  const query = params.toString();
  return query ? `${pathOnly}?${query}` : pathOnly;
}
