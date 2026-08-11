"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-fullscreen.css";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

const DEFAULT_TABS = ["All", "Education", "Medical", "Events", "Community"];
let lightGalleryModulesPromise;

function loadLightGalleryModules() {
  if (!lightGalleryModulesPromise) {
    lightGalleryModulesPromise = Promise.all([
      import("lightgallery"),
      import("lightgallery/plugins/thumbnail"),
      import("lightgallery/plugins/zoom"),
      import("lightgallery/plugins/fullscreen"),
    ]).then(([core, thumbnail, zoom, fullscreen]) => ({
      createLightGallery: core.default,
      plugins: [thumbnail.default, zoom.default, fullscreen.default],
    }));
  }
  return lightGalleryModulesPromise;
}

const revealCard = keyframes`
  from { opacity: 0; transform: translateY(calc(var(--gallery-reveal-distance) * 1px)); }
  to { opacity: 1; transform: translateY(0); }
`;

const GalleryRoot = styled.div`
  width: 100%;
  color: var(--gallery-text);
  font-family: var(--fable-body, "Instrument Sans", system-ui, sans-serif);

  .gallery-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: calc(var(--gallery-heading-gap) * 1px);
  }

  .gallery-subtitle {
    margin: 0 0 14px;
    color: var(--gallery-subtitle);
    font-size: calc(var(--gallery-subtitle-size) * 1px);
    font-weight: var(--gallery-subtitle-weight);
    line-height: 1.4;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .gallery-title {
    margin: 0;
    color: var(--gallery-title);
    font-family: var(--fable-display, "Bricolage Grotesque", system-ui, sans-serif);
    font-size: clamp(34px, calc(var(--gallery-title-size) * 1px), 72px);
    font-weight: var(--gallery-title-weight);
    line-height: var(--gallery-title-line-height);
    letter-spacing: -0.03em;
  }

  .gallery-title em {
    color: var(--gallery-title-accent);
    font-style: normal;
  }

  .gallery-view-link {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding-bottom: 5px;
    color: var(--gallery-link);
    border-bottom: 1px solid currentColor;
    font-size: 14px;
    font-weight: 650;
    text-decoration: none;
  }

  .gallery-view-link.gallery-view-link {
    color: var(--gallery-link);
  }

  .gallery-view-link svg { transition: transform 260ms ease; }
  .gallery-view-link:hover svg { transform: translateX(4px); }

  @media (max-width: 767px) {
    .gallery-heading { align-items: flex-start; flex-direction: column; }
    .gallery-title { font-size: clamp(32px, 10vw, 48px); }
  }
`;

const Filters = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.$alignment === "left"
      ? "flex-start"
      : props.$alignment === "right"
        ? "flex-end"
        : "center"};
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: calc(var(--gallery-filter-gap) * 1px);
`;

const FilterButton = styled.button`
  padding: 8px 24px;
  border: 1px solid ${(props) =>
    props.$active
      ? "var(--gallery-tab-active-border)"
      : "var(--gallery-tab-border)"};
  border-radius: 30px;
  background: ${(props) =>
    props.$active ? "var(--gallery-tab-active-bg)" : "transparent"};
  color: ${(props) =>
    props.$active ? "var(--gallery-tab-active-text)" : "var(--gallery-tab-text)"};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  cursor: pointer;
  transition: color 220ms ease, border-color 220ms ease, background 220ms ease,
    transform 220ms ease;

  &:hover {
    color: ${(props) =>
      props.$active ? "var(--gallery-tab-active-text)" : "var(--gallery-tab-hover-text)"};
    border-color: var(--gallery-tab-hover-border);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--gallery-accent) 28%, transparent);
    outline-offset: 2px;
  }

  @media (max-width: 560px) {
    padding: 8px 17px;
    font-size: 13px;
  }
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--gallery-columns), minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: calc(var(--gallery-grid-gap) * 1px);
  align-items: stretch;

  @media (max-width: 991px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: min(calc(var(--gallery-grid-gap) * 1px), 24px);
  }

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 10px;
  }
