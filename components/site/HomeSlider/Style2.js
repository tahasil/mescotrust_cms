"use client";

import React from "react";
import { PageContainer } from "@/styles/Theme";

const ArrowIcon = () => (
  <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
    <path d="M3 9h11M10 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const targetOf = (val) => (val === "_blank" ? "_blank" : "_self");
const linkRel = (target) => (target === "_blank" ? "noopener noreferrer" : undefined);

/**
 * Style 2: Responsive Full-Screen Video & Image Slider (Bootstrap/CodePen pattern)
 * - Desktop: Full-bleed cover hero just like Style 1.
 * - Mobile: Slider & all slides match the exact natural height of the video.
 * - Equal spacing between Title, Paragraph, and Button with comfortably scaled fonts.
 * - Responsive bullets (rail navigation) clearly visible and interactive.
 * - Handles both Video slides and Image slides for Style 2.
 */
export default function Style2Slide({
  slide,
  index,
  isActive,
  wasActive,
  isInitial,
  currentRef,
  rootRef,
}) {
  const isVideo = slide.mediaType === "video" && Boolean(slide.videoUrl);
  const videoUrl = String(slide.videoUrl || "").trim();
  const overlayOpacity = Math.min(100, Math.max(0, Number(slide.overlayOpacity) || 100)) / 100;

  const syncVideoAspect = (video) => {
    if (video && video.videoWidth && video.videoHeight && rootRef?.current) {
      rootRef.current.style.setProperty(
        "--home-slider-video-aspect",
        `${video.videoWidth} / ${video.videoHeight}`
      );
    }
  };

  return (
    <article
      className={`home-slider-slide is-style2 is-style-2${isActive ? " is-active" : ""}${wasActive ? " was-active" : ""}${isInitial ? " is-initial" : ""}${isVideo ? " is-video-slide" : " is-image-slide"}`}
      aria-hidden={!isActive}
    >
      {isVideo ? (
        <div className="home-slider-video-wrapper is-style2 is-style-2">
          <video
            data-home-slider-video
            data-slide-index={index}
            className="home-slider-media home-slider-video-media is-style2 is-style-2"
            src={videoUrl}
            poster={slide.videoPoster || slide.image || undefined}
            autoPlay={isActive}
            muted
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
            onLoadedMetadata={(event) => syncVideoAspect(event.currentTarget)}
            onLoadedData={(event) => {
              const v = event.currentTarget;
              syncVideoAspect(v);
              if (index !== currentRef?.current) return;
              v.muted = true;
              v.play?.().catch(() => {});
            }}
            onCanPlay={(event) => {
              const v = event.currentTarget;
              syncVideoAspect(v);
              if (index !== currentRef?.current) return;
              v.muted = true;
              v.play?.().catch(() => {});
            }}
            aria-label={slide.alt || ""}
            style={{ objectPosition: slide.backgroundPosition || "center center" }}
          />
        </div>
      ) : (
        <picture>
          {slide.mobileImage ? (
            <source media="(max-width: 767px)" srcSet={slide.mobileImage} />
          ) : null}
          <img
            className="home-slider-media is-style2 is-style-2"
            src={slide.image || slide.videoPoster || ""}
            alt={slide.alt || ""}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding={index === 0 ? "sync" : "async"}
            style={{ objectPosition: slide.backgroundPosition || "center center" }}
          />
        </picture>
      )}

      {!isVideo && (
        <div className="home-slider-scrim" style={{ opacity: overlayOpacity }} />
      )}

      <PageContainer className={`home-slider-caption align-${slide.textAlignment || "left"}`}>
        {slide.captionTitle ? <p>{slide.captionTitle}</p> : null}
        {slide.captionButtonLabel && slide.captionButtonUrl ? (
          <a
            href={slide.captionButtonUrl}
            target={targetOf(slide.captionButtonTarget)}
            rel={linkRel(targetOf(slide.captionButtonTarget))}
          >
            {slide.captionButtonLabel}
            <ArrowIcon />
          </a>
        ) : null}
      </PageContainer>
    </article>
  );
}

export const style2Css = `
  /* Style 2 Desktop: Full cover hero banner */
  .home-slider-video-wrapper.is-style2,
  .home-slider-video-wrapper.is-style-2 {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: block;
    background: transparent;
  }
  .home-slider-video-wrapper.is-style2 .home-slider-video-media,
  .home-slider-video-wrapper.is-style-2 .home-slider-video-media,
  .home-slider-video-media.is-style2,
  .home-slider-video-media.is-style-2 {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: cover !important;
    filter: none !important;
    z-index: 0;
    transform: none !important;
    animation: none !important;
  }
  .home-slider-slide.is-style2 .home-slider-media {
    object-fit: cover;
  }

  /* Style 2: Remove all overlay colors, gradients, and scrim from video slides */
  .home-slider-slide.is-style2.is-video-slide,
  .home-slider-slide.is-style-2.is-video-slide {
    background: transparent !important;
  }
  .home-slider-slide.is-style2.is-video-slide .home-slider-video-wrapper,
  .home-slider-slide.is-style-2.is-video-slide .home-slider-video-wrapper {
    background: transparent !important;
  }
  .home-slider-slide.is-style2.is-video-slide .home-slider-scrim,
  .home-slider-slide.is-style-2.is-video-slide .home-slider-scrim,
  .home-slider-slide.is-style2.is-video-slide::before,
  .home-slider-slide.is-style-2.is-video-slide::after {
    display: none !important;
    opacity: 0 !important;
    background: none !important;
    pointer-events: none !important;
  }

  /* Remove slider global glow overlay when video slide is active in Style 2 */
  .home-cinematic-slider.has-style-2.is-video-active::before,
  .home-cinematic-slider.is-style2.is-video-active::before,
  .home-cinematic-slider.has-style-2:has(.home-slider-slide.is-video-slide.is-active)::before,
  .home-cinematic-slider.is-style2:has(.home-slider-slide.is-video-slide.is-active)::before {
    display: none !important;
    opacity: 0 !important;
    background: none !important;
  }

  /* Style 2 Desktop View (>= 768px): Position slider cleanly below the fixed header so video is not hidden underneath */
  @media (min-width: 768px) {
    .public-site .home-cinematic-slider.has-style-2 {
      margin-top: var(--appearance-header-height, 92px);
      --home-slider-viewport-offset: var(--appearance-header-offset, 132px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.has-style-2 {
      margin-top: 0;
      --home-slider-viewport-offset: var(--appearance-header-height, 92px);
    }
    .home-cinematic-slider.has-style-2 .home-slider-content {
      padding-top: max(var(--home-slider-container-padding-top, 0px), 28px) !important;
      padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 36px) !important;
    }
  }

  /* Style 2 Mobile Responsive (< 768px): Exact video height for all slides */
  @media (max-width: 767px) {
    .public-site .home-cinematic-slider.has-style-2 {
      margin-top: var(--appearance-header-height, 76px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.has-style-2 {
      margin-top: 0;
    }
    .home-cinematic-slider.has-style-2,
    .home-cinematic-slider.has-style-2 .home-slider-stage {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      aspect-ratio: var(--home-slider-video-aspect, 16 / 9) !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-slide {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-video-wrapper {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-video-media {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      filter: none !important;
    }

    /* Content Layout: Equal space between Title, Paragraph, and Button */
    .home-cinematic-slider.has-style-2 .home-slider-content {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      padding-top: 14px !important;
      padding-bottom: 14px !important;
      padding-left: 18px !important;
      padding-right: 38px !important; /* clearance for bullets on the right */
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-content.align-center {
      align-items: center !important;
      text-align: center !important;
      padding-right: 18px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-content.align-center .home-slider-actions {
      justify-content: center !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-content.align-right {
      align-items: flex-end !important;
      text-align: right !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-content.align-right .home-slider-actions {
      justify-content: flex-end !important;
    }

    /* Typography: Scaled slightly larger and comfortable */
    .home-cinematic-slider.has-style-2 .home-slider-pill {
      margin: 0 !important;
      padding: 4px 12px !important;
      font-size: 11.5px !important;
      line-height: 1.2 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-title {
      margin: 0 !important;
      font-size: clamp(18px, 4.8vw, 24px) !important;
      font-weight: 650 !important;
      line-height: 1.2 !important;
      letter-spacing: -0.015em !important;
      max-width: 100% !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-description {
      margin: 0 !important;
      font-size: clamp(12px, 3.1vw, 13.5px) !important;
      line-height: 1.45 !important;
      max-width: 38ch !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
      opacity: 0.9 !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-actions {
      margin: 0 !important;
      padding-top: 2px !important;
      gap: 10px !important;
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: wrap !important;
      width: auto !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-button {
      min-height: 36px !important;
      padding: 7px 18px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border-radius: 999px !important;
      flex: 0 0 auto !important;
      width: auto !important;
      line-height: 1.2 !important;
    }

    /* Bullets Points: Clearly visible on responsive */
    .home-cinematic-slider.has-style-2 .home-slider-rail {
      position: absolute !important;
      right: 12px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      z-index: 10 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 7px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail button {
      position: relative !important;
      width: 5px !important;
      height: 18px !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: rgba(255, 255, 255, 0.42) !important;
      border: 0 !important;
      border-radius: 999px !important;
      cursor: pointer !important;
      transition: height 0.25s, background 0.25s !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail button.is-active {
      background: rgba(255, 255, 255, 0.95) !important;
      height: 26px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail button::after {
      content: "" !important;
      position: absolute !important;
      inset: auto 0 0 !important;
      height: 0 !important;
      background: var(--home-slider-rail, #E03C33) !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail button.is-active::after {
      animation: homeSliderRailFill var(--home-slider-autoplay) linear forwards !important;
    }

    .home-cinematic-slider.has-style-2 .home-slider-badge,
    .home-cinematic-slider.has-style-2 .home-slider-caption {
      display: none !important;
    }
  }

  /* Extra small screens (< 480px) */
  @media (max-width: 480px) {
    .public-site .home-cinematic-slider.has-style-2 {
      margin-top: var(--appearance-header-height, 66px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.has-style-2 {
      margin-top: 0;
    }
    .home-cinematic-slider.has-style-2 .home-slider-content {
      padding-top: 10px !important;
      padding-bottom: 10px !important;
      padding-left: 14px !important;
      padding-right: 32px !important;
      gap: 10px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-pill {
      padding: 3px 10px !important;
      font-size: 10.5px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-title {
      font-size: clamp(16px, 4.4vw, 21px) !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-description {
      font-size: clamp(11.5px, 2.9vw, 12.5px) !important;
      line-height: 1.4 !important;
      max-width: 34ch !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-actions {
      gap: 8px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-button {
      min-height: 33px !important;
      padding: 6px 15px !important;
      font-size: 12px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail {
      right: 8px !important;
      gap: 5px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail button {
      width: 4.5px !important;
      height: 15px !important;
    }
    .home-cinematic-slider.has-style-2 .home-slider-rail button.is-active {
      height: 22px !important;
    }
  }
`;
