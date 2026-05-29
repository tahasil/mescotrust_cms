"use client";

import { useEffect, useRef, useState } from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

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

function toBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function toNumber(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  if (Number.isFinite(min) && next < min) return min;
  if (Number.isFinite(max) && next > max) return max;
  return next;
}

function normalizeItem(item = {}) {
  return {
    quote: toText(item?.quote, ""),
    name: toText(item?.name, ""),
    title: toText(item?.title, ""),
    imageUrl: toText(item?.imageUrl, ""),
  };
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => normalizeItem(item))
    .filter((item) => item.quote || item.name || item.title || item.imageUrl);
}

const TestimonialsShell = styled.div`
  .tm-slider-shell {
    position: relative;
    padding: 0;
  }

  .tm-carousel .slick-list {
    margin: 0 -10px;
  }

  .tm-carousel .slick-track {
    display: flex !important;
  }

  .tm-carousel .slick-slide {
    height: inherit;
  }

  .tm-carousel .slick-slide > div {
    height: 100%;
  }

  .tm-slide {
    padding: 10px;
    box-sizing: border-box;
    height: 100%;
  }

  .tm-card {
    height: 100%;
    min-height: 170px;
    background: var(--tm-card-bg);
    border: 1px solid var(--tm-card-border);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(14, 57, 74, 0.08);
    padding: 18px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .tm-quote-text {
    margin: 0;
    color: var(--tm-quote-color);
    font-size: var(--tm-quote-font-size-desktop);
    line-height: var(--tm-quote-line-height);
    font-weight: var(--tm-quote-font-weight);
    font-family: var(--tm-font-family);
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
    flex: 1 1 auto;
  }

  .tm-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
  }

  .tm-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(5, 94, 130, 0.12);
  }

  .tm-name-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tm-name {
    margin: 0;
    color: var(--tm-name-color);
    font-size: var(--tm-name-font-size-desktop);
    line-height: 1.35;
    font-weight: var(--tm-name-font-weight);
    font-family: var(--tm-font-family);
  }

  .tm-role {
    margin: 0;
    color: var(--tm-role-color);
    font-size: var(--tm-role-font-size-desktop);
    line-height: 1.35;
    font-weight: var(--tm-role-font-weight);
    font-family: var(--tm-font-family);
  }

  .tm-nav {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
  }

  .tm-nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid var(--tm-arrow-border);
    background: var(--tm-arrow-bg);
    color: var(--tm-arrow-color);
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }

  .tm-nav-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .tm-nav-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .tm-carousel .slick-dots li button {
    background: var(--tm-dot-color, rgba(8, 61, 83, 0.25));
  }

  .tm-carousel .slick-dots li.slick-active button {
    background: var(--tm-dot-active-color, #055e82);
  }

  @media (max-width: 1199px) {
    .tm-card {
      min-height: 190px;
      padding: 16px;
    }
  }

  @media (max-width: 767px) {
    .tm-slider-shell {
      padding: 0;
    }

    .tm-card {
      min-height: 170px;
      border-radius: 14px;
      padding: 14px;
      gap: 12px;
    }

    .tm-quote-text {
      font-size: var(--tm-quote-font-size-mobile);
    }

    .tm-name {
      font-size: var(--tm-name-font-size-mobile);
    }

    .tm-role {
      font-size: var(--tm-role-font-size-mobile);
    }
  }
`;

/**
 * Site component: Testimonials (Testimonials).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding), Colors, content, slider settings, and items come from EditForm.
 */
