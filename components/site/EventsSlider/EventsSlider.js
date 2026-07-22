"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Carousel } from "antd";
import {
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  PageContainer,
  getColor,
} from "@/styles/Theme";
import {
  formatEventDateRange,
  getEventImageSources,
  formatLocationLine,
} from "@/components/events/eventDisplay";
import MediaImage from "@/components/shared/MediaImage";
import { usePageReadyTask } from "@/lib/pageReadiness";

const SliderWrapper = styled.div`
  --events-ink: #2a283e;
  --events-ink-soft: rgba(42, 40, 62, 0.76);
  --events-ink-muted: rgba(42, 40, 62, 0.52);
  --events-border: rgba(42, 40, 62, 0.14);
  --events-primary: #e03c33;
  --events-surface: #fff;
  color: var(--events-ink);
  font-family: "Instrument Sans", system-ui, sans-serif;
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;

  .events-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: clamp(36px, 4vw, 56px);
  }

  .events-eyebrow {
    margin: 0 0 18px;
    color: var(--events-eyebrow, var(--events-primary));
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.16em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  .events-title {
    max-width: 16ch;
    margin: 0;
    color: var(--events-heading, var(--events-ink));
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui,
      sans-serif;
    font-size: clamp(36px, 4.6vw, 64px);
    font-weight: 620;
    letter-spacing: -0.02em;
    line-height: 1.08;
  }

  .events-all-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid currentColor;
    color: var(--events-ink);
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease, gap 0.25s ease;
    &:hover {
      gap: 13px;
      color: var(--events-primary);
    }
  }

  .carousel-shell {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--events-border);
    border-radius: 20px;
    background: var(--events-surface);
  }

  .slick-track {
    transition-timing-function: cubic-bezier(0.77, 0, 0.18, 1) !important;
  }

  .slick-slide > div,
  .slide-frame {
    height: 100%;
  }

  .slide-frame {
    min-width: 0;
  }

  .event-slide {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(0, 1fr);
    min-height: clamp(340px, 32vw, 440px);
    height: 100%;
  }

  .slide-image {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(42, 40, 62, 0.05);
    picture {
      width: 100%;
      height: 100%;
      display: block;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  .event-slide:hover .slide-image img {
    transform: scale(1.025);
  }

  .image-placeholder {
    padding: 32px;
    color: var(--events-ink-muted);
    font-size: 14px;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-align: center;
  }

  .slide-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    min-width: 0;
    padding: clamp(26px, 3.2vw, 56px);
  }

  .slide-date {
    margin: 0;
    color: var(--events-date, var(--events-primary));
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.45;
    text-transform: uppercase;
  }

  .slide-title {
    margin: 0;
    color: var(--events-ink);
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui,
      sans-serif;
    font-size: clamp(23px, 2.3vw, 34px);
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.15;
    a {
      color: inherit;
      text-decoration: none;
    }
  }

  .slide-location {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    color: var(--events-ink-muted);
    font-size: 14.5px;
    font-weight: 600;
    .anticon {
      flex: 0 0 auto;
      color: var(--events-primary);
      font-size: 16px;
    }
  }

  .slide-desc {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    max-width: 44ch;
    margin: 0;
    color: var(--events-description, var(--events-ink-soft));
    font-size: 15.5px;
    line-height: 1.6;
  }

  .slide-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    align-self: flex-start;
    margin-top: 8px;
    padding: 13px 26px;
    border-radius: var(--events-cta-radius, 999px);
    background: var(--events-cta-bg, var(--events-ink));
    color: var(--events-cta-text, #fbfaf7);
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    width: fit-content;
    transition:
      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      background 0.25s ease,
      box-shadow 0.25s ease;
    &:hover {
      color: var(--events-cta-text, #fbfaf7);
      background: var(--events-cta-bg-hover, #000);
      box-shadow: 0 12px 24px rgba(42, 40, 62, 0.16);
      transform: translateY(-2px);
    }
    &:active {
      transform: scale(0.97);
    }
  }

  .slider-nav {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nav-btn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--events-border);
    border-radius: 50%;
    background: var(--events-arrow-bg, var(--events-surface));
    color: var(--events-arrow-color, var(--events-ink));
    cursor: pointer;
    font-size: 18px;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease,
      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    &:hover {
      border-color: var(--events-ink);
      background: var(--events-ink);
      color: #fbfaf7;
      transform: translateY(-2px);
    }
    &:active {
      transform: scale(0.98);
    }
  }

  .slider-foot {
    position: absolute;
    right: clamp(20px, 2.6vw, 44px);
    bottom: clamp(20px, 2.4vw, 36px);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 3;
  }

  .slider-count {
    min-width: 58px;
    color: var(--events-count, var(--events-ink-muted));
    font-family: "Bricolage Grotesque", "Instrument Sans", system-ui,
      sans-serif;
    font-size: 14px;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-align: right;
  }

  @media (max-width: 1023px) {
    .event-slide {
      grid-template-columns: 1fr;
    }
    .slide-image {
      aspect-ratio: 16 / 9;
    }
    .slider-foot {
      position: static;
      justify-content: flex-end;
      padding: 0 26px 26px;
    }
  }

  @media (max-width: 600px) {
    .events-head {
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .events-eyebrow {
      margin-bottom: 12px;
    }
    .events-title {
      font-size: clamp(34px, 11vw, 48px);
    }
    .carousel-shell {
      border-radius: 16px;
    }
    .slide-content {
      gap: 12px;
      padding: 24px 20px;
    }
    .slide-desc {
      -webkit-line-clamp: 5;
      font-size: 14.5px;
    }
    .slide-cta {
      margin-top: 4px;
    }
    .slider-foot {
      padding: 0 20px 20px;
    }
    .nav-btn {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slide-image img,
    .events-all-link,
    .slide-cta,
    .nav-btn {
      transition-duration: 0.01ms !important;
    }
  }
`;

