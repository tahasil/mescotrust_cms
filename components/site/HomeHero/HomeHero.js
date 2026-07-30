"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Carousel } from "antd";
import { RightCircleFilled, PlayCircleFilled } from "@ant-design/icons";
import Link from "next/link";
import { ThemeButton, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

/** Full-width slider banner: background image + dark overlay + left-aligned text + CTA. No default image — from DB only. */
const SliderSection = styled.section.attrs((p) => ({
  $bgImage: p.$bgImage || "",
  $clickable: p.$clickable,
  $overlayBackground: p.$overlayBackground || "transparent",
  $fitMode: p.$fitMode || "viewport",
  $aspectRatio: p.$aspectRatio || "64 / 30",
}))`
  width: 100%;
  min-height: ${(p) =>
    p.$fitMode === "ratio" ? "auto" : "calc(100vh - 80px)"};
  aspect-ratio: ${(p) => (p.$fitMode === "ratio" ? p.$aspectRatio : "auto")};
  padding: 0;
  position: relative;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  background-color: ${(p) =>
    p.$bgImage ? (p.$fitMode === "ratio" ? "transparent" : "#000") : "rgba(0,0,0,0.4)"};
  background-image: ${(p) => (p.$bgImage ? `url(${p.$bgImage})` : "none")};
  background-position: center;
  background-repeat: no-repeat;
  background-size: ${(p) => (p.$fitMode === "ratio" ? "cover" : "contain")};
  display: flex;
  align-items: center;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: ${(p) => p.$overlayBackground};
    pointer-events: none;
  }
  @media (max-width: 768px) {
    padding: ${(p) => (p.$fitMode === "ratio" ? "0" : "0px 24px")};
    min-height: ${(p) => (p.$fitMode === "ratio" ? "auto" : "calc(90vh - 80px)")};
  }
  .slider-title {
    margin: 0 0 1rem;
    font-size: 3.5rem;
    line-height: 1.25;
    font-weight: 700;
    color: #fff;
    max-width: 800px;
    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }
  .slider-desc {
    margin: 0 0 1.5rem;
    font-size: 1.3rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.95);
    max-width: 800px;
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const VideoBadge = styled.div`
  position: absolute;
  top: 22px;
  right: 22px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
  .anticon {
    font-size: 28px;
  }
`;
const HomeFluidContainer = styled.div`
  width: 100%;
  position: relative;
  padding-top: 80px;
  @media (max-width: 768px) {
  }
`;

const ContentWrapper = ({ usePageContainer, children, style }) =>
  usePageContainer ? (
    <PageContainer $managedStyle={style}>{children}</PageContainer>
  ) : (
    <div style={{ position: "relative", zIndex: 1, padding: "0 5%", ...style }}>
      {children}
    </div>
  );

function normalizeExternalUrl(rawUrl) {
  const value = rawUrl != null ? String(rawUrl).trim() : "";
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  if (/^(www\.|m\.youtube\.com|youtube\.com|youtu\.be)/i.test(value)) {
    return `https://${value}`;
  }
  return "";
}

function loadImageAspectRatio(url) {
  const src = url != null ? String(url).trim() : "";
  if (!src) return Promise.resolve("");
  if (typeof window === "undefined") return Promise.resolve("");
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const w = Number(img.naturalWidth || 0);
      const h = Number(img.naturalHeight || 0);
      if (w > 0 && h > 0) resolve(`${w} / ${h}`);
      else resolve("");
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

function SingleSlide({
  bgImageUrl,
  title,
  description,
  buttonText,
  buttonLink,
  showButton,
  titleColor,
  descColor,
  buttonBgColor,
  buttonTextColor,
  contentContainer,
  mediaType,
  videoUrl,
  overlayEnabled,
  slideAspectRatio,
  titleHighlightColorKey,
}) {
  const safeTitle = title != null ? String(title).trim() : "";
  const safeDescription = description != null ? String(description).trim() : "";
  const safeButtonText = buttonText != null ? String(buttonText).trim() : "";
  const safeButtonLink = buttonLink != null ? String(buttonLink).trim() : "";
  const titleStyle = titleColor ? { color: titleColor } : undefined;
  const descStyle = descColor ? { color: descColor } : undefined;
  const buttonStyle =
    buttonBgColor || buttonTextColor
      ? {
          ...(buttonBgColor && { background: buttonBgColor }),
          ...(buttonTextColor && { color: buttonTextColor }),
        }
      : undefined;
  const renderButton = showButton !== false && !!safeButtonText;
  const hasForegroundContent = !!safeTitle || !!safeDescription || renderButton;
  const showOverlay = overlayEnabled != null ? overlayEnabled : hasForegroundContent;
  const overlayBackground = showOverlay
    ? "linear-gradient(90deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 50%, transparent 100%)"
    : "transparent";
  const fitMode = hasForegroundContent ? "viewport" : "ratio";
  const aspectRatio = slideAspectRatio || "64 / 30";
  const usePageContainer = contentContainer !== "full";
  const clickableVideoUrl = normalizeExternalUrl(videoUrl);
  const isVideoSlide = mediaType === "video";

  const handleSlideClick = () => {
    if (!clickableVideoUrl) return;
    window.open(clickableVideoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <SliderSection
      $bgImage={bgImageUrl}
      $clickable={!!clickableVideoUrl}
      $overlayBackground={overlayBackground}
      $fitMode={fitMode}
      $aspectRatio={aspectRatio}
      onClick={handleSlideClick}
      role={clickableVideoUrl ? "button" : undefined}
      tabIndex={clickableVideoUrl ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickableVideoUrl) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSlideClick();
        }
      }}
      aria-label={clickableVideoUrl ? "Open video in new tab" : undefined}
    >
      {isVideoSlide && <VideoBadge><PlayCircleFilled /></VideoBadge>}
      <ContentWrapper
        usePageContainer={usePageContainer}
        style={{ position: "relative", zIndex: 1 }}
      >
        {safeTitle && (
          <h2 className="slider-title" style={titleStyle}>
            {renderHighlightedTitle(safeTitle, { titleHighlightColorKey })}
          </h2>
        )}
        {safeDescription && (
          <p className="slider-desc" style={descStyle}>
            {safeDescription}
          </p>
        )}
        {renderButton && (
          <Link
            href={safeButtonLink || "#"}
            onClick={(e) => e.stopPropagation()}
          >
            {buttonStyle ? (
              <ThemeButton type="button" size="large" style={buttonStyle}>
                {safeButtonText} <RightCircleFilled />
              </ThemeButton>
            ) : (
              <ThemeButton type="button" size="large">
                {safeButtonText} <RightCircleFilled />
              </ThemeButton>
            )}
          </Link>
        )}
      </ContentWrapper>
    </SliderSection>
  );
}