export default function Testimonials(props) {
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const sectionBgType = (
    props?.testimonialsSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = toText(props?.testimonialsSectionBgImage, "");
  const sectionBgColorKey = toText(props?.testimonialsSectionBgColorKey, "");
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
    props?.testimonialsSectionPaddingTop != null
      ? Number(props.testimonialsSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.testimonialsSectionPaddingBottom != null
      ? Number(props.testimonialsSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.testimonialsSectionMarginTop != null
      ? Number(props.testimonialsSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.testimonialsSectionMarginBottom != null
      ? Number(props.testimonialsSectionMarginBottom)
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
    props?.testimonialsPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = toText(
    props?.testimonialsPageContainerBgImage,
    "",
  );
  const pageContainerBgColorKey = toText(
    props?.testimonialsPageContainerBgColorKey,
    "",
  );
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
    props?.testimonialsPageContainerPaddingTop != null
      ? Number(props.testimonialsPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.testimonialsPageContainerPaddingRight != null
      ? Number(props.testimonialsPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.testimonialsPageContainerPaddingBottom != null
      ? Number(props.testimonialsPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.testimonialsPageContainerPaddingLeft != null
      ? Number(props.testimonialsPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.testimonialsPageContainerMarginTop != null
      ? Number(props.testimonialsPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.testimonialsPageContainerMarginBottom != null
      ? Number(props.testimonialsPageContainerMarginBottom)
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

  const items = normalizeItems(props?.testimonialsItems);
  const autoplay = toBoolean(props?.testimonialsAutoplay, false);
  const showArrows = toBoolean(props?.testimonialsShowArrows, true);
  const showDots = toBoolean(props?.testimonialsShowDots, true);
  const draggable = toBoolean(props?.testimonialsDraggable, false);
  const infinite = toBoolean(props?.testimonialsInfinite, true);
  const autoplaySpeed = toNumber(
    props?.testimonialsAutoplaySpeed,
    5000,
    1000,
    30000,
  );
  const speed = toNumber(props?.testimonialsSpeed, 400, 100, 3000);
  const slidesDesktop = toNumber(props?.testimonialsSlidesDesktop, 3, 1, 4);
  const slidesTablet = toNumber(props?.testimonialsSlidesTablet, 2, 1, 3);
  const slidesMobile = toNumber(props?.testimonialsSlidesMobile, 1, 1, 2);

  const [slidesPerView, setSlidesPerView] = useState(slidesDesktop);
  useEffect(() => {
    const apply = () => {
      if (window.innerWidth <= 767) {
        setSlidesPerView(slidesMobile);
      } else if (window.innerWidth <= 1199) {
        setSlidesPerView(slidesTablet);
      } else {
        setSlidesPerView(slidesDesktop);
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [slidesDesktop, slidesTablet, slidesMobile]);

  const totalItems = items.length;
  const slidesToShow = Math.max(
    1,
    Math.min(slidesPerView, Math.max(1, totalItems)),
  );
  const maxStartIndex = Math.max(0, totalItems - slidesToShow);
  const prevDisabled = !infinite && currentSlide <= 0;
  const nextDisabled = !infinite && currentSlide >= maxStartIndex;

  const cardBg =
    resolveThemeColorValue(props?.testimonialsCardBgColorKey, "") || "#ffffff";
  const cardBorder =
    resolveThemeColorValue(props?.testimonialsCardBorderColorKey, "") ||
    "rgba(10, 59, 81, 0.12)";
  const quoteColor =
    resolveThemeColorValue(props?.testimonialsQuoteColorKey, "") ||
    "rgba(44, 56, 63, 0.95)";
  const nameColor =
    resolveThemeColorValue(props?.testimonialsNameColorKey, "") ||
    resolveThemeColorValue("primary", "") ||
    "#055e82";
  const roleColor =
    resolveThemeColorValue(props?.testimonialsRoleColorKey, "") ||
    "rgba(57, 74, 84, 0.8)";
  const arrowColor =
    resolveThemeColorValue(props?.testimonialsArrowColorKey, "") ||
    resolveThemeColorValue("primary", "") ||
    "#055e82";
  const arrowBg =
    resolveThemeColorValue(props?.testimonialsArrowBgColorKey, "") || "#ffffff";
  const dotColor =
    resolveThemeColorValue(props?.testimonialsDotColorKey, "") ||
    "rgba(8, 61, 83, 0.25)";
  const dotActiveColor =
    resolveThemeColorValue(props?.testimonialsDotActiveColorKey, "") ||
    resolveThemeColorValue("primary", "") ||
    "#055e82";
  const fontFamily = toText(props?.testimonialsFontFamily, "inherit");
  const quoteFontSizeDesktop = toNumber(
    props?.testimonialsQuoteFontSizeDesktop,
    16,
    10,
    80,
  );
  const quoteFontSizeMobile = toNumber(
    props?.testimonialsQuoteFontSizeMobile,
    15,
    10,
    72,
  );
  const quoteLineHeight = toNumber(
    props?.testimonialsQuoteLineHeight,
    1.6,
    0.8,
    3,
  );
  const quoteFontWeight = toNumber(
    props?.testimonialsQuoteFontWeight,
    500,
    100,
    900,
  );
  const nameFontSizeDesktop = toNumber(
    props?.testimonialsNameFontSizeDesktop,
    18,
    10,
    80,
  );
  const nameFontSizeMobile = toNumber(
    props?.testimonialsNameFontSizeMobile,
    16,
    10,
    72,
  );
  const nameFontWeight = toNumber(
    props?.testimonialsNameFontWeight,
    700,
    100,
    900,
  );
  const roleFontSizeDesktop = toNumber(
    props?.testimonialsRoleFontSizeDesktop,
    14,
    10,
    80,
  );
  const roleFontSizeMobile = toNumber(
    props?.testimonialsRoleFontSizeMobile,
    13,
    10,
    72,
  );
  const roleFontWeight = toNumber(
    props?.testimonialsRoleFontWeight,
    500,
    100,
    900,
  );

  const rootStyle = {
    "--tm-card-bg": cardBg,
    "--tm-card-border": cardBorder,
    "--tm-quote-color": quoteColor,
    "--tm-quote-mark-color": quoteColor,
    "--tm-name-color": nameColor,
    "--tm-role-color": roleColor,
    "--tm-arrow-color": arrowColor,
    "--tm-arrow-border": arrowColor,
    "--tm-arrow-bg": arrowBg,
    "--tm-dot-color": dotColor,
    "--tm-dot-active-color": dotActiveColor,
    "--tm-font-family": fontFamily || "inherit",
    "--tm-quote-font-size-desktop": `${quoteFontSizeDesktop}px`,
    "--tm-quote-font-size-mobile": `${quoteFontSizeMobile}px`,
    "--tm-quote-line-height": String(quoteLineHeight),
    "--tm-quote-font-weight": String(Math.round(quoteFontWeight)),
    "--tm-name-font-size-desktop": `${nameFontSizeDesktop}px`,
    "--tm-name-font-size-mobile": `${nameFontSizeMobile}px`,
    "--tm-name-font-weight": String(Math.round(nameFontWeight)),
    "--tm-role-font-size-desktop": `${roleFontSizeDesktop}px`,
    "--tm-role-font-size-mobile": `${roleFontSizeMobile}px`,
    "--tm-role-font-weight": String(Math.round(roleFontWeight)),
  };

  return (
    <TestimonialsShell style={rootStyle}>
      {items.length > 0 ? (
        <div className="tm-slider-shell">
          <Carousel
            ref={carouselRef}
            className="tm-carousel"
            dots={showDots}
            autoplay={autoplay}
            autoplaySpeed={autoplaySpeed}
            speed={speed}
            infinite={infinite}
            draggable={draggable}
            slidesToShow={slidesToShow}
            slidesToScroll={1}
            beforeChange={(_, next) => setCurrentSlide(next)}
          >
            {items.map((item, index) => (
              <div key={`testimonial-${index}`} className="tm-slide">
                <article className="tm-card">
                  <p className="tm-quote-text">
                    “{String(item.quote || "").replace(/^[“"\s]+/, "")}
                  </p>
                  <footer className="tm-footer">
                    {item.imageUrl ? (
                      <img
                        className="tm-avatar"
                        src={item.imageUrl}
                        alt={item.name || "Testimonial author"}
                        loading="lazy"
                      />
                    ) : null}
                    <div className="tm-name-wrap">
                      {item.name ? (
                        <p className="tm-name">{item.name}</p>
                      ) : null}
                      {item.title ? (
                        <p className="tm-role">{item.title}</p>
                      ) : null}
                    </div>
                  </footer>
                </article>
              </div>
            ))}
          </Carousel>

          {showArrows && items.length > slidesToShow ? (
            <div className="tm-nav">
              <button
                type="button"
                className="tm-nav-btn"
                onClick={() => carouselRef.current?.prev()}
                disabled={prevDisabled}
                aria-label="Previous testimonial"
              >
                <LeftOutlined />
              </button>
              <button
                type="button"
                className="tm-nav-btn"
                onClick={() => carouselRef.current?.next()}
                disabled={nextDisabled}
                aria-label="Next testimonial"
              >
                <RightOutlined />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </TestimonialsShell>
  );
}
