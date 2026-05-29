"use client";

import { useEffect, useMemo, useState } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { getColor } from "@/styles/Theme";
import MediaImage from "@/components/shared/MediaImage";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

const SliderRoot = styled.div`
  .news-feed-slider {
    margin-top: 20px;
  }

  .news-grid {
    display: grid;
    grid-template-columns: repeat(
      var(--news-cards-per-view, 3),
      minmax(0, 1fr)
    );
    gap: var(--news-card-gap, 20px);
    align-items: stretch;
  }

  .news-card-link {
    display: block;
    color: inherit;
    text-decoration: none;
    height: 100%;
  }

  .news-card-link .news-card {
    cursor: pointer;
    height: 100%;
  }

  .news-card {
    background: var(--news-card-bg, #fff);
    border: 1px solid var(--news-card-border, rgba(0, 81, 111, 0.1));
    border-radius: 20px;
    box-shadow: 0 0 10px var(--news-card-shadow, rgba(0, 81, 111, 0.1));
    min-height: 410px;
    height: 100%;
    padding: 24px 24px 22px;
    display: flex;
    flex-direction: column;
  }

  .news-image {
    width: 100%;
    height: 200px;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 20px;
    background: #eef2f4;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .news-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .news-title {
    margin: 0 0 10px;
    font-size: 16px;
    line-height: 24px;
    font-weight: 600;
    color: var(--news-title-color, #262a2c);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 48px;
  }

  .news-excerpt {
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 24px;
    color: var(--news-excerpt-color, #3c3c3c);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 48px;
  }

  .news-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .news-date {
    font-size: 14px;
    line-height: 1.6;
    color: var(--news-date-color, #1a1a1a);
  }

  .news-source {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: var(--news-source-bg, #333);
    color: var(--news-source-color, #fff);
    font-size: 14px;
    line-height: 1.6;
    padding: 4px 10px;
    text-decoration: none;
    white-space: nowrap;
  }

  .news-navigation {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 14px;
  }

  .nav-btn {
    width: var(--news-arrow-size, 70px);
    height: var(--news-arrow-size, 70px);
    border-radius: 999px;
    border: 1px solid var(--news-arrow-color, #333);
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
    font-size: calc(var(--news-arrow-size, 70px) * 0.42);
    color: var(--news-arrow-color, #333);
    background: var(--news-arrow-bg, #ffffff);
  }

  .nav-btn:hover {
    transform: translateY(-1px);
    background: var(--news-arrow-color, #333);
    color: var(--news-arrow-bg, #ffffff);
  }

  .nav-btn:focus-visible {
    outline: 2px solid var(--news-arrow-color, #333);
    outline-offset: 2px;
  }

  .nav-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 991px) {
    .news-card {
      min-height: 390px;
      padding: 18px;
    }

    .news-image {
      border-radius: 16px;
      margin-bottom: 16px;
    }

    .news-navigation {
      justify-content: center;
      margin-top: 20px;
    }

    .nav-btn {
      width: 56px;
      height: 56px;
      font-size: 24px;
    }
  }

  @media (max-width: 767px) {
    .news-card {
      min-height: 360px;
    }

    .news-image {
      height: 180px;
      border-radius: 14px;
    }

    .news-title {
      font-size: 15px;
      line-height: 22px;
    }

    .news-excerpt {
      line-height: 22px;
      min-height: 44px;
    }
  }
`;

function toText(value) {
  return value == null ? "" : String(value).trim();
}

function toNonNegativeNumber(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function clampCards(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(4, Math.round(n)));
}

function normalizeItem(item) {
  const sourceTarget = normalizeLinkTarget(
    item?.sourceTarget ?? item?.openInNewTab,
    "_self",
  );
  return {
    image: toText(item?.image),
    title: toText(item?.title),
    excerpt: toText(item?.excerpt),
    date: toText(item?.date),
    source: toText(item?.source),
    sourceUrl: ensureMailto(item?.sourceUrl || ""),
    articleUrl: toText(item?.articleUrl),
    sourceTarget,
  };
}

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

function resolveThemeColor(rawKey, fallback) {
  const key = toText(rawKey);
  if (!key) return fallback;
  if (isDirectCssColor(key)) return key;
  return getColor(key) || key;
}

