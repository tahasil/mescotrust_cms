"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Carousel } from "antd";
import { RightCircleFilled, PlayCircleFilled } from "@ant-design/icons";
import Link from "next/link";
import { ThemeButton, getColor, PageContainer } from "@/styles/Theme";

/** Full-width slider banner: background image + dark overlay + left-aligned text + CTA. No default image — from DB only. */
const SliderSection = styled.section.attrs((p) => ({
  $bgImage: p.$bgImage || "",
  $clickable: p.$clickable,
}))`
  width: 100%;
  min-height: calc(100vh - 80px);
  padding: 0;
  position: relative;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  background: ${(p) =>
    p.$bgImage
      ? `url(${p.$bgImage}) center/cover no-repeat`
      : "rgba(0,0,0,0.4)"};
  display: flex;
  align-items: center;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.65) 0%,
      rgba(0, 0, 0, 0.35) 50%,
      transparent 100%
    );
    pointer-events: none;
  }
  @media (max-width: 768px) {
    padding: 0px 24px;
    min-height: calc(90vh - 80px);
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
    <PageContainer style={style}>{children}</PageContainer>
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
}) {
  const titleStyle = titleColor ? { color: titleColor } : undefined;
  const descStyle = descColor ? { color: descColor } : undefined;
  const buttonStyle =
    buttonBgColor || buttonTextColor
      ? {
          ...(buttonBgColor && { background: buttonBgColor }),
          ...(buttonTextColor && { color: buttonTextColor }),
        }
      : undefined;
  const renderButton = showButton !== false;
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
        <h2 className="slider-title" style={titleStyle}>
          {title != null ? title : ""}
        </h2>
        <p className="slider-desc" style={descStyle}>
          {description != null ? description : ""}
        </p>
        {renderButton && (
          <Link
            href={buttonLink != null && buttonLink !== "" ? buttonLink : "#"}
            onClick={(e) => e.stopPropagation()}
          >
            {buttonStyle ? (
              <ThemeButton type="button" size="large" style={buttonStyle}>
                {buttonText != null ? buttonText : ""} <RightCircleFilled />
              </ThemeButton>
            ) : (
              <ThemeButton type="button" size="large">
                {buttonText != null ? buttonText : ""} <RightCircleFilled />
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
  const [isMobileView, setIsMobileView] = useState(false);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileView(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

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

  const slideProps = {
    titleColor,
    descColor,
    buttonBgColor,
    buttonTextColor,
    contentContainer,
  };
  const resolveSlideBgImage = (slide) => {
    const desktop = slide?.bgImageUrlDesktop || slide?.bgImageUrl || "";
    const mobile = slide?.bgImageUrlMobile || "";
    if (isMobileView) return mobile || desktop;
    return desktop || mobile;
  };

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

  const slideContent =
    normalizedSlides.length === 1 ? (
      <SingleSlide
        bgImageUrl={resolveSlideBgImage(normalizedSlides[0])}
        title={normalizedSlides[0].title}
        description={normalizedSlides[0].description}
        buttonText={normalizedSlides[0].buttonText}
        buttonLink={normalizedSlides[0].buttonLink}
        showButton={normalizedSlides[0].showButton}
        mediaType={normalizedSlides[0].mediaType}
        videoUrl={normalizedSlides[0].youtubeUrl || normalizedSlides[0].videoUrl}
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
        {normalizedSlides.map((slide, i) => (
          <SingleSlide
            key={i}
            bgImageUrl={resolveSlideBgImage(slide)}
            title={slide.title}
            description={slide.description}
            buttonText={slide.buttonText}
            buttonLink={slide.buttonLink}
            showButton={slide.showButton}
            mediaType={slide.mediaType}
            videoUrl={slide.youtubeUrl || slide.videoUrl}
            {...slideProps}
          />
        ))}
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
