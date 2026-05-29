"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Carousel } from "antd";
import { RightCircleFilled, PlayCircleFilled } from "@ant-design/icons";
import Link from "next/link";
import { ThemeButton, getColor, PageContainer } from "@/styles/Theme";
import { normalizeMapSliderConfig } from "@/lib/mapSliderAnimations";
import { MapSliderAnimationsVisual } from "@/components/site/MapSliderAnimations/MapSliderAnimations";

const MOBILE_IMAGE_MAX_WIDTH = 767;
const MOBILE_IMAGE_MEDIA_QUERY = `(max-width: ${MOBILE_IMAGE_MAX_WIDTH}px)`;

/** Full-width slider banner: background image + dark overlay + left-aligned text + CTA. No default image — from DB only. */
const SliderSection = styled.section.attrs((p) => ({
  $bgImageDesktop: p.$bgImageDesktop || "",
  $bgImageMobile: p.$bgImageMobile || "",
  $clickable: p.$clickable,
  $isPreview: p.$isPreview,
}))`
  width: 100%;
  min-height: ${(p) => (p.$isPreview ? "clamp(320px, 56vh, 560px)" : "100vh")};
  ${(p) => (!p.$isPreview ? "min-height: 100svh; min-height: 100dvh;" : "")}
  padding: 0;
  position: relative;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  background: ${(p) => {
    const desktopSrc = p.$bgImageDesktop || p.$bgImageMobile;
    return desktopSrc
      ? `url(${desktopSrc}) center/cover no-repeat`
      : "rgba(0,0,0,0.4)";
  }};
  display: flex;
  align-items: center;
  background-position: center center;
  @media (max-width: ${MOBILE_IMAGE_MAX_WIDTH}px) {
    background: ${(p) => {
      const mobileSrc = p.$bgImageMobile || p.$bgImageDesktop;
      return mobileSrc
        ? `url(${mobileSrc}) center/cover no-repeat`
        : "rgba(0,0,0,0.4)";
    }};
  }
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
    .slider-title {
      font-size: clamp(1.5rem, 7.2vw, 2.3rem);
      line-height: 1.16;
      margin-bottom: 0.7rem;
    }
    .slider-desc {
      margin: 12px 0px;
      font-size: clamp(0.88rem, 3.9vw, 1rem);
      line-height: 1.5;
    }
    .ant-btn {
      min-height: 40px !important;
      padding: 8px 14px !important;
      font-size: 14px !important;
    }
    &::before {
      background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.62) 0%,
        rgba(0, 0, 0, 0.46) 56%,
        rgba(0, 0, 0, 0.38) 100%
      );
    }
  }
  .slider-title {
    margin: 0 0 1rem;
    font-size: clamp(1.75rem, 5vw, 3.5rem);
    line-height: 1.2;
    font-weight: 700;
    color: #fff;
    max-width: min(800px, 100%);
    word-break: break-word;
  }
  .slider-desc {
    margin: 24px 0px;
    font-size: clamp(0.98rem, 2.2vw, 1.3rem);
    line-height: 1.58;
    color: rgba(255, 255, 255, 0.95);
    max-width: min(800px, 100%);
    word-break: break-word;
  }
  a {
    display: inline-flex;
    max-width: 100%;
  }
  .ant-btn {
    max-width: 100%;
    min-height: 46px;
    height: auto;
    white-space: normal;
    line-height: 1.2;
    text-align: center;
  }
  @media (max-width: 576px) {
    align-items: flex-start;
    padding-top: clamp(72px, 16vw, 104px);
    padding-bottom: clamp(28px, 8vw, 44px);
    .slider-title {
      font-size: clamp(1.35rem, 6.8vw, 1.95rem);
      line-height: 1.18;
    }
    .slider-desc {
      font-size: clamp(0.84rem, 3.8vw, 0.96rem);
      line-height: 1.48;
      margin: 10px 0px;
    }
    .slider-cta {
      display: inline-flex;
      align-self: flex-start;
    }
    a {
      display: inline-flex;
      width: auto;
    }
    .ant-btn {
      width: auto !important;
      min-width: 148px;
      max-width: max-content;
      justify-content: center;
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
  @media (max-width: 768px) {
    top: 14px;
    right: 14px;
    width: 44px;
    height: 44px;
    .anticon {
      font-size: 22px;
    }
  }
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    .anticon {
      font-size: 20px;
    }
  }
`;
const HomeFluidContainer = styled.div`
  width: 100%;
  position: relative;
  overflow: hidden;
  .ant-carousel .slick-prev,
  .ant-carousel .slick-next {
    z-index: 2;
    width: 44px;
    height: 44px;
  }
  .ant-carousel .slick-prev {
    left: 12px;
  }
  .ant-carousel .slick-next {
    right: 12px;
  }
  .ant-carousel .slick-dots {
    bottom: ${(p) => (p.$isPreview ? "16px" : "40px")};
    left: 50%;
    transform: translateX(-50%);
    width: min(90vw, 1400px);
    max-width: calc(100vw - 32px);
    display: flex !important;
    justify-content: flex-start;
    gap: 4px;
    margin: 0;
    padding: 0;
  }
  .ant-carousel .slick-dots li {
    width: 30px;
    height: 10px;
    margin: 0;
  }
  .ant-carousel .slick-dots li button {
    width: 30px;
    height: 10px;
    border-radius: 10px;
    background: #ffffff !important;
    opacity: 1;
  }
  .ant-carousel .slick-dots li::after {
    display: none !important;
  }
  .ant-carousel .slick-dots li.slick-active {
    width: 60px;
    &::after {
      display: none;
    }
  }
  .ant-carousel .slick-dots li.slick-active button {
    width: 60px;
    background: var(--primary-color, #cf372f) !important;
  }
  /* .ant-carousel .slick-dots li.slick-active::after {
    display: none;
  } */
  @media (max-width: 768px) {
    .ant-carousel .slick-prev,
    .ant-carousel .slick-next {
      width: 34px;
      height: 34px;
    }
    .ant-carousel .slick-prev {
      left: 8px;
    }
    .ant-carousel .slick-next {
      right: 8px;
    }
    .ant-carousel .slick-dots {
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      max-width: calc(100vw - 24px);
      justify-content: center;
      align-items: center;
    }
  }
  @media (max-width: 576px) {
    .ant-carousel .slick-prev,
    .ant-carousel .slick-next {
      display: none !important;
    }
    .ant-carousel .slick-dots {
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      max-width: calc(100vw - 24px);
      justify-content: center;
      align-items: center;
    }
    .ant-carousel .slick-dots li {
      width: 24px;
      height: 8px;
    }
    .ant-carousel .slick-dots li button {
      width: 24px;
      height: 8px;
    }
    .ant-carousel .slick-dots li.slick-active,
    .ant-carousel .slick-dots li.slick-active button {
      width: 44px;
    }
  }
`;