function chunkItems(items, size) {
  if (!Array.isArray(items) || items.length === 0 || size <= 0) return [];
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export default function NewsFeedSlider(props) {
  const items = Array.isArray(props?.newsFeedSliderItems)
    ? props.newsFeedSliderItems.map(normalizeItem).filter((item) => item.title)
    : [];
  const safeItems = items;

  const cardsDesktop = clampCards(props?.newsFeedSliderCardsDesktop, 3);
  const cardsTablet = clampCards(props?.newsFeedSliderCardsTablet, 2);
  const cardsMobile = clampCards(props?.newsFeedSliderCardsMobile, 1);
  const cardGap = toNonNegativeNumber(props?.newsFeedSliderCardGap, 20);
  const showArrows = props?.newsFeedSliderShowArrows !== false;
  const loop = props?.newsFeedSliderLoop === true;
  const arrowSize = toNonNegativeNumber(props?.newsFeedSliderArrowSize, 70);

  const cardTitleColor = resolveThemeColor(
    props?.newsFeedSliderItemTitleColorKey,
    "#262a2c",
  );
  const excerptColor = resolveThemeColor(
    props?.newsFeedSliderItemDescColorKey,
    "#3c3c3c",
  );
  const dateColor = resolveThemeColor(
    props?.newsFeedSliderDateColorKey,
    "#1a1a1a",
  );
  const sourceBg = resolveThemeColor(
    props?.newsFeedSliderSourceBgColorKey,
    "#333",
  );
  const sourceColor = resolveThemeColor(
    props?.newsFeedSliderSourceTextColorKey,
    "#ffffff",
  );
  const arrowColor = resolveThemeColor(
    props?.newsFeedSliderArrowButtonColorKey ||
      props?.newsFeedSliderArrowNextColorKey ||
      props?.newsFeedSliderArrowPrevColorKey,
    "#333",
  );
  const arrowBgColor = resolveThemeColor(
    props?.newsFeedSliderArrowButtonBgColorKey ||
      props?.newsFeedSliderArrowNextBgColorKey ||
      props?.newsFeedSliderArrowPrevBgColorKey,
    "#ffffff",
  );

  const [cardsPerView, setCardsPerView] = useState(cardsDesktop);
  useEffect(() => {
    const apply = () => {
      if (window.innerWidth <= 767) {
        setCardsPerView(cardsMobile);
      } else if (window.innerWidth <= 1199) {
        setCardsPerView(cardsTablet);
      } else {
        setCardsPerView(cardsDesktop);
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [cardsDesktop, cardsTablet, cardsMobile]);

  const pages = useMemo(
    () => chunkItems(safeItems, cardsPerView),
    [safeItems, cardsPerView],
  );
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    if (pages.length === 0) {
      setActivePage(0);
      return;
    }
    setActivePage((prev) => Math.min(prev, pages.length - 1));
  }, [pages.length]);

  if (!pages.length) return null;

  const canGoPrev = loop || activePage > 0;
  const canGoNext = loop || activePage < pages.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    setActivePage((prev) => (prev <= 0 ? pages.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (!canGoNext) return;
    setActivePage((prev) => (prev >= pages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <SliderRoot
        style={{
          "--news-cards-per-view": cardsPerView,
          "--news-card-gap": `${cardGap}px`,
          "--news-title-color": cardTitleColor,
          "--news-excerpt-color": excerptColor,
          "--news-date-color": dateColor,
          "--news-source-bg": sourceBg,
          "--news-source-color": sourceColor,
          "--news-arrow-bg": arrowBgColor,
          "--news-arrow-color": arrowColor,
          "--news-arrow-size": `${arrowSize}px`,
        }}
      >
        <div className="news-feed-slider">
          <div className="news-grid">
            {pages[activePage].map((item, index) => {
              const cardKey = `${item.title}-${index}`;
              const cardLink =
                ensureMailto(item.sourceUrl || "") ||
                ensureMailto(item.articleUrl || "");
              const openInNewTab = item.sourceTarget === "_blank";
              const sourceNode = item.source ? (
                <span className="news-source">{item.source}</span>
              ) : null;

              const cardNode = (
                <article className="news-card">
                  <div className="news-image">
                    {item.image ? (
                      <MediaImage
                        src={item.image}
                        alt={item.title || "News image"}
                        width={1200}
                        height={706}
                        sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                        imgStyle={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span style={{ color: "rgba(0,0,0,0.25)", fontSize: 13 }}>
                        IMAGE PLACEHOLDER
                      </span>
                    )}
                  </div>

                  <h3 className="news-title">{item.title}</h3>
                  {item.excerpt && <p className="news-excerpt">{item.excerpt}</p>}

                  <div className="news-meta">
                    <span className="news-date">{item.date}</span>
                    {sourceNode}
                  </div>
                </article>
              );

              if (cardLink) {
                return (
                  <a
                    className="news-card-link"
                    key={cardKey}
                    href={cardLink}
                    target={openInNewTab ? "_blank" : "_self"}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                  >
                    {cardNode}
                  </a>
                );
              }

              return (
                <article className="news-card" key={cardKey}>
                  <div className="news-image">
                    {item.image ? (
                      <MediaImage
                        src={item.image}
                        alt={item.title || "News image"}
                        width={1200}
                        height={706}
                        sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                        imgStyle={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span style={{ color: "rgba(0,0,0,0.25)", fontSize: 13 }}>
                        IMAGE PLACEHOLDER
                      </span>
                    )}
                  </div>
                  <h3 className="news-title">{item.title}</h3>
                  {item.excerpt && <p className="news-excerpt">{item.excerpt}</p>}
                  <div className="news-meta">
                    <span className="news-date">{item.date}</span>
                    {sourceNode}
                  </div>
                </article>
              );
            })}
          </div>

          {showArrows && pages.length > 1 && (
            <div className="news-navigation">
              <button
                type="button"
                className="nav-btn nav-btn-prev"
                aria-label="Previous"
                onClick={goPrev}
                disabled={!canGoPrev}
              >
                <LeftOutlined />
              </button>
              <button
                type="button"
                className="nav-btn nav-btn-next"
                aria-label="Next"
                onClick={goNext}
                disabled={!canGoNext}
              >
                <RightOutlined />
              </button>
            </div>
          )}
        </div>
      </SliderRoot>
    </>
  );
}
