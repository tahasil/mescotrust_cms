"use client";

/**
 * Standardized title alignment utilities for site components.
 * Guarantees consistent left, center, right alignment for Main Title & Subtitle
 * without modifying existing typography settings.
 */

export function getTitleAlign(props, defaultAlign = "left", prefix = "") {
  const p = prefix ? String(prefix).trim() : "";
  const raw =
    (p ? props?.[`${p}TitleAlign`] : null) ??
    props?.titleAlign ??
    defaultAlign;
  const s = String(raw || "").trim().toLowerCase();
  if (s === "center" || s === "enter" || s === "middle") return "center";
  if (s === "right" || s === "end") return "right";
  if (s === "justify") return "justify";
  return "left";
}

export function getTitleAlignStyles(titleAlign = "left") {
  const align =
    titleAlign === "center" || titleAlign === "enter" || titleAlign === "middle"
      ? "center"
      : titleAlign === "right" || titleAlign === "end"
      ? "right"
      : titleAlign === "justify"
      ? "justify"
      : "left";
  return {
    textAlign: align,
    marginLeft: align === "center" ? "auto" : align === "right" ? "auto" : "0",
    marginRight: align === "center" ? "auto" : align === "left" ? "auto" : "0",
    maxWidth: "100%",
  };
}

export function getSubtitleAlignStyles(titleAlign = "left") {
  const align =
    titleAlign === "center" || titleAlign === "enter" || titleAlign === "middle"
      ? "center"
      : titleAlign === "right" || titleAlign === "end"
      ? "right"
      : titleAlign === "justify"
      ? "justify"
      : "left";
  return {
    textAlign: align,
    maxWidth: "100%",
  };
}

export function getHeaderAlignStyles(titleAlign = "left") {
  const align =
    titleAlign === "center" || titleAlign === "enter" || titleAlign === "middle"
      ? "center"
      : titleAlign === "right" || titleAlign === "end"
      ? "right"
      : titleAlign === "justify"
      ? "justify"
      : "left";
  return {
    textAlign: align,
    alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
  };
}

export const PARAGRAPH_ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Justify", value: "justify" },
];

export function getParagraphAlign(props, defaultAlign = "left", prefix = "") {
  const p = prefix ? String(prefix).trim() : "";
  const raw =
    (p ? props?.[`${p}ParagraphAlign`] : null) ??
    props?.paragraphAlign ??
    defaultAlign;
  const s = String(raw || "").trim().toLowerCase();
  if (s === "center" || s === "enter" || s === "middle") return "center";
  if (s === "right" || s === "end") return "right";
  if (s === "justify") return "justify";
  return "left";
}

