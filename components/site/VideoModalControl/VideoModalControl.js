"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

const DEFAULT_ITEMS = Object.freeze([
  {
    description: "Demo Day Highlights - Cohort Showcase",
    dateText: "",
    videoUrl: "",
    coverImageUrl: "",
    playIconUrl: "",
  },
  {
    description: "Founder Masterclass Series",
    dateText: "",
    videoUrl: "",
    coverImageUrl: "",
    playIconUrl: "",
  },
  {
    description: "Community Sessions",
    dateText: "",
    videoUrl: "",
    coverImageUrl: "",
    playIconUrl: "",
  },
]);

function isDirectCssColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.startsWith("#") ||
    raw.startsWith("rgb(") ||
    raw.startsWith("rgba(") ||
    raw.startsWith("hsl(") ||
    raw.startsWith("hsla(") ||
    raw.startsWith("linear-gradient(") ||
    raw.startsWith("radial-gradient(") ||
    raw.startsWith("conic-gradient(") ||
    raw.startsWith("var(")
  );
}

function resolveThemeColorValue(rawKey, fallbackKey) {
  const key = String(rawKey || "").trim();
  if (!key) return fallbackKey ? getColor(fallbackKey) : undefined;
  if (isDirectCssColor(key)) return key;
  return getColor(key) || key;
}

function isGradientColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.includes("gradient") ||
    raw.startsWith("var(--theme-primary-gradient") ||
    raw.startsWith("var(--theme-secondary-gradient")
  );
}

function getTextPaintStyle(colorValue) {
  const value = String(colorValue || "").trim();
  if (!value) return undefined;
  if (!isGradientColor(value)) return { color: value };
  return {
    color: "transparent",
    background: value,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "inline-block",
  };
}

function getBackgroundStyleFromThemeColor(rawKey) {
  const value = resolveThemeColorValue(rawKey);
  if (!value) return undefined;
  return { background: value };
}

function toText(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function toPositiveNumber(value, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) return fallback;
  return next;
}

function toBoundedInt(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  const rounded = Math.round(next);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function normalizeAlign(value, fallback = "left") {
  const next = String(value ?? fallback)
    .trim()
    .toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function normalizeCardVariant(value, fallback = "videos") {
  const next = String(value ?? fallback)
    .trim()
    .toLowerCase();
  return next === "podcasts" ? "podcasts" : "videos";
}

function normalizeItem(raw = {}) {
  return {
    description: toText(
      raw?.description ?? raw?.title ?? raw?.label ?? raw?.text,
      "",
    ),
    dateText: toText(raw?.dateText ?? raw?.date ?? raw?.meta, ""),
    videoUrl: toText(
      raw?.videoUrl ??
        raw?.youtubeUrl ??
        raw?.video ??
        raw?.url ??
        raw?.mediaUrl ??
        raw?.playLink ??
        raw?.buttonLink ??
        raw?.link ??
        raw?.href,
      "",
    ),
    coverImageUrl: toText(
      raw?.coverImageUrl ?? raw?.cover ?? raw?.image ?? raw?.thumbnail,
      "",
    ),
    playIconUrl: toText(raw?.playIconUrl ?? raw?.iconUrl ?? raw?.playIcon, ""),
  };
}

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return DEFAULT_ITEMS.map((item) => ({ ...item }));
  }
  const normalized = rawItems
    .map((item) => normalizeItem(item))
    .filter((item) => item.description || item.videoUrl || item.coverImageUrl);
  if (normalized.length === 0) {
    return DEFAULT_ITEMS.map((item) => ({ ...item }));
  }
  return normalized;
}

function extractYouTubeId(url) {
  const value = toText(url, "");
  if (!value) return "";
  const directMatch = value.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?.*v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i,
  );
  if (directMatch?.[1]) return directMatch[1];

  try {
    const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)
      ? value
      : `https://${value}`;
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const segments = parsed.pathname.split("/").filter(Boolean);
      const possible = segments[segments.length - 1] || "";
      if (/^[a-zA-Z0-9_-]{11}$/.test(possible)) return possible;
    }
  } catch {
    return "";
  }

  return "";
}

