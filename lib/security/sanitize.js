const DOMPurify = require("isomorphic-dompurify");

/**
 * Strict Tag Allowlist for Rich Text (WYSIWYG) Content.
 */
const ALLOWED_HTML_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "strike",
  "blockquote", "pre", "code",
  "ul", "ol", "li",
  "a", "img", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
];

/**
 * Strict Attribute Allowlist for Rich Text Content.
 */
const ALLOWED_HTML_ATTRS = [
  "href", "src", "alt", "title", "target", "rel", "class", "style", "width", "height", "loading",
];

/**
 * Protocols allowed for links and sources.
 * Strictly blocks javascript:, vbscript:, data:, file:, etc.
 */
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Purifies rich HTML content using isomorphic-dompurify.
 * Removes malicious script tags, event handlers (onclick, onerror), dangerous protocols,
 * and enforces rel="noopener noreferrer" on target="_blank" links.
 */
function sanitizeHtml(html, options = {}) {
  if (html == null) return "";
  const raw = String(html);
  if (!raw.trim()) return "";

  const config = {
    ALLOWED_TAGS: options.allowedTags || ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: options.allowedAttrs || ALLOWED_HTML_ATTRS,
    ALLOWED_URI_REGEXP: SAFE_URL_PATTERN,
    ADD_ATTR: ["target"],
    FORBID_TAGS: [
      "script", "iframe", "object", "embed", "base", "form",
      "input", "textarea", "button", "link", "meta", "applet",
    ],
    FORBID_ATTR: ["action", "formaction", "xlink:href"],
    ...options,
  };

  const clean = DOMPurify.sanitize(raw, config);

  // Additional post-processing: enforce rel="noopener noreferrer" on target="_blank" links
  return String(clean).replace(
    /<a\b([^>]*\btarget\s*=\s*["']_blank["'][^>]*)>/gi,
    (match, attrs) => {
      if (/rel\s*=/i.test(attrs)) {
        return `<a${attrs.replace(/rel\s*=\s*["'][^"']*["']/i, 'rel="noopener noreferrer"')}>`;
      }
      return `<a${attrs} rel="noopener noreferrer">`;
    }
  );
}

/**
 * Strips all HTML tags and script/style contents from plain-text fields
 * (titles, locations, authors, labels, excerpts, tags, etc.).
 */
function sanitizePlainText(value) {
  if (value == null) return "";
  const str = String(value);
  if (!str) return "";

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // control chars
    .trim();
}

/**
 * Validates and sanitizes a URL to ensure it does not execute scripts via javascript:
 * or other dangerous pseudoprotocols.
 *
 * Safe protocols: http://, https://, mailto:, tel:, relative paths (/path), hash anchors (#anchor).
 * Disallowed protocols: javascript:, vbscript:, data:text/html, etc.
 *
 * @param {string} url - The URL to validate.
 * @param {string} fallback - The fallback to return if URL is dangerous or invalid (default: "#").
 * @returns {string} The safe URL or fallback.
 */
function sanitizeUrl(url, fallback = "#") {
  if (url == null) return fallback;
  const raw = String(url).trim();
  if (!raw) return fallback;

  // Allow anchor fragments and root-relative paths
  if (raw.startsWith("#") || (raw.startsWith("/") && !raw.startsWith("//"))) {
    return raw;
  }

  // Check for dangerous pseudoprotocol patterns (including encoded variants)
  const normalized = raw.replace(/[\u0000-\u001F\s]/g, "").toLowerCase();
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("//")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(raw, "https://mescotrust.local");
    const proto = parsed.protocol.toLowerCase();
    if (proto === "http:" || proto === "https:" || proto === "mailto:" || proto === "tel:") {
      return raw;
    }
  } catch {
    // If not a parseable URL, reject unless relative path
    if (raw.startsWith("/")) return raw;
  }

  return fallback;
}

/**
 * Validates CSS token values (e.g. colors, font names) inserted into dynamic inline CSS.
 * Forbids style tag breakout characters (<, >, {, }, ;) or quotes.
 */
function sanitizeCssToken(value, fallback = "") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/[<>{};"'\\]/.test(raw) || /<\/style/i.test(raw)) {
    return fallback;
  }
  return raw;
}

/**
 * Escapes closing style tags to prevent inline CSS tag breakout.
 */
function sanitizeInlineStyle(value) {
  return String(value || "").replace(/<\/style/gi, "<\\/style");
}

module.exports = {
  ALLOWED_HTML_TAGS,
  ALLOWED_HTML_ATTRS,
  sanitizeHtml,
  sanitizePlainText,
  sanitizeUrl,
  sanitizeCssToken,
  sanitizeInlineStyle,
};