`;

const GalleryCard = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0;
  margin: 0;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--gallery-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  animation: ${revealCard} calc(var(--gallery-reveal-duration) * 1s) cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--gallery-card-delay, 0ms);

  .gallery-cover {
    position: relative;
    display: block;
    flex: 0 0 auto;
    width: 100%;
    aspect-ratio: var(--gallery-aspect-ratio);
    overflow: hidden;
    border-radius: calc(var(--gallery-card-radius) * 1px);
    background: var(--gallery-card-bg);
    transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
    border-radius: inherit;
  }

  &:hover .gallery-cover { transform: scale(0.98); }

  &:focus-visible { outline: 3px solid var(--gallery-accent); outline-offset: 3px; }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    .gallery-cover { transition: none; }
  }

  @media (max-width: 620px) {
    .gallery-cover { border-radius: min(calc(var(--gallery-card-radius) * 1px), 12px); }
  }
`;

const CardTitle = styled.span`
  position: static;
  display: block;
  flex: 1 1 auto;
  padding: 10px 0 0;
  color: var(--gallery-card-title);
  font-size: calc(var(--gallery-card-title-size) * 1px);
  font-weight: var(--gallery-card-title-weight);
  line-height: var(--gallery-card-title-line-height);

  .gallery-card-title { display: inline; color: var(--gallery-card-title); }
  .gallery-card-description {
    display: block;
    margin-top: 5px;
    color: var(--gallery-card-description);
    font-size: 0.82em;
    font-weight: 400;
  }
  .gallery-card-date {
    display: block;
    margin-top: 5px;
    color: var(--gallery-date);
    font-size: 0.76em;
    font-weight: 500;
  }

  @media (max-width: 620px) {
    padding-top: 6px;
    font-size: clamp(9px, 2.8vw, 12px);
    line-height: 1.3;
  }

`;

const PhotoCount = styled.span`
  position: static;
  display: inline;
  margin-left: 4px;
  padding: 0;
  color: var(--gallery-count-text);
  background: transparent;
  font-size: 0.92em;
  font-weight: 500;
`;

const HoverArrow = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  right: auto;
  bottom: auto;
  z-index: 2;
  min-width: 38px;
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--gallery-button-border);
  border-radius: 999px;
  color: var(--gallery-button-text);
  background: var(--gallery-button-bg);
  font-size: 13px;
  font-weight: 650;
  opacity: 0;
  transform: translate(-50%, calc(-50% + 8px));
  transition: opacity 260ms ease, transform 260ms ease, background 260ms ease,
    color 260ms ease, border-color 260ms ease;

  &:hover {
    color: var(--gallery-button-hover-text);
    background: var(--gallery-button-hover-bg);
    border-color: var(--gallery-button-hover-border);
  }

  ${GalleryCard}:hover &, ${GalleryCard}:focus-visible & {
    opacity: 1;
    transform: translate(-50%, -50%);
  }

  @media (hover: none), (max-width: 767px) {
    display: none;
  }
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  border: 1px dashed var(--gallery-card-border);
  border-radius: calc(var(--gallery-card-radius) * 1px);
  color: var(--gallery-text);
  text-align: center;
`;

const ViewMoreWrap = styled.div`
  margin-top: 32px;
  text-align: center;
`;

const ViewMoreLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 12px 22px;
  border-radius: 999px;
  color: var(--gallery-view-more-text);
  background: var(--gallery-view-more-bg);
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  transition: transform 220ms ease, box-shadow 220ms ease;

  &:hover {
    color: var(--gallery-view-more-text);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(42, 40, 62, 0.14);
  }


  && { color: var(--gallery-view-more-text); }
`;

const LightboxTheme = createGlobalStyle`
  .lg-backdrop { background: rgba(10, 9, 15, 0.94); }
  .lg-outer .lg-thumb-outer { background: rgba(10, 9, 15, 0.9); }
  .lg-outer .lg-sub-html h4 {
    color: ${(props) => props.$titleColor};
  }
  .lg-outer .lg-prev,
  .lg-outer .lg-next {
    color: ${(props) => props.$arrowColor};
    background: ${(props) => props.$buttonColor};
    border-radius: 999px;
  }
  .lg-outer .lg-prev:hover:not(.disabled),
  .lg-outer .lg-next:hover:not(.disabled) {
    color: ${(props) => props.$arrowColor};
    background: ${(props) => props.$buttonColor};
  }
`;

function text(value) {
  return value == null ? "" : String(value).trim();
}

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function color(value, fallback) {
  return text(value) ? getColor(text(value)) : fallback;
}