function extractVimeoId(url) {
  const value = toText(url, "");
  if (!value) return "";
  const match = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] || "";
}

function getVideoSource(url) {
  const value = toText(url, "");
  if (!value) return null;

  const youtubeId = extractYouTubeId(value);
  if (youtubeId) {
    return {
      type: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
      title: "YouTube video",
    };
  }

  const vimeoId = extractVimeoId(value);
  if (vimeoId) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      title: "Vimeo video",
    };
  }

  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(value) || value.startsWith("/")) {
    return {
      type: "video",
      src: value,
      title: "Video",
    };
  }

  return {
    type: "iframe",
    src: /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)
      ? value
      : `https://${value}`,
    title: "Video",
  };
}

function toCssUrlValue(url) {
  const value = toText(url, "");
  if (!value) return "";
  return `url("${value.replace(/"/g, '\\"')}")`;
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 7.5 17 12l-8 4.5z" fill="currentColor" />
    </svg>
  );
}

const VideoModalShell = styled.section`
  position: relative;

  .vmc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .vmc-title-wrap {
    margin-bottom: 0;
    text-align: var(--vmc-title-align);
  }

  .vmc-subtitle,
  .vmc-title {
    margin: 0;
  }

  .vmc-header-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 10px 18px;
    font-size: 16px;
    line-height: 1;
    font-weight: 500;
    text-decoration: none;
    background: var(--vmc-header-btn-bg);
    color: var(--vmc-header-btn-text);
    transition:
      transform 0.2s ease,
      filter 0.2s ease;
    white-space: nowrap;
  }

  .vmc-header-btn:hover {
    transform: translateY(-1px);
    filter: brightness(0.97);
  }

  .vmc-grid {
    display: grid;
    grid-template-columns: repeat(var(--vmc-columns-desktop), minmax(0, 1fr));
    gap: var(--vmc-card-gap);
  }

  .vmc-card {
    border-radius: var(--vmc-card-radius);
    background: var(--vmc-card-bg);
    border: 1px solid var(--vmc-card-border);
    padding: var(--vmc-card-padding-y) var(--vmc-card-padding-x);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .vmc-root.is-videos .vmc-card {
    box-shadow: 0 6px 18px rgba(8, 37, 56, 0.06);
  }

  .vmc-cover {
    position: relative;
    width: 100%;
    height: var(--vmc-cover-height-desktop);
    border-radius: calc(var(--vmc-card-radius) * 0.72);
    overflow: hidden;
    background: var(--vmc-fallback-videos);
    isolation: isolate;
  }

  .vmc-root.is-podcasts .vmc-cover {
    background: var(--vmc-fallback-podcasts);
  }

  .vmc-cover.has-image {
    background: #0f2232;
  }

  .vmc-cover::before,
  .vmc-cover::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .vmc-cover::before {
    background:
      radial-gradient(
        circle at 20% 25%,
        rgba(255, 255, 255, 0.18) 0%,
        transparent 44%
      ),
      radial-gradient(
        circle at 80% 75%,
        rgba(255, 255, 255, 0.12) 0%,
        transparent 46%
      );
    opacity: 0.75;
  }

  .vmc-cover::after {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.16),
      rgba(0, 0, 0, 0.32)
    );
  }

  .vmc-root.is-podcasts .vmc-cover::before {
    background:
      radial-gradient(
        circle at 16% 24%,
        rgba(255, 255, 255, 0.15) 0%,
        transparent 42%
      ),
      radial-gradient(
        circle at 86% 68%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 44%
      );
  }

  .vmc-root.is-podcasts .vmc-cover::after {
    background: linear-gradient(
      180deg,
      rgba(0, 18, 30, 0.08),
      rgba(0, 18, 30, 0.2)
    );
  }

  .vmc-cover-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: 1;
  }

  .vmc-cover.has-image::before,
  .vmc-cover.has-image::after {
    z-index: 2;
  }

  .vmc-play-btn {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
    width: var(--vmc-play-btn-size);
    height: var(--vmc-play-btn-size);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: var(--vmc-play-bg);
    color: var(--vmc-play-icon);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      filter 0.2s ease;
  }

  .vmc-play-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .vmc-play-btn:not(:disabled):hover {
    transform: translate(-50%, -50%) scale(1.04);
    filter: brightness(1.02);
  }

  .vmc-play-btn svg,
  .vmc-play-btn img,
  .vmc-play-icon-mask,
  .vmc-play-icon-image {
    width: var(--vmc-play-icon-size);
    height: var(--vmc-play-icon-size);
    display: block;
  }

  .vmc-play-btn img,
  .vmc-play-icon-image {
    object-fit: contain;
  }

  @supports ((-webkit-mask-image: url("")) or (mask-image: url(""))) {
    .vmc-play-icon-mask {
      background-color: var(--vmc-play-icon);
      -webkit-mask-image: var(--vmc-play-icon-mask-url);
      mask-image: var(--vmc-play-icon-mask-url);
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-position: center;
      mask-position: center;
    }

    .vmc-play-icon-image {
      display: none;
    }
  }

  .vmc-description {
    margin: 0;
    font-size: var(--vmc-description-size-desktop);
    line-height: 1.28;
    font-weight: var(--vmc-description-weight);
    color: var(--vmc-description-color);
  }

  .vmc-date {
    margin: -2px 0 0;
    font-size: var(--vmc-date-size-desktop);
    line-height: 1.35;
    font-weight: var(--vmc-date-weight);
    color: var(--vmc-date-color);
  }

  .vmc-modal-backdrop {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    z-index: 2147483647;
    background: rgba(8, 14, 24, 0.78);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    backdrop-filter: blur(2px);
  }

  .vmc-modal {
    width: min(1080px, calc(100vw - 24px));
    position: relative;
  }

  .vmc-modal-close {
    position: absolute;
    right: 12px;
    top: 12px;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.42);
    background: rgba(0, 0, 0, 0.56);
    color: #ffffff;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .vmc-modal-frame {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 14px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 26px 45px rgba(0, 0, 0, 0.38);
  }

  .vmc-modal-frame iframe,
  .vmc-modal-frame video {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }

  @media (max-width: 1199px) {
    .vmc-grid {
      grid-template-columns: repeat(var(--vmc-columns-tablet), minmax(0, 1fr));
    }
  }

  @media (max-width: 767px) {
    .vmc-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .vmc-header-btn {
      font-size: 14px;
      padding: 9px 14px;
    }

    .vmc-grid {
      grid-template-columns: repeat(var(--vmc-columns-mobile), minmax(0, 1fr));
      gap: calc(var(--vmc-card-gap) * 0.88);
    }

    .vmc-card {
      padding: calc(var(--vmc-card-padding-y) * 0.85)
        calc(var(--vmc-card-padding-x) * 0.85);
      gap: 10px;
    }

    .vmc-cover {
      height: var(--vmc-cover-height-mobile);
    }

    .vmc-description {
      font-size: var(--vmc-description-size-mobile);
    }

    .vmc-date {
      font-size: var(--vmc-date-size-mobile);
    }

    .vmc-modal-close {
      top: 10px;
      right: 10px;
    }
  }
`;

