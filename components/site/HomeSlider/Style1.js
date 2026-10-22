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
 * Style 1: Full-cover background video & image (object-fit: cover)
 * As originally implemented on mesco-demo.aiolos.cloud.
 * Renders full slide (video or image) with cinematic cover presentation.
 */
export default function Style1Slide({
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
      className={`home-slider-slide is-style1 is-style-1${isActive ? " is-active" : ""}${wasActive ? " was-active" : ""}${isInitial ? " is-initial" : ""}${isVideo ? " is-video-slide" : " is-image-slide"}`}
      aria-hidden={!isActive}
    >
      {isVideo ? (
        <div className="home-slider-video-wrapper is-style1 is-style-1">
          <video
            data-home-slider-video
            data-slide-index={index}
            className="home-slider-media home-slider-video-media is-style1 is-style-1"
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
            className="home-slider-media is-style1 is-style-1"
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

export const style1Css = `
  /* Style 1: Full-cover background (video & image: object-fit: cover) */
  .home-slider-video-wrapper.is-style1,
  .home-slider-video-wrapper.is-style-1 {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: block;
    background: transparent;
  }
  .home-slider-video-wrapper.is-style1 .home-slider-video-media,
  .home-slider-video-wrapper.is-style-1 .home-slider-video-media,
  .home-slider-video-media.is-style1,
  .home-slider-video-media.is-style-1 {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: cover !important;
    filter: none !important;
    drop-shadow: none !important;
    box-shadow: none !important;
    z-index: 0;
    transform: none !important;
    animation: none !important;
  }
  .home-slider-slide.is-style1 .home-slider-media {
    object-fit: cover;
  }

  /* Style 1: Remove all overlay colors, gradients, and scrim from video slides */
  .home-slider-slide.is-style1.is-video-slide,
  .home-slider-slide.is-style-1.is-video-slide {
    background: transparent !important;
  }
  .home-slider-slide.is-style1.is-video-slide .home-slider-video-wrapper,
  .home-slider-slide.is-style-1.is-video-slide .home-slider-video-wrapper {
    background: transparent !important;
  }
  .home-slider-slide.is-style1.is-video-slide .home-slider-scrim,
  .home-slider-slide.is-style-1.is-video-slide .home-slider-scrim,
  .home-slider-slide.is-style1.is-video-slide::before,
  .home-slider-slide.is-style-1.is-video-slide::after {
    display: none !important;
    opacity: 0 !important;
    background: none !important;
    pointer-events: none !important;
  }

  /* Style 1 Desktop View (>= 768px): Position slider cleanly below the fixed header so video is not hidden underneath */
  @media (min-width: 768px) {
    .public-site .home-cinematic-slider.is-style1,
    .public-site .home-cinematic-slider.is-style-1 {
      margin-top: var(--appearance-header-height, 92px);
      --home-slider-viewport-offset: var(--appearance-header-offset, 132px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style1,
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style-1 {
      margin-top: 0;
      --home-slider-viewport-offset: var(--appearance-header-height, 92px);
    }
    .home-cinematic-slider.is-style1 .home-slider-content,
    .home-cinematic-slider.is-style-1 .home-slider-content {
      padding-top: max(var(--home-slider-container-padding-top, 0px), 28px) !important;
      padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 36px) !important;
    }
  }

  /* Style 1 Mobile View (< 768px): Responsive spacing between Title, Description, and Buttons */
  @media (max-width: 767px) {
    .public-site .home-cinematic-slider.is-style1,
    .public-site .home-cinematic-slider.is-style-1 {
      margin-top: var(--appearance-header-height, 76px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style1,
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style-1 {
      margin-top: 0;
    }
    .home-cinematic-slider.is-style1 .home-slider-content,
    .home-cinematic-slider.is-style-1 .home-slider-content {
      gap: 22px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-pill,
    .home-cinematic-slider.is-style-1 .home-slider-pill {
      margin-bottom: 12px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-title,
    .home-cinematic-slider.is-style-1 .home-slider-title {
      margin-bottom: 4px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-description,
    .home-cinematic-slider.is-style-1 .home-slider-description {
      margin-bottom: 6px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-actions,
    .home-cinematic-slider.is-style-1 .home-slider-actions {
      margin-top: 8px !important;
    }
  }
  @media (max-width: 480px) {
    .public-site .home-cinematic-slider.is-style1,
    .public-site .home-cinematic-slider.is-style-1 {
      margin-top: var(--appearance-header-height, 66px);
    }
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style1,
    .public-site:has(.appearance-header.is-preview) .home-cinematic-slider.is-style-1 {
      margin-top: 0;
    }
    .home-cinematic-slider.is-style1 .home-slider-content,
    .home-cinematic-slider.is-style-1 .home-slider-content {
      gap: 20px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-pill,
    .home-cinematic-slider.is-style-1 .home-slider-pill {
      margin-bottom: 10px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-title,
    .home-cinematic-slider.is-style-1 .home-slider-title {
      margin-bottom: 4px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-description,
    .home-cinematic-slider.is-style-1 .home-slider-description {
      margin-bottom: 6px !important;
    }
    .home-cinematic-slider.is-style1 .home-slider-actions,
    .home-cinematic-slider.is-style-1 .home-slider-actions {
      margin-top: 8px !important;
    }
  }
`;
