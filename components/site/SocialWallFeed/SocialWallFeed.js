"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { Button, Empty } from "antd";
import {
  CalendarOutlined,
  FacebookFilled,
  GlobalOutlined,
  InstagramFilled,
  LinkedinFilled,
  MessageOutlined,
  PlayCircleFilled,
  ShareAltOutlined,
  XOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import {
  FullWidthBackground,
  MainTitle,
  PageContainer,
  SubTitle,
  getColor,
} from "@/styles/Theme";
import { usePageReadyTask } from "@/lib/pageReadiness";

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  return rounded > 0 ? rounded : fallback;
}

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getInitials(input) {
  const raw = toSafeString(input);
  if (!raw) return "SW";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function applySectionStyles(props, prefix) {
  const sectionBgType = toSafeString(props?.[`${prefix}SectionBgType`] || "default");
  const sectionBgImage = toSafeString(props?.[`${prefix}SectionBgImage`]);
  const sectionBgColorKey = toSafeString(props?.[`${prefix}SectionBgColorKey`]);
  const sectionPaddingTop = props?.[`${prefix}SectionPaddingTop`];
  const sectionPaddingBottom = props?.[`${prefix}SectionPaddingBottom`];
  const sectionMarginTop = props?.[`${prefix}SectionMarginTop`];
  const sectionMarginBottom = props?.[`${prefix}SectionMarginBottom`];

  const sectionClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionStyle = {
    ...(sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : {}),
    ...(sectionBgType === "color" && sectionBgColorKey
      ? {
          backgroundColor: getColor(sectionBgColorKey),
          backgroundImage: "none",
        }
      : {}),
    ...(sectionPaddingTop != null ? { paddingTop: `${Number(sectionPaddingTop)}px` } : {}),
    ...(sectionPaddingBottom != null ? { paddingBottom: `${Number(sectionPaddingBottom)}px` } : {}),
    ...(sectionMarginTop != null ? { marginTop: `${Number(sectionMarginTop)}px` } : {}),
    ...(sectionMarginBottom != null ? { marginBottom: `${Number(sectionMarginBottom)}px` } : {}),
  };

  const pageBgType = toSafeString(props?.[`${prefix}PageContainerBgType`] || "default");
  const pageBgImage = toSafeString(props?.[`${prefix}PageContainerBgImage`]);
  const pageBgColorKey = toSafeString(props?.[`${prefix}PageContainerBgColorKey`]);
  const pagePaddingTop = props?.[`${prefix}PageContainerPaddingTop`];
  const pagePaddingRight = props?.[`${prefix}PageContainerPaddingRight`];
  const pagePaddingBottom = props?.[`${prefix}PageContainerPaddingBottom`];
  const pagePaddingLeft = props?.[`${prefix}PageContainerPaddingLeft`];
  const pageMarginTop = props?.[`${prefix}PageContainerMarginTop`];
  const pageMarginBottom = props?.[`${prefix}PageContainerMarginBottom`];

  const pageStyle = {
    ...(pageBgType === "image" && pageBgImage
      ? {
          backgroundImage: `url(${pageBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : {}),
    ...(pageBgType === "color" && pageBgColorKey
      ? {
          backgroundColor: getColor(pageBgColorKey),
          backgroundImage: "none",
        }
      : {}),
    ...(pagePaddingTop != null ? { paddingTop: `${Number(pagePaddingTop)}px` } : {}),
    ...(pagePaddingRight != null ? { paddingRight: `${Number(pagePaddingRight)}px` } : {}),
    ...(pagePaddingBottom != null ? { paddingBottom: `${Number(pagePaddingBottom)}px` } : {}),
    ...(pagePaddingLeft != null ? { paddingLeft: `${Number(pagePaddingLeft)}px` } : {}),
    ...(pageMarginTop != null ? { marginTop: `${Number(pageMarginTop)}px` } : {}),
    ...(pageMarginBottom != null ? { marginBottom: `${Number(pageMarginBottom)}px` } : {}),
  };

  return { sectionClassName, sectionStyle, pageStyle };
}

const PLATFORM_META = Object.freeze({
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    soft: "rgba(228,64,95,0.12)",
    Icon: InstagramFilled,
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    soft: "rgba(24,119,242,0.12)",
    Icon: FacebookFilled,
  },
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    soft: "rgba(255,0,0,0.12)",
    Icon: YoutubeFilled,
  },
  twitter: {
    label: "X (Twitter)",
    color: "#0f172a",
    soft: "rgba(15,23,42,0.1)",
    Icon: XOutlined,
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    soft: "rgba(10,102,194,0.12)",
    Icon: LinkedinFilled,
  },
  pinterest: {
    label: "Pinterest",
    color: "#BD081C",
    soft: "rgba(189,8,28,0.12)",
    Icon: GlobalOutlined,
  },
  snapchat: {
    label: "Snapchat",
    color: "#EAB308",
    soft: "rgba(234,179,8,0.18)",
    Icon: GlobalOutlined,
  },
});

function getPlatformMeta(platform, fallbackLabel = "") {
  const key = toSafeString(platform).toLowerCase();
  const entry = PLATFORM_META[key];
  if (entry) return entry;
  return {
    label: toSafeString(fallbackLabel || platform) || "Social",
    color: "#475569",
    soft: "rgba(71,85,105,0.12)",
    Icon: GlobalOutlined,
  };
}

function normalizePostKind(item = {}) {
  const kind = toSafeString(item?.postKind).toLowerCase();
  if (["image", "video", "carousel", "text"].includes(kind)) return kind;
  const mediaItems = Array.isArray(item?.mediaItems) ? item.mediaItems : [];
  if (mediaItems.length > 1) return "carousel";
  if (toSafeString(item?.videoUrl) || toSafeString(item?.mediaType).toLowerCase() === "video") {
    return "video";
  }
  if (toSafeString(item?.thumbnailUrl) || toSafeString(item?.mediaUrl)) return "image";
  return "text";
}

function getItemMediaUrls(item = {}) {
  const urls = [];
  const seen = new Set();
  const push = (value) => {
    const safe = toSafeString(value);
    if (!safe || seen.has(safe)) return;
    seen.add(safe);
    urls.push(safe);
  };
  if (Array.isArray(item?.mediaItems)) {
    item.mediaItems.forEach((url) => push(url));
  }
  push(item?.thumbnailUrl);
  push(item?.mediaUrl);
  return urls.slice(0, 8);
}

const revealIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const WallBody = styled.div`
  width: 100%;
  max-width: 1720px;
  margin: 0 auto;

  padding: 0 10px;

  @media (max-width: 768px) {
    padding: 0 6px;
  }
`;

const FilterChip = styled.button`
  border: 1px solid ${(props) => (props.$active ? "#8f1d21" : "rgba(15,23,42,0.16)")};
  background: ${(props) => (props.$active ? "rgba(143,29,33,0.1)" : "#fff")};
  color: ${(props) => (props.$active ? "#7f1d1d" : "#1e293b")};
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  line-height: 1;
  font-weight: 600;
  cursor: pointer;
  transition: all 180ms ease;

  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    border-color: #8f1d21;
    color: #7f1d1d;
  }
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 1140px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 960px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 14px;
  }
`;

const Card = styled.article`
  --radius: 18px;
  --border: rgba(15, 23, 42, 0.1);

  break-inside: avoid;
  margin-bottom: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: #fff;
  box-shadow: ${(props) =>
    props.$cardStyle === "elevated"
      ? "0 20px 36px rgba(15,23,42,0.14)"
      : props.$cardStyle === "outlined"
        ? "0 1px 0 rgba(15,23,42,0.04)"
        : "0 10px 24px rgba(15,23,42,0.08)"};
  display: flex;
  flex-direction: column;
  min-height: 360px;
  animation: ${revealIn} 460ms ease both;
  animation-delay: var(--delay, 0ms);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(143, 29, 33, 0.38);
    box-shadow: 0 24px 44px rgba(15, 23, 42, 0.16);
  }
`;

const MediaShell = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: linear-gradient(135deg, #e2e8f0 0%, #f8fafc 60%, #eef2ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #fff;
    transition: transform 280ms ease;
  }

  ${Card}:hover & img,
  ${Card}:hover & video {
    transform: scale(1.03);
  }
`;

const MediaSkeleton = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 252, 0.92);
  overflow: hidden;
  z-index: 2;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(148, 163, 184, 0) 0%,
      rgba(148, 163, 184, 0.22) 50%,
      rgba(148, 163, 184, 0) 100%
    );
    animation: ${shimmer} 1.1s linear infinite;
  }