const SplitSlideSection = styled.section.attrs((p) => ({
  $bgImage: p.$bgImage || "",
  $bgColor: p.$bgColor || "",
  $clickable: p.$clickable,
  $isPreview: p.$isPreview,
  $isMapSlider: p.$isMapSlider === true,
}))`
  width: 100%;
  min-height: ${(p) => (p.$isPreview ? "clamp(320px, 56vh, 560px)" : "100vh")};
  ${(p) => (!p.$isPreview ? "min-height: 100svh; min-height: 100dvh;" : "")}
  padding: ${(p) =>
    p.$isMapSlider
      ? "clamp(6px, 1.2vw, 16px) 0 0"
      : "clamp(40px, 5.2vw, 82px) 0 0"};
  position: relative;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  background: ${(p) =>
    p.$bgImage
      ? `url(${p.$bgImage}) center/cover no-repeat`
      : p.$bgColor || ""};
  display: flex;
  align-items: center;
  overflow: hidden;
  background-position: center center;
  /* &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      92deg,
      rgba(5, 7, 9, 0.3) 0%,
      rgba(5, 7, 9, 0.18) 45%,
      rgba(5, 7, 9, 0.1) 100%
    );
    pointer-events: none;
  } */
  @media (max-width: 767px) {
    padding-top: clamp(58px, 10vw, 74px);
  }
  @media (max-width: 767px) {
    min-height: auto;
    padding:
      clamp(66px, 10vw, 92px)
      clamp(14px, 3.8vw, 28px)
      clamp(24px, 6vw, 40px);
    align-items: flex-start;
  }
  @media (min-width: 768px) and (max-width: 992px) {
    padding:
      clamp(58px, 8vw, 72px)
      clamp(20px, 4.6vw, 34px)
      clamp(20px, 4.8vw, 34px);
  }
  @media (max-width: 576px) {
    padding:
      clamp(54px, 12vw, 70px)
      clamp(12px, 4.2vw, 18px)
      clamp(18px, 5.6vw, 28px);
  }
  /* @media (max-width: 480px) {
    padding: 20px 0;
  } */
`;