function normalizeSlide(slide) {
  const mediaType = slide?.mediaType === "video" ? "video" : "image";
  const youtubeUrl =
    slide?.youtubeUrl != null ? String(slide.youtubeUrl).trim() : "";
  const videoUrl = slide?.videoUrl != null ? String(slide.videoUrl).trim() : "";
  const bgImageUrlDesktop =
    slide?.bgImageUrlDesktop != null
      ? String(slide.bgImageUrlDesktop).trim()
      : slide?.bgImageUrl != null
        ? String(slide.bgImageUrl).trim()
        : "";
  const bgImageUrlMobile =
    slide?.bgImageUrlMobile != null ? String(slide.bgImageUrlMobile).trim() : "";

  return {
    bgImageUrl: bgImageUrlDesktop,
    bgImageUrlDesktop,
    bgImageUrlMobile,
    title: slide?.title != null ? String(slide.title).trim() : "",
    description:
      slide?.description != null ? String(slide.description).trim() : "",
    buttonText: slide?.buttonText != null ? String(slide.buttonText).trim() : "",
    buttonLink: slide?.buttonLink != null ? String(slide.buttonLink).trim() : "",
    showButton: slide?.showButton !== false,
    mediaType,
    youtubeUrl,
    videoUrl,
  };
}

function fetchHomeHero() {
  return fetch("/api/theme/home-hero", {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
}

/**
 * Site component: HomeHero — full-width image slider(s).
 * Data source: page block props (homeHeroSlides from pages collection) first, else theme API (components collection).
 */
export default function HomeHero(props) {
  const [theme, setTheme] = useState(null);
  const [themeResolved, setThemeResolved] = useState(false);
  const [slideAspectRatios, setSlideAspectRatios] = useState({});
  const fromPage =
    (Array.isArray(props?.homeHeroSlides) && props.homeHeroSlides.length > 0) ||
    (Array.isArray(props?.slides) && props.slides.length > 0);

  useEffect(() => {
    if (fromPage) {
      setThemeResolved(true);
      return;
    }
    fetchHomeHero()
      .then(setTheme)
      .finally(() => setThemeResolved(true));
    const onFocus = () =>
      fetchHomeHero().then((t) => t != null && setTheme(t));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fromPage]);

  const slides =
    Array.isArray(props?.homeHeroSlides) && props.homeHeroSlides.length > 0
      ? props.homeHeroSlides
      : Array.isArray(props?.slides) && props.slides.length > 0
        ? props.slides
        : Array.isArray(theme?.homeHeroSlides)
          ? theme.homeHeroSlides
          : [];
  const normalizedSlides = slides.map(normalizeSlide);

  const titleColor =
    props?.sliderTitleColor ??
    (props?.homeHeroSliderTitleColorKey
      ? getColor(props.homeHeroSliderTitleColorKey)
      : undefined) ??
    (theme?.homeHeroSliderTitleColorKey
      ? getColor(theme.homeHeroSliderTitleColorKey)
      : undefined);
  const descColor =
    props?.sliderDescColor ??
    (props?.homeHeroSliderDescColorKey
      ? getColor(props.homeHeroSliderDescColorKey)
      : undefined) ??
    (theme?.homeHeroSliderDescColorKey
      ? getColor(theme.homeHeroSliderDescColorKey)
      : undefined);
  const buttonBgColor =
    props?.sliderButtonBgColor ??
    (props?.homeHeroSliderButtonBgColorKey
      ? getColor(props.homeHeroSliderButtonBgColorKey)
      : undefined) ??
    (theme?.homeHeroSliderButtonBgColorKey
      ? getColor(theme.homeHeroSliderButtonBgColorKey)
      : undefined);
  const buttonTextColor =
    props?.sliderButtonTextColor ??
    (props?.homeHeroSliderButtonTextColorKey
      ? getColor(props.homeHeroSliderButtonTextColorKey)
      : undefined) ??
    (theme?.homeHeroSliderButtonTextColorKey
      ? getColor(theme.homeHeroSliderButtonTextColorKey)
      : undefined);

  const backgroundContainer =
    props?.backgroundContainer ??
    props?.homeHeroBackgroundContainer ??
    theme?.homeHeroBackgroundContainer ??
    "full";
  const contentContainer =
    props?.contentContainer ??
    props?.homeHeroContentContainer ??
    theme?.homeHeroContentContainer ??
    "pageContainer";
  const isBgContained = backgroundContainer === "contained";

  const autoplay = props?.homeHeroAutoplay ?? theme?.homeHeroAutoplay ?? true;
  const showArrows =
    props?.homeHeroShowArrows ?? theme?.homeHeroShowArrows ?? true;
  const showDots = props?.homeHeroShowDots ?? theme?.homeHeroShowDots ?? true;
  const autoplaySpeed =
    props?.homeHeroAutoplaySpeed ?? theme?.homeHeroAutoplaySpeed ?? 5000;
  const speed = props?.homeHeroSpeed ?? theme?.homeHeroSpeed ?? 500;
  const overlayEnabledRaw =
    props?.homeHeroOverlayEnabled ?? theme?.homeHeroOverlayEnabled;
  const overlayEnabled =
    overlayEnabledRaw == null ? undefined : overlayEnabledRaw !== false;

  const slideProps = {
    titleColor,
    descColor,
    buttonBgColor,
    buttonTextColor,
    contentContainer,
    overlayEnabled,
    titleHighlightColorKey: props?.titleHighlightColorKey,
  };
  const resolveSlideBgImage = (slide) => {
    const desktop = slide?.bgImageUrlDesktop || slide?.bgImageUrl || "";
    const mobile = slide?.bgImageUrlMobile || "";
    return desktop || mobile;
  };

  useEffect(() => {
    const urls = [...new Set(normalizedSlides.map(resolveSlideBgImage).filter(Boolean))];
    const unresolved = urls.filter((url) => !slideAspectRatios[url]);
    if (unresolved.length === 0) return;

    let cancelled = false;
    Promise.all(
      unresolved.map(async (url) => [url, await loadImageAspectRatio(url)]),
    ).then((entries) => {
      if (cancelled) return;
      setSlideAspectRatios((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [url, ratio] of entries) {
          if (!url || !ratio || next[url] === ratio) continue;
          next[url] = ratio;
          changed = true;
        }
        return changed ? next : prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [normalizedSlides, slideAspectRatios]);

  if (normalizedSlides.length === 0) {
    // Reserve hero space until client-side HomeHero defaults finish loading,
    // preventing a large first-load layout shift.
    if (!fromPage && !themeResolved) {
      return (
        <HomeFluidContainer data-component="HomeHero" aria-hidden="true">
          <SliderSection />
        </HomeFluidContainer>
      );
    }
    return null;
  }

  const singleSlide = normalizedSlides[0];
  const singleBgUrl = singleSlide ? resolveSlideBgImage(singleSlide) : "";

  const slideContent =
    normalizedSlides.length === 1 ? (
      <SingleSlide
        bgImageUrl={singleBgUrl}
        title={singleSlide?.title}
        description={singleSlide?.description}
        buttonText={singleSlide?.buttonText}
        buttonLink={singleSlide?.buttonLink}
        showButton={singleSlide?.showButton}
        mediaType={singleSlide?.mediaType}
        videoUrl={singleSlide?.youtubeUrl || singleSlide?.videoUrl}
        slideAspectRatio={slideAspectRatios[singleBgUrl]}
        {...slideProps}
      />
    ) : (
      <Carousel
        arrows={showArrows}
        autoplay={autoplay}
        autoplaySpeed={autoplaySpeed}
        speed={speed}
        dots={showDots}
        effect="fade"
      >
        {normalizedSlides.map((slide, i) => {
          const bgUrl = resolveSlideBgImage(slide);
          return (
            <SingleSlide
              key={i}
              bgImageUrl={bgUrl}
              title={slide.title}
              description={slide.description}
              buttonText={slide.buttonText}
              buttonLink={slide.buttonLink}
              showButton={slide.showButton}
              mediaType={slide.mediaType}
              videoUrl={slide.youtubeUrl || slide.videoUrl}
              slideAspectRatio={slideAspectRatios[bgUrl]}
              {...slideProps}
            />
          );
        })}
      </Carousel>
    );

  const inner = (
    <HomeFluidContainer data-component="HomeHero">
      {slideContent}
    </HomeFluidContainer>
  );

  if (isBgContained) {
    return <PageContainer>{inner}</PageContainer>;
  }
  return inner;
}
