import DOMPurify from "isomorphic-dompurify";

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
    "strong", "em", "u", "s", "blockquote", "pre", "code",
    "ul", "ol", "li", "a", "img", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "class", "style", "width", "height"],
};

export default function SafeHtml({ html, className }) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, SANITIZE_OPTIONS);

  return (
    <div
      className={className || "rich-content"}
      dangerouslySetInnerHTML={{ __html: clean }}
      style={{ lineHeight: 1.7 }}
    />
  );
}