const SplitSlideGrid = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(20px, 3vw, 36px);
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: clamp(10px, 2.4vw, 18px);
    justify-items: center;
    align-items: start;
  }
`;

const SlideContentFrame = styled.div`
  width: min(900px, 100%);
  min-height: clamp(300px, 44vh, 500px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  .slider-copy {
    display: flex;
    flex-direction: column;
    min-height: auto;
  }
  .slider-desc {
    margin: 12px 0;
  }
  .slider-cta {
    margin-top: 10px;
    padding-top: 0;
  }
  @media (max-width: 768px) {
    min-height: auto;
  }
  @media (max-width: 576px) {
    justify-content: flex-start;
  }
`;

const SplitTextBlock = styled.div`
  ${(p) =>
    p.$isMapSlider
      ? "min-height: clamp(180px, 24vh, 300px);"
      : "min-height: clamp(320px, 44vh, 520px);"}
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  .slider-copy {
    display: flex;
    flex-direction: column;
    min-height: auto;
  }
  .slider-title {
    margin: 0 0 1rem;
    font-size: clamp(2rem, 4.9vw, 4.15rem);
    line-height: 1.12;
    font-weight: 500;
    color: #fff;
    max-width: 100%;
    word-break: break-word;
  }
  .slider-desc {
    margin: 12px 0;
    font-size: clamp(0.95rem, 1.4vw, 1.55rem);
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.95);
    max-width: min(560px, 100%);
    word-break: break-word;
  }
  .slider-cta {
    margin-top: 10px;
    padding-top: 0;
  }
  a {
    display: inline-flex;
    max-width: 100%;
  }
  .ant-btn {
    max-width: 100%;
    min-height: 46px;
    height: auto;
    white-space: normal;
    line-height: 1.2;
    text-align: center;
  }
  @media (max-width: 576px) {
    width: 100%;
    .slider-cta {
      display: inline-flex;
      align-self: flex-start;
    }
    a {
      display: inline-flex;
      width: auto;
    }
    .ant-btn {
      width: auto !important;
      min-width: 148px;
      max-width: max-content;
      justify-content: center;
    }
  }
  @media (max-width: 767px) {
    order: 2;
    min-height: auto;
    width: min(100%, 760px);
    margin-inline: auto;
    justify-content: flex-start;
    .slider-desc {
      max-width: 100%;
    }
    .slider-copy {
      min-height: auto;
    }
    .slider-cta {
      margin-top: 10px;
    }
  }
  @media (max-width: 767px) {
    width: min(100%, 620px);
    .slider-title {
      font-size: clamp(1.35rem, 6.8vw, 2rem);
      line-height: 1.18;
    }
    .slider-desc {
      font-size: clamp(0.84rem, 3.8vw, 0.98rem);
      line-height: 1.48;
      margin: 10px 0;
    }
    .ant-btn {
      min-height: 40px !important;
      padding: 8px 14px !important;
      font-size: 14px !important;
    }
  }
  @media (max-width: 576px) {
    .slider-copy {
      margin-top: clamp(10px, 2.8vw, 16px);
    }
  }
