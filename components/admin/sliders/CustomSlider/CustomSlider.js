"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import {
  FullWidthBackground,
  MainTitle,
  PageContainer,
  SubTitle,
  getColor,
} from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

function splitIntoGroups(list, size) {
  if (!Array.isArray(list) || list.length === 0 || size <= 0) return [];
  const groups = [];
  for (let i = 0; i < list.length; i += size) {
    groups.push(list.slice(i, i + size));
  }
  return groups;
}

function toText(value) {
  return value == null ? "" : String(value).trim();
}

function decodeHtmlEntities(value) {
  return toText(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPrimaryEnabledLink(socialLinks) {
  if (!Array.isArray(socialLinks)) return null;
  return (
    socialLinks.find(
      (entry) => toText(entry?.url) && entry?.linkEnabled === true,
    ) || null
  );
}

function normalizeOrderIds(list) {
  return Array.isArray(list)
    ? list.map((id) => toText(id)).filter(Boolean)
    : [];
}

function orderPortfolioItems(items, orderedIds) {
  const safeItems = Array.isArray(items) ? items : [];
  const order = normalizeOrderIds(orderedIds);
  if (safeItems.length === 0 || order.length === 0) return safeItems;
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...safeItems].sort((a, b) => {
    const aId = toText(a?._id);
    const bId = toText(b?._id);
    const aRank = rank.has(aId) ? rank.get(aId) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(bId) ? rank.get(bId) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return toText(a?.name || a?.title).localeCompare(
      toText(b?.name || b?.title),
    );
  });
}

function normalizeFeaturedPortfolioSlides(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const name = toText(item?.name || item?.title);
      const primaryLink = getPrimaryEnabledLink(item?.socialLinks);
      const linkUrl = ensureMailto(primaryLink?.url || "");
      const linkText =
        toText(primaryLink?.label || primaryLink?.platform) || "Know More";
      const linkTarget = normalizeTargetFromItem(
        primaryLink,
        {
          targetKeys: ["target", "sourceTarget"],
          boolKeys: ["openInNewTab", "newTab"],
          fallback: "_self",
        },
      );
      const image = toText(item?.image);
      const logo = toText(item?.logo);
      const description = stripHtml(
        item?.bio || item?.description || item?.designation,
      );
      const itemId = toText(item?._id);

      return {
        _key: `portfolio-slide-${itemId || index}`,
        logoUrl: logo,
        logoAlt: name ? `${name} logo` : "Logo",
        title: name,
        description,
        linkText,
        linkUrl,
        linkTarget,
        linkEnabled: Boolean(linkUrl),
        sideImageDesktopUrl: image,
        sideImageTabletMobileUrl: image,
        sideImageAlt: name || "Slide image",
      };
    })
    .filter(
      (item) =>
        item.logoUrl ||
        item.title ||
        item.description ||
        item.sideImageDesktopUrl ||
        item.sideImageTabletMobileUrl,
    );
}

function resolveResponsiveMode(width) {
  if (width <= 767) return "mobile";
  if (width <= 992) return "tablet";
  return "desktop";
}

function normalizeImageRatio(width, height, fallback = 1.2) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return fallback;
  }
  return Math.min(2.4, Math.max(0.65, w / h));
}

