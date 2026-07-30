"use client";

import { getColor } from "@/styles/Theme";

/**
 * Matches InnerPageHero title behavior across site components:
 * - text wrapped in *asterisks* is highlighted;
 * - when no markers are present, the final word is highlighted.
 */
export function renderHighlightedTitle(
  value,
  props,
  { legacyColorKey = "", fallbackColorKey = "primarySoft" } = {},
) {
  const text = String(value || "");
  const selectedColorKey = String(
    props?.titleHighlightColorKey || legacyColorKey || fallbackColorKey || "",
  ).trim();
  const highlightStyle = selectedColorKey
    ? { color: getColor(selectedColorKey), fontStyle: "normal" }
    : { fontStyle: "normal" };

  if (!text.includes("*")) {
    const parts = text.split(/\s+/).filter(Boolean);
    const highlighted = parts.pop();
    return (
      <>
        {parts.length ? `${parts.join(" ")} ` : ""}
        {highlighted ? <em style={highlightStyle}>{highlighted}</em> : null}
      </>
    );
  }

  return text.split(/(\*[^*]+\*)/g).map((part, index) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <em key={`${part}-${index}`} style={highlightStyle}>
        {part.slice(1, -1)}
      </em>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}
