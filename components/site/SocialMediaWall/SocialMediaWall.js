"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, Col } from "antd";
import styled from "styled-components";
import { usePageReadyTask } from "@/lib/pageReadiness";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  ThemeModal,
} from "@/styles/Theme";

const DEFAULT_POST_LIMIT = 20;
const DEFAULT_CARD_GAP = 16;
const DEFAULT_REFRESH_INTERVAL_SECONDS = 180;
const DEFAULT_EMPTY_MESSAGE =
  "No social posts available right now. Please check back shortly.";

const PLATFORM_META = {
  instagram: { label: "Instagram", color: "#E4405F" },
  facebook: { label: "Facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  youtube: { label: "YouTube", color: "#FF0000" },
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  twitter: { label: "X (Twitter)", color: "#000000" },
  googlemaps: { label: "Google Maps", color: "#4285F4" },
  other: { label: "Other", color: "#5E6470" },
};

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  return rounded > 0 ? rounded : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeVisibility(value) {
  const normalized = safeString(value).toLowerCase();
  if (["all", "desktop", "mobile", "none"].includes(normalized)) {
    return normalized;
  }
  return "all";
}

function normalizeFeedMode(value) {
  const normalized = safeString(value).toLowerCase();
  if (["live", "manual", "both"].includes(normalized)) return normalized;
  return "both";
}

function toIsoDate(value) {
  const raw = safeString(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function formatDisplayDate(value) {
  const iso = toIsoDate(value);
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function hashString(value) {
  const input = safeString(value);
  if (!input) return "x";
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

function isDirectVideoUrl(url) {
  const value = safeString(url).toLowerCase();
  if (!value) return false;
  return (
    value.endsWith(".mp4") ||
    value.includes(".mp4?") ||
    value.endsWith(".webm") ||
    value.includes(".webm?") ||
    value.endsWith(".ogg") ||
    value.includes(".ogg?")
  );
}

function getPostImageSources(post) {
  const desktop = safeString(post?.imageDesktop || post?.image || post?.thumbnailDesktop);
  const mobile = safeString(post?.imageMobile || post?.thumbnailMobile);
  return {
    desktop,
    mobile,
    image: desktop || mobile,
  };
}

function normalizePlatformConfig(item, index = 0) {
  const platform = safeString(item?.platform || "instagram").toLowerCase();
  return {
    platform,
    label: PLATFORM_META[platform]?.label || "Other",
    color: PLATFORM_META[platform]?.color || PLATFORM_META.other.color,
    profileUrl: safeString(item?.profileUrl),
    handle: safeString(item?.handle),
    accountId: safeString(item?.accountId),
    active: item?.active !== false,
    feedMode: normalizeFeedMode(item?.feedMode || "both"),
    visibility: normalizeVisibility(item?.visibility || "all"),
    postLimit: clamp(toPositiveInt(item?.postLimit, DEFAULT_POST_LIMIT), 1, 60),
    order: toPositiveInt(item?.order, index + 1),
  };
}

function normalizePost(post, { fallbackSource = "manual", platformConfigMap } = {}) {
  const platform = safeString(post?.platform || "other").toLowerCase();
  const config = platformConfigMap?.get(platform);
  const platformMeta = PLATFORM_META[platform] || PLATFORM_META.other;
  const imageSources = getPostImageSources(post);
  const publishedAt = toIsoDate(post?.publishedAt || post?.date);
  const mediaTypeInput = safeString(post?.mediaType).toLowerCase();
  const videoUrl = safeString(post?.videoUrl);
  const hasVideo = !!videoUrl;
  const hasImage = !!imageSources.image;
  const mediaType =
    mediaTypeInput && ["auto", "image", "video", "text"].includes(mediaTypeInput)
      ? mediaTypeInput === "auto"
        ? hasVideo
          ? "video"
          : hasImage
            ? "image"
            : "text"
        : mediaTypeInput
      : hasVideo
        ? "video"
        : hasImage
          ? "image"
          : "text";

  const caption = safeString(post?.caption || post?.text);
  const handle = safeString(post?.handle || config?.handle);
  const username = safeString(post?.username || config?.label || handle || platformMeta.label);
  const postUrl = safeString(post?.postUrl || config?.profileUrl);
  const visibility = normalizeVisibility(post?.visibility || config?.visibility);

  return {
    id:
      safeString(post?.id) ||
      `${platform}-${hashString(`${postUrl}-${caption}-${publishedAt}-${username}`)}`,
    platform,
    platformLabel: safeString(post?.platformLabel || config?.label || platformMeta.label),
    platformColor: config?.color || platformMeta.color,
    source: safeString(post?.source || fallbackSource) || fallbackSource,
    username,
    handle: handle && !handle.startsWith("@") ? `@${handle}` : handle,
    caption,
    text: safeString(post?.text || post?.caption),
    date: safeString(post?.date || formatDisplayDate(publishedAt)),
    publishedAt,
    postUrl,
    imageDesktop: imageSources.desktop,
    imageMobile: imageSources.mobile,
    image: imageSources.image,
    thumbnailDesktop: safeString(post?.thumbnailDesktop || imageSources.desktop),
    thumbnailMobile: safeString(post?.thumbnailMobile || imageSources.mobile),
    videoUrl,
    mediaType,
    visibility,
    active: post?.enabled !== false,
  };
}

function compareByDateDesc(first, second) {
  const firstTime = first?.publishedAt ? Date.parse(first.publishedAt) : 0;
  const secondTime = second?.publishedAt ? Date.parse(second.publishedAt) : 0;
  if (Number.isFinite(firstTime) && Number.isFinite(secondTime) && firstTime !== secondTime) {
    return secondTime - firstTime;
  }
  return 0;
}

function arePlatformConfigsEqual(first = [], second = []) {
  if (!Array.isArray(first) || !Array.isArray(second)) return false;
  if (first.length !== second.length) return false;
  for (let i = 0; i < first.length; i += 1) {
    const a = first[i] || {};
    const b = second[i] || {};
    if (
      safeString(a.platform) !== safeString(b.platform) ||
      Boolean(a.active !== false) !== Boolean(b.active !== false) ||
      toPositiveInt(a.order, i + 1) !== toPositiveInt(b.order, i + 1) ||
      normalizeFeedMode(a.feedMode) !== normalizeFeedMode(b.feedMode) ||
      normalizeVisibility(a.visibility) !== normalizeVisibility(b.visibility) ||
      toPositiveInt(a.postLimit, DEFAULT_POST_LIMIT) !==
        toPositiveInt(b.postLimit, DEFAULT_POST_LIMIT) ||
      safeString(a.handle) !== safeString(b.handle) ||
      safeString(a.profileUrl) !== safeString(b.profileUrl)
    ) {
      return false;
    }
  }
  return true;
}

function PlatformIcon({ platform, size = 20, color }) {
  const fill = color || PLATFORM_META[platform]?.color || "#666";
  const iconSize = Number(size) || 20;
  switch (platform) {
    case "instagram":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke={fill} strokeWidth="2" />
          <circle cx="12" cy="12" r="5" stroke={fill} strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.5" fill={fill} />
        </svg>
      );
    case "facebook":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "twitter":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M20.52 3.48A11.82 11.82 0 0012.13 0C5.56 0 .2 5.36.2 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.28-1.64a11.88 11.88 0 005.85 1.5h.01c6.57 0 11.93-5.36 11.93-11.94 0-3.18-1.24-6.17-3.56-8.44zm-8.39 18.35h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.73.98.99-3.64-.24-.38a9.88 9.88 0 01-1.52-5.24c0-5.45 4.45-9.9 9.93-9.9 2.65 0 5.14 1.03 7.01 2.9a9.86 9.86 0 012.91 7.03c0 5.46-4.45 9.9-9.94 9.9zm5.44-7.42c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.23-.65.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.66-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.08-.8.38-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.07 2.86 1.22 3.06.15.2 2.1 3.22 5.09 4.52.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.78-.73 2.03-1.43.25-.71.25-1.31.17-1.43-.08-.13-.28-.2-.58-.35z" />
        </svg>
      );
    case "googlemaps":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M12 2C8.14 2 5 5.06 5 8.83c0 4.8 5.66 11.84 6.01 12.27a1.3 1.3 0 001.98 0C13.34 20.67 19 13.63 19 8.83 19 5.06 15.86 2 12 2zm0 9.5a2.67 2.67 0 110-5.33 2.67 2.67 0 010 5.33z" />
        </svg>
      );
    default:
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={fill}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
  }
}

const PostsLayout = styled.div`
  --social-wall-gap: ${(props) => props.$gap}px;
  --social-wall-cols-desktop: ${(props) => props.$colsDesktop};
  --social-wall-cols-laptop: ${(props) => props.$colsLaptop};
  --social-wall-cols-tablet: ${(props) => props.$colsTablet};
  --social-wall-cols-mobile: ${(props) => props.$colsMobile};

  ${(props) =>
    props.$layout === "grid"
      ? `
    display: grid;
    grid-template-columns: repeat(var(--social-wall-cols-desktop), minmax(0, 1fr));
    gap: var(--social-wall-gap);
    @media (max-width: 1199px) {
      grid-template-columns: repeat(var(--social-wall-cols-laptop), minmax(0, 1fr));
    }
    @media (max-width: 991px) {
      grid-template-columns: repeat(var(--social-wall-cols-tablet), minmax(0, 1fr));
    }
    @media (max-width: 767px) {
      grid-template-columns: repeat(var(--social-wall-cols-mobile), minmax(0, 1fr));
    }
  `
      : `
    column-count: var(--social-wall-cols-desktop);
    column-gap: var(--social-wall-gap);
    @media (max-width: 1199px) {
      column-count: var(--social-wall-cols-laptop);
    }
    @media (max-width: 991px) {
      column-count: var(--social-wall-cols-tablet);
    }
    @media (max-width: 767px) {
      column-count: var(--social-wall-cols-mobile);
    }
  `}
`;

const CarouselTrack = styled.div`
  --social-wall-gap: ${(props) => props.$gap}px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 340px);
  gap: var(--social-wall-gap);
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 2px 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  & > * {
    scroll-snap-align: start;
  }

  @media (max-width: 767px) {
    grid-auto-columns: minmax(84%, 84%);
  }
`;

const PostCard = styled.article`
  position: relative;
  break-inside: avoid;
  width: 100%;
  margin-bottom: ${(props) => (props.$layout === "masonry" ? `${props.$gap}px` : 0)};
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;

  &[data-clickable="true"] {
    cursor: pointer;
  }

  &[data-clickable="true"]:hover {
    transform: translateY(-5px);
    border-color: rgba(15, 23, 42, 0.16);
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
  }

  &[data-visibility="none"] {
    display: none;
  }

  &[data-visibility="desktop"] {
    @media (max-width: 767px) {
      display: none;
    }
  }

  &[data-visibility="mobile"] {
    display: none;
    @media (max-width: 767px) {
      display: block;
    }
  }
`;

const MediaArea = styled.div`
  position: relative;
  width: 100%;
  height: 246px;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 12%, rgba(226, 232, 240, 0.94), rgba(241, 245, 249, 0.96)),
    linear-gradient(145deg, #f8fafc 0%, #eef2f7 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);

  picture {
    width: 100%;
    height: 100%;
    display: flex;
  }

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    display: block;
    background: transparent;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: rgba(15, 23, 42, 0.42);
    font-size: 12px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-weight: 700;
  }

  @media (max-width: 1199px) {
    height: 230px;
  }

  @media (max-width: 991px) {
    height: 220px;
  }

  @media (max-width: 767px) {
    height: 206px;
  }

  @media (max-width: 575px) {
    height: 192px;
  }
`;

const VideoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: linear-gradient(to top, rgba(2, 6, 23, 0.24), rgba(2, 6, 23, 0.04) 48%);
  svg {
    width: 46px;
    height: 46px;
    opacity: 0.92;
  }
`;

const LiveBadge = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: #e02424;
  box-shadow: 0 8px 18px rgba(224, 36, 36, 0.24);
`;

const PostBody = styled.div`
  padding: 16px 16px 14px;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const PlatformBadge = styled.div`
  flex-shrink: 0;
  width: ${(props) => props.$size || 30}px;
  height: ${(props) => props.$size || 30}px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$bg ? `${props.$bg}1A` : "rgba(0,0,0,0.08)")};
