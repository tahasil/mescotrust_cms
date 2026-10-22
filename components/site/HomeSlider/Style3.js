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
 * Style 3: Centered contained video with blurred duplicate backdrop
 * Original default behavior for MESCO Trust CMS.
 * Renders full slide (video with blur backdrop or standard image).
 */
export default function Style3Slide({
  slide,
  index,
  isActive,
  wasActive,
  isInitial,
  currentRef,
}) {
  const isVideo = slide.mediaType === "video" && Boolean(slide.videoUrl);
  const videoUrl = String(slide.videoUrl || "").trim();
  const overlayOpacity = Math.min(100, Math.max(0, Number(slide.overlayOpacity) || 100)) / 100;

  return (
    <article
      className={`home-slider-slide is-style3 is-style-3${isActive ? " is-active" : ""}${wasActive ? " was-active" : ""}${isInitial ? " is-initial" : ""}${isVideo ? " is-video-slide" : " is-image-slide"}`}
      aria-hidden={!isActive}
    >
      {isVideo ? (
        <div className="home-slider-video-wrapper is-style3 is-style-3">
          <video
            aria-hidden="true"
            tabIndex={-1}
            className="home-slider-video-backdrop"
            src={videoUrl}
            poster={slide.videoPoster || slide.image || undefined}
            autoPlay={isActive}
            muted
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
          />
          <video
            data-home-slider-video
            data-slide-index={index}
            className="home-slider-media home-slider-video-media is-style3 is-style-3"
            src={videoUrl}
            poster={slide.videoPoster || slide.image || undefined}
            autoPlay={isActive}
            muted
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
            onLoadedData={(event) => {
              if (index !== currentRef?.current) return;
              const v = event.currentTarget;
              v.muted = true;
              v.play?.().catch(() => {});
            }}
            onCanPlay={(event) => {
              if (index !== currentRef?.current) return;
              const v = event.currentTarget;
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
            className="home-slider-media is-style3 is-style-3"
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

export const style3Css = `
  /* Style 3: Centered contained video with blurred backdrop */
  .home-slider-video-wrapper.is-style3,
  .home-slider-video-wrapper.is-style-3 {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .home-slider-video-backdrop {
    position: absolute;
    inset: -30px;
    width: calc(100% + 60px);
    height: calc(100% + 60px);
    object-fit: cover !important;
    object-position: center center !important;
    filter: blur(32px) brightness(0.68) saturate(1.2);
    opacity: 0.95;
    transform: scale(1.08);
    pointer-events: none;
    z-index: 0;
  }
  .home-slider-video-media.is-style3,
  .home-slider-video-media.is-style-3 {
    position: relative !important;
    inset: auto !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: contain !important;
    object-position: center center !important;
    filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.45)) !important;
    z-index: 1;
    transform: none !important;
    animation: none !important;
  }
  .home-slider-slide.is-style3 .home-slider-media {
    object-fit: cover;
  }

  /* Style 3: Remove all overlay colors, gradients, and scrim from video slides */
  .home-slider-slide.is-style3.is-video-slide,
  .home-slider-slide.is-style-3.is-video-slide {
    background: transparent !important;
  }
  .home-slider-slide.is-style3.is-video-slide .home-slider-scrim,
  .home-slider-slide.is-style-3.is-video-slide .home-slider-scrim,
  .home-slider-slide.is-style3.is-video-slide::before,
  .home-slider-slide.is-style-3.is-video-slide::after {
    display: none !important;
    opacity: 0 !important;
    background: none !important;
    pointer-events: none !important;
  }

  /* Style 3 Desktop View (>= 768px): Position slider cleanly below the fixed header so video is not hidden underneath */
  @media (min-width: 768px) {
    .public-site .home-cinematic-slider.is-style3,
    .public-site .home-cinematic-slider.is-style-3 {
      margin-top: var(--appearance-header-height, 92px);
      --home-slider-viewport-offset: var(--appearance-header-offset, 132px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style3,
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style-3 {
      margin-top: 0;
      --home-slider-viewport-offset: var(--appearance-header-height, 92px);
    }
    .home-cinematic-slider.is-style3 .home-slider-content,
    .home-cinematic-slider.is-style-3 .home-slider-content {
      padding-top: max(var(--home-slider-container-padding-top, 0px), 28px) !important;
      padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 36px) !important;
    }
  }

  /* Style 3 Mobile View (< 768px) */
  @media (max-width: 767px) {
    .public-site .home-cinematic-slider.is-style3,
    .public-site .home-cinematic-slider.is-style-3 {
      margin-top: var(--appearance-header-height, 76px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style3,
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style-3 {
      margin-top: 0;
    }
  }
  @media (max-width: 480px) {
    .public-site .home-cinematic-slider.is-style3,
    .public-site .home-cinematic-slider.is-style-3 {
      margin-top: var(--appearance-header-height, 66px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style3,
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style-3 {
      margin-top: 0;
    }
  }
`;