`;

const OverlayBadge = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  background: rgba(15, 23, 42, 0.76);
  color: #fff;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const CarouselGrid = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 2px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #fff;
  }
`;

const TextMedia = styled.div`
  width: 100%;
  height: 100%;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  color: #0f172a;
  background:
    radial-gradient(circle at 0% 0%, rgba(143,29,33,0.08), transparent 46%),
    radial-gradient(circle at 100% 100%, rgba(30,41,59,0.12), transparent 48%),
    #f8fafc;
`;

const TextMediaTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 700;
`;

const TextMediaSnippet = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 700;
  color: #0f172a;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 14px 15px;
  height: 100%;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const AuthorWrap = styled.div`
  display: flex;
  gap: 10px;
  min-width: 0;
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 0;
  background: #e2e8f0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #1e293b;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const AuthorMeta = styled.div`
  min-width: 0;

  .name {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .handle {
    margin-top: 1px;
    font-size: 12px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const DateMeta = styled.div`
  flex-shrink: 0;
  color: #64748b;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const PlatformPill = styled.span`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  border-radius: 999px;
  padding: 7px 10px;
  color: ${(props) => props.$color || "#334155"};
  background: ${(props) => props.$soft || "rgba(51,65,85,0.12)"};
`;

const Caption = styled.p`
  margin: 0;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;

  ${(props) =>
    props.$clamped
      ? css`
          display: -webkit-box;
          -webkit-line-clamp: 3;
          line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        `
      : ""}
`;

const ToggleMore = styled.button`
  border: none;
  background: none;
  color: #8f1d21;
  padding: 0;
  margin-top: -6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
`;

const MetricsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MetricPill = styled.span`
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1;
  color: #334155;
  background: #f1f5f9;
`;

const CtaRow = styled.div`
  margin-top: auto;
  padding-top: 4px;
`;

const ViewButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  color: #fff;
  background: linear-gradient(90deg, #8f1d21 0%, #b4232a 100%);
  box-shadow: 0 8px 18px rgba(143, 29, 33, 0.34);
  transition: transform 180ms ease, box-shadow 180ms ease;

  &:hover {
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 12px 22px rgba(143, 29, 33, 0.38);
  }
`;

const MissingLink = styled.span`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
`;

export default function SocialWallFeed(props) {
  const prefix = "socialWallFeed";
  const enabled = props?.socialWallFeedEnabled !== false;
  const postLimit = toPositiveInt(props?.socialWallFeedPostLimit, 12);
  const filtersEnabled = props?.socialWallFeedFiltersEnabled !== false;
  const cardStylePreset = toSafeString(props?.socialWallFeedCardStylePreset || "clean").toLowerCase();
  const sortBy = toSafeString(props?.socialWallFeedSortBy || "latest").toLowerCase();
  const sortOrder = toSafeString(props?.socialWallFeedSortOrder || "desc").toLowerCase();
  const selectedPlatforms = useMemo(
    () =>
      Array.isArray(props?.socialWallFeedPlatforms)
        ? props.socialWallFeedPlatforms
            .map((item) => toSafeString(item).toLowerCase())
            .filter(Boolean)
        : [],
    [props?.socialWallFeedPlatforms],
  );
  const showPlatformIcon = props?.socialWallFeedShowPlatformIcon !== false;
  const showEngagement = props?.socialWallFeedShowEngagement !== false;
  const showDate = props?.socialWallFeedShowDate !== false;
  const infiniteScroll = props?.socialWallFeedInfiniteScroll === true;

  const [loading, setLoading] = useState(enabled);
  const [initialLoading, setInitialLoading] = useState(enabled);
  usePageReadyTask(enabled && initialLoading, "social-wall-feed");
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [activePlatform, setActivePlatform] = useState("all");
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [expandedCaptionMap, setExpandedCaptionMap] = useState({});
  const [mediaLoadedMap, setMediaLoadedMap] = useState({});
  const loadMoreSentinelRef = useRef(null);
  const showFilterTabs = filtersEnabled && availablePlatforms.length > 1;

  const { sectionClassName, sectionStyle, pageStyle } = useMemo(
    () => applySectionStyles(props, prefix),
    [props],
  );

  const titleColor = toSafeString(props?.titleColorKey)
    ? getColor(props.titleColorKey)
    : getColor("primary");

  const blockConfig = useMemo(
    () => ({
      enabled,
      platforms: selectedPlatforms,
      layoutMode: "grid",
      postLimit,
      filtersEnabled,
      cardStylePreset,
      sortBy,
      sortOrder,
      showPlatformIcon,
      showEngagement,
      showDate,
      infiniteScroll,
    }),
    [
      cardStylePreset,
      enabled,
      filtersEnabled,
      postLimit,
      selectedPlatforms,
      showDate,
      showEngagement,
      showPlatformIcon,
      sortBy,
      sortOrder,
      infiniteScroll,
    ],
  );

  const loadFeed = useCallback(
    async ({ cursor = "", append = false, platform = "all" } = {}) => {
      if (!enabled) return;
      const requestPayload = {
        limit: postLimit,
        cursor: cursor || "",
        platform: platform !== "all" ? platform : "",
        blockConfig,
      };
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await fetch("/api/public/social-wall/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });
        const data = await res.json().catch(() => ({}));
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
        setNextCursor(data?.nextCursor || null);
        if (!append) {
          setExpandedCaptionMap({});
          setMediaLoadedMap({});
        }

        const platformRows = Array.isArray(data?.platformConfigs)
          ? data.platformConfigs
              .map((row) => ({
                platform: toSafeString(row?.platform).toLowerCase(),
                label: toSafeString(row?.label || row?.platform),
                order: Number(row?.displayOrder || 999),
              }))
              .filter((row) => !!row.platform)
              .sort((a, b) =>
                a.order !== b.order ? a.order - b.order : a.platform.localeCompare(b.platform),
              )
          : [];

        const uniquePlatforms = [];
        const seen = new Set();
        platformRows.forEach((row) => {
          if (seen.has(row.platform)) return;
          seen.add(row.platform);
          uniquePlatforms.push({ platform: row.platform, label: row.label });
        });
        setAvailablePlatforms(uniquePlatforms);
      } catch {
        if (!append) setItems([]);
        setNextCursor(null);
        setAvailablePlatforms([]);
      } finally {
        if (append) setLoadingMore(false);
        else {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    },
    [blockConfig, enabled, postLimit],
  );

  useEffect(() => {
    setActivePlatform("all");
    loadFeed({ append: false, platform: "all" });
  }, [loadFeed]);

  useEffect(() => {
    if (activePlatform === "all") return;
    const exists = availablePlatforms.some((item) => item.platform === activePlatform);
    if (exists) return;
    setActivePlatform("all");
    loadFeed({ append: false, platform: "all" });
  }, [activePlatform, availablePlatforms, loadFeed]);

  useEffect(() => {
    if (!infiniteScroll) return undefined;
    if (!nextCursor || loadingMore || loading) return undefined;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (!target?.isIntersecting) return;
        loadFeed({ append: true, cursor: nextCursor, platform: activePlatform });
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activePlatform, infiniteScroll, loadFeed, loading, loadingMore, nextCursor]);

  const markMediaLoaded = useCallback((key) => {
    const safe = toSafeString(key);
    if (!safe) return;
    setMediaLoadedMap((prev) => {
      if (prev[safe]) return prev;
      return { ...prev, [safe]: true };
    });
  }, []);

  const toggleCaption = useCallback((itemKey) => {
    const safe = toSafeString(itemKey);
    if (!safe) return;
    setExpandedCaptionMap((prev) => ({ ...prev, [safe]: prev[safe] !== true }));
  }, []);

  const getItemKey = useCallback((item, index) => {
    const id = toSafeString(item?.id);
    if (id) return id;
    return `${toSafeString(item?.platform)}-${toSafeString(item?.postId)}-${index}`;
  }, []);

  const renderCard = useCallback(
    (item, index) => {
      const itemKey = getItemKey(item, index);
      const caption = toSafeString(item?.caption);
      const captionExpandable = caption.length > 170;
      const captionExpanded = expandedCaptionMap[itemKey] === true;
      const postKind = normalizePostKind(item);
      const mediaUrls = getItemMediaUrls(item);
      const primaryMedia = mediaUrls[0] || "";
      const showVideo = postKind === "video" && toSafeString(item?.videoUrl);
      const showCarousel = postKind === "carousel" && mediaUrls.length > 1;
      const platformMeta = getPlatformMeta(item?.platform, item?.platform);
      const PlatformIcon = platformMeta.Icon || GlobalOutlined;
      const authorName =
        toSafeString(item?.authorName || item?.authorHandle || platformMeta.label) ||
        platformMeta.label;
      const authorHandle = toSafeString(item?.authorHandle);
      const showMetrics =
        showEngagement &&
        (Number(item?.likesCount || 0) > 0 ||
          Number(item?.commentsCount || 0) > 0 ||
          Number(item?.sharesCount || 0) > 0);
      const textSnippet = caption
        ? caption.slice(0, 90)
        : "This post has no visual media. Open original to read full context.";

      return (
        <Card
          key={itemKey}
          $cardStyle={cardStylePreset}
          style={{ "--delay": `${Math.min(index, 8) * 45}ms` }}
        >
          {showCarousel ? (
            <MediaShell>
              <CarouselGrid>
                {mediaUrls.slice(0, 4).map((url, imageIndex) => {
                  const mediaKey = `${itemKey}-carousel-${imageIndex}`;
                  return (
                    <div key={mediaKey} style={{ position: "relative" }}>
                      {!mediaLoadedMap[mediaKey] ? <MediaSkeleton /> : null}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={caption || platformMeta.label}
                        loading="lazy"
                        onLoad={() => markMediaLoaded(mediaKey)}
                        onError={() => markMediaLoaded(mediaKey)}
                      />
                    </div>
                  );
                })}
              </CarouselGrid>
              <OverlayBadge>
                <ShareAltOutlined />
                {mediaUrls.length}
              </OverlayBadge>
            </MediaShell>
          ) : showVideo ? (
            <MediaShell>
              {!mediaLoadedMap[`${itemKey}-video`] ? <MediaSkeleton /> : null}
              <video
                controls
                preload="metadata"
                poster={toSafeString(item?.thumbnailUrl || item?.mediaUrl)}
                onLoadedData={() => markMediaLoaded(`${itemKey}-video`)}
                onError={() => markMediaLoaded(`${itemKey}-video`)}
              >
                <source src={item.videoUrl} />
              </video>
              <OverlayBadge>
                <PlayCircleFilled />
                Video
              </OverlayBadge>
            </MediaShell>
          ) : primaryMedia ? (
            <MediaShell>
              {!mediaLoadedMap[`${itemKey}-image`] ? <MediaSkeleton /> : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryMedia}
                alt={caption || platformMeta.label}
                loading="lazy"
                onLoad={() => markMediaLoaded(`${itemKey}-image`)}
                onError={() => markMediaLoaded(`${itemKey}-image`)}
              />
              {postKind === "video" ? (
                <OverlayBadge>
                  <PlayCircleFilled />
                  Video
                </OverlayBadge>
              ) : null}
            </MediaShell>
          ) : (
            <MediaShell>
              <TextMedia>
                <TextMediaTitle>Text Post</TextMediaTitle>
                <TextMediaSnippet>{textSnippet}</TextMediaSnippet>
              </TextMedia>
            </MediaShell>
          )}

          <CardBody>
            <TopRow>
              <AuthorWrap>
                <Avatar>
                  {toSafeString(item?.authorImage) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.authorImage} alt={authorName} loading="lazy" />
                  ) : (
                    getInitials(authorName)
                  )}
                </Avatar>
                <AuthorMeta>
                  <div className="name">{authorName}</div>
                  {authorHandle ? <div className="handle">{authorHandle}</div> : null}
                </AuthorMeta>
              </AuthorWrap>
              {showDate ? (
                <DateMeta>
                  <CalendarOutlined />
                  <span>{fmtDate(item?.publishedAt)}</span>
                </DateMeta>
              ) : null}
            </TopRow>

            {showPlatformIcon ? (
              <PlatformPill $color={platformMeta.color} $soft={platformMeta.soft}>
                <PlatformIcon />
                {platformMeta.label}
              </PlatformPill>
            ) : null}

            {caption ? (
              <Caption $clamped={captionExpandable && !captionExpanded}>{caption}</Caption>
            ) : (
              <Caption $clamped={false}>No caption provided for this post.</Caption>
            )}
            {captionExpandable ? (
              <ToggleMore type="button" onClick={() => toggleCaption(itemKey)}>
                {captionExpanded ? "Read Less" : "Read More"}
              </ToggleMore>
            ) : null}

            {showMetrics ? (
              <MetricsRow>
                <MetricPill>Like {Number(item?.likesCount || 0)}</MetricPill>
                <MetricPill>
                  <MessageOutlined /> {Number(item?.commentsCount || 0)}
                </MetricPill>
                <MetricPill>
                  <ShareAltOutlined /> {Number(item?.sharesCount || 0)}
                </MetricPill>
              </MetricsRow>
            ) : null}

            <CtaRow>
              {toSafeString(item?.postUrl) ? (
                <ViewButton href={item.postUrl} target="_blank" rel="noreferrer">
                  <GlobalOutlined />
                  View Original Post
                </ViewButton>
              ) : (
                <MissingLink>Original post link not available</MissingLink>
              )}
            </CtaRow>
          </CardBody>
        </Card>
      );
    },
    [
      cardStylePreset,
      expandedCaptionMap,
      getItemKey,
      markMediaLoaded,
      mediaLoadedMap,
      showDate,
      showEngagement,
      showPlatformIcon,
      toggleCaption,
    ],
  );

  if (!enabled) return null;
  if (initialLoading) return null;

  const title = toSafeString(props?.mainTitle || "Social Media Wall");
  const subtitle = toSafeString(props?.subTitle || "");

  return (
    <FullWidthBackground className={sectionClassName} $managedStyle={sectionStyle}>
      <PageContainer $managedStyle={pageStyle}>
        <WallBody>
          {subtitle ? <SubTitle>{subtitle}</SubTitle> : null}
          {title ? (
            <MainTitle className="mb-4" color={titleColor}>
              {title}
            </MainTitle>
          ) : null}

          {showFilterTabs ? (
            <FilterRow>
              <FilterChip
                type="button"
                $active={activePlatform === "all"}
                onClick={() => {
                  setActivePlatform("all");
                  loadFeed({ append: false, platform: "all" });
                }}
              >
                <GlobalOutlined />
                All
              </FilterChip>
              {availablePlatforms.map((item) => {
                const meta = getPlatformMeta(item.platform, item.label);
                const Icon = meta.Icon || GlobalOutlined;
                return (
                  <FilterChip
                    key={item.platform}
                    type="button"
                    $active={activePlatform === item.platform}
                    onClick={() => {
                      setActivePlatform(item.platform);
                      loadFeed({ append: false, platform: item.platform });
                    }}
                  >
                    <Icon />
                    {item.label || item.platform}
                  </FilterChip>
                );
              })}
            </FilterRow>
          ) : null}

          {items.length === 0 ? (
            <Empty description="No social posts available" />
          ) : (
            <CardsContainer>{items.map((item, index) => renderCard(item, index))}</CardsContainer>
          )}

          {nextCursor && !infiniteScroll ? (
            <div style={{ textAlign: "center", marginTop: 22 }}>
              <Button
                loading={loadingMore}
                onClick={() =>
                  loadFeed({ append: true, cursor: nextCursor, platform: activePlatform })
                }
              >
                Load More
              </Button>
            </div>
          ) : null}
          {infiniteScroll && nextCursor ? (
            <div ref={loadMoreSentinelRef} style={{ height: 2, marginTop: 18 }} />
          ) : null}
        </WallBody>
      </PageContainer>
    </FullWidthBackground>
  );
}
