const DOMPurify = require("isomorphic-dompurify");

const SVG_MIME_TYPE = "image/svg+xml";
const SVG_MIME_TYPES = [SVG_MIME_TYPE, "image/svg"];

function isSvgMimeType(mimeType) {
  return SVG_MIME_TYPES.includes(String(mimeType || "").toLowerCase().trim());
}

function sanitizeUploadedSvg(buffer) {
  const raw = Buffer.from(buffer || "")
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .trim();

  if (!raw) {
    return { ok: false, error: "Invalid SVG: empty file" };
  }
  if (!/<svg[\s>]/i.test(raw)) {
    return { ok: false, error: "Invalid SVG: missing root <svg> element" };
  }

  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true, html: false },
    FORBID_TAGS: [
      "script",
      "foreignObject",
      "iframe",
      "object",
      "embed",
      "audio",
      "video",
      "canvas",
      "link",
      "meta",
    ],
  }).trim();

  if (!clean || !/<svg[\s>]/i.test(clean)) {
    return { ok: false, error: "Invalid SVG: sanitization removed required SVG content" };
  }

  if (/(<script\b|<foreignObject\b|\bon\w+\s*=|\bjavascript:)/i.test(clean)) {
    return { ok: false, error: "Invalid SVG: unsafe content detected" };
  }

  return { ok: true, buffer: Buffer.from(clean, "utf8") };
}

module.exports = {
  SVG_MIME_TYPE,
  SVG_MIME_TYPES,
  isSvgMimeType,
  sanitizeUploadedSvg,
};
