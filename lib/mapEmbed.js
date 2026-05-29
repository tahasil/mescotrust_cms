const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

function parseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export function normalizeMapEmbedInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // Allow users to paste full iframe embed HTML from map providers.
  const iframeSrcMatch = raw.match(/<iframe[\s\S]*?\ssrc=(["'])(.*?)\1[\s\S]*?>/i);
  if (iframeSrcMatch?.[2]) {
    return String(iframeSrcMatch[2]).trim();
  }

  return raw;
}

export function isValidMapEmbedInput(value) {
  const normalized = normalizeMapEmbedInput(value);
  if (!normalized) return false;

  const parsed = parseUrl(normalized);
  if (!parsed) return false;
  if (!HTTP_PROTOCOLS.has(parsed.protocol)) return false;

  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();

  const isGoogleMapsHost =
    host === "maps.google.com" ||
    host === "www.google.com" ||
    host.endsWith(".google.com");

  if (isGoogleMapsHost) {
    return (
      pathname.includes("/maps") ||
      pathname.includes("/maps/embed") ||
      search.includes("pb=") ||
      search.includes("q=")
    );
  }

  const isOpenStreetMapHost =
    host === "www.openstreetmap.org" || host === "openstreetmap.org";
  if (isOpenStreetMapHost) {
    return pathname.includes("/export/embed") || pathname.includes("/embed");
  }

  // For other hosts, still allow valid HTTPS embeds but only when path clearly
  // suggests embeddable map content.
  return pathname.includes("map") || pathname.includes("embed");
}

