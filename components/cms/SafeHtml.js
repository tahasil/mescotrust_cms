import { sanitizeHtml } from "@/lib/security/sanitize";

export default function SafeHtml({ html, className }) {
  if (!html) return null;
  const clean = sanitizeHtml(html);
  if (!clean) return null;

  return (
    <div
      className={className || "rich-content"}
      dangerouslySetInnerHTML={{ __html: clean }}
      style={{ lineHeight: 1.7 }}
    />
  );
}