export default function CustomSlider(props) {
  const mainTitle = (props?.mainTitle ?? "Featured Portfolio")
    .toString()
    .trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();

  const sectionTitleColorKey = (props?.customSliderSectionTitleColorKey ?? "")
    .toString()
    .trim();
  const sectionSubTitleColorKey = (
    props?.customSliderSectionSubTitleColorKey ?? ""
  )
    .toString()
    .trim();
  const cardBgColorKey = (props?.customSliderCardBgColorKey ?? "")
    .toString()
    .trim();
  const cardHoverBgColorKey = (props?.customSliderCardHoverBgColorKey ?? "")
    .toString()
    .trim();
  const itemTitleColorKey = (props?.customSliderItemTitleColorKey ?? "")
    .toString()
    .trim();
  const itemDescriptionColorKey = (
    props?.customSliderItemDescriptionColorKey ?? ""
  )
    .toString()
    .trim();
  const linkColorKey = (props?.customSliderLinkColorKey ?? "")
    .toString()
    .trim();
  const arrowColorKey = (props?.customSliderArrowButtonColorKey ?? "")
    .toString()
    .trim();
  const arrowBgColorKey = (props?.customSliderArrowButtonBgColorKey ?? "")
    .toString()
    .trim();

  const sectionBgType = (
    props?.customSliderSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.customSliderSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.customSliderSectionBgColorKey ?? "")
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
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.customSliderSectionPaddingTop != null
      ? Number(props.customSliderSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.customSliderSectionPaddingBottom != null
      ? Number(props.customSliderSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.customSliderSectionMarginTop != null
      ? Number(props.customSliderSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.customSliderSectionMarginBottom != null
      ? Number(props.customSliderSectionMarginBottom)
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
    props?.customSliderPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.customSliderPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.customSliderPageContainerBgColorKey ?? ""
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
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop =
    props?.customSliderPageContainerPaddingTop != null
      ? Number(props.customSliderPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.customSliderPageContainerPaddingRight != null
      ? Number(props.customSliderPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.customSliderPageContainerPaddingBottom != null
      ? Number(props.customSliderPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.customSliderPageContainerPaddingLeft != null
      ? Number(props.customSliderPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.customSliderPageContainerMarginTop != null
      ? Number(props.customSliderPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.customSliderPageContainerMarginBottom != null
      ? Number(props.customSliderPageContainerMarginBottom)
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

  const [slides, setSlides] = useState([]);
  const [imageAspectRatios, setImageAspectRatios] = useState({});

  useEffect(() => {
    let ignore = false;
    fetch("/api/portfolio?featured=1&allCategories=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (ignore) return;
        const orderedItems = orderPortfolioItems(
          data?.items,
          props?.customSliderPortfolioOrder,
        );
        setSlides(normalizeFeaturedPortfolioSlides(orderedItems));
      })
      .catch(() => {
        if (ignore) return;
        setSlides([]);
      });

    return () => {
      ignore = true;
    };
  }, [props?.customSliderPortfolioOrder]);

  useEffect(() => {
    setImageAspectRatios({});
  }, [slides]);

  const [mode, setMode] = useState("desktop");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setMode(resolveResponsiveMode(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keep tablet image/cards behavior aligned with mobile to avoid compressed/cropped presentation.
  const perPage = mode === "desktop" ? 4 : 1;
  const groupedSlides = useMemo(
    () => splitIntoGroups(slides, perPage),
    [slides, perPage],
  );

  const showArrows =
    props?.customSliderShowArrows !== false && groupedSlides.length > 1;
  const showDots =
    props?.customSliderShowDots !== false && groupedSlides.length > 1;
  const autoplay =
    props?.customSliderAutoplay !== false && groupedSlides.length > 1;
  const autoplaySpeed =
    props?.customSliderAutoplaySpeed != null
      ? Math.max(1000, Number(props.customSliderAutoplaySpeed))
      : 4500;
  const speed =
    props?.customSliderSpeed != null
      ? Math.max(200, Number(props.customSliderSpeed))
      : 500;

  const carouselRef = useRef(null);

  if (slides.length === 0) return null;

  const sectionTitleColor = sectionTitleColorKey
    ? getColor(sectionTitleColorKey)
    : getColor("primary");
  const sectionSubTitleColor = sectionSubTitleColorKey
    ? getColor(sectionSubTitleColorKey)
    : getColor("primary");
  const titleUsesGradient =
    /gradient/i.test(sectionTitleColorKey) ||
    /gradient/i.test(String(sectionTitleColor || ""));
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "#FFFFFF";
  const cardHoverBgColor = cardHoverBgColorKey
    ? getColor(cardHoverBgColorKey)
    : cardBgColor;
  const itemTitleColor = itemTitleColorKey
    ? getColor(itemTitleColorKey)
    : "#111111";
  const itemDescriptionColor = itemDescriptionColorKey
    ? getColor(itemDescriptionColorKey)
    : "#525252";
  const linkColor = linkColorKey ? getColor(linkColorKey) : getColor("primary");
  const arrowColor = arrowColorKey
    ? getColor(arrowColorKey)
    : getColor("primary");
  const arrowBgColor = arrowBgColorKey ? getColor(arrowBgColorKey) : "#FFFFFF";

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <section
          className="custom-slider-root"
          aria-label={mainTitle || "Custom slider"}
        >
          {(subTitle || mainTitle) && (
            <header className="custom-slider-header">
              <div className="custom-slider-heading-text">
                {subTitle ? (
                  <SubTitle as="p" color={sectionSubTitleColor}>
                    {subTitle}
                  </SubTitle>
                ) : null}
                {mainTitle ? (
                  <MainTitle
                    as="h2"
                    color={
                      titleUsesGradient ? "transparent" : sectionTitleColor
                    }
                    style={
                      titleUsesGradient
                        ? {
                            background: sectionTitleColor,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }
                        : undefined
                    }
                  >
                    {mainTitle}
                  </MainTitle>
                ) : null}
              </div>
              {showArrows ? (
                <div
                  className="custom-slider-nav"
                  aria-label="Slider navigation"
                >
                  <button
                    type="button"
                    className="custom-slider-nav-btn"
                    onClick={() => carouselRef.current?.prev?.()}
                    aria-label="Previous slides"
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    type="button"
                    className="custom-slider-nav-btn custom-slider-nav-btn-next"
                    onClick={() => carouselRef.current?.next?.()}
                    aria-label="Next slides"
                  >
                    <RightOutlined />
                  </button>
                </div>
              ) : null}
            </header>
          )}

          <Carousel
            ref={carouselRef}
            dots={showDots}
            autoplay={autoplay}
            autoplaySpeed={autoplaySpeed}
            speed={speed}
            draggable
            infinite={groupedSlides.length > 1}
            className="custom-slider-carousel"
          >
            {groupedSlides.map((group, groupIndex) => (
              <div key={`group-${groupIndex}`} className="custom-slider-page">
                <div
                  className={`custom-slider-grid custom-slider-grid-${mode}`}
                >
                  {group.map((item, itemIndex) => {
                    const imageForDesktop = item.sideImageDesktopUrl || "";
                    const imageForTabletMobile =
                      item.sideImageTabletMobileUrl || "";
                    const sideImageSrc =
                      mode === "desktop"
                        ? imageForDesktop || imageForTabletMobile
                        : imageForTabletMobile || imageForDesktop;
                    const imageKey = `${item._key}-${sideImageSrc || "no-image"}`;
                    const imageRatio = imageAspectRatios[imageKey] || 1.2;
                    const desktopImageCol = Math.round(
                      Math.min(360, Math.max(190, imageRatio * 220)),
                    );
                    const itemMinHeight = Math.round(
                      Math.min(320, Math.max(170, desktopImageCol / imageRatio)),
                    );
                    const itemStyle = {
                      "--item-image-col": `${desktopImageCol}px`,
                      "--item-row-min-height": `${itemMinHeight}px`,
                    };
                    return (
                      <article
                        className={`custom-slider-item ${
                          mode === "desktop" && itemIndex >= 2
                            ? "is-reverse-desktop"
                            : ""
                        }`}
                        key={item._key}
                        style={itemStyle}
                      >
                        <div className="custom-slider-item-inner">
                          <div className="custom-slider-item-content">
                            <div className="custom-slider-item-head">
                              {item.logoUrl ? (
                                <span className="custom-slider-logo-badge">
                                  <img
                                    src={item.logoUrl}
                                    alt={item.logoAlt || "Logo"}
                                    loading="lazy"
                                    decoding="async"
                                    width="30"
                                    height="30"
                                    className="custom-slider-logo"
                                  />
                                </span>
                              ) : null}
                              <h3 className="custom-slider-item-title">
                                {item.title}
                              </h3>
                            </div>
                            <p className="custom-slider-item-description">
                              {item.description}
                            </p>
                            {item.linkEnabled ? (
                              <a
                                href={item.linkUrl}
                                target={item.linkTarget === "_blank" ? "_blank" : "_self"}
                                rel={
                                  item.linkTarget === "_blank"
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                className="custom-slider-item-link"
                                aria-label={`${item.linkText || "Know More"} about ${item.title || "item"}`}
                              >
                                {item.linkText || "Know More"}
                              </a>
                            ) : null}
                          </div>
                          <div className="custom-slider-item-image-wrap">
                            {sideImageSrc ? (
                              <img
                                src={sideImageSrc}
                                alt={
                                  item.sideImageAlt ||
                                  item.title ||
                                  "Slide image"
                                }
                                loading="lazy"
                                decoding="async"
                                className="custom-slider-item-image"
                                onLoad={(event) => {
                                  const ratio = normalizeImageRatio(
                                    event.currentTarget?.naturalWidth,
                                    event.currentTarget?.naturalHeight,
                                  );
                                  setImageAspectRatios((prev) => {
                                    if (prev[imageKey] === ratio) return prev;
                                    return { ...prev, [imageKey]: ratio };
                                  });
                                }}
                              />
                            ) : (
                              <div
                                className="custom-slider-item-image-empty"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </Carousel>
        </section>
      </PageContainer>

      <style jsx>{`
        .custom-slider-root {
          position: relative;
          width: 100%;
        }
        .custom-slider-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .custom-slider-heading-text {
          min-width: 0;
        }
        .custom-slider-nav {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .custom-slider-nav-btn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid ${arrowColor};
          color: ${arrowColor};
          background: ${arrowBgColor};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .custom-slider-nav-btn:hover {
          background: ${arrowColor};
          color: ${arrowBgColor};
        }
        .custom-slider-nav-btn:focus-visible {
          outline: 2px solid ${arrowColor};
          outline-offset: 2px;
        }
        .custom-slider-grid {
          display: grid;
          gap: 14px;
          align-items: stretch;
        }
        .custom-slider-grid-desktop {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .custom-slider-grid-tablet {
          grid-template-columns: 1fr;
        }
        .custom-slider-grid-mobile {
          grid-template-columns: 1fr;
        }
        .custom-slider-item {
          height: 100%;
          min-width: 0;
        }
        .custom-slider-item-inner {
          height: 100%;
          min-height: var(--item-row-min-height, 230px);
          background: transparent;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(190px, var(--item-image-col, 220px));
          gap: 10px;
          overflow: visible;
          min-width: 0;
          align-items: start;
        }
        .custom-slider-item-content {
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
          min-height: var(--item-row-min-height, 230px);
          background: ${cardBgColor};
          border-radius: 14px;
          border: none;
          transition: background-color 0.2s ease;
        }
        .custom-slider-item:hover .custom-slider-item-content,
        .custom-slider-item:focus-within .custom-slider-item-content,
        .custom-slider-item-inner:hover .custom-slider-item-content,
        .custom-slider-item-inner:focus-within .custom-slider-item-content,
        .custom-slider-item-content:hover,
        .custom-slider-item-content:focus-within {
          background: ${cardHoverBgColor};
        }
        .custom-slider-item-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          min-height: 52px;
        }
        .custom-slider-logo-badge {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          overflow: hidden;
          flex: 0 0 auto;
        }
        .custom-slider-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          display: block;
        }
        .custom-slider-item-title {
          margin: 0;
          font-size: 18px;
          line-height: 1.3;
          font-weight: 500;
          color: ${itemTitleColor};
          -webkit-text-fill-color: currentColor;
          transition: color 0.2s ease;
        }
        .custom-slider-item-description {
          margin: 0;
          color: ${itemDescriptionColor};
          font-size: 15px;
          line-height: 1.5;
          flex: 1 1 auto;
          min-height: 72px;
          transition: color 0.2s ease;
        }
        .custom-slider-item-link {
          margin-top: 14px;
          color: ${linkColor};
          font-size: 15px;
          line-height: 1;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .custom-slider-item-link-disabled {
          pointer-events: none;
          cursor: default;
          opacity: 0.65;
        }
        .custom-slider-item-link:focus-visible {
          outline: 2px solid ${linkColor};
          outline-offset: 2px;
          border-radius: 4px;
        }
        .custom-slider-item:hover .custom-slider-item-title,
        .custom-slider-item:focus-within .custom-slider-item-title,
        .custom-slider-item-inner:hover .custom-slider-item-title,
        .custom-slider-item-inner:focus-within .custom-slider-item-title,
        .custom-slider-item-content:hover .custom-slider-item-title,
        .custom-slider-item-content:focus-within .custom-slider-item-title,
        .custom-slider-item:hover .custom-slider-item-description,
        .custom-slider-item:focus-within .custom-slider-item-description,
        .custom-slider-item-inner:hover .custom-slider-item-description,
        .custom-slider-item-inner:focus-within .custom-slider-item-description,
        .custom-slider-item-content:hover .custom-slider-item-description,
        .custom-slider-item-content:focus-within
          .custom-slider-item-description {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background-image: none !important;
        }
        .custom-slider-item:hover .custom-slider-item-link,
        .custom-slider-item:focus-within .custom-slider-item-link,
        .custom-slider-item-inner:hover .custom-slider-item-link,
        .custom-slider-item-inner:focus-within .custom-slider-item-link,
        .custom-slider-item-content:hover .custom-slider-item-link,
        .custom-slider-item-content:focus-within .custom-slider-item-link {
          color: #ffffff !important;
        }
        .custom-slider-item-image-wrap {
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: auto;
          padding: 0;
          border-radius: 14px;
          overflow: hidden;
          border: none;
          min-width: 0;
          line-height: 0;
        }
        .custom-slider-item-image {
          width: 100%;
          height: auto;
          object-fit: contain;
          object-position: center center;
          border-radius: 14px;
          background: transparent;
          display: block;
        }
        .custom-slider-item-image-empty {
          width: 100%;
          height: 100%;
          min-height: 150px;
        }
      `}</style>
      <style jsx global>{`
        .custom-slider-carousel .slick-list {
          margin: 0 -2px;
        }
        .custom-slider-carousel .slick-slide > div {
          padding: 2px;
        }
        .custom-slider-carousel .slick-dots {
          position: static;
          margin-top: 16px;
          display: flex !important;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }
        .custom-slider-carousel .slick-dots li {
          width: auto;
          height: auto;
          margin: 0;
        }
        .custom-slider-carousel .slick-dots li button {
          width: 28px;
          height: 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
          opacity: 1;
          padding: 0;
        }
        .custom-slider-carousel .slick-dots li.slick-active button {
          background: ${linkColor};
        }
        @media (max-width: 992px) {
          .custom-slider-header {
            flex-wrap: wrap;
            align-items: center;
          }
          .custom-slider-nav {
            margin-left: auto;
          }
          .custom-slider-item-inner {
            grid-template-columns: 1fr !important;
            min-height: 0;
            gap: 14px;
            align-content: start;
          }
          .custom-slider-item-image-wrap {
            order: 1;
            min-height: unset;
            width: 100%;
            background: transparent !important;
            box-shadow: none !important;
          }
          .custom-slider-item-content {
            order: 2;
            width: 100%;
            height: auto;
            min-height: 0;
            padding: 18px 16px;
          }
          .custom-slider-item-title {
            font-size: 17px;
          }
          .custom-slider-item-description {
            font-size: 14px;
            min-height: 0;
          }
          .custom-slider-item-link {
            font-size: 14px;
          }
        }
        @media (max-width: 767px) {
          .custom-slider-header {
            align-items: center;
            margin-bottom: 14px;
          }
          .custom-slider-nav {
            gap: 8px;
          }
          .custom-slider-nav-btn {
            width: 36px;
            height: 36px;
          }
          .custom-slider-item-inner {
            grid-template-columns: 1fr !important;
            gap: 12px;
          }
          .custom-slider-item-image-wrap {
            order: 1;
            min-height: unset;
            width: 100%;
            background: transparent !important;
            box-shadow: none !important;
          }
          .custom-slider-item-content {
            order: 2;
            padding: 16px 14px;
          }
          .custom-slider-item-head {
            min-height: 0;
          }
          .custom-slider-logo-badge {
            width: 40px;
            height: 40px;
            border-radius: 9px;
          }
          .custom-slider-logo {
            width: 100%;
            height: 100%;
          }
          .custom-slider-item-title {
            font-size: 18px;
            line-height: 1.3;
          }
          .custom-slider-item-description {
            font-size: 15px;
            min-height: 0;
          }
          .custom-slider-item-link {
            margin-top: 12px;
            font-size: 15px;
          }
        }
        @media (min-width: 993px) {
          .custom-slider-grid-desktop {
            align-items: stretch;
            grid-auto-rows: 1fr;
          }
          .custom-slider-grid-desktop .custom-slider-item {
            height: 100%;
          }
          .custom-slider-item-inner {
            align-items: stretch;
            gap: 0;
            min-height: var(--item-row-min-height, 230px);
            height: auto;
            grid-template-columns: minmax(0, 1fr) minmax(190px, var(--item-image-col, 220px));
          }
          .custom-slider-item-content {
            height: var(--item-row-min-height, 230px);
            min-height: var(--item-row-min-height, 230px);
            max-height: var(--item-row-min-height, 230px);
            overflow: hidden;
            align-self: stretch;
            padding: 16px 14px;
          }
          .custom-slider-item-head {
            margin-bottom: 8px;
          }
          .custom-slider-item-description {
            flex: 1 1 auto;
            min-height: 0;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .custom-slider-item-link {
            margin-top: 8px;
          }
          .custom-slider-item-image-wrap {
            height: var(--item-row-min-height, 230px);
            min-height: var(--item-row-min-height, 230px);
            max-height: var(--item-row-min-height, 230px);
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            align-self: stretch;
            justify-self: stretch;
          }
          .custom-slider-item-image {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .custom-slider-item.is-reverse-desktop .custom-slider-item-inner {
            grid-template-columns: minmax(190px, var(--item-image-col, 220px)) minmax(0, 1fr);
          }
          .custom-slider-item.is-reverse-desktop
            .custom-slider-item-image-wrap {
            order: 1;
            justify-self: stretch;
          }
          .custom-slider-item.is-reverse-desktop .custom-slider-item-content {
            order: 2;
          }
        }
      `}</style>
    </FullWidthBackground>
  );
}