function normalizeImage(image) {
  if (typeof image === "string") return { url: text(image), alt: "" };
  return {
    url: text(image?.urlDesktop || image?.url || image?.src || image?.urlMobile),
    alt: text(image?.alt),
  };
}

function normalizeItem(item) {
  const cover = text(item?.imageDesktop || item?.image || item?.imageMobile);
  const images = Array.isArray(item?.images)
    ? item.images.map(normalizeImage).filter((image) => image.url)
    : [];
  return {
    title: text(item?.title),
    description: text(item?.description),
    date: text(item?.date),
    type: item?.type === "link" ? "link" : "album",
    linkType: item?.linkType === "external" ? "external" : "internal",
    linkUrl: text(item?.linkUrl),
    cover: cover || images[0]?.url || "",
    categories: Array.isArray(item?.categories)
      ? item.categories.map(text).filter((item) => item && item !== "All")
      : [],
    images: images.length > 0 ? images : cover ? [{ url: cover, alt: text(item?.title) }] : [],
  };
}

function normalizeTabs(input) {
  const tabs = Array.isArray(input)
    ? input.map((item) => text(typeof item === "string" ? item : item?.label)).filter(Boolean)
    : [];
  const unique = [...new Set(tabs)];
  if (unique.length === 0) return DEFAULT_TABS;
  return unique.includes("All") ? unique : ["All", ...unique];
}

