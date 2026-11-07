import { Fragment } from "react";

const INLINE_MARK = /(\*\*[^*]+\*\*|`[^`]+`)/g;

/**
 * Guides are written with **on-screen labels** and `typed values` marked up.
 * This builds React elements, never HTML, so guide text can't inject anything.
 */
export function renderGuideText(text) {
  return String(text ?? "")
    .split(INLINE_MARK)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return <code key={index}>{part.slice(1, -1)}</code>;
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
}

/** The same text without its markers, for searching and page descriptions. */
export function plainGuideText(text) {
  return String(text ?? "").replace(/\*\*|`/g, "");
}

/** Anchor for a guide section, shared by links and the headings they point to. */
export function getSectionAnchor(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
