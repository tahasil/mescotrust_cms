import { sanitizeUrl } from "@/lib/security/sanitize";

/**
 * Builds the registration URL used by event detail views. Event records remain
 * the source of truth; local registration pages receive the event context as
 * query parameters while external URLs are validated for safe schemes.
 */
export function buildEventRegistrationHref(registrationLink, event, dateRange) {
  const safeLink = sanitizeUrl(registrationLink, "");
  if (!safeLink) return "";
  if (!safeLink.startsWith("/")) return safeLink;

  const [pathOnly, existingQuery = ""] = safeLink.split("?");
  const params = new URLSearchParams(existingQuery);
  if (event?.title) params.set("event", String(event.title).trim());
  if (dateRange) params.set("date", dateRange);
  if (event?._id) params.set("eventId", String(event._id));
  if (event?.slug) params.set("eventSlug", String(event.slug).trim());
  const query = params.toString();
  return query ? `${pathOnly}?${query}` : pathOnly;
}