function getBackgroundStyles(props) {
  const prefix = "photoGallery";
  const sectionType = text(props?.[`${prefix}SectionBgType`] || "default");
  const sectionImage = text(props?.[`${prefix}SectionBgImage`]);
  const sectionColor = text(props?.photoGallerySectionBgColorKey);
  const sectionStyle = {
    ...(sectionType === "image" && sectionImage
      ? {
          backgroundImage: `url(${sectionImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : sectionColor
        ? { backgroundColor: getColor(sectionColor), backgroundImage: "none" }
        : {}),
  };
  ["PaddingTop", "PaddingBottom", "MarginTop", "MarginBottom"].forEach((suffix) => {
    const value = props?.[`${prefix}Section${suffix}`];
    if (value !== "" && value != null && Number(value) >= 0) {
      const cssKey = `${suffix[0].toLowerCase()}${suffix.slice(1)}`;
      sectionStyle[cssKey] = `${Number(value)}px`;
    }
  });

  const pageType = text(props?.[`${prefix}PageContainerBgType`] || "default");
  const pageImage = text(props?.[`${prefix}PageContainerBgImage`]);
  const pageColor = text(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageStyle = {
    ...(pageType === "image" && pageImage
      ? {
          backgroundImage: `url(${pageImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageType === "color" && pageColor
        ? { backgroundColor: getColor(pageColor), backgroundImage: "none" }
        : {}),
  };
  ["PaddingTop", "PaddingRight", "PaddingBottom", "PaddingLeft", "MarginTop", "MarginBottom"].forEach(
    (suffix) => {
      const value = props?.[`${prefix}PageContainer${suffix}`];
      if (value !== "" && value != null && Number(value) >= 0) {
        const cssKey = `${suffix[0].toLowerCase()}${suffix.slice(1)}`;
        pageStyle[cssKey] = `${Number(value)}px`;
      }
    },
  );
  return {
    sectionBgClassName: sectionType === "default" && !sectionColor ? "defaultBackground" : undefined,
    sectionBgStyle: sectionStyle,
    pageContainerBgStyle: pageStyle,
  };
}

function getCardShadow(value) {
  if (value === "none") return "none";
  if (value === "elevated") {
    return "0 16px 34px color-mix(in srgb, var(--gallery-card-shadow-color) 20%, transparent)";
  }
  return "0 4px 12px color-mix(in srgb, var(--gallery-card-shadow-color) 16%, transparent)";
}

export default function PhotoGallery(props) {
  const router = useRouter();
  const lightboxHostRef = useRef(null);
  const lightboxRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState("All");

  const items = useMemo(
    () =>
      (Array.isArray(props?.photoGalleryItems) ? props.photoGalleryItems : [])
        .map(normalizeItem)
        .filter((item) => item.cover),
    [props?.photoGalleryItems],
  );
  const tabs = useMemo(() => normalizeTabs(props?.photoGalleryTabs), [props?.photoGalleryTabs]);
  const filtersVisible = props?.photoGalleryFiltersVisible !== false && tabs.length > 1;
  const tabAlignment = ["left", "center", "right"].includes(props?.photoGalleryTabAlignment)
    ? props.photoGalleryTabAlignment
    : "center";
  const limitEnabled = props?.photoGalleryLimitEnabled === true || props?.photoGalleryLimitEnabled === "true";
  const limitCount = Math.floor(numberInRange(props?.photoGalleryLimitCount, 6, 1, 60));

  useEffect(() => {
    if (activeFilter === "All" || tabs.includes(activeFilter)) return;
    setActiveFilter("All");
  }, [activeFilter, tabs]);

  useEffect(
    () => () => {
      lightboxRef.current?.destroy?.(true);
      lightboxRef.current = null;
    },
    [],
  );

  const openAlbum = useCallback(async (item) => {
    if (item.type === "link") {
      if (!item.linkUrl) return;
      if (item.linkType === "external") {
        const url = /^https?:\/\//i.test(item.linkUrl) ? item.linkUrl : `https://${item.linkUrl}`;
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        router.push(item.linkUrl);
      }
      return;
    }

    const slides = item.images.map((image, index) => ({
      src: image.url,
      thumb: image.url,
      alt: image.alt || item.title,
      subHtml: `<h4>${item.title.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character])}</h4>${item.images.length > 1 ? `<p>${index + 1} / ${item.images.length}</p>` : ""}`,
    }));
    if (!lightboxHostRef.current || slides.length === 0) return;

    if (!lightboxRef.current) {
      const { createLightGallery, plugins } = await loadLightGalleryModules();
      if (!lightboxHostRef.current) return;
      lightboxRef.current = createLightGallery(lightboxHostRef.current, {
        dynamic: true,
        dynamicEl: slides,
        plugins,
        speed: 500,
        download: false,
        counter: true,
        thumbnail: true,
        preload: 2,
        hideScrollbar: true,
        licenseKey: "0000-0000-000-0000",
      });
    } else {
      lightboxRef.current.refresh(slides);
    }
    lightboxRef.current.openGallery(0);
  }, [router]);

  const filteredItems = activeFilter === "All"
    ? items
    : items.filter((item) => item.categories.includes(activeFilter));
  const displayedItems = limitEnabled ? filteredItems.slice(0, limitCount) : filteredItems;
  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = getBackgroundStyles(props);
  const title = text(props?.photoGalleryTitle);
  const accentTitle = text(props?.photoGalleryHeadingAccent);
  const subtitle = text(props?.photoGallerySubTitle);
  const titleVisible = props?.photoGalleryTitleVisible !== false;
  const subtitleVisible = props?.photoGallerySubTitleVisible !== false;
  const showHeading = (titleVisible && (title || accentTitle)) || (subtitleVisible && subtitle);
  const showPhotoCount = props?.photoGalleryPhotoCountVisible !== false;
  const showHoverArrow = props?.photoGalleryHoverArrowVisible !== false;
  const target = props?.photoGalleryViewAllTarget === "_blank" ? "_blank" : "_self";
  const viewAllText = text(props?.photoGalleryViewAllText);
  const viewAllLink = text(props?.photoGalleryViewAllLink);
  const viewMoreText = text(props?.photoGalleryViewMoreText || "View More");
  const viewMoreLink = text(props?.photoGalleryViewMoreLink);
  const navBg = color(
    props?.photoGalleryNavButtonBgColorKey || props?.photoGalleryAccentColorKey,
    getColor("primary"),
  );
  const navArrow = color(props?.photoGalleryNavArrowColorKey, "#fff");
  const modalTitleColor = color(props?.photoGalleryModalTitleColorKey, "#fff");
  const overlayText = color(props?.photoGalleryOverlayTextColorKey, "#fff");
  const buttonBg = color(
    props?.photoGalleryButtonBgColorKey || props?.photoGalleryNavButtonBgColorKey,
    navBg,
  );
  const buttonText = color(
    props?.photoGalleryButtonTextColorKey || props?.photoGalleryNavArrowColorKey,
    overlayText,
  );
  const designStyle = {
    "--gallery-text": color(props?.photoGalleryTextColorKey, getColor("blackLight")),
    "--gallery-subtitle": color(props?.photoGallerySubTitleColorKey, getColor("primary")),
    "--gallery-title": color(props?.photoGalleryTitleColorKey, getColor("black")),
    "--gallery-title-accent": color(props?.photoGalleryAccentTextColorKey, getColor("black")),
    "--gallery-link": color(props?.photoGalleryLinkColorKey, getColor("black")),
    "--gallery-accent": color(props?.photoGalleryAccentColorKey, getColor("primary")),
    "--gallery-nav-bg": navBg,
    "--gallery-arrow": navArrow,
    "--gallery-tab-active-bg": color(props?.photoGalleryTabBgColorKey, getColor("gradient")),
    "--gallery-tab-active-text": color(props?.photoGalleryTabTextColorKey, "#fff"),
    "--gallery-tab-active-border": color(
      props?.photoGalleryTabBorderColorKey || props?.photoGalleryTabBgColorKey,
      getColor("primary"),
    ),
    "--gallery-tab-border": color(props?.photoGalleryTabBorderColorKey, "rgba(42,40,62,0.16)"),
    "--gallery-tab-text": color(props?.photoGalleryTabInactiveTextColorKey, getColor("black")),
    "--gallery-tab-hover-border": color(props?.photoGalleryTabHoverBorderColorKey, getColor("primary")),
    "--gallery-tab-hover-text": color(props?.photoGalleryTabHoverTextColorKey, getColor("primary")),
    "--gallery-card-bg": color(props?.photoGalleryCardBgColorKey, "#e8e6df"),
    "--gallery-card-title": color(props?.photoGalleryCardTitleColorKey, getColor("blackLight")),
    "--gallery-card-description": color(props?.photoGalleryCardDescriptionColorKey, getColor("blackLight")),
    "--gallery-date": color(props?.photoGalleryDateColorKey, getColor("blackLight")),
    "--gallery-card-border": color(props?.photoGalleryCardBorderColorKey, "transparent"),
    "--gallery-card-shadow-color": color(props?.photoGalleryCardShadowColorKey, getColor("black")),
    "--gallery-overlay": color(props?.photoGalleryOverlayColorKey, "#050505"),
    "--gallery-overlay-text": overlayText,
    "--gallery-button-bg": buttonBg,
    "--gallery-button-text": buttonText,
    "--gallery-button-border": color(props?.photoGalleryButtonBorderColorKey, buttonBg),
    "--gallery-button-hover-bg": color(props?.photoGalleryButtonHoverBgColorKey, buttonText),
    "--gallery-button-hover-text": color(props?.photoGalleryButtonHoverTextColorKey, buttonBg),
    "--gallery-button-hover-border": color(props?.photoGalleryButtonHoverBorderColorKey, buttonBg),
    "--gallery-count-bg": color(props?.photoGalleryCountBgColorKey, "rgba(0,0,0,0.62)"),
    "--gallery-count-text": color(props?.photoGalleryCountTextColorKey, getColor("blackLight")),
    "--gallery-view-more-bg": color(props?.photoGalleryViewMoreButtonBgColorKey, getColor("primary")),
    "--gallery-view-more-text": color(props?.photoGalleryViewMoreButtonTextColorKey, "#fff"),
    "--gallery-columns": Math.floor(numberInRange(props?.photoGalleryColumns, 3, 2, 4)),
    "--gallery-grid-gap": numberInRange(props?.photoGalleryGridGap, 16, 0, 64),
    "--gallery-card-radius": numberInRange(props?.photoGalleryImageRadius, 16, 0, 80),
    "--gallery-card-border-width": `${numberInRange(props?.photoGalleryCardBorderWidth, 0, 0, 8)}px`,
    "--gallery-card-shadow": getCardShadow(text(props?.photoGalleryCardShadow || "soft")),
    "--gallery-overlay-opacity": numberInRange(props?.photoGalleryOverlayOpacity, 0.92, 0, 1),
    "--gallery-aspect-ratio": text(props?.photoGalleryAspectRatio || "16 / 9.6"),
    "--gallery-heading-gap": numberInRange(props?.photoGalleryHeadingSpacing, 40, 0, 120),
    "--gallery-filter-gap": numberInRange(props?.photoGalleryFilterSpacing, 46, 0, 120),
    "--gallery-title-size": numberInRange(props?.photoGalleryTitleFontSize, 56, 24, 96),
    "--gallery-title-weight": numberInRange(props?.photoGalleryTitleFontWeight, 620, 100, 900),
    "--gallery-title-line-height": numberInRange(props?.photoGalleryTitleLineHeight, 1.08, 0.8, 2),
    "--gallery-subtitle-size": numberInRange(props?.photoGallerySubTitleFontSize, 13, 10, 32),
    "--gallery-subtitle-weight": numberInRange(props?.photoGallerySubTitleFontWeight, 650, 100, 900),
    "--gallery-card-title-size": numberInRange(props?.photoGalleryCardTitleFontSize, 16, 11, 32),
    "--gallery-card-title-weight": numberInRange(props?.photoGalleryCardTitleFontWeight, 600, 100, 900),
    "--gallery-card-title-line-height": numberInRange(props?.photoGalleryCardTitleLineHeight, 1.3, 1, 2),
    "--gallery-reveal-duration": numberInRange(props?.photoGalleryRevealDuration, 0.55, 0, 3),
    "--gallery-reveal-distance": numberInRange(props?.photoGalleryRevealDistance, 18, 0, 100),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <GalleryRoot className="fable-section" style={designStyle}>
          <LightboxTheme
            $buttonColor={navBg}
            $arrowColor={navArrow}
            $titleColor={modalTitleColor}
          />
          {showHeading ? (
            <header className="gallery-heading">
              <div>
                {subtitleVisible && subtitle ? <p className="gallery-subtitle">{subtitle}</p> : null}
                {titleVisible && (title || accentTitle) ? (
                  <h2 className="gallery-title">
                    {renderHighlightedTitle(
                      accentTitle
                        ? `${title}${title ? " " : ""}*${accentTitle}*`
                        : title,
                      props,
                      { legacyColorKey: props?.photoGalleryAccentTextColorKey },
                    )}
                  </h2>
                ) : null}
              </div>
              {viewAllText && viewAllLink ? (
                <a
                  className="gallery-view-link"
                  href={viewAllLink}
                  target={target}
                  rel={target === "_blank" ? "noopener noreferrer" : undefined}
                >
                  {viewAllText} <ArrowRightOutlined />
                </a>
              ) : null}
            </header>
          ) : null}

          {filtersVisible ? (
            <Filters $alignment={tabAlignment} aria-label="Filter photo albums">
              {tabs.map((tab) => (
                <FilterButton
                  key={tab}
                  type="button"
                  $active={activeFilter === tab}
                  aria-pressed={activeFilter === tab}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab}
                </FilterButton>
              ))}
            </Filters>
          ) : null}

          {displayedItems.length > 0 ? (
            <GalleryGrid>
              {displayedItems.map((item, index) => (
                <GalleryCard
                  key={`${item.title}-${item.cover}-${index}`}
                  type="button"
                  onClick={() => openAlbum(item)}
                  aria-label={item.type === "album" ? `Open ${item.title} album` : item.title}
                  style={{
                    "--gallery-card-delay": `${Math.min(index, 8) * 55}ms`,
                  }}
                >
                  <span className="gallery-cover">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      fetchPriority="auto"
                      decoding="async"
                    />
                    {showHoverArrow ? (
                      <HoverArrow aria-hidden="true">
                        <span>{item.type === "album" ? "View Album" : "View"}</span>
                        <ArrowRightOutlined />
                      </HoverArrow>
                    ) : null}
                  </span>
                  <CardTitle>
                    <span className="gallery-card-title">{item.title}</span>
                    {showPhotoCount && item.type === "album" ? (
                      <PhotoCount>{"\u00b7"} {item.images.length} {item.images.length === 1 ? "photo" : "photos"}</PhotoCount>
                    ) : null}
                    {item.description ? (
                      <span className="gallery-card-description">{item.description}</span>
                    ) : null}
                    {item.date ? <span className="gallery-card-date">{item.date}</span> : null}
                  </CardTitle>
                </GalleryCard>
              ))}
            </GalleryGrid>
          ) : (
            <EmptyState>No photo albums are available for this category.</EmptyState>
          )}

          {limitEnabled && viewMoreText && viewMoreLink && filteredItems.length > limitCount ? (
            <ViewMoreWrap>
              <ViewMoreLink href={viewMoreLink}>
                {viewMoreText} <ArrowRightOutlined />
              </ViewMoreLink>
            </ViewMoreWrap>
          ) : null}
          <div ref={lightboxHostRef} aria-hidden="true" />
        </GalleryRoot>
      </PageContainer>
    </FullWidthBackground>
  );
}