`;

const SplitImageCard = styled.div`
  width: 100%;
  max-width: 680px;
  justify-self: end;
  align-self: center;
  margin-inline: auto;
  position: relative;
  border-radius: 0;
  overflow: visible;
  border: none;
  box-shadow: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  picture {
    display: block;
    width: 100%;
    line-height: 0;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    max-width: 100%;
    max-height: clamp(200px, 58vh, 560px);
    object-fit: contain;
    object-position: center center;
    margin-inline: auto;
    border-radius: 0;
  }
  @media (max-width: 767px) {
    order: 1;
    justify-self: center;
    width: min(100%, 640px);
    max-width: min(100%, 640px);
    img {
      max-height: clamp(190px, 38vh, 360px);
    }
  }
  @media (min-width: 768px) and (max-width: 992px) {
    width: min(100%, 700px);
    max-width: min(100%, 700px);
    img {
      max-height: clamp(220px, 40vh, 360px);
    }
  }
  @media (max-width: 767px) {
    width: min(100%, 560px);
    max-width: min(100%, 560px);
    img {
      max-height: clamp(170px, 34vh, 290px);
    }
  }
  @media (max-width: 576px) {
    width: 100%;
    max-width: 100%;
    img {
      max-height: clamp(150px, 32vh, 230px);
      border-radius: 0;
    }
  }
`;

const LottieSurface = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  background: transparent;
  & > svg {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
`;

const LottieBackgroundLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 5vw, 64px);
  @media (max-width: 768px) {
    padding: clamp(12px, 4vw, 24px);
  }
`;

const LottieBackgroundCard = styled.div`
  width: min(960px, 100%);
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
  background: rgba(6, 20, 26, 0.5);
  @media (max-width: 768px) {
    aspect-ratio: 4 / 3;
  }
`;

const SplitMapSliderWrap = styled.div`
  width: 100%;
  max-width: min(500px, 100%);
  justify-self: end;
  align-self: center;
  min-height: clamp(150px, 20vh, 280px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  .msa-stage {
    width: min(100%, 500px);
  }

  @media (max-width: 767px) {
    order: 1;
    justify-self: center;
    max-width: min(100%, 560px);
    min-height: clamp(190px, 28vh, 320px);
  }
  @media (max-width: 767px) {
    min-height: clamp(170px, 26vh, 280px);
  }
  @media (max-width: 576px) {
    min-height: 150px;
    padding: 0;
  }
`;

const MapSliderBackgroundLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(18px, 4vw, 56px);
  @media (max-width: 768px) {
    padding: clamp(10px, 4vw, 18px);
  }
`;

const MapSliderBackgroundCard = styled.div`
  width: min(1020px, 100%);
  max-width: 100%;
`;

let lottieRuntimePromise = null;
function loadLottieRuntime() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Lottie runtime unavailable on server"));
  }
  if (window.__homeHeroLottieRuntime?.loadAnimation) {
    return Promise.resolve(window.__homeHeroLottieRuntime);
  }
  if (lottieRuntimePromise) return lottieRuntimePromise;

  lottieRuntimePromise = (async () => {
    const mod = await import("lottie-web/build/player/lottie_light");
    const runtime = mod?.default || mod;
    if (!runtime?.loadAnimation) {
      throw new Error("Lottie runtime not available");
    }
    window.__homeHeroLottieRuntime = runtime;
    return runtime;
  })().catch((err) => {
    lottieRuntimePromise = null;
    throw err;
  });

  return lottieRuntimePromise;
}

