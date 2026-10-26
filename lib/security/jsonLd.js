/**
 * XSS-Safe JSON-LD Serializer.
 * Serializes data into a JSON string safe for inline <script type="application/ld+json"> embedding.
 * Escapes '<', '>', '&', and single/double quote entities to Unicode escape sequences to prevent
 * inline script breakout (e.g. `</script><script>alert(1)</script>`).
 */
function serializeJsonLd(data) {
  if (!data) return "";
  const json = typeof data === "string" ? data : JSON.stringify(data);
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

module.exports = {
  serializeJsonLd,
  default: serializeJsonLd,
};
