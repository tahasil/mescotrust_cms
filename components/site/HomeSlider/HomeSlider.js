"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { HOME_SLIDER_DEFAULT_PROPS, HOME_SLIDER_DEFAULT_SLIDES } from "./defaults";
import Style1Slide, { style1Css } from "./Style1";
import Style2Slide, { style2Css } from "./Style2";
import Style3Slide, { style3Css } from "./Style3";

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

const targetOf = (value) => (value === "_blank" ? "_blank" : "_self");
const linkRel = (target) => (target === "_blank" ? "noopener noreferrer" : undefined);

const managedNumber = (value) => {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

function getManagedWrapperProps(settings) {
  const prefix = "homeSlider";
  const sectionBgType = String(settings?.[`${prefix}SectionBgType`] || "default");
  const containerBgType = String(settings?.[`${prefix}PageContainerBgType`] || "default");
  const sectionBgImage = String(settings?.[`${prefix}SectionBgImage`] || "").trim();
  const containerBgImage = String(settings?.[`${prefix}PageContainerBgImage`] || "").trim();
  const sectionColorKey = String(settings?.[`${prefix}SectionBgColorKey`] || "").trim();
  const containerColorKey = String(settings?.[`${prefix}PageContainerBgColorKey`] || "").trim();
  const containerPaddingTop = managedNumber(settings?.[`${prefix}PageContainerPaddingTop`]);
  const containerPaddingBottom = managedNumber(settings?.[`${prefix}PageContainerPaddingBottom`]);

  return {
    sectionClassName: sectionBgType === "default" ? "defaultBackground" : undefined,
    sectionStyle: {
      paddingLeft: 0,
      paddingRight: 0,
      ...(sectionBgType === "image" && sectionBgImage
        ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
        : sectionBgType === "color" && sectionColorKey
          ? { backgroundColor: getColor(sectionColorKey), backgroundImage: "none" }
          : {}),
      paddingTop: managedNumber(settings?.[`${prefix}SectionPaddingTop`]),
      paddingBottom: managedNumber(settings?.[`${prefix}SectionPaddingBottom`]),
      marginTop: managedNumber(settings?.[`${prefix}SectionMarginTop`]),
      marginBottom: managedNumber(settings?.[`${prefix}SectionMarginBottom`]),
    },
    containerStyle: {
      ...(containerPaddingTop != null ? { "--home-slider-container-padding-top": `${containerPaddingTop}px` } : {}),
      ...(containerPaddingBottom != null ? { "--home-slider-container-padding-bottom": `${containerPaddingBottom}px` } : {}),
      ...(containerBgType === "image" && containerBgImage
        ? { backgroundImage: `url(${containerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
        : containerBgType === "color" && containerColorKey
          ? { backgroundColor: getColor(containerColorKey), backgroundImage: "none" }
          : {}),
      marginTop: managedNumber(settings?.[`${prefix}PageContainerMarginTop`]),
      marginBottom: managedNumber(settings?.[`${prefix}PageContainerMarginBottom`]),
    },
  };
}

const ArrowIcon = () => (
  <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
    <path d="M3 9h11M10 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AnnouncementIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M4 10v4l3 1 7 4V5L7 9l-3 1Zm12-2.5a6 6 0 0 1 0 9" fill="currentColor" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <path d="M12 21s-7.5-4.4-9.5-8.8C.8 8.5 3.1 5 6.8 5c2.1 0 3.8 1.2 5.2 3 1.4-1.8 3.1-3 5.2-3 3.7 0 6 3.5 4.3 7.2C19.5 16.6 12 21 12 21Z" fill="currentColor" />
  </svg>
);

function normalizeSlide(slide, index) {
  const fallback = HOME_SLIDER_DEFAULT_SLIDES[index % HOME_SLIDER_DEFAULT_SLIDES.length] || HOME_SLIDER_DEFAULT_SLIDES[0];
  const merged = { ...fallback, ...(slide && typeof slide === "object" ? slide : {}) };
  return {
    ...merged,
    videoStyle: ["style1", "style2", "style3"].includes(merged?.videoStyle) ? merged.videoStyle : "style3",
    videoFit: merged?.videoFit === "cover" ? "cover" : "contain",
  };
}

export default function HomeSlider(props) {
  const settings = { ...HOME_SLIDER_DEFAULT_PROPS, ...(props || {}) };
  const slides = useMemo(() => {
    const source = Array.isArray(settings.homeSliderSlides) ? settings.homeSliderSlides : [];
    return source.map(normalizeSlide).filter((slide) => slide.active !== false);
  }, [settings.homeSliderSlides]);
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(null);
  const [paused, setPaused] = useState(false);
  const pointerStartX = useRef(null);
  const cleanupTimerRef = useRef(null);
  const rootRef = useRef(null);
  const currentRef = useRef(0);
  const pathId = `home-slider-badge-${useId().replace(/:/g, "")}`;
  const transitionSpeed = clamp(settings.homeSliderTransitionSpeed, 200, 2500, 1100);
  const autoplaySpeed = clamp(settings.homeSliderAutoplaySpeed, 1500, 60000, 6000);
  const minHeight = clamp(settings.homeSliderMinHeight, 0, 1400, 0);
  const { sectionClassName, sectionStyle, containerStyle } = getManagedWrapperProps(settings);

  useEffect(() => {
    if (current < slides.length) return;
    currentRef.current = 0;
    setCurrent(0);
    setPrevious(null);
  }, [current, slides.length]);

  useEffect(() => () => window.clearTimeout(cleanupTimerRef.current), []);

  const goTo = useCallback((requestedIndex) => {
    if (slides.length < 2) return;
    const next = (requestedIndex + slides.length) % slides.length;
    const active = currentRef.current;
    if (next === active) return;
    window.clearTimeout(cleanupTimerRef.current);
    setPrevious(active);
    currentRef.current = next;
    setCurrent(next);
    cleanupTimerRef.current = window.setTimeout(() => setPrevious(null), transitionSpeed + 150);
  }, [slides.length, transitionSpeed]);

  useEffect(() => {
    if (!settings.homeSliderAutoplay || paused || slides.length < 2) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => goTo(currentRef.current + 1), autoplaySpeed);
    return () => window.clearInterval(timer);
  }, [autoplaySpeed, goTo, paused, settings.homeSliderAutoplay, slides.length]);

  useEffect(() => {
    const videos = rootRef.current?.querySelectorAll("video") || [];
    videos.forEach((video) => {
      const slideEl = video.closest(".home-slider-slide");
      const isCurrent = slideEl?.classList.contains("is-active");
      if (isCurrent) {
        video.muted = true;
        video.playsInline = true;
        video.play?.().catch(() => {});
        if (video.videoWidth && video.videoHeight) {
          rootRef.current?.style.setProperty(
            "--home-slider-video-aspect",
            `${video.videoWidth} / ${video.videoHeight}`
          );
        }
      } else {
        video.pause?.();
      }
    });
  }, [current, slides]);

  if (slides.length === 0) {
    return (
      <FullWidthBackground className={`${sectionClassName || ""} home-slider-full-width`.trim()} $managedStyle={sectionStyle}>
        <PageContainer className="home-slider-page-container" $managedStyle={containerStyle}>
          <div style={{ minHeight: 240, display: "grid", placeItems: "center", color: "rgba(255,255,255,.72)", background: "#211e30" }}>No active slides.</div>
        </PageContainer>
      </FullWidthBackground>
    );
  }

  const activeSlide = slides[current] || slides[0];
  const align = ["center", "right"].includes(activeSlide.textAlignment) ? activeSlide.textAlignment : "left";
  const hasSlideContent = Boolean(
    activeSlide.smallTitle ||
    activeSlide.headingLine1 ||
    activeSlide.headingLine2 ||
    activeSlide.headingHighlight ||
    activeSlide.description ||
    activeSlide.primaryButtonLabel ||
    activeSlide.secondaryButtonLabel
  );
  const headingColor = getColor(activeSlide.headingColorKey || "warmWhite") || "#FAF6EF";
  const highlightColor = getColor(activeSlide.highlightColorKey || "primarySoft") || "#F2867F";
  const descriptionColor = getColor(activeSlide.descriptionColorKey || "white") || "#FFFFFF";
  const primaryBg = getColor(activeSlide.primaryButtonBgColorKey || "primary") || "#E03C33";
  const primaryText = getColor(activeSlide.primaryButtonTextColorKey || "white") || "#FFFFFF";
  const secondaryText = getColor(activeSlide.secondaryButtonTextColorKey || "white") || "#FFFFFF";
  const background = getColor(settings.homeSliderBackgroundColorKey || "dark") || "#211E30";
  const railColor = getColor(settings.homeSliderRailColorKey || "primary") || "#E03C33";
  const badgeTarget = targetOf(settings.homeSliderBadgeTarget);
  const sliderType = ["style1", "style2", "style3"].includes(settings.homeSliderType)
    ? settings.homeSliderType
    : (slides.find((s) => ["style1", "style2", "style3"].includes(s?.videoStyle))?.videoStyle || "style2");
  const hasStyle2 = sliderType === "style2";
  const isCurrentVideo = activeSlide?.mediaType === "video" && Boolean(activeSlide?.videoUrl);

  return (
    <FullWidthBackground className={`${sectionClassName || ""} home-slider-full-width`.trim()} $managedStyle={sectionStyle}>
      <PageContainer className="home-slider-structure-container" $managedStyle={containerStyle}>
      <section
      ref={rootRef}
      className={`home-cinematic-slider is-${sliderType}${hasStyle2 ? " has-style-2" : ""}${isCurrentVideo ? " is-video-active" : ""}`}
      aria-roledescription="carousel"
      aria-label="Home highlights"
      style={{
        "--home-slider-video-aspect": "16 / 9",
        "--home-slider-min-height": `${minHeight}px`,
        "--home-slider-transition": `${transitionSpeed}ms`,
        "--home-slider-autoplay": `${autoplaySpeed}ms`,
        "--home-slider-background": background,
        "--home-slider-rail": railColor,
        "--home-slider-heading": headingColor,
        "--home-slider-highlight": highlightColor,
        "--home-slider-description": descriptionColor,
        "--home-slider-primary-bg": primaryBg,
        "--home-slider-primary-text": primaryText,
        "--home-slider-secondary-text": secondaryText,
      }}
      onMouseEnter={() => settings.homeSliderPauseOnHover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(event) => {
        if (settings.homeSliderSwipeEnabled !== false) pointerStartX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStartX.current == null) return;
        const delta = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(delta) > 40) goTo(currentRef.current + (delta < 0 ? 1 : -1));
      }}
      onPointerCancel={() => { pointerStartX.current = null; }}
    >
      <div className="home-slider-stage">
        {slides.map((slide, index) => {
          const isActive = index === current;
          const wasActive = index === previous;
          const isInitial = previous == null && isActive;
          const commonProps = {
            slide,
            index,
            isActive,
            wasActive,
            isInitial,
            currentRef,
            rootRef,
          };
          const slideKey = `${slide.image || slide.videoUrl || "slide"}-${index}`;

          if (sliderType === "style1") {
            return <Style1Slide key={slideKey} {...commonProps} />;
          }
          if (sliderType === "style2") {
            return <Style2Slide key={slideKey} {...commonProps} />;
          }
          return <Style3Slide key={slideKey} {...commonProps} />;
        })}

        <PageContainer className={`home-slider-content home-slider-page-container align-${align}${hasSlideContent ? " has-content" : ""}`} $managedStyle={containerStyle}>
          {activeSlide.smallTitle ? (
            activeSlide.smallTitleUrl ? (
              <a className="home-slider-pill home-slider-intro" href={activeSlide.smallTitleUrl} target={targetOf(activeSlide.smallTitleTarget)} rel={linkRel(targetOf(activeSlide.smallTitleTarget))}>
                <AnnouncementIcon /><span>{activeSlide.smallTitle}</span><ArrowIcon />
              </a>
            ) : (
              <span className="home-slider-pill home-slider-intro"><AnnouncementIcon /><span>{activeSlide.smallTitle}</span></span>
            )
          ) : null}
          {(activeSlide.headingLine1 || activeSlide.headingLine2 || activeSlide.headingHighlight) ? (
            <h1 className="home-slider-title home-slider-intro">
              {activeSlide.headingLine1 ? <span>{activeSlide.headingLine2 || activeSlide.headingHighlight ? activeSlide.headingLine1 : renderHighlightedTitle(activeSlide.headingLine1, { titleHighlightColorKey: activeSlide.highlightColorKey })}</span> : null}
              {/* Keeps the heading readable for crawlers/screen readers. The spans are
                  display:block, so this space adds no visual line break. */}
              {activeSlide.headingLine1 && (activeSlide.headingLine2 || activeSlide.headingHighlight) ? " " : null}
              {(activeSlide.headingLine2 || activeSlide.headingHighlight) ? (
                <span>{renderHighlightedTitle(activeSlide.headingHighlight ? `${activeSlide.headingLine2}${activeSlide.headingLine2 ? " " : ""}*${activeSlide.headingHighlight}*` : activeSlide.headingLine2, { titleHighlightColorKey: activeSlide.highlightColorKey })}</span>
              ) : null}
            </h1>
          ) : null}
          {activeSlide.description ? <p className="home-slider-description home-slider-intro">{activeSlide.description}</p> : null}
          <div className="home-slider-actions home-slider-intro">
            {activeSlide.primaryButtonLabel && activeSlide.primaryButtonUrl ? (
              <a className="home-slider-button primary" href={activeSlide.primaryButtonUrl} target={targetOf(activeSlide.primaryButtonTarget)} rel={linkRel(targetOf(activeSlide.primaryButtonTarget))}>{activeSlide.primaryButtonLabel}</a>
            ) : null}
            {activeSlide.secondaryButtonLabel && activeSlide.secondaryButtonUrl ? (
              <a className="home-slider-button secondary" href={activeSlide.secondaryButtonUrl} target={targetOf(activeSlide.secondaryButtonTarget)} rel={linkRel(targetOf(activeSlide.secondaryButtonTarget))}>{activeSlide.secondaryButtonLabel}</a>
            ) : null}
          </div>
        </PageContainer>

        {settings.homeSliderShowRail !== false && slides.length > 1 ? (
          <div className="home-slider-rail" role="tablist" aria-label="Choose slide">
            {slides.map((slide, index) => (
              <button
                key={`rail-${index}`}
                type="button"
                role="tab"
                aria-label={`Go to slide ${index + 1}`}
                aria-selected={index === current}
                className={index === current ? "is-active" : ""}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        ) : null}

        {settings.homeSliderBadgeEnabled !== false && settings.homeSliderBadgeUrl ? (
          <a className="home-slider-badge" href={settings.homeSliderBadgeUrl} target={badgeTarget} rel={linkRel(badgeTarget)} aria-label={settings.homeSliderBadgeAriaLabel || settings.homeSliderBadgeText}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs><path id={pathId} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
              <text><textPath href={`#${pathId}`} textLength="276" lengthAdjust="spacingAndGlyphs">{settings.homeSliderBadgeText}</textPath></text>
            </svg>
            <HeartIcon />
          </a>
        ) : null}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .home-cinematic-slider, .home-cinematic-slider * { box-sizing: border-box; }
        .home-slider-structure-container { display: contents; }
        .home-cinematic-slider {
          --home-slider-body: "Instrument Sans", system-ui, sans-serif;
          --home-slider-display: "Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif;
          position: relative;
          width: 100%;
          height: max(calc(100svh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
          height: max(calc(100dvh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
          min-height: max(calc(100svh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
          min-height: max(calc(100dvh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
          overflow: hidden;
          color: #fbfaf7;
          background: var(--home-slider-background);
          font-family: var(--home-slider-body);
          font-synthesis: none;
          -webkit-font-smoothing: antialiased;
          touch-action: pan-y;
        }
        .home-cinematic-slider::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          background: radial-gradient(52% 60% at 82% 10%,rgba(224,60,51,.16),transparent 70%),radial-gradient(40% 50% at 8% 92%,rgba(224,60,51,.1),transparent 70%);
          pointer-events: none;
        }
        .home-slider-stage {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: inherit;
        }

        .home-slider-slide { position: absolute; inset: 0; z-index: 0; visibility: hidden; clip-path: inset(100% 0 0 0); }
        .home-slider-slide.is-initial { z-index: 1; visibility: visible; clip-path: inset(0) !important; transition: none !important; }
        .home-slider-slide.is-active { z-index: 1; visibility: visible; clip-path: inset(0); transition: clip-path var(--home-slider-transition) cubic-bezier(.77,0,.18,1); }
        .home-slider-slide.was-active { z-index: 0; visibility: visible; clip-path: inset(0); }
        .home-slider-slide picture { position: absolute; inset: 0; display: block; }
        .home-slider-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.85); }
        .home-slider-slide.is-active .home-slider-media:not(.home-slider-video-media) { animation: homeSliderSettle 8s ease-out forwards; }
        
        .home-slider-slide.is-video-slide {
          background: #171422;
        }
        ${style1Css}
        ${style2Css}
        ${style3Css}
        .home-slider-slide.is-video-slide .home-slider-scrim { pointer-events: none; }
        .home-slider-scrim { position: absolute; inset: 0; background: linear-gradient(100deg,rgba(23,20,34,.94) 8%,rgba(23,20,34,.62) 48%,rgba(23,20,34,.28) 100%),linear-gradient(0deg,rgba(23,20,34,.85) 0%,transparent 36%),radial-gradient(46% 60% at 88% 8%,rgba(224,60,51,.22),transparent 70%); }
        .home-slider-caption { position: absolute; left: 0; right: 0; bottom: clamp(22px,4vh,44px); z-index: 2; width: 90%; max-width: var(--layout-width, 100%); margin: 0 auto; padding-top: 0; padding-bottom: 0; padding-left: 0; padding-right: 0; display: flex; align-items: baseline; gap: 20px; flex-wrap: wrap; }
        .home-slider-caption.align-center { justify-content: center; text-align: center; }
        .home-slider-caption.align-right { justify-content: flex-end; text-align: right; }
        .home-slider-caption p { margin: 0; color: #fff; font-family: var(--home-slider-display); font-size: clamp(17px,1.7vw,24px); font-weight: 620; }
        .home-slider-caption a { display: inline-flex; align-items: center; gap: 8px; padding-bottom: 3px; color: rgba(250,246,239,.92) !important; -webkit-text-fill-color: rgba(250,246,239,.92) !important; border-bottom: 1.5px solid currentColor; font-size: 14px; font-weight: 600; text-decoration: none !important; }
        .home-slider-slide.is-initial .home-slider-caption p, .home-slider-slide.is-initial .home-slider-caption a { animation: none !important; opacity: 1 !important; transform: none !important; }
        .home-slider-slide.is-active:not(.is-initial) .home-slider-caption p, .home-slider-slide.is-active:not(.is-initial) .home-slider-caption a { animation: homeSliderCaptionUp .8s cubic-bezier(.16,1,.3,1) .25s backwards; }
        .home-slider-slide.is-active:not(.is-initial) .home-slider-caption a { animation-delay: .4s; }
        .home-slider-content {
          position: absolute;
          inset: 0;
          z-index: 3;
          width: 90%;
          max-width: var(--layout-width, 100%);
          margin: 0 auto;
          height: 100%;
          padding-top: max(var(--home-slider-container-padding-top, 0px), calc(var(--appearance-header-offset, 132px) + 20px), calc(var(--appearance-header-height, 92px) + 28px));
          padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 76px);
          padding-left: 0;
          padding-right: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          pointer-events: none;
        }
        .public-site .home-cinematic-slider { --home-slider-viewport-offset: var(--appearance-ribbon-height, 40px); }
        .home-slider-content > * { pointer-events: auto; }
        .home-slider-content.align-center { align-items: center; text-align: center; }
        .home-slider-content.align-right { align-items: flex-end; text-align: right; }
        .home-slider-pill { display: inline-flex; align-items: center; gap: 10px; max-width: 100%; margin-bottom: clamp(14px, 2vh, 22px); padding: 8px 16px; color: #fbfaf7 !important; -webkit-text-fill-color: #fbfaf7 !important; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.22); border-radius: 999px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); font-size: 13px; font-weight: 600; text-decoration: none !important; transition: background .25s,border-color .25s; }
        .home-slider-pill:hover { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.4); }
        .home-slider-pill > svg:first-child { flex: 0 0 auto; color: #f2867f; }
        .home-slider-pill span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .home-slider-title { max-width: 22ch; margin: 0 0 clamp(14px, 1.8vh, 22px); color: var(--home-slider-heading) !important; font-family: var(--home-slider-display) !important; font-size: clamp(34px, 4.8vw, 76px) !important; font-weight: 650 !important; line-height: 1.05 !important; letter-spacing: -.028em !important; }
        .home-slider-title > span { display: block; font-family: inherit !important; }
        .home-slider-title em { color: var(--home-slider-highlight); font-family: inherit !important; font-style: normal; }
        .home-slider-description { max-width: 44ch; margin: 0 0 clamp(16px, 2.2vh, 26px); color: var(--home-slider-description); opacity: .82; font-size: clamp(14px, 1.2vw, 17px); line-height: 1.55; }
        .home-slider-actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .home-slider-button { display: inline-flex; align-items: center; justify-content: center; padding: 15px 32px; border: 1px solid transparent; border-radius: 999px; font-size: 15.5px; font-weight: 600; line-height: 1.2; text-decoration: none !important; transition: transform .25s,background .25s,border-color .25s; }
        .home-slider-button.primary { color: var(--home-slider-primary-text) !important; -webkit-text-fill-color: var(--home-slider-primary-text) !important; background: var(--home-slider-primary-bg); box-shadow: 0 14px 30px rgba(224,60,51,.28); }
        .home-slider-button.secondary { color: var(--home-slider-secondary-text) !important; -webkit-text-fill-color: var(--home-slider-secondary-text) !important; background: rgba(23, 20, 34, 0.45); border-color: rgba(255,255,255,.35); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
        .home-slider-button:hover { transform: translateY(-2px); }
        .home-slider-button.secondary:hover { background: rgba(255,255,255,.15); border-color: #fff; }
        .home-slider-rail { position: absolute; right: clamp(16px,2.6vw,36px); top: 50%; z-index: 4; display: flex; flex-direction: column; gap: 10px; transform: translateY(-50%); }
        .home-slider-rail button { position: relative; width: 4px; height: 34px; padding: 0; overflow: hidden; background: rgba(255,255,255,.3); border: 0; border-radius: 999px; cursor: pointer; }
        .home-slider-rail button::after { content: ""; position: absolute; inset: auto 0 0; height: 0; background: var(--home-slider-rail); }
        .home-slider-rail button.is-active { background: rgba(255,255,255,.45); }
        .home-slider-rail button.is-active::after { animation: homeSliderRailFill var(--home-slider-autoplay) linear forwards; }
        .home-slider-badge { position: absolute; right: clamp(20px,4vw,56px); bottom: 22px; z-index: 5; width: 108px; height: 108px; display: grid; place-items: center; color: #fbfaf7 !important; -webkit-text-fill-color: #fbfaf7 !important; text-decoration: none !important; transition: transform .3s cubic-bezier(.16,1,.3,1); }
        .home-slider-badge:hover { color: #f2867f !important; -webkit-text-fill-color: #f2867f !important; transform: scale(1.08); }
        .home-slider-badge > svg:first-child { position: absolute; inset: 0; width: 100%; height: 100%; animation: homeSliderSpin 16s linear infinite; }
        .home-slider-badge text { fill: currentColor; font-family: var(--home-slider-body); font-size: 11.5px; font-weight: 700; letter-spacing: .18em; }
        .home-slider-badge > svg:last-child { color: #e03c33; }
        @keyframes homeSliderSettle { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes homeSliderCaptionUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes homeSliderRailFill { from { height: 0; } to { height: 100%; } }
        @keyframes homeSliderSpin { to { transform: rotate(360deg); } }
        @media (max-width: 1199px) {
          .home-cinematic-slider,
          .home-slider-stage {
            height: max(calc(100svh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
            height: max(calc(100dvh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
            min-height: max(calc(100svh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
            min-height: max(calc(100dvh - var(--home-slider-viewport-offset, 40px)), var(--home-slider-min-height, 0px));
          }
          .home-slider-content {
            padding-top: max(var(--home-slider-container-padding-top, 0px), calc(var(--appearance-header-offset, 120px) + 20px), calc(var(--appearance-header-height, 80px) + 28px));
            padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 70px);
          }
        }
        @media (max-width: 1023px) {
          .home-slider-title { max-width: 18ch; font-size: clamp(32px, 5.2vw, 52px) !important; }
        }
        @media (max-width: 767px) {
          .public-site .home-cinematic-slider { --home-slider-viewport-offset: var(--appearance-ribbon-height, 36px); }
          .home-cinematic-slider,
          .home-cinematic-slider .home-slider-stage {
            height: max(560px, calc(100svh - var(--home-slider-viewport-offset, 36px)));
            height: max(560px, calc(100dvh - var(--home-slider-viewport-offset, 36px)));
            min-height: max(560px, calc(100svh - var(--home-slider-viewport-offset, 36px)));
            min-height: max(560px, calc(100dvh - var(--home-slider-viewport-offset, 36px)));
          }
          .home-slider-content {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            padding-left: 20px;
            padding-right: 20px;
            justify-content: center !important;
            gap: clamp(14px, 2.6vh, 22px);
            padding-top: max(var(--home-slider-container-padding-top, 0px), calc(var(--appearance-header-height, 76px) + 16px));
            padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 24px);
          }
          .public-site:has(.appearance-header.is-preview) .home-slider-content { padding-top: max(var(--home-slider-container-padding-top, 0px), 18px); }
          .home-slider-pill { max-width: 100%; margin-bottom: 0; padding: 8px 14px; font-size: 12px; line-height: 1.25; }
          .home-slider-title { max-width: 100%; margin-bottom: 0; font-size: clamp(28px, 7.6vw, 40px) !important; line-height: 1.12 !important; letter-spacing: -.02em !important; text-wrap: balance; }
          .home-slider-description { max-width: 38ch; margin-bottom: 0; font-size: 14px; line-height: 1.6; opacity: .86; text-wrap: pretty; }
          .home-slider-actions { display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 100%; margin-top: 2px; }
          .home-slider-button { flex: 1 1 0; min-width: 0; width: auto; min-height: 48px; padding: 12px 14px; font-size: 14px; line-height: 1.25; text-align: center; }
          .home-slider-rail {
            position: absolute !important;
            right: 12px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 10 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 7px !important;
          }
          .home-slider-rail button {
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
          .home-slider-rail button.is-active {
            background: rgba(255, 255, 255, 0.95) !important;
            height: 26px !important;
          }
          .home-slider-rail button::after {
            content: "" !important;
            position: absolute !important;
            inset: auto 0 0 !important;
            height: 0 !important;
            background: var(--home-slider-rail, #E03C33) !important;
          }
          .home-slider-rail button.is-active::after {
            animation: homeSliderRailFill var(--home-slider-autoplay) linear forwards !important;
          }
          .home-slider-caption { display: none; }
          .home-slider-badge { display: none; }
        }
        @media (max-width: 480px) {
          .home-slider-content { padding-top: max(var(--home-slider-container-padding-top, 0px), calc(var(--appearance-header-height, 66px) + 14px)); padding-bottom: max(var(--home-slider-container-padding-bottom, 0px), 14px); gap: clamp(14px, 2.8vh, 20px); }
          .home-slider-pill { padding: 7px 13px; font-size: 11.5px; }
          .home-slider-title { font-size: clamp(26px, 7.4vw, 34px) !important; }
          .home-slider-description { font-size: 13.5px; line-height: 1.55; max-width: 34ch; }
          .home-slider-actions { gap: 10px; }
          .home-slider-button { min-height: 46px; padding: 12px 10px; font-size: 13.5px; }
          .home-slider-rail { right: 8px !important; gap: 5px !important; }
          .home-slider-rail button { width: 4.5px !important; height: 15px !important; }
          .home-slider-rail button.is-active { height: 22px !important; }
        }
        @media (max-width: 350px) {
          .home-slider-actions { flex-direction: column; gap: 8px; max-width: 100%; }
          .home-slider-button { flex: 0 0 auto; width: 100%; min-height: 46px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-slider-slide.is-active, .home-slider-slide.is-active .home-slider-media, .home-slider-slide.is-active .home-slider-caption p, .home-slider-slide.is-active .home-slider-caption a, .home-slider-rail button.is-active::after, .home-slider-badge > svg:first-child { animation: none !important; transition: none !important; }
          .home-slider-rail button.is-active::after { height: 100%; }
        }
      ` }} />
      </section>
      </PageContainer>
    </FullWidthBackground>
  );
}