`;

const HeaderMeta = styled.div`
  min-width: 0;
  flex: 1;
  .source {
    font-size: 14px;
    font-weight: 700;
    color: rgba(16, 24, 40, 0.9);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .handle {
    margin-top: 2px;
    font-size: 12px;
    color: rgba(16, 24, 40, 0.58);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PlatformTag = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  border-radius: 999px;
  padding: 7px 12px;
  color: ${(props) => props.$color || "#5E6470"};
  background: ${(props) => (props.$color ? `${props.$color}1A` : "rgba(0,0,0,0.06)")};
`;

const PostCaption = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: rgba(16, 24, 40, 0.72);
  word-break: break-word;
  white-space: pre-wrap;
`;

const Footer = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(16, 24, 40, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const FooterDate = styled.span`
  font-size: 13px;
  color: rgba(16, 24, 40, 0.55);
`;

const FooterLiveType = styled.span`
  font-size: 11px;
  color: rgba(16, 24, 40, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const EmptyState = styled.div`
  border-radius: 14px;
  padding: 28px 20px;
  text-align: center;
  border: 1px dashed rgba(16, 24, 40, 0.2);
  color: rgba(16, 24, 40, 0.68);
  background: rgba(255, 255, 255, 0.6);
`;

const ModalScrollBody = styled(ThemeModal)`
  .ant-modal {
    width: min(940px, calc(100vw - 24px)) !important;
    max-width: 940px;
    top: 18px;
  }
  .ant-modal-content {
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 26px 80px rgba(2, 6, 23, 0.28);
    padding: 0;
  }
  .ant-modal-body {
    max-height: calc(100vh - 56px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0;
  }
  .ant-modal-close {
    background: rgba(255, 255, 255, 0.94) !important;
    border: 1px solid rgba(15, 23, 42, 0.12) !important;
    color: rgba(15, 23, 42, 0.7) !important;
    width: 36px !important;
    height: 36px !important;
    top: 14px !important;
    right: 14px !important;
    border-radius: 999px !important;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    &:hover {
      background: #fff !important;
      color: rgba(2, 6, 23, 0.95) !important;
    }
  }
`;

const ModalPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  min-height: 420px;

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
    min-height: 0;
  }
`;

const ModalMedia = styled.div`
  position: relative;
  width: 100%;
  min-height: 100%;
  background:
    radial-gradient(circle at 15% 12%, #f1f5f9 0%, #e2e8f0 54%, #cbd5e1 100%),
    linear-gradient(155deg, #e2e8f0 0%, #f8fafc 100%);
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  @media (max-width: 991px) {
    border-right: 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    min-height: 280px;
  }

  picture {
    width: 100%;
    height: 100%;
    display: flex;
  }

  img,
  video {
    width: 100%;
    height: 100%;
    max-height: 430px;
    object-fit: contain;
    object-position: center center;
    border-radius: 14px;
    background: #fff;
    display: block;
  }

  .placeholder {
    width: 100%;
    min-height: 240px;
    border-radius: 14px;
    border: 1px dashed rgba(15, 23, 42, 0.22);
    display: grid;
    place-items: center;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(15, 23, 42, 0.58);
  }
`;

const ModalContent = styled.div`
  padding: 30px 30px 28px;
  min-width: 0;

  @media (max-width: 767px) {
    padding: 20px 18px 20px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
`;

const ModalMeta = styled.div`
  flex: 1;
  min-width: 0;
  .title {
    font-size: 30px;
    line-height: 1.15;
    font-weight: 700;
    color: #0f172a;
    word-break: break-word;
    text-transform: uppercase;
    margin-bottom: 6px;
    letter-spacing: 0.01em;
    padding-right: 10px;
    @media (max-width: 1199px) {
      font-size: 26px;
    }
    @media (max-width: 767px) {
      font-size: 22px;
      text-transform: none;
    }
  }
  .subtitle {
    font-size: 20px;
    line-height: 1.25;
    font-weight: 700;
    color: #ef4444;
    word-break: break-word;
    @media (max-width: 1199px) {
      font-size: 18px;
    }
    @media (max-width: 767px) {
      font-size: 16px;
    }
  }
`;

const ModalFacts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 2px 0 18px;
`;

const ModalFact = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(248, 250, 252, 0.9);
  border-radius: 999px;
  padding: 7px 12px;
`;

const ModalText = styled.p`
  margin: 0 0 22px;
  font-size: 19px;
  line-height: 1.68;
  color: rgba(16, 24, 40, 0.75);
  white-space: pre-wrap;
  word-break: break-word;
  @media (max-width: 1199px) {
    font-size: 17px;
  }
  @media (max-width: 767px) {
    font-size: 15px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ModalGhostButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  border: 1px solid rgba(15, 23, 42, 0.2);
  color: rgba(15, 23, 42, 0.84);
  background: #fff;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: rgba(15, 23, 42, 0.38);
    color: #0f172a;
    background: #f8fafc;
  }
`;

const ViewOriginalBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  color: #fff;
  border: 1px solid ${(props) => props.$color || "var(--primary-color, #1677ff)"};
  background: ${(props) => props.$color || "var(--primary-color, #1677ff)"};
  transition: all 0.22s ease;
  &:hover {
    color: ${(props) => props.$color || "var(--primary-color, #1677ff)"};
    background: #fff;
  }
`;

export default function SocialMediaWall(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [livePosts, setLivePosts] = useState([]);
  const [loadingLive, setLoadingLive] = useState(
    props?.socialMediaWallEnabled !== false &&
      props?.socialMediaWallEnableLivePosts !== false,
  );
  usePageReadyTask(loadingLive, "social-media-wall");
  const [runtimePlatformConfigs, setRuntimePlatformConfigs] = useState([]);

  const componentEnabled = props?.socialMediaWallEnabled !== false;

  const titleEnabled = props?.socialMediaWallTitleEnabled !== false;
  const subTitleEnabled = props?.socialMediaWallSubTitleEnabled !== false;
  const mainTitle = safeString(props?.mainTitle || "Social Media Wall");
  const subTitle = safeString(props?.subTitle);
  const titleColorKey = safeString(props?.titleColorKey);
  const subTitleColorKey = safeString(props?.socialMediaWallSubTitleColorKey);
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;

  const sectionBgType = safeString(props?.socialMediaWallSectionBgType || "default");
  const sectionBgImage = safeString(props?.socialMediaWallSectionBgImage);
  const sectionBgColorKey = safeString(props?.socialMediaWallSectionBgColorKey);
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop =
    props?.socialMediaWallSectionPaddingTop != null
      ? Number(props.socialMediaWallSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.socialMediaWallSectionPaddingBottom != null
      ? Number(props.socialMediaWallSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.socialMediaWallSectionMarginTop != null
      ? Number(props.socialMediaWallSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.socialMediaWallSectionMarginBottom != null
      ? Number(props.socialMediaWallSectionMarginBottom)
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

  const simpleSectionBgColorKey = safeString(props?.socialMediaWallSectionBgColorKey);
  const simpleSectionSpacingRaw = Number(props?.socialMediaWallSectionSpacing);
  const simpleSectionSpacing =
    Number.isFinite(simpleSectionSpacingRaw) && simpleSectionSpacingRaw >= 0
      ? Math.min(240, Math.floor(simpleSectionSpacingRaw))
      : null;
  const sectionBgStyleFinal = {
    ...(sectionBgStyle || {}),
    ...(simpleSectionBgColorKey
      ? { backgroundColor: getColor(simpleSectionBgColorKey), backgroundImage: "none" }
      : {}),
    ...(simpleSectionSpacing != null
      ? {
          paddingTop: `${simpleSectionSpacing}px`,
          paddingBottom: `${simpleSectionSpacing}px`,
        }
      : {}),
  };
  const sectionClassNameFinal =
    simpleSectionBgColorKey || simpleSectionSpacing != null ? undefined : sectionBgClassName;

  const pageContainerBgType = safeString(
    props?.socialMediaWallPageContainerBgType || "default",
  );
  const pageContainerBgImage = safeString(props?.socialMediaWallPageContainerBgImage);
  const pageContainerBgColorKey = safeString(
    props?.socialMediaWallPageContainerBgColorKey,
  );
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop =
    props?.socialMediaWallPageContainerPaddingTop != null
      ? Number(props.socialMediaWallPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.socialMediaWallPageContainerPaddingRight != null
      ? Number(props.socialMediaWallPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.socialMediaWallPageContainerPaddingBottom != null
      ? Number(props.socialMediaWallPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.socialMediaWallPageContainerPaddingLeft != null
      ? Number(props.socialMediaWallPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.socialMediaWallPageContainerMarginTop != null
      ? Number(props.socialMediaWallPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.socialMediaWallPageContainerMarginBottom != null
      ? Number(props.socialMediaWallPageContainerMarginBottom)
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

  const layoutModeRaw = safeString(props?.socialMediaWallLayoutMode).toLowerCase();
  const layoutMode = ["grid", "masonry", "carousel"].includes(layoutModeRaw)
    ? layoutModeRaw
    : "masonry";
  const cardGapRaw = Number(props?.socialMediaWallCardGap);
  const cardGap = clamp(
    Number.isFinite(cardGapRaw) && cardGapRaw >= 0
      ? Math.floor(cardGapRaw)
      : DEFAULT_CARD_GAP,
    0,
    48,
  );
  const colDesktop = clamp(
    toPositiveInt(props?.socialMediaWallColumnsDesktop, 5),
    1,
    8,
  );
  const colLaptop = clamp(
    toPositiveInt(props?.socialMediaWallColumnsLaptop, 4),
    1,
    8,
  );
  const colTablet = clamp(
    toPositiveInt(props?.socialMediaWallColumnsTablet, 3),
    1,
    6,
  );
  const colMobile = clamp(
    toPositiveInt(props?.socialMediaWallColumnsMobile, 1),
    1,
    4,
  );

  const showPlatformIcon = props?.socialMediaWallShowPlatformIcon !== false;
  const showPlatformLabel = props?.socialMediaWallShowPlatformLabel !== false;
  const showHandle = props?.socialMediaWallShowHandle !== false;
  const showDate = props?.socialMediaWallShowDate !== false;
  const showCaption = props?.socialMediaWallShowCaption !== false;
  const allowModal = props?.socialMediaWallAllowModal !== false;
  const emptyStateMessage =
    safeString(props?.socialMediaWallEmptyStateMessage) || DEFAULT_EMPTY_MESSAGE;

  const globalPostLimit = clamp(
    toPositiveInt(props?.socialMediaWallPostLimit, DEFAULT_POST_LIMIT),
    1,
    60,
  );
  const orderMode =
    safeString(props?.socialMediaWallOrderMode).toLowerCase() === "platform-priority"
      ? "platform-priority"
      : "chronological";
  const enableLivePosts = props?.socialMediaWallEnableLivePosts !== false;
  const autoRefreshEnabled = props?.socialMediaWallAutoRefreshEnabled === true;
  const refreshIntervalSec = clamp(
    toPositiveInt(
      props?.socialMediaWallRefreshIntervalSec,
      DEFAULT_REFRESH_INTERVAL_SECONDS,
    ),
    30,
    3600,
  );

  const platformConfigs = useMemo(() => {
    const raw =
      Array.isArray(runtimePlatformConfigs) && runtimePlatformConfigs.length > 0
        ? runtimePlatformConfigs
        : Array.isArray(props?.socialMediaWallPlatforms)
          ? props.socialMediaWallPlatforms
          : [];
    const normalized = raw
      .map((item, index) => normalizePlatformConfig(item, index))
      .filter(Boolean);
    const dedup = new Map();
    for (const item of normalized) {
      dedup.set(item.platform, item);
    }
    if (dedup.size === 0) {
      const defaults = [
        { platform: "twitter", order: 1, active: true, feedMode: "both", postLimit: globalPostLimit, profileUrl: "" },
        { platform: "facebook", order: 2, active: true, feedMode: "both", postLimit: globalPostLimit, profileUrl: "" },
        { platform: "instagram", order: 3, active: true, feedMode: "both", postLimit: globalPostLimit, profileUrl: "" },
        { platform: "youtube", order: 4, active: true, feedMode: "both", postLimit: globalPostLimit, profileUrl: "" },
      ];
      return defaults.map((item, index) => normalizePlatformConfig(item, index));
    }
    return Array.from(dedup.values()).sort((a, b) => a.order - b.order);
  }, [runtimePlatformConfigs, props?.socialMediaWallPlatforms, globalPostLimit]);

  const platformConfigMap = useMemo(() => {
    const map = new Map();
    platformConfigs.forEach((item) => {
      map.set(item.platform, item);
    });
    return map;
  }, [platformConfigs]);

  const liveRequestPayload = useMemo(
    () => ({
      platformConfigs: platformConfigs.map((config) => ({
        platform: config.platform,
        feedMode: config.feedMode,
        visibility: config.visibility,
        handle: config.handle,
        profileUrl: config.profileUrl,
        postLimit: config.postLimit,
      })),
      globalLimit: globalPostLimit,
      orderMode,
    }),
    [platformConfigs, globalPostLimit, orderMode],
  );

  useEffect(() => {
    if (!componentEnabled || !enableLivePosts) {
      setLivePosts([]);
      setLoadingLive(false);
      return () => {};
    }

    let mounted = true;
    let timerId = null;

    const loadLivePosts = async () => {
      if (!mounted) return;
      setLoadingLive(true);
      try {
        const response = await fetch("/api/public/social-wall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(liveRequestPayload),
        });
        const payload = response.ok ? await response.json() : { livePosts: [] };
        if (!mounted) return;
        const responsePlatformConfigs = Array.isArray(payload?.platformConfigs)
          ? payload.platformConfigs
              .map((item, index) => normalizePlatformConfig(item, index))
              .filter(Boolean)
              .sort((a, b) => a.order - b.order)
          : [];
        if (responsePlatformConfigs.length > 0) {
          setRuntimePlatformConfigs((prev) =>
            arePlatformConfigsEqual(prev, responsePlatformConfigs)
              ? prev
              : responsePlatformConfigs,
          );
        }
        const fetchedPosts = Array.isArray(payload?.livePosts)
          ? payload.livePosts.map((post) =>
              normalizePost(post, {
                fallbackSource: "live",
                platformConfigMap,
              }),
            )
          : [];
        setLivePosts(fetchedPosts);
      } catch {
        if (mounted) setLivePosts([]);
      } finally {
        if (mounted) setLoadingLive(false);
      }
    };

    loadLivePosts();
    if (autoRefreshEnabled) {
      timerId = setInterval(loadLivePosts, refreshIntervalSec * 1000);
    }

    return () => {
      mounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, [
    componentEnabled,
    enableLivePosts,
    autoRefreshEnabled,
    refreshIntervalSec,
    liveRequestPayload,
    platformConfigMap,
  ]);

  const manualPosts = useMemo(() => {
    const raw = Array.isArray(props?.socialMediaWallPosts) ? props.socialMediaWallPosts : [];
    return raw
      .map((post) =>
        normalizePost(post, {
          fallbackSource: "manual",
          platformConfigMap,
        }),
      )
      .filter((post) => post.active !== false);
  }, [props?.socialMediaWallPosts, platformConfigMap]);

  const mergedPosts = useMemo(() => {
    const candidates = [];

    for (const post of manualPosts) {
      const config = platformConfigMap.get(post.platform);
      if (config && !config.active) continue;
      if (config?.feedMode === "live") continue;
      if (post.visibility === "none") continue;
      candidates.push(post);
    }

    for (const post of livePosts) {
      const config = platformConfigMap.get(post.platform);
      if (config && !config.active) continue;
      if (config?.feedMode === "manual") continue;
      if (post.visibility === "none") continue;
      candidates.push(post);
    }

    const sorted = [...candidates];
    if (orderMode === "platform-priority") {
      sorted.sort((first, second) => {
        const firstOrder = platformConfigMap.get(first.platform)?.order ?? 999;
        const secondOrder = platformConfigMap.get(second.platform)?.order ?? 999;
        if (firstOrder !== secondOrder) return firstOrder - secondOrder;
        return compareByDateDesc(first, second);
      });
    } else {
      sorted.sort(compareByDateDesc);
    }

    const perPlatformCounter = new Map();
    const filtered = [];
    for (const post of sorted) {
      const perPlatformLimit = platformConfigMap.get(post.platform)?.postLimit ?? 999;
      const current = perPlatformCounter.get(post.platform) || 0;
      if (current >= perPlatformLimit) continue;
      perPlatformCounter.set(post.platform, current + 1);
      filtered.push(post);
      if (filtered.length >= globalPostLimit) break;
    }
    return filtered;
  }, [manualPosts, livePosts, platformConfigMap, orderMode, globalPostLimit]);

  const modalPost = selectedPost
    ? normalizePost(selectedPost, {
        fallbackSource: selectedPost?.source || "manual",
        platformConfigMap,
      })
    : null;

  const handleCardClick = (post) => {
    if (!allowModal) return;
    setSelectedPost(post);
    setModalOpen(true);
  };

  const renderPostCard = (post) => {
    const imageSources = getPostImageSources(post);
    const image = imageSources.image;
    const isVideo = post.mediaType === "video";
    const isDirectVideo = isVideo && isDirectVideoUrl(post.videoUrl);
    const cardClickable = allowModal;
    const showMedia = post.mediaType !== "text";
    const cardLayout = layoutMode === "carousel" ? "carousel" : layoutMode;
    return (
      <PostCard
        key={post.id}
        onClick={() => handleCardClick(post)}
        data-clickable={cardClickable ? "true" : "false"}
        data-visibility={post.visibility}
        $layout={cardLayout}
        $gap={cardGap}
      >
        {post.source === "live" && <LiveBadge>LIVE</LiveBadge>}

        {showMedia && (
          <MediaArea>
            {isDirectVideo ? (
              <video
                controls={false}
                muted
                playsInline
                preload="metadata"
                poster={image}
                src={post.videoUrl}
              />
            ) : image ? (
              <picture>
                {imageSources.mobile ? (
                  <source media="(max-width: 767px)" srcSet={imageSources.mobile} />
                ) : null}
                <img
                  src={image}
                  alt={post.caption || post.username || post.platformLabel}
                  loading="lazy"
                />
              </picture>
            ) : (
              <div style={{ minHeight: 140 }} />
            )}
            {isVideo && (
              <VideoOverlay>
                <PlayGlyph />
              </VideoOverlay>
            )}
          </MediaArea>
        )}

        <PostBody>
          <PostHeader>
            {showPlatformIcon && (
              <PlatformBadge $bg={post.platformColor}>
                <PlatformIcon
                  platform={post.platform}
                  size={16}
                  color={post.platformColor}
                />
              </PlatformBadge>
            )}
            <HeaderMeta>
              {post.username && <div className="source">{post.username}</div>}
              {showHandle && post.handle && <div className="handle">{post.handle}</div>}
            </HeaderMeta>
            {showPlatformLabel && (
              <PlatformTag $color={post.platformColor}>{post.platformLabel}</PlatformTag>
            )}
          </PostHeader>

          {showCaption && post.caption && <PostCaption>{post.caption}</PostCaption>}
          {showCaption && !post.caption && (
            <PostCaption style={{ opacity: 0.72 }}>
              {post.mediaType === "text"
                ? "Text post"
                : "Media post from the connected social feed."}
            </PostCaption>
          )}

          <Footer>
            {showDate && <FooterDate>{post.date || "Date unavailable"}</FooterDate>}
            <FooterLiveType>{post.mediaType}</FooterLiveType>
          </Footer>
        </PostBody>
      </PostCard>
    );
  };

  if (!componentEnabled) return null;

  return (
    <>
      <FullWidthBackground className={sectionClassNameFinal} $managedStyle={sectionBgStyleFinal}>
        <PageContainer $managedStyle={pageContainerBgStyle}>
          {(titleEnabled || subTitleEnabled) && (
            <Row gutter={[16, 16]}>
              <Col span={24} className="mb-4">
                {subTitleEnabled && subTitle && (
                  <SubTitle style={subTitleColor ? { color: subTitleColor } : undefined}>
                    {subTitle}
                  </SubTitle>
                )}
                {titleEnabled && <MainTitle color={titleColor}>{mainTitle}</MainTitle>}
              </Col>
            </Row>
          )}

          {mergedPosts.length > 0 &&
            (layoutMode === "carousel" ? (
              <CarouselTrack $gap={cardGap}>
                {mergedPosts.map((post) => renderPostCard(post))}
              </CarouselTrack>
            ) : (
              <PostsLayout
                $layout={layoutMode}
                $gap={cardGap}
                $colsDesktop={colDesktop}
                $colsLaptop={colLaptop}
                $colsTablet={colTablet}
                $colsMobile={colMobile}
              >
                {mergedPosts.map((post) => renderPostCard(post))}
              </PostsLayout>
            ))}

          {!loadingLive && mergedPosts.length === 0 && (
            <EmptyState>{emptyStateMessage}</EmptyState>
          )}
        </PageContainer>
      </FullWidthBackground>

      <ModalScrollBody
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedPost(null);
        }}
        centered
        footer={null}
        width={640}
        destroyOnClose
        data-lenis-prevent
      >
        {modalPost && (
          <div data-lenis-prevent>
            {(modalPost.mediaType === "image" || modalPost.mediaType === "video") && (
              <ModalMedia>
                {modalPost.mediaType === "video" && isDirectVideoUrl(modalPost.videoUrl) ? (
                  <video
                    src={modalPost.videoUrl}
                    poster={modalPost.image}
                    controls
                    preload="metadata"
                  />
                ) : modalPost.image ? (
                  <picture>
                    {modalPost.imageMobile ? (
                      <source media="(max-width: 767px)" srcSet={modalPost.imageMobile} />
                    ) : null}
                    <img
                      src={modalPost.image}
                      alt={
                        modalPost.caption || modalPost.username || modalPost.platformLabel
                      }
                    />
                  </picture>
                ) : null}
              </ModalMedia>
            )}
            <ModalContent>
              <ModalHeader>
                <PlatformBadge $bg={modalPost.platformColor} $size={38}>
                  <PlatformIcon
                    platform={modalPost.platform}
                    size={20}
                    color={modalPost.platformColor}
                  />
                </PlatformBadge>
                <ModalMeta>
                  <div className="title">
                    {modalPost.username || modalPost.platformLabel}
                  </div>
                  <div className="subtitle">
                    {modalPost.date || "Date unavailable"}
                    {modalPost.handle ? ` • ${modalPost.handle}` : ""}
                  </div>
                </ModalMeta>
                <PlatformTag $color={modalPost.platformColor}>
                  {modalPost.platformLabel}
                </PlatformTag>
              </ModalHeader>

              {(modalPost.caption || modalPost.text) && (
                <ModalText>{modalPost.caption || modalPost.text}</ModalText>
              )}

              {modalPost.postUrl && (
                <ViewOriginalBtn
                  href={modalPost.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  $color={modalPost.platformColor}
                >
                  <PlatformIcon
                    platform={modalPost.platform}
                    size={14}
                    color="#fff"
                  />
                  View on {modalPost.platformLabel}
                </ViewOriginalBtn>
              )}
            </ModalContent>
          </div>
        )}
      </ModalScrollBody>
    </>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.55)" />
      <path d="M26 21.5L46 32L26 42.5V21.5Z" fill="#fff" />
    </svg>
  );
}