function padSlideNumber(value) {
  return String(value).padStart(2, "0");
}

function getManagedNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function getManagedWrapperProps(props) {
  const prefix = "eventsSlider";
  const sectionBgType = String(
    props?.[`${prefix}SectionBgType`] || "default",
  );
  const containerBgType = String(
    props?.[`${prefix}PageContainerBgType`] || "default",
  );
  const sectionBgImage = String(
    props?.[`${prefix}SectionBgImage`] || "",
  ).trim();
  const containerBgImage = String(
    props?.[`${prefix}PageContainerBgImage`] || "",
  ).trim();
  const sectionColorKey = String(
    props?.[`${prefix}SectionBgColorKey`] || "",
  ).trim();
  const containerColorKey = String(
    props?.[`${prefix}PageContainerBgColorKey`] || "",
  ).trim();

  return {
    sectionClassName:
      sectionBgType === "default"
        ? "defaultBackground events-slider-background"
        : "events-slider-background",
    sectionProps: {
      $managedBackgroundImage:
        sectionBgType === "image" ? sectionBgImage || undefined : undefined,
      $managedBackgroundColor:
        sectionBgType === "color" && sectionColorKey
          ? getColor(sectionColorKey)
          : undefined,
      $managedPaddingTop: getManagedNumber(
        props?.[`${prefix}SectionPaddingTop`],
      ),
      $managedPaddingBottom: getManagedNumber(
        props?.[`${prefix}SectionPaddingBottom`],
      ),
      $managedMarginTop: getManagedNumber(
        props?.[`${prefix}SectionMarginTop`],
      ),
      $managedMarginBottom: getManagedNumber(
        props?.[`${prefix}SectionMarginBottom`],
      ),
    },
    containerProps: {
      $managedBackgroundImage:
        containerBgType === "image"
          ? containerBgImage || undefined
          : undefined,
      $managedBackgroundColor:
        containerBgType === "color" && containerColorKey
          ? getColor(containerColorKey)
          : undefined,
      $managedPaddingTop: getManagedNumber(
        props?.[`${prefix}PageContainerPaddingTop`],
      ),
      $managedPaddingRight: getManagedNumber(
        props?.[`${prefix}PageContainerPaddingRight`],
      ),
      $managedPaddingBottom: getManagedNumber(
        props?.[`${prefix}PageContainerPaddingBottom`],
      ),
      $managedPaddingLeft: getManagedNumber(
        props?.[`${prefix}PageContainerPaddingLeft`],
      ),
      $managedMarginTop: getManagedNumber(
        props?.[`${prefix}PageContainerMarginTop`],
      ),
      $managedMarginBottom: getManagedNumber(
        props?.[`${prefix}PageContainerMarginBottom`],
      ),
    },
  };
}