/**
 * Site component: VideoModalControl.
 * Supports two card variants (videos/podcasts) with modal playback.
 */
export default function VideoModalControl(props) {
  const mainTitle = toText(props?.mainTitle, "Videos");
  const subTitle = toText(props?.subTitle, "");
  const hasTitleBlock = Boolean(mainTitle || subTitle);
  const titleAlign = normalizeAlign(props?.titleAlign, "left");
  const cardVariant = normalizeCardVariant(
    props?.videoModalControlCardVariant,
    "videos",
  );

  const titleColor =
    resolveThemeColorValue(props?.titleColorKey, "primary") || "#005f88";
  const subTitleColor =
    resolveThemeColorValue(props?.subTitleColorKey, "") || "#6f7d86";

  const headerButtonText = toText(props?.videoModalControlHeaderButtonText, "");
  const headerButtonLink = ensureMailto(props?.videoModalControlHeaderButtonLink);
  const headerButtonTarget = normalizeTargetFromItem(
    {
      target: props?.videoModalControlHeaderButtonTarget,
      newTab: props?.videoModalControlHeaderButtonNewTab,
    },
    { targetKeys: ["target"], boolKeys: ["newTab"], fallback: "_self" },
  );
  const hasHeaderButton = Boolean(headerButtonText && headerButtonLink);

  const cardBgColor =
    resolveThemeColorValue(props?.videoModalControlCardBgColorKey, "") ||
    "#ffffff";
  const cardBorderColor =
    resolveThemeColorValue(props?.videoModalControlCardBorderColorKey, "") ||
    "rgba(18, 38, 56, 0.12)";
  const descriptionColor =
    resolveThemeColorValue(props?.videoModalControlDescriptionColorKey, "") ||
    "#1f2a37";
  const dateColor =
    resolveThemeColorValue(props?.videoModalControlDateColorKey, "") ||
    "#6f7d86";
  const playBgColor =
    resolveThemeColorValue(props?.videoModalControlPlayIconBgColorKey, "") ||
    "#ffffff";
  const playIconColor =
    resolveThemeColorValue(
      props?.videoModalControlPlayIconColorKey,
      "primary",
    ) || "#005f88";
  const fallbackBgColor =
    resolveThemeColorValue(props?.videoModalControlFallbackBgColorKey, "") ||
    "#015f84";
  const headerBtnBgColor =
    resolveThemeColorValue(
      props?.videoModalControlHeaderButtonBgColorKey,
      "",
    ) || "#ffb329";
  const headerBtnTextColor =
    resolveThemeColorValue(
      props?.videoModalControlHeaderButtonTextColorKey,
      "primary",
    ) || "#005f88";

  const sectionBgType = (
    props?.videoModalControlSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.videoModalControlSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.videoModalControlSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? getBackgroundStyleFromThemeColor(sectionBgColorKey)
        : undefined;
  const sectionPaddingTop =
    props?.videoModalControlSectionPaddingTop != null
      ? Number(props.videoModalControlSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.videoModalControlSectionPaddingBottom != null
      ? Number(props.videoModalControlSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.videoModalControlSectionMarginTop != null
      ? Number(props.videoModalControlSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.videoModalControlSectionMarginBottom != null
      ? Number(props.videoModalControlSectionMarginBottom)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = (
    props?.videoModalControlPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.videoModalControlPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.videoModalControlPageContainerBgColorKey ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? getBackgroundStyleFromThemeColor(pageContainerBgColorKey)
        : undefined;
  const containerPaddingTop =
    props?.videoModalControlPageContainerPaddingTop != null
      ? Number(props.videoModalControlPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.videoModalControlPageContainerPaddingRight != null
      ? Number(props.videoModalControlPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.videoModalControlPageContainerPaddingBottom != null
      ? Number(props.videoModalControlPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.videoModalControlPageContainerPaddingLeft != null
      ? Number(props.videoModalControlPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.videoModalControlPageContainerMarginTop != null
      ? Number(props.videoModalControlPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.videoModalControlPageContainerMarginBottom != null
      ? Number(props.videoModalControlPageContainerMarginBottom)
      : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  const cards = normalizeItems(
    props?.videoModalControlItems ?? props?.cards ?? props?.items,
  );

  const coverHeightDesktop = toPositiveNumber(
    props?.videoModalControlCoverHeightDesktop,
    190,
  );
  const coverHeightMobile = toPositiveNumber(
    props?.videoModalControlCoverHeightMobile,
    160,
  );
  const playButtonSize = toPositiveNumber(
    props?.videoModalControlPlayButtonSize,
    56,
  );
  const playIconSize = toPositiveNumber(
    props?.videoModalControlPlayIconSize,
    18,
  );
  const columnsDesktop = toBoundedInt(
    props?.videoModalControlColumnsDesktop,
    3,
    1,
    6,
  );
  const columnsTablet = toBoundedInt(
    props?.videoModalControlColumnsTablet,
    2,
    1,
    4,
  );
  const columnsMobile = toBoundedInt(
    props?.videoModalControlColumnsMobile,
    1,
    1,
    2,
  );
  const cardGap = toPositiveNumber(props?.videoModalControlCardGap, 18);
  const cardRadius = toPositiveNumber(props?.videoModalControlCardRadius, 18);
  const cardPaddingX = toPositiveNumber(
    props?.videoModalControlCardPaddingX,
    18,
  );
  const cardPaddingY = toPositiveNumber(
    props?.videoModalControlCardPaddingY,
    18,
  );
  const descriptionFontSizeDesktop = toPositiveNumber(
    props?.videoModalControlDescriptionFontSizeDesktop,
    34,
  );
  const descriptionFontSizeMobile = toPositiveNumber(
    props?.videoModalControlDescriptionFontSizeMobile,
    24,
  );
  const descriptionFontWeight = toBoundedInt(
    props?.videoModalControlDescriptionFontWeight,
    700,
    100,
    900,
  );
  const dateFontSizeDesktop = toPositiveNumber(
    props?.videoModalControlDateFontSizeDesktop,
    21,
  );
  const dateFontSizeMobile = toPositiveNumber(
    props?.videoModalControlDateFontSizeMobile,
    17,
  );
  const dateFontWeight = toBoundedInt(
    props?.videoModalControlDateFontWeight,
    500,
    100,
    900,
  );

  const rootStyle = {
    "--vmc-title-align": titleAlign,
    "--vmc-columns-desktop": String(columnsDesktop),
    "--vmc-columns-tablet": String(columnsTablet),
    "--vmc-columns-mobile": String(columnsMobile),
    "--vmc-card-gap": `${cardGap}px`,
    "--vmc-card-radius": `${cardRadius}px`,
    "--vmc-card-padding-x": `${cardPaddingX}px`,
    "--vmc-card-padding-y": `${cardPaddingY}px`,
    "--vmc-cover-height-desktop": `${coverHeightDesktop}px`,
    "--vmc-cover-height-mobile": `${coverHeightMobile}px`,
    "--vmc-card-bg": cardBgColor,
    "--vmc-card-border": cardBorderColor,
    "--vmc-description-size-desktop": `${descriptionFontSizeDesktop}px`,
    "--vmc-description-size-mobile": `${descriptionFontSizeMobile}px`,
    "--vmc-description-weight": String(descriptionFontWeight),
    "--vmc-date-size-desktop": `${dateFontSizeDesktop}px`,
    "--vmc-date-size-mobile": `${dateFontSizeMobile}px`,
    "--vmc-date-weight": String(dateFontWeight),
    "--vmc-description-color": descriptionColor,
    "--vmc-date-color": dateColor,
    "--vmc-play-btn-size": `${playButtonSize}px`,
    "--vmc-play-icon-size": `${playIconSize}px`,
    "--vmc-play-bg": playBgColor,
    "--vmc-play-icon": playIconColor,
    "--vmc-fallback-videos": `linear-gradient(135deg, ${fallbackBgColor} 0%, #11354e 55%, #081a2a 100%)`,
    "--vmc-fallback-podcasts": `linear-gradient(145deg, ${fallbackBgColor} 0%, #014e6f 100%)`,
    "--vmc-header-btn-bg": headerBtnBgColor,
    "--vmc-header-btn-text": headerBtnTextColor,
  };

  const [activeCard, setActiveCard] = useState(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const activeSource = useMemo(
    () => (activeCard?.videoUrl ? getVideoSource(activeCard.videoUrl) : null),
    [activeCard],
  );

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (!activeCard) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveCard(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCard]);

  useEffect(() => {
    if (!isClientMounted) return undefined;
    if (!activeCard) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeCard, isClientMounted]);

  const modalNode =
    activeCard && activeSource ? (
      <div
        className="vmc-modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          zIndex: 2147483647,
          background: "rgba(8, 14, 24, 0.78)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          backdropFilter: "blur(2px)",
        }}
        onClick={() => setActiveCard(null)}
        role="presentation"
      >
        <div
          className="vmc-modal"
          style={{
            width: "min(1080px, calc(100vw - 24px))",
            position: "relative",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={activeCard?.description || "Video player"}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="vmc-modal-close"
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "1px solid rgba(255, 255, 255, 0.42)",
              background: "rgba(0, 0, 0, 0.56)",
              color: "#ffffff",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
              zIndex: 2,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setActiveCard(null)}
            aria-label="Close video"
          >
            ×
          </button>
          <div
            className="vmc-modal-frame"
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 14,
              overflow: "hidden",
              background: "#000",
              boxShadow: "0 26px 45px rgba(0, 0, 0, 0.38)",
            }}
          >
            {activeSource.type === "video" ? (
              <video
                src={activeSource.src}
                controls
                autoPlay
                playsInline
                preload="metadata"
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            ) : (
              <iframe
                src={activeSource.src}
                title={activeSource.title}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: 0, display: "block" }}
              />
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <VideoModalShell style={rootStyle}>
          <div className={`vmc-root is-${cardVariant}`}>
            {(hasTitleBlock || hasHeaderButton) && (
              <div className="vmc-header">
                {hasTitleBlock ? (
                  <header className="vmc-title-wrap">
                    {subTitle ? (
                      <SubTitle
                        className="vmc-subtitle"
                        style={{ textAlign: titleAlign }}
                      >
                        <span style={getTextPaintStyle(subTitleColor)}>
                          {subTitle}
                        </span>
                      </SubTitle>
                    ) : null}
                    {mainTitle ? (
                      <MainTitle
                        className="vmc-title"
                        style={{ textAlign: titleAlign }}
                      >
                        <span style={getTextPaintStyle(titleColor)}>
                          {mainTitle}
                        </span>
                      </MainTitle>
                    ) : null}
                  </header>
                ) : (
                  <span />
                )}

                {hasHeaderButton ? (
                  <a
                    className="vmc-header-btn"
                    href={headerButtonLink}
                    target={headerButtonTarget === "_blank" ? "_blank" : "_self"}
                    rel={
                      headerButtonTarget === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {headerButtonText}
                  </a>
                ) : null}
              </div>
            )}

            <div className="vmc-grid">
              {cards.map((item, index) => {
                const hasCoverImage = Boolean(item.coverImageUrl);
                const itemPlayIconUrl = toText(item.playIconUrl, "");
                const hasPlayableVideo = Boolean(toText(item.videoUrl, ""));
                return (
                  <article
                    key={`vmc-card-${item.description || item.videoUrl || index}`}
                    className="vmc-card"
                  >
                    <div
                      className={`vmc-cover${hasCoverImage ? " has-image" : ""}`}
                    >
                      {hasCoverImage ? (
                        <img
                          className="vmc-cover-image"
                          src={item.coverImageUrl}
                          alt={item.description || "Video thumbnail"}
                          loading="lazy"
                        />
                      ) : null}

                      <button
                        type="button"
                        className="vmc-play-btn"
                        style={
                          itemPlayIconUrl
                            ? {
                                "--vmc-play-icon-mask-url":
                                  toCssUrlValue(itemPlayIconUrl),
                              }
                            : undefined
                        }
                        onClick={() => {
                          if (!hasPlayableVideo) return;
                          setActiveCard(item);
                        }}
                        disabled={!hasPlayableVideo}
                        aria-label={
                          item.description
                            ? `Play ${item.description}`
                            : "Play video"
                        }
                      >
                        {itemPlayIconUrl ? (
                          <>
                            <span className="vmc-play-icon-mask" aria-hidden="true" />
                            <img
                              className="vmc-play-icon-image"
                              src={itemPlayIconUrl}
                              alt=""
                              loading="lazy"
                            />
                          </>
                        ) : (
                          <PlayGlyph />
                        )}
                      </button>
                    </div>

                    {item.description ? (
                      <p className="vmc-description">{item.description}</p>
                    ) : null}
                    {item.dateText ? (
                      <p className="vmc-date">{item.dateText}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </VideoModalShell>
      </PageContainer>
      {isClientMounted && modalNode
        ? createPortal(modalNode, document.body)
        : null}
    </FullWidthBackground>
  );
}