function resolveLottieJsonUrl(rawPath) {
  const value = rawPath != null ? String(rawPath).trim() : "";
  if (!value) return "";
  if (typeof window === "undefined") return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `${window.location.protocol}${value}`;
  if (value.startsWith("/")) return `${window.location.origin}${value}`;
  return `${window.location.origin}/${value.replace(/^\.?\//, "")}`;
}

function LottieJsonPlayer({ src }) {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let animation = null;

    const mount = async () => {
      const target = hostRef.current;
      const jsonPath = src != null ? String(src).trim() : "";
      if (!target || !jsonPath) return;
      target.innerHTML = "";
      setFailed(false);
      try {
        const lottie = await loadLottieRuntime();
        const resolvedUrl = resolveLottieJsonUrl(jsonPath);
        const response = await fetch(resolvedUrl, {
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "application/json,text/plain,*/*",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch JSON (${response.status})`);
        }
        const raw = await response.text();
        let animationData = null;
        try {
          animationData = JSON.parse(raw.replace(/^\uFEFF/, ""));
        } catch {
          throw new Error("Invalid Lottie JSON");
        }
        if (!animationData || typeof animationData !== "object") {
          throw new Error("Invalid animation payload");
        }
        if (cancelled || !hostRef.current) return;
        animation = lottie.loadAnimation({
          container: hostRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
          },
        });
        animation.addEventListener?.("data_failed", () => {
          if (!cancelled) setFailed(true);
        });
      } catch (err) {
        // Show lightweight fallback state to make failure visible in UI.
        console.error("[HomeHero Lottie] Failed to load:", err);
        setFailed(true);
      }
    };

    mount();
    return () => {
      cancelled = true;
      if (animation && typeof animation.destroy === "function") {
        animation.destroy();
      }
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [src]);

  return (
    <LottieSurface ref={hostRef}>
      {failed ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.75)",
            fontSize: 14,
            padding: 16,
            textAlign: "center",
          }}
        >
          Lottie JSON failed to load
        </div>
      ) : null}
    </LottieSurface>
  );
}

const ContentWrapper = ({ usePageContainer, children, style }) =>
  usePageContainer ? (
    <PageContainer style={style}>{children}</PageContainer>
  ) : (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        padding: "0 clamp(16px, 5vw, 72px)",
        ...style,
      }}
    >
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

function normalizeButtonTarget(value) {
  return value === "_blank" ? "_blank" : "_self";
}

function SingleSlide({
  bgImageUrlDesktop,
  bgImageUrlMobile,
  lottieJsonUrl,
  mapSliderConfig,
  title,
  description,
  buttonText,
  buttonLink,
  buttonTarget,
  showButton,
  titleColor,
  descColor,
  buttonBgColor,
  buttonTextColor,
  contentContainer,
  mediaType,
  videoUrl,
  preferSideImage,
  sectionBgImage,
  sectionBgColor,
  useStaticSectionBg,
  isMobileView,
  isPreview,
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
  const compactCta = isMobileView === true;
  const baseCtaStyle = {
    background:
      getColor("primary") || "#cf372f",
    border: "1px solid #ffffff",
    borderRadius: 999,
    color: "#ffffff",
    fontWeight: 600,
    minHeight: compactCta ? 40 : 48,
    padding: compactCta ? "8px 16px" : "10px 20px",
    fontSize: compactCta ? 14 : 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
  };
  const renderButton = showButton !== false;
  const usePageContainer = contentContainer !== "full";
  const clickableVideoUrl = normalizeExternalUrl(videoUrl);
  const resolvedButtonTarget = normalizeButtonTarget(buttonTarget);
  const buttonRel =
    resolvedButtonTarget === "_blank" ? "noopener noreferrer" : undefined;
  const isVideoSlide = mediaType === "video";
  const isLottieSlide =
    mediaType === "lottie" &&
    lottieJsonUrl != null &&
    String(lottieJsonUrl).trim() !== "";
  const isMapSliderSlide = mediaType === "mapSlider";
  const effectiveDesktopImage = bgImageUrlDesktop || bgImageUrlMobile || "";
  const effectiveMobileImage = bgImageUrlMobile || bgImageUrlDesktop || "";
  const useSideImageLayout =
    isMapSliderSlide ||
    (preferSideImage === true &&
      (isLottieSlide || !!(effectiveDesktopImage || effectiveMobileImage)));

  const handleSlideClick = () => {
    if (!clickableVideoUrl) return;
    window.open(clickableVideoUrl, "_blank", "noopener,noreferrer");
  };

  if (useSideImageLayout) {
    const splitBgImage = useStaticSectionBg ? "" : sectionBgImage;
    const splitBgColor = useStaticSectionBg ? "" : sectionBgColor;
    return (
      <SplitSlideSection
        $bgImage={splitBgImage}
        $bgColor={splitBgColor}
        $clickable={!!clickableVideoUrl}
        $isPreview={isPreview}
        $isMapSlider={isMapSliderSlide}
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
        <ContentWrapper
          usePageContainer={usePageContainer}
          style={{ position: "relative", zIndex: 1 }}
        >
          <SplitSlideGrid>
            <SplitTextBlock $isMapSlider={isMapSliderSlide}>
              <div className="slider-copy">
                <h2 className="slider-title" style={titleStyle}>
                  {title != null ? title : ""}
                </h2>
                <p className="slider-desc" style={descStyle}>
                  {description != null ? description : ""}
                </p>
              </div>
              {renderButton && (
                <div className="slider-cta">
                  <Link
                    href={
                      buttonLink != null && buttonLink !== "" ? buttonLink : "#"
                    }
                    target={
                      buttonLink != null && buttonLink !== ""
                        ? resolvedButtonTarget
                        : undefined
                    }
                    rel={
                      buttonLink != null && buttonLink !== ""
                        ? buttonRel
                        : undefined
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    {buttonStyle ? (
                      <ThemeButton
                        type="button"
                        size="large"
                        style={{ ...baseCtaStyle, ...buttonStyle }}
                      >
                        {buttonText != null ? buttonText : ""}{" "}
                        {/* <RightCircleFilled /> */}
                      </ThemeButton>
                    ) : (
                      <ThemeButton
                        type="button"
                        size="large"
                        style={baseCtaStyle}
                      >
                        {buttonText != null ? buttonText : ""}{" "}
                        {/* <RightCircleFilled /> */}
                      </ThemeButton>
                    )}
                  </Link>
                </div>
              )}
            </SplitTextBlock>
            {isMapSliderSlide ? (
              <SplitMapSliderWrap>
                <MapSliderAnimationsVisual
                  config={normalizeMapSliderConfig(mapSliderConfig, {
                    defaultItemCount: 10,
                  })}
                  embedded
                />
              </SplitMapSliderWrap>
            ) : (
              <SplitImageCard $isLottie={isLottieSlide}>
                {isVideoSlide && (
                  <VideoBadge style={{ top: 14, right: 14 }}>
                    <PlayCircleFilled />
                  </VideoBadge>
                )}
                {isLottieSlide ? (
                  <LottieJsonPlayer src={lottieJsonUrl} />
                ) : (
                  <picture>
                    {effectiveMobileImage ? (
                      <source
                        media={MOBILE_IMAGE_MEDIA_QUERY}
                        srcSet={effectiveMobileImage}
                      />
                    ) : null}
                    <img
                      src={effectiveDesktopImage || effectiveMobileImage}
                      alt={title || "Slide image"}
                    />
                  </picture>
                )}
              </SplitImageCard>
            )}
          </SplitSlideGrid>
        </ContentWrapper>
      </SplitSlideSection>
    );
  }

  return (
    <SliderSection
      $bgImageDesktop={
        isLottieSlide || isMapSliderSlide ? "" : effectiveDesktopImage
      }
      $bgImageMobile={
        isLottieSlide || isMapSliderSlide ? "" : effectiveMobileImage
      }
      $clickable={!!clickableVideoUrl}
      $isPreview={isPreview}
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
      {isLottieSlide ? (
        <LottieBackgroundLayer>
          <LottieBackgroundCard>
            <LottieJsonPlayer src={lottieJsonUrl} />
          </LottieBackgroundCard>
        </LottieBackgroundLayer>
      ) : null}
      {isMapSliderSlide ? (
        <MapSliderBackgroundLayer>
          <MapSliderBackgroundCard>
            <MapSliderAnimationsVisual
              config={normalizeMapSliderConfig(mapSliderConfig, {
                defaultItemCount: 10,
              })}
              embedded
            />
          </MapSliderBackgroundCard>
        </MapSliderBackgroundLayer>
      ) : null}
      {isVideoSlide && (
        <VideoBadge>
          <PlayCircleFilled />
        </VideoBadge>
      )}
      <ContentWrapper
        usePageContainer={usePageContainer}
        style={{ position: "relative", zIndex: 1 }}
      >
        <SlideContentFrame>
          <div className="slider-copy">
            <h2 className="slider-title" style={titleStyle}>
              {title != null ? title : ""}
            </h2>
            <p className="slider-desc" style={descStyle}>
              {description != null ? description : ""}
            </p>
          </div>
          {renderButton && (
            <div className="slider-cta">
              <Link
                href={
                  buttonLink != null && buttonLink !== "" ? buttonLink : "#"
                }
                target={
                  buttonLink != null && buttonLink !== ""
                    ? resolvedButtonTarget
                    : undefined
                }
                rel={
                  buttonLink != null && buttonLink !== ""
                    ? buttonRel
                    : undefined
                }
                onClick={(e) => e.stopPropagation()}
              >
                {buttonStyle ? (
                  <ThemeButton
                    type="button"
                    size="large"
                    style={{ ...baseCtaStyle, ...buttonStyle }}
                  >
                    {buttonText != null ? buttonText : ""} <RightCircleFilled />
                  </ThemeButton>
                ) : (
                  <ThemeButton type="button" size="large" style={baseCtaStyle}>
                    {buttonText != null ? buttonText : ""} <RightCircleFilled />
                  </ThemeButton>
                )}
              </Link>
            </div>
          )}
        </SlideContentFrame>
      </ContentWrapper>
    </SliderSection>
  );
}

function normalizeSlide(slide) {
  const mediaType =
    slide?.mediaType === "video"
      ? "video"
      : slide?.mediaType === "lottie"
        ? "lottie"
        : slide?.mediaType === "mapSlider"
          ? "mapSlider"
        : "image";
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
    slide?.bgImageUrlMobile != null
      ? String(slide.bgImageUrlMobile).trim()
      : "";
  const lottieJsonUrl =
    slide?.lottieJsonUrl != null ? String(slide.lottieJsonUrl).trim() : "";
  const mapSliderConfig = normalizeMapSliderConfig(slide?.mapSliderConfig, {
    defaultItemCount: 10,
  });

  return {
    bgImageUrl: bgImageUrlDesktop,
    bgImageUrlDesktop,
    bgImageUrlMobile,
    title: slide?.title != null ? String(slide.title).trim() : "",
    description:
      slide?.description != null ? String(slide.description).trim() : "",
    buttonText:
      slide?.buttonText != null ? String(slide.buttonText).trim() : "",
    buttonLink:
      slide?.buttonLink != null ? String(slide.buttonLink).trim() : "",
    buttonTarget: normalizeButtonTarget(slide?.buttonTarget),
    showButton: slide?.showButton !== false,
    mediaType,
    youtubeUrl,
    videoUrl,
    lottieJsonUrl,
    mapSliderConfig,
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
 * Data source: page block props (homeHeroSlides from pages collection) first, else theme API (sliders collection).
 */
export default function HomeHero(props) {
  const [theme, setTheme] = useState(null);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_IMAGE_MEDIA_QUERY).matches;
  });
  const isEditorPreview =
    props?.homeHeroIsEditorPreview === true || props?.preview === true;
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_IMAGE_MEDIA_QUERY);
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
  const sectionBgType = (
    props?.homeHeroSectionBgType ??
    theme?.homeHeroSectionBgType ??
    "default"
  )
    .toString()
    .trim()
    .toLowerCase();
  const sectionBgImage = (
    props?.homeHeroSectionBgImage ??
    theme?.homeHeroSectionBgImage ??
    ""
  )
    .toString()
    .trim();
  const sectionBgColorKey = (
    props?.homeHeroSectionBgColorKey ??
    theme?.homeHeroSectionBgColorKey ??
    ""
  )
    .toString()
    .trim();
  const sectionBgColor =
    sectionBgType === "color" && sectionBgColorKey
      ? getColor(sectionBgColorKey)
      : undefined;
  const preferSideImage = sectionBgType === "image";
  const staticSectionBgStyle =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColor
        ? {
            backgroundColor: sectionBgColor,
            backgroundImage: "none",
          }
        : undefined;

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
    preferSideImage,
    sectionBgImage,
    sectionBgColor,
    useStaticSectionBg: !!staticSectionBgStyle,
    isMobileView,
    isPreview: isEditorPreview,
  };

  if (normalizedSlides.length === 0) return null;

  const slideContent =
    normalizedSlides.length === 1 ? (
      <SingleSlide
        bgImageUrlDesktop={
          normalizedSlides[0].bgImageUrlDesktop ||
          normalizedSlides[0].bgImageUrl ||
          ""
        }
        bgImageUrlMobile={normalizedSlides[0].bgImageUrlMobile || ""}
        lottieJsonUrl={normalizedSlides[0].lottieJsonUrl}
        mapSliderConfig={normalizedSlides[0].mapSliderConfig}
        title={normalizedSlides[0].title}
        description={normalizedSlides[0].description}
        buttonText={normalizedSlides[0].buttonText}
        buttonLink={normalizedSlides[0].buttonLink}
        buttonTarget={normalizedSlides[0].buttonTarget}
        showButton={normalizedSlides[0].showButton}
        mediaType={normalizedSlides[0].mediaType}
        videoUrl={
          normalizedSlides[0].youtubeUrl || normalizedSlides[0].videoUrl
        }
        {...slideProps}
      />
    ) : (
      <Carousel
        arrows={showArrows}
        autoplay={autoplay}
        autoplaySpeed={autoplaySpeed}
        speed={speed}
        dots={showDots}
        draggable
        swipeToSlide
        adaptiveHeight={isEditorPreview}
      >
        {normalizedSlides.map((slide, i) => (
          <SingleSlide
            key={i}
            bgImageUrlDesktop={slide.bgImageUrlDesktop || slide.bgImageUrl || ""}
            bgImageUrlMobile={slide.bgImageUrlMobile || ""}
            lottieJsonUrl={slide.lottieJsonUrl}
            mapSliderConfig={slide.mapSliderConfig}
            title={slide.title}
            description={slide.description}
            buttonText={slide.buttonText}
            buttonLink={slide.buttonLink}
            buttonTarget={slide.buttonTarget}
            showButton={slide.showButton}
            mediaType={slide.mediaType}
            videoUrl={slide.youtubeUrl || slide.videoUrl}
            {...slideProps}
          />
        ))}
      </Carousel>
    );

  const inner = (
    <HomeFluidContainer
      data-component="HomeHero"
      $isPreview={isEditorPreview}
      style={staticSectionBgStyle}
    >
      {slideContent}
    </HomeFluidContainer>
  );

  if (isBgContained) {
    return <PageContainer>{inner}</PageContainer>;
  }
  return inner;
}
