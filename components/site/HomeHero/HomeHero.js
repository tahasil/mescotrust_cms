"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Carousel } from "antd";
import { RightCircleFilled } from "@ant-design/icons";
import Link from "next/link";
import { ThemeButton, getColor, PageContainer } from "@/styles/Theme";

/** Full-width slider banner: background image + dark overlay + left-aligned text + CTA. No default image — from DB only. */
const SliderSection = styled.section.attrs((p) => ({
  $bgImage: p.$bgImage || "",
}))`
  width: 100%;
  min-height: 420px;
  padding: 10% 0 15% 0;
  position: relative;
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

const ContentWrapper = ({ usePageContainer, children, style }) =>
  usePageContainer ? (
    <PageContainer style={style}>{children}</PageContainer>
  ) : (
    <div style={{ position: "relative", zIndex: 1, padding: "0 5%", ...style }}>
      {children}
    </div>
  );

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

  return (
    <SliderSection $bgImage={bgImageUrl}>
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
  const fromPage =
    (Array.isArray(props?.homeHeroSlides) && props.homeHeroSlides.length > 0) ||
    (Array.isArray(props?.slides) && props.slides.length > 0);

  useEffect(() => {
    if (fromPage) return;
    fetchHomeHero().then(setTheme);
    const onFocus = () => fetchHomeHero().then((t) => t != null && setTheme(t));
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

  const slideProps = {
    titleColor,
    descColor,
    buttonBgColor,
    buttonTextColor,
    contentContainer,
  };

  if (slides.length === 0) return null;

  const slideContent =
    slides.length === 1 ? (
      <SingleSlide
        bgImageUrl={slides[0].bgImageUrl}
        title={slides[0].title}
        description={slides[0].description}
        buttonText={slides[0].buttonText}
        buttonLink={slides[0].buttonLink}
        showButton={slides[0].showButton}
        {...slideProps}
      />
    ) : (
      <Carousel arrows autoplay effect="fade">
        {slides.map((slide, i) => (
          <SingleSlide
            key={i}
            bgImageUrl={slide.bgImageUrl}
            title={slide.title}
            description={slide.description}
            buttonText={slide.buttonText}
            buttonLink={slide.buttonLink}
            showButton={slide.showButton}
            {...slideProps}
          />
        ))}
      </Carousel>
    );

  const inner = (
    <div className="site-component-homehero" data-component="HomeHero">
      {slideContent}
    </div>
  );

  if (isBgContained) {
    return <PageContainer>{inner}</PageContainer>;
  }
  return inner;
}