export default function EventsSlider(props) {
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const subTitle = (props?.eventsSliderSubTitle ?? "Events")
    .toString()
    .trim();
  const mainTitle = (props?.eventsSliderMainTitle ?? "Save the date.")
    .toString()
    .trim();
  const usesLegacyDefaultTitles =
    subTitle.toLowerCase() === "upcoming" &&
    mainTitle.toLowerCase() === "events";
  const displaySubTitle = usesLegacyDefaultTitles ? "Events" : subTitle;
  const displayMainTitle = usesLegacyDefaultTitles ? "Save the date." : mainTitle;
  const titleEnabled = props?.eventsSliderTitleEnabled !== false;
  const subTitleEnabled = props?.eventsSliderSubTitleEnabled !== false;
  const limit = Math.min(
    20,
    Math.max(1, Number(props?.eventsSliderLimit) || 8),
  );
  const sort = props?.eventsSliderSort === "recent" ? "recent" : "upcoming";
  const subTitleColorKey = (props?.eventsSliderSubTitleColorKey ?? "")
    .toString()
    .trim();
  const mainTitleColorKey = (props?.eventsSliderMainTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : getColor("primary");
  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : getColor("black");
  const dateColorKey = (props?.eventsSliderDateColorKey ?? "")
    .toString()
    .trim();
  const descColorKey = (props?.eventsSliderDescColorKey ?? "")
    .toString()
    .trim();
  const arrowColorKey = (props?.eventsSliderArrowColorKey ?? "")
    .toString()
    .trim();
  const arrowBgColorKey = (props?.eventsSliderArrowBgColorKey ?? "")
    .toString()
    .trim();
  const dotActiveColorKey = (props?.eventsSliderDotActiveColorKey ?? "")
    .toString()
    .trim();
  const buttonBgColorKey = (props?.eventsSliderButtonBgColorKey ?? "")
    .toString()
    .trim();
  const buttonTextColorKey = (props?.eventsSliderButtonTextColorKey ?? "")
    .toString()
    .trim();
  const buttonRadius =
    props?.eventsSliderButtonRadius != null
      ? Math.max(0, Number(props.eventsSliderButtonRadius))
      : 999;
  const buttonSize = (props?.eventsSliderButtonSize ?? "md").toString().trim();

  const autoplay = props?.eventsSliderAutoplay !== false;
  const showArrows = props?.eventsSliderShowArrows !== false;
  const showDots = props?.eventsSliderShowDots !== false;
  const infinite = props?.eventsSliderInfinite !== false;
  const autoplaySpeed =
    props?.eventsSliderAutoplaySpeed != null
      ? Math.max(1000, Number(props.eventsSliderAutoplaySpeed))
      : 6000;
  const speed =
    props?.eventsSliderSpeed != null
      ? Math.max(200, Number(props.eventsSliderSpeed))
      : 750;

  const dateColor = dateColorKey ? getColor(dateColorKey) : null;
  const descColor = descColorKey ? getColor(descColorKey) : null;
  const arrowColor = arrowColorKey ? getColor(arrowColorKey) : null;
  const arrowBgColor = arrowBgColorKey ? getColor(arrowBgColorKey) : null;
  const dotActiveColor = dotActiveColorKey ? getColor(dotActiveColorKey) : null;
  const buttonBg = buttonBgColorKey ? getColor(buttonBgColorKey) : null;
  const buttonText = buttonTextColorKey ? getColor(buttonTextColorKey) : null;
  const { sectionClassName, sectionProps, containerProps } =
    getManagedWrapperProps(props);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  usePageReadyTask(loading, "events-slider");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(mediaQuery.matches);
    syncMotionPreference();
    mediaQuery.addEventListener?.("change", syncMotionPreference);
    return () =>
      mediaQuery.removeEventListener?.("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let initialRequest = true;

    const loadFeaturedEvents = async () => {
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          sort,
          featured: "true",
        });
        const res = await fetch(`/api/events?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Featured events could not be loaded.");
        const data = await res.json();
        if (!cancelled) {
          const nextItems = Array.isArray(data.items) ? data.items : [];
          setItems(nextItems);
          setCurrentSlide((current) =>
            current < nextItems.length ? current : 0,
          );
        }
      } catch {
        if (!cancelled && initialRequest) setItems([]);
      } finally {
        if (!cancelled && initialRequest) {
          initialRequest = false;
          setLoading(false);
        }
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadFeaturedEvents();
    };

    loadFeaturedEvents();
    window.addEventListener("focus", loadFeaturedEvents);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadFeaturedEvents);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [limit, sort]);

  if (loading) {
    return null;
  }

  if (!items.length) return null;

  const btnPadding =
    buttonSize === "sm"
      ? "10px 20px"
      : buttonSize === "lg"
        ? "16px 32px"
        : "13px 26px";
  const btnFontSize = buttonSize === "sm" ? 14 : buttonSize === "lg" ? 16 : 15;

  return (
    <FullWidthBackground className={sectionClassName} {...sectionProps}>
      <PageContainer className="events-slider-container" {...containerProps}>
        <SliderWrapper
          style={{
            ...(subTitleColor ? { "--events-eyebrow": subTitleColor } : {}),
            ...(mainTitleColor ? { "--events-heading": mainTitleColor } : {}),
            ...(dateColor ? { "--events-date": dateColor } : {}),
            ...(descColor ? { "--events-description": descColor } : {}),
            ...(arrowColor ? { "--events-arrow-color": arrowColor } : {}),
            ...(arrowBgColor ? { "--events-arrow-bg": arrowBgColor } : {}),
            ...(dotActiveColor
              ? { "--events-count": dotActiveColor }
              : {}),
            ...(buttonBg ? { "--events-cta-bg": buttonBg } : {}),
            ...(buttonText ? { "--events-cta-text": buttonText } : {}),
            ...(Number.isFinite(buttonRadius)
              ? { "--events-cta-radius": `${buttonRadius}px` }
              : {}),
          }}
        >
          <div className="events-head">
            <div>
              {subTitleEnabled && displaySubTitle ? (
                <p className="events-eyebrow">{displaySubTitle}</p>
              ) : null}
              {titleEnabled && displayMainTitle ? (
                <h2 className="events-title">{displayMainTitle}</h2>
              ) : null}
            </div>
            <Link href="/events" className="events-all-link">
              All events <RightOutlined aria-hidden="true" />
            </Link>
          </div>

          <div
            className="carousel-shell"
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured events"
          >
            <Carousel
              ref={carouselRef}
              dots={false}
              infinite={infinite && items.length > 1}
              autoplay={autoplay && !reduceMotion && items.length > 1}
              autoplaySpeed={autoplaySpeed}
              speed={reduceMotion ? 0 : speed}
              draggable={items.length > 1}
              pauseOnHover
              afterChange={(idx) => setCurrentSlide(idx)}
            >
              {items.map((ev) => {
                const { desktop, mobile } = getEventImageSources(ev);
                const href = `/events/${ev.slug}`;
                const dateLabel = formatEventDateRange(
                  ev?.startDate,
                  ev?.endDate,
                );
                const location = formatLocationLine(ev);
                const desc = (ev?.description ?? "").toString().trim();
                return (
                  <div className="slide-frame" key={ev._id || ev.slug}>
                    <article className="event-slide">
                      <div className="slide-image">
                        {desktop || mobile ? (
                          <MediaImage
                            src={desktop || mobile}
                            mobileSrc={mobile || ""}
                            alt={ev.title || "Event"}
                            width={1280}
                            height={720}
                            sizes="(max-width: 1023px) 90vw, 54vw"
                            imgStyle={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <span className="image-placeholder">
                            Image unavailable
                          </span>
                        )}
                      </div>
                      <div className="slide-content">
                        {dateLabel ? (
                          <p className="slide-date">{dateLabel}</p>
                        ) : null}
                        <h3 className="slide-title">
                          <Link href={href}>{ev.title}</Link>
                        </h3>
                        {location ? (
                          <p className="slide-location">
                            <EnvironmentOutlined aria-hidden="true" />
                            <span>{location}</span>
                          </p>
                        ) : null}
                        {desc ? <p className="slide-desc">{desc}</p> : null}
                        <Link
                          href={href}
                          className="slide-cta"
                          style={{
                            borderRadius: Number.isFinite(buttonRadius)
                              ? buttonRadius
                              : 999,
                            padding: btnPadding,
                            fontSize: btnFontSize,
                          }}
                        >
                          View Details
                        </Link>
                      </div>
                    </article>
                  </div>
                );
              })}
            </Carousel>

            {(showDots || (items.length > 1 && showArrows)) && (
              <div className="slider-foot">
                {showDots ? (
                  <span className="slider-count" aria-live="polite">
                    {padSlideNumber(currentSlide + 1)} / {padSlideNumber(items.length)}
                  </span>
                ) : null}
                {items.length > 1 && showArrows ? (
                  <div className="slider-nav">
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={() => carouselRef.current?.prev()}
                    aria-label="Previous event"
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={() => carouselRef.current?.next()}
                    aria-label="Next event"
                  >
                    <RightOutlined />
                  </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </SliderWrapper>
        </PageContainer>
    </FullWidthBackground>
  );
}
