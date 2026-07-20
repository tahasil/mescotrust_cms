"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { getColor } from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const WorksSection = styled.div`
  position: relative;
  width: 100%;
  background: ${getColor("cream")} no-repeat center;
  background-size: cover;
`;

const WorksWrapper = styled.div`
  width: 100%;
  position: relative;
  color: ${getColor("black")};
  font-family: "Instrument Sans", system-ui, sans-serif;
  --button-color: ${(p) => p.$buttonColor || getColor("white")};
  --description-color: ${(p) =>
    p.$descriptionColor || "rgba(255, 255, 255, 0.88)"};

  .worksPin {
    width: 100%;
    overflow: hidden;
    padding-block: clamp(64px, 8vh, 96px);
  }

  .worksHead {
    width: 100%;
    max-width: 1400px;
    margin-inline: auto;
    padding-inline: clamp(20px, 4vw, 48px);
    padding-top: 0;
    padding-bottom: 0;
    margin-bottom: clamp(36px, 5vh, 56px);
    box-sizing: border-box;
  }

  .worksEyebrow {
    margin: 0 0 18px;
    color: var(--eyebrow-color, ${getColor("primary")});
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.16em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .worksHeading {
    max-width: 16ch;
    margin: 0;
    color: var(--heading-color, ${getColor("black")});
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif;
    font-size: clamp(36px, 4.6vw, 64px);
    font-weight: 620;
    letter-spacing: -0.02em;
    line-height: 1.08;
  }

  .worksHeading em {
    font-style: normal;
  }

  .worksTrack {
    display: flex;
    gap: clamp(20px, 2.4vw, 36px);
    width: max-content;
    padding-inline: clamp(20px, 4vw, 48px);
    will-change: transform;
  }

  .workCard {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    align-items: flex-end;
    width: clamp(320px, 44vw, 680px);
    aspect-ratio: 16 / 10.5;
    overflow: hidden;
    border-radius: 20px;
  }

  .workCardBackground {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .workCardFallback {
    position: absolute;
    inset: 0;
    background: ${getColor("dark")};
  }

  .workCardScrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      185deg,
      rgba(27, 24, 38, 0.06) 30%,
      rgba(27, 24, 38, 0.88) 100%
    );
  }

  .workCardBody {
    position: relative;
    z-index: 2;
    padding: clamp(22px, 2.6vw, 40px);
    color: ${getColor("white")};
  }

  .workCardIcon {
    display: block;
    width: 56px;
    height: 56px;
    object-fit: contain;
    margin-bottom: 16px;
    border-radius: 14px;
    background: ${getColor("cream")};
    padding: 9px;
    box-sizing: border-box;
  }

  .workCard h3 {
    max-width: 16ch;
    margin: 0 0 10px;
    font-family: ${(p) =>
      p.$titleFontFamily ||
      '"Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif'};
    font-size: ${(p) =>
      p.$titleFontSize ? `${p.$titleFontSize}px` : "clamp(24px, 2.4vw, 36px)"};
    font-style: ${(p) => p.$titleFontStyle || "normal"};
    font-weight: ${(p) => p.$titleFontWeight || 620};
    letter-spacing: ${(p) =>
      p.$titleLetterSpacing != null
        ? `${p.$titleLetterSpacing}px`
        : "-0.01em"};
    line-height: ${(p) => p.$titleLineHeight || 1.12};
  }

  .workCardDescription {
    max-width: 42ch;
    margin: 0 0 16px;
    color: var(--description-color);
    font-size: 15.5px;
    line-height: 1.6;
  }

  .workCardLink {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1.5px solid rgba(255, 253, 248, 0.6);
    color: var(--button-color);
    font-size: 15px;
    font-weight: 650;
    line-height: 1.5;
    padding-bottom: 3px;
    text-decoration: none;
    transition: gap 0.25s ease, color 0.2s ease;
  }

  .workCardLink:hover {
    gap: 13px;
    color: ${getColor("primaryPale")};
  }

  .workCard:hover .workCardBackground {
    transform: scale(1.06);
  }

  .emptyState {
    width: 100%;
    padding: 40px 24px;
    color: ${getColor("blackMuted")};
    text-align: center;
  }

  @media (max-width: 767px) {
    .worksPin {
      overflow: visible;
    }

    .worksTrack {
      width: auto;
      overflow-x: auto;
      padding-bottom: 10px;
      scroll-snap-type: x mandatory;
      will-change: auto;
    }

    .workCard {
      width: 84vw;
      aspect-ratio: 4 / 4.4;
      scroll-snap-align: start;
    }
  }

  &.isEditorPreview {
    .worksPin {
      overflow: visible;
    }

    .worksTrack {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      padding-bottom: 12px;
      scroll-snap-type: x mandatory;
      will-change: auto;
    }

    .workCard {
      scroll-snap-align: start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .worksTrack {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      padding-bottom: 12px;
      scroll-snap-type: x mandatory;
      will-change: auto;
    }

    .workCard {
      scroll-snap-align: start;
    }

    .workCardBackground {
      transition: none;
    }
  }
`;

function textValue(value) {
  return value == null ? "" : String(value).trim();
}

export default function OverviewOfOurWork(props) {
  const pathname = usePathname();
  const wrapperRef = useRef(null);
  const pinRef = useRef(null);
  const trackRef = useRef(null);
  const isEditorPreview = pathname?.startsWith("/admin") === true;

  const rawItems = props?.overviewOfOurWorkItems ?? props?.items;
  const cards = Array.isArray(rawItems)
    ? rawItems.map((item) => ({
        title: textValue(item?.title) || "Card",
        description: textValue(
          item?.description ?? item?.body ?? item?.text ?? item?.summary,
        ),
        bgImageUrl: textValue(
          item?.bgImageUrlDesktop ??
            item?.bgImageUrl ??
            item?.bgImage ??
            item?.bgImageUrlMobile,
        ),
        link: textValue(item?.link ?? item?.url),
        linkText: textValue(item?.linkText ?? item?.buttonText),
        titleColorKey: textValue(
          item?.titleColorKey ?? item?.cardTitleColorKey,
        ),
        icon: textValue(item?.icon),
      }))
    : [];

  useLayoutEffect(() => {
    if (
      isEditorPreview ||
      !wrapperRef.current ||
      !pinRef.current ||
      !trackRef.current
    ) {
      return;
    }

    let media;
    let layoutFrame = 0;
    let paintFrame = 0;
    let refreshFrame = 0;
    let refreshPaintFrame = 0;
    let initialized = false;
    let lastLayoutMetrics = null;

    const getLayoutMetrics = () => {
      const pin = pinRef.current;
      const track = trackRef.current;
      if (!pin || !track) return null;
      const anchor = pin.parentElement?.classList.contains("pin-spacer")
        ? pin.parentElement
        : pin;
      return {
        anchorTop: anchor.getBoundingClientRect().top + window.scrollY,
        pinHeight: pin.getBoundingClientRect().height,
        trackWidth: track.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    };

    const refreshIfLayoutShifted = () => {
      if (!initialized) return;
      const metrics = getLayoutMetrics();
      if (!metrics) return;
      const hasChanged =
        !lastLayoutMetrics ||
        Object.keys(metrics).some(
          (key) => Math.abs(metrics[key] - lastLayoutMetrics[key]) >= 1,
        );
      if (!hasChanged) {
        return;
      }
      lastLayoutMetrics = metrics;
      ScrollTrigger.refresh();
      lastLayoutMetrics = getLayoutMetrics();
    };

    const refreshAfterPaint = () => {
      window.cancelAnimationFrame(refreshFrame);
      window.cancelAnimationFrame(refreshPaintFrame);
      refreshFrame = window.requestAnimationFrame(() => {
        refreshPaintFrame = window.requestAnimationFrame(
          refreshIfLayoutShifted,
        );
      });
    };

    const initializeScroll = () => {
      if (initialized || !pinRef.current || !trackRef.current) return;
      initialized = true;
      media = gsap.matchMedia();
      media.add(
        {
          desktop: "(min-width: 768px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (!context.conditions.desktop || context.conditions.reduceMotion) {
            return;
          }

          const distance = () =>
            Math.max(0, trackRef.current.scrollWidth - window.innerWidth);

          if (distance() <= 0) return;

          const tween = gsap.to(trackRef.current, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: pinRef.current,
              start: "top top",
              end: () => `+=${Math.max(1, distance())}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });

          return () => tween.kill();
        },
        wrapperRef,
      );
      ScrollTrigger.refresh();
      lastLayoutMetrics = getLayoutMetrics();
    };

    const initializeAfterPaint = () => {
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(paintFrame);
      layoutFrame = window.requestAnimationFrame(() => {
        paintFrame = window.requestAnimationFrame(initializeScroll);
      });
    };

    const handlePageReadiness = (event) => {
      if (event?.detail?.ready || window.__mescoPageReady?.isReady?.()) {
        initializeAfterPaint();
        refreshAfterPaint();
      }
    };

    const handleWindowLoad = () => {
      initializeAfterPaint();
      refreshAfterPaint();
    };

    const layoutRoot =
      wrapperRef.current.closest(".public-site") || document.body;
    const resizeObserver = new ResizeObserver(refreshAfterPaint);
    resizeObserver.observe(document.body);
    if (layoutRoot !== document.body) resizeObserver.observe(layoutRoot);

    const mutationObserver = new MutationObserver(refreshAfterPaint);
    mutationObserver.observe(layoutRoot, { childList: true, subtree: true });

    window.addEventListener("site-page-readiness-change", handlePageReadiness);
    window.addEventListener("load", handleWindowLoad, { once: true });

    initializeAfterPaint();

    return () => {
      window.removeEventListener(
        "site-page-readiness-change",
        handlePageReadiness,
      );
      window.removeEventListener("load", handleWindowLoad);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(paintFrame);
      window.cancelAnimationFrame(refreshFrame);
      window.cancelAnimationFrame(refreshPaintFrame);
      media?.revert();
    };
  }, [cards.length, isEditorPreview]);

  const sectionBgType = textValue(
    props?.overviewOfOurWorkSectionBgType ?? "default",
  );
  const sectionBgImage = textValue(props?.overviewOfOurWorkSectionBgImage);
  const sectionBgColorKey = textValue(
    props?.overviewOfOurWorkSectionBgColorKey,
  );
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionSpacing = {
    paddingTop: props?.overviewOfOurWorkSectionPaddingTop,
    paddingBottom: props?.overviewOfOurWorkSectionPaddingBottom,
    marginTop: props?.overviewOfOurWorkSectionMarginTop,
    marginBottom: props?.overviewOfOurWorkSectionMarginBottom,
  };
  const sectionBgStyle = {
    ...(sectionBgStyleBase || {}),
    ...Object.fromEntries(
      Object.entries(sectionSpacing)
        .filter(
          ([, value]) =>
            value != null &&
            value !== "" &&
            Number.isFinite(Number(value)) &&
            Number(value) >= 0,
        )
        .map(([key, value]) => [key, `${Number(value)}px`]),
    ),
  };

  const pageContainerBgType = textValue(
    props?.overviewOfOurWorkPageContainerBgType ?? "default",
  );
  const pageContainerBgImage = textValue(
    props?.overviewOfOurWorkPageContainerBgImage,
  );
  const pageContainerBgColorKey = textValue(
    props?.overviewOfOurWorkPageContainerBgColorKey,
  );
  const pageContainerStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerSpacing = {
    paddingTop: props?.overviewOfOurWorkPageContainerPaddingTop,
    paddingRight: props?.overviewOfOurWorkPageContainerPaddingRight,
    paddingBottom: props?.overviewOfOurWorkPageContainerPaddingBottom,
    paddingLeft: props?.overviewOfOurWorkPageContainerPaddingLeft,
    marginTop: props?.overviewOfOurWorkPageContainerMarginTop,
    marginBottom: props?.overviewOfOurWorkPageContainerMarginBottom,
  };
  const pageContainerStyle = {
    ...(pageContainerStyleBase || {}),
    ...Object.fromEntries(
      Object.entries(containerSpacing)
        .filter(
          ([, value]) =>
            value != null &&
            value !== "" &&
            Number.isFinite(Number(value)) &&
            Number(value) >= 0,
        )
        .map(([key, value]) => [key, `${Number(value)}px`]),
    ),
  };

  const eyebrow = textValue(props?.overviewOfOurWorkEyebrow);
  const heading = textValue(props?.overviewOfOurWorkHeading);
  const headingAccent = textValue(props?.overviewOfOurWorkHeadingAccent);
  const showHeading = Boolean(eyebrow || heading || headingAccent);
  const titleColorKeyDefault = textValue(
    props?.overviewOfOurWorkCardTitleColorKey,
  );
  const titleColor = (key) => {
    const resolvedKey = textValue(key) || titleColorKeyDefault;
    return resolvedKey ? getColor(resolvedKey) : getColor("white");
  };
  const colorFromProp = (propName, fallback) => {
    const key = textValue(props?.[propName]);
    return key ? getColor(key) : fallback;
  };
  const titleFontSizeValue = Number(props?.overviewOfOurWorkTitleFontSize);
  const titleFontWeightValue = Number(props?.overviewOfOurWorkTitleFontWeight);
  const titleLetterSpacingValue = Number(
    props?.overviewOfOurWorkTitleLetterSpacing,
  );
  const titleLineHeightValue = Number(
    props?.overviewOfOurWorkTitleLineHeight,
  );
  const usesLegacyGeneratedTypography =
    titleFontSizeValue === 24 &&
    titleFontWeightValue === 700 &&
    textValue(props?.overviewOfOurWorkTitleFontStyle || "normal") ===
      "normal" &&
    titleLetterSpacingValue === 0 &&
    titleLineHeightValue === 1.2;
  return (
    <WorksSection
      className={sectionBgClassName}
      style={Object.keys(sectionBgStyle).length ? sectionBgStyle : undefined}
    >
      <WorksWrapper
        ref={wrapperRef}
        className={isEditorPreview ? "isEditorPreview" : undefined}
        $buttonColor={colorFromProp(
          "overviewOfOurWorkButtonColorKey",
          getColor("white"),
        )}
        $descriptionColor={colorFromProp(
          "overviewOfOurWorkDescriptionColorKey",
          "rgba(255, 255, 255, 0.88)",
        )}
        $titleFontFamily={textValue(
          props?.overviewOfOurWorkTitleFontFamily,
        )}
        $titleFontSize={
          !usesLegacyGeneratedTypography && Number.isFinite(titleFontSizeValue)
            ? titleFontSizeValue
            : undefined
        }
        $titleFontStyle={
          !usesLegacyGeneratedTypography &&
          textValue(props?.overviewOfOurWorkTitleFontStyle) === "italic"
            ? "italic"
            : undefined
        }
        $titleFontWeight={
          !usesLegacyGeneratedTypography &&
          Number.isFinite(titleFontWeightValue)
            ? titleFontWeightValue
            : undefined
        }
        $titleLetterSpacing={
          !usesLegacyGeneratedTypography &&
          Number.isFinite(titleLetterSpacingValue)
            ? titleLetterSpacingValue
            : undefined
        }
        $titleLineHeight={
          !usesLegacyGeneratedTypography && Number.isFinite(titleLineHeightValue)
            ? titleLineHeightValue
            : undefined
        }
        style={{
          "--eyebrow-color": colorFromProp(
            "overviewOfOurWorkEyebrowColorKey",
            getColor("primary"),
          ),
          "--heading-color": colorFromProp(
            "overviewOfOurWorkHeadingColorKey",
            getColor("black"),
          ),
        }}
      >
        <div ref={pinRef} className="worksPin">
          {showHeading ? (
            <div className="worksHead" style={pageContainerStyle}>
              {eyebrow ? <p className="worksEyebrow">{eyebrow}</p> : null}
              {heading || headingAccent ? (
                <h2 className="worksHeading">
                  {heading}
                  {heading && headingAccent ? " " : null}
                  {headingAccent ? <em>{headingAccent}</em> : null}
                </h2>
              ) : null}
            </div>
          ) : null}

          {cards.length ? (
            <div ref={trackRef} className="worksTrack">
              {cards.map((card, index) => {
                const hasLink = Boolean(card.link && card.linkText);
                return (
                  <article className="workCard" key={`${card.title}-${index}`}>
                    {card.bgImageUrl ? (
                      <img
                        className="workCardBackground"
                        src={card.bgImageUrl}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    ) : (
                      <span className="workCardFallback" aria-hidden="true" />
                    )}
                    <span className="workCardScrim" aria-hidden="true" />
                    <div className="workCardBody">
                      {card.icon ? (
                        <img
                          className="workCardIcon"
                          src={card.icon}
                          alt=""
                          width={56}
                          height={56}
                        />
                      ) : null}
                      <h3 style={{ color: titleColor(card.titleColorKey) }}>
                        {card.title}
                      </h3>
                      {card.description ? (
                        <p className="workCardDescription">{card.description}</p>
                      ) : null}
                      {hasLink ? (
                        <Link className="workCardLink" href={card.link}>
                          <span>{card.linkText}</span>
                          <ArrowRightOutlined aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="emptyState">
              No cards yet. Edit this component and add items under Content.
            </div>
          )}
        </div>
      </WorksWrapper>
    </WorksSection>
  );
}
