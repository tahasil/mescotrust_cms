"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Empty, Spin } from "antd";
import {
  FullWidthBackground,
  MainTitle,
  PageContainer,
  SubTitle,
  getColor,
} from "@/styles/Theme";

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

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const FilterChip = styled.button`
  border: 1px solid rgba(15, 23, 42, 0.16);
  background: ${(props) => (props.$active ? "rgba(15, 23, 42, 0.08)" : "#fff")};
  color: #0f172a;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
`;

const CardsContainer = styled.div`
  display: ${(props) => (props.$layoutMode === "grid" ? "grid" : "block")};
  grid-template-columns: ${(props) =>
    props.$layoutMode === "grid" ? "repeat(4, minmax(0, 1fr))" : "none"};
  gap: 16px;
  column-count: ${(props) => (props.$layoutMode === "masonry" ? 4 : "initial")};
  column-gap: ${(props) => (props.$layoutMode === "masonry" ? "16px" : "initial")};

  @media (max-width: 1200px) {
    grid-template-columns: ${(props) =>
      props.$layoutMode === "grid" ? "repeat(2, minmax(0, 1fr))" : "none"};
    column-count: ${(props) => (props.$layoutMode === "masonry" ? 2 : "initial")};
  }

  @media (max-width: 768px) {
    grid-template-columns: ${(props) =>
      props.$layoutMode === "grid" ? "repeat(1, minmax(0, 1fr))" : "none"};
    column-count: ${(props) => (props.$layoutMode === "masonry" ? 1 : "initial")};
  }
`;

const CarouselTrack = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(280px, 340px);
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
`;

const Card = styled.article`
  break-inside: avoid;
  margin-bottom: ${(props) => (props.$layoutMode === "masonry" ? "16px" : "0")};
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: ${(props) =>
    props.$cardStyle === "elevated"
      ? "0 12px 28px rgba(15, 23, 42, 0.14)"
      : props.$cardStyle === "outlined"
        ? "none"
        : "0 6px 14px rgba(15, 23, 42, 0.08)"};

  .media {
    width: 100%;
    height: 220px;
    overflow: hidden;
    background: #f8fafc;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  }

  .media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .content {
    padding: 12px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
    gap: 10px;
  }

  .caption {
    color: #0f172a;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .engagement {
    display: flex;
    gap: 10px;
    color: #334155;
    font-size: 12px;
    margin-bottom: 10px;
  }
`;

export default function SocialWallFeed(props) {
  const prefix = "socialWallFeed";
  const enabled = props?.socialWallFeedEnabled !== false;
  const layoutMode = toSafeString(props?.socialWallFeedLayoutMode || "masonry").toLowerCase();
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

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [activePlatform, setActivePlatform] = useState("all");
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
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
      layoutMode,
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
      layoutMode,
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
        else setLoading(false);
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

  if (!enabled) return null;

  const title = toSafeString(props?.mainTitle || "Social Media Wall");
  const subtitle = toSafeString(props?.subTitle || "");

  return (
    <FullWidthBackground className={sectionClassName} style={sectionStyle}>
      <PageContainer style={pageStyle}>
        {subtitle ? <SubTitle>{subtitle}</SubTitle> : null}
        {title ? <MainTitle className="mb-4" color={titleColor}>{title}</MainTitle> : null}

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
              All
            </FilterChip>
            {availablePlatforms.map((item) => (
              <FilterChip
                key={item.platform}
                type="button"
                $active={activePlatform === item.platform}
                onClick={() => {
                  setActivePlatform(item.platform);
                  loadFeed({ append: false, platform: item.platform });
                }}
              >
                {item.label || item.platform}
              </FilterChip>
            ))}
          </FilterRow>
        ) : null}

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="No social posts available" />
        ) : layoutMode === "carousel" ? (
          <CarouselTrack>
            {items.map((item) => (
              <Card
                key={item.id || `${item.platform}-${item.postId}`}
                $layoutMode={layoutMode}
                $cardStyle={cardStylePreset}
              >
                <div className="media">
                  {item.thumbnailUrl || item.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl || item.mediaUrl}
                      alt={item.caption || item.platform}
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="content">
                  <div className="meta">
                    <span>
                      {showPlatformIcon ? `[${toSafeString(item.platform).toUpperCase()}] ` : ""}
                      {item.authorName || item.platform}
                    </span>
                    {showDate ? <span>{fmtDate(item.publishedAt)}</span> : null}
                  </div>
                  <div className="caption">{item.caption || "-"}</div>
                  {showEngagement ? (
                    <div className="engagement">
                      <span>Like {Number(item.likesCount || 0)}</span>
                      <span>Comment {Number(item.commentsCount || 0)}</span>
                      <span>Share {Number(item.sharesCount || 0)}</span>
                    </div>
                  ) : null}
                  {item.postUrl ? (
                    <a href={item.postUrl} target="_blank" rel="noreferrer">
                      Open Post
                    </a>
                  ) : null}
                </div>
              </Card>
            ))}
          </CarouselTrack>
        ) : (
          <CardsContainer $layoutMode={layoutMode}>
            {items.map((item) => (
              <Card
                key={item.id || `${item.platform}-${item.postId}`}
                $layoutMode={layoutMode}
                $cardStyle={cardStylePreset}
              >
                <div className="media">
                  {item.thumbnailUrl || item.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl || item.mediaUrl}
                      alt={item.caption || item.platform}
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="content">
                  <div className="meta">
                    <span>
                      {showPlatformIcon ? `[${toSafeString(item.platform).toUpperCase()}] ` : ""}
                      {item.authorName || item.platform}
                    </span>
                    {showDate ? <span>{fmtDate(item.publishedAt)}</span> : null}
                  </div>
                  <div className="caption">{item.caption || "-"}</div>
                  {showEngagement ? (
                    <div className="engagement">
                      <span>Like {Number(item.likesCount || 0)}</span>
                      <span>Comment {Number(item.commentsCount || 0)}</span>
                      <span>Share {Number(item.sharesCount || 0)}</span>
                    </div>
                  ) : null}
                  {item.postUrl ? (
                    <a href={item.postUrl} target="_blank" rel="noreferrer">
                      Open Post
                    </a>
                  ) : null}
                </div>
              </Card>
            ))}
          </CardsContainer>
        )}

        {nextCursor && !infiniteScroll ? (
          <div style={{ textAlign: "center", marginTop: 20 }}>
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
          <div ref={loadMoreSentinelRef} style={{ height: 2, marginTop: 16 }} />
        ) : null}
      </PageContainer>
    </FullWidthBackground>
  );
}
