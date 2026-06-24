"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Carousel, Col, Row, Spin } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  PageContainer,
  MainTitle,
  SubTitle,
  getColor,
} from "@/styles/Theme";
import {
  getEventImageSources,
  formatEventDayDate,
} from "@/components/events/eventDisplay";
import { parseMarginTopBottomString } from "@/lib/manageSectionFields";
import MediaImage from "@/components/shared/MediaImage";

const SliderWrapper = styled.div`
  .carousel-shell {
    position: relative;
    padding: 0 72px;
    @media (max-width: 1199px) {
      padding: 0 58px;
    }
    @media (max-width: 767px) {
      padding: 0;
    }
  }

  .slide-card {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    overflow: hidden;
    background: #1c1d1d;
    padding: 40px;
    @media (max-width: 991px) {
      padding: 32px;
      border-radius: 20px;
    }
    @media (max-width: 576px) {
      padding: 20px;
      border-radius: 16px;
    }
  }

  .slide-image {
    width: 100%;
    height: 380px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
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
    }
    @media (max-width: 991px) {
      height: 300px;
      border-radius: 12px;
    }
    @media (max-width: 576px) {
      height: 220px;
    }
  }

  .slide-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    @media (max-width: 991px) {
      margin-top: 16px;
    }
  }

  .slide-date {
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: rgba(0, 0, 0, 0.45);
    margin-bottom: 10px;
  }

  .slide-title {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.25;
    margin: 0 0 14px 0;
    color: #fff;
    @media (max-width: 576px) {
      font-size: 18px;
    }
  }

  .slide-desc {
    font-size: 15px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.75);
    margin: 0 0 22px 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    @media (max-width: 991px) {
      font-size: 14px;
      margin-bottom: 16px;
      -webkit-line-clamp: 5;
    }
  }

  .slide-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: var(--events-cta-radius, 999px);
    background: var(--events-cta-bg, var(--primary-color, #8b1a1a));
    color: var(--events-cta-text, #fff);
    font-weight: 700;
    text-decoration: none;
    width: fit-content;
  }

  .slider-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 3;
    @media (max-width: 767px) {
      display: none;
    }
  }

  .nav-btn {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: var(--events-arrow-bg, var(--primary-color, #d0322f));
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
    pointer-events: auto;
    color: var(--events-arrow-color, #fff);
    font-size: 14px;
    padding: 0;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
    flex-shrink: 0;
    &:hover {
      transform: scale(1.04);
      opacity: 0.92;
    }
    &:active {
      transform: scale(0.98);
    }
  }

  .dots-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
  }

  .slider-dots {
    display: flex;
    align-items: center;
    gap: 6px;
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 0;
      background: rgba(0, 0, 0, 0.12);
      cursor: pointer;
      padding: 0;
    }
    .dot.active {
      background: var(--events-dot-active, var(--primary-color, #8b1a1a));
    }
  }
`;

function buildBgStyles(props, prefix) {
  const sectionBgType = (props?.[`${prefix}SectionBgType`] ?? "default")
    .toString()
    .trim();
  const sectionBgImage = (props?.[`${prefix}SectionBgImage`] ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.[`${prefix}SectionBgColorKey`] ?? "")
    .toString()
    .trim();
  const sectionPadding = (props?.[`${prefix}SectionPadding`] ?? "")
    .toString()
    .trim();
  const sectionMargin = (props?.[`${prefix}SectionMargin`] ?? "")
    .toString()
    .trim();

  const containerBgType = (props?.[`${prefix}PageContainerBgType`] ?? "default")
    .toString()
    .trim();
  const containerBgImage = (props?.[`${prefix}PageContainerBgImage`] ?? "")
    .toString()
    .trim();
  const containerBgColorKey = (
    props?.[`${prefix}PageContainerBgColorKey`] ?? ""
  )
    .toString()
    .trim();
  const containerPadding = (props?.[`${prefix}PageContainerPadding`] ?? "")
    .toString()
    .trim();
  const containerMargin = (props?.[`${prefix}PageContainerMargin`] ?? "")
    .toString()
    .trim();

  const [sPT, sPB] = parseMarginTopBottomString(sectionPadding);
  const [sMT, sMB] = parseMarginTopBottomString(sectionMargin);
  const [cMT, cMB] = parseMarginTopBottomString(containerMargin);

  const sectionBgStyle =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { background: getColor(sectionBgColorKey) }
        : undefined;

  const sectionStyle = {
    ...(sectionBgStyle || {}),
    ...(sPT != null ? { paddingTop: `${sPT}px` } : {}),
    ...(sPB != null ? { paddingBottom: `${sPB}px` } : {}),
    ...(sMT != null ? { marginTop: `${sMT}px` } : {}),
    ...(sMB != null ? { marginBottom: `${sMB}px` } : {}),
  };

  const pageContainerBgStyle =
    containerBgType === "image" && containerBgImage
      ? {
          backgroundImage: `url(${containerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : containerBgType === "color" && containerBgColorKey
        ? { background: getColor(containerBgColorKey) }
        : undefined;

  const pageContainerStyle = {
    ...(pageContainerBgStyle || {}),
    ...(cMT != null ? { marginTop: `${cMT}px` } : {}),
    ...(cMB != null ? { marginBottom: `${cMB}px` } : {}),
  };

  return { sectionStyle, pageContainerStyle };
}

export default function EventsSlider(props) {
  const prefix = "eventsSlider";
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const subTitle = (props?.eventsSliderSubTitle ?? "Upcoming")
    .toString()
    .trim();
  const mainTitle = (props?.eventsSliderMainTitle ?? "Events")
    .toString()
    .trim();
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
    : getColor("black");
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

  const autoplay = props?.eventsSliderAutoplay === true;
  const showArrows = props?.eventsSliderShowArrows !== false;
  const showDots = props?.eventsSliderShowDots !== false;
  const infinite = props?.eventsSliderInfinite !== false;
  const autoplaySpeed =
    props?.eventsSliderAutoplaySpeed != null
      ? Math.max(1000, Number(props.eventsSliderAutoplaySpeed))
      : 5000;
  const speed =
    props?.eventsSliderSpeed != null
      ? Math.max(200, Number(props.eventsSliderSpeed))
      : 450;

  const dateColor = dateColorKey ? getColor(dateColorKey) : null;
  const descColor = descColorKey ? getColor(descColorKey) : null;
  const arrowColor = arrowColorKey ? getColor(arrowColorKey) : null;
  const arrowBgColor = arrowBgColorKey ? getColor(arrowBgColorKey) : null;
  const dotActiveColor = dotActiveColorKey ? getColor(dotActiveColorKey) : null;
  const buttonBg = buttonBgColorKey ? getColor(buttonBgColorKey) : null;
  const buttonText = buttonTextColorKey ? getColor(buttonTextColorKey) : null;

  const { sectionStyle, pageContainerStyle } = buildBgStyles(props, prefix);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events?limit=${limit}&sort=${sort}`, {
          cache: "no-store",
        });
        const data = res.ok ? await res.json() : {};
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit, sort]);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <Spin />
        </div>
      </PageContainer>
    );
  }

  if (!items.length) return null;

  const btnPadding =
    buttonSize === "sm"
      ? "8px 12px"
      : buttonSize === "lg"
        ? "12px 18px"
        : "10px 16px";
  const btnFontSize = buttonSize === "sm" ? 13 : buttonSize === "lg" ? 15 : 14;

  return (
    <FullWidthBackground
      style={Object.keys(sectionStyle).length ? sectionStyle : undefined}
    >
      <PageContainer
        style={
          Object.keys(pageContainerStyle).length
            ? pageContainerStyle
            : undefined
        }
      >
        <Row gutter={[16, 16]}>
          <Col
            span={{ span: 24, offset: 0 }}
            sm={{ span: 24, offset: 0 }}
            md={{ span: 10, offset: 7 }}
            lg={{ span: 10, offset: 7 }}
            className="mb-4 text-center"
          >
            {subTitleEnabled && subTitle ? (
              <SubTitle color={subTitleColor}>{subTitle}</SubTitle>
            ) : null}
            {titleEnabled && mainTitle ? (
              <MainTitle color={mainTitleColor}>{mainTitle}</MainTitle>
            ) : null}
          </Col>
        </Row>

        <SliderWrapper
          style={{
            ...(arrowColor ? { "--events-arrow-color": arrowColor } : {}),
            ...(arrowBgColor ? { "--events-arrow-bg": arrowBgColor } : {}),
            ...(dotActiveColor
              ? { "--events-dot-active": dotActiveColor }
              : {}),
            ...(buttonBg ? { "--events-cta-bg": buttonBg } : {}),
            ...(buttonText ? { "--events-cta-text": buttonText } : {}),
            ...(Number.isFinite(buttonRadius)
              ? { "--events-cta-radius": `${buttonRadius}px` }
              : {}),
          }}
        >
          <div className="px-1">
            <div className="carousel-shell">
              <Carousel
                ref={carouselRef}
                dots={false}
                infinite={infinite && items.length > 1}
                autoplay={autoplay}
                autoplaySpeed={autoplaySpeed}
                speed={speed}
                afterChange={(idx) => setCurrentSlide(idx)}
              >
                {items.map((ev) => {
                  const { desktop, mobile } = getEventImageSources(ev);
                  const href = `/events/${ev.slug}`;
                  const dateLabel = formatEventDayDate(
                    ev.startDate || ev.endDate,
                  );
                  const desc = (ev?.description ?? "").toString().trim();
                  return (
                    <div key={ev._id || ev.slug}>
                      <div className="slide-card">
                        <Row gutter={[32, 24]} align="stretch">
                          <Col xs={24} md={24} lg={10}>
                            <div className="slide-image">
                              {desktop || mobile ? (
                                <MediaImage
                                  src={desktop || mobile}
                                  mobileSrc={mobile || ""}
                                  alt={ev.title || "Event"}
                                  width={1280}
                                  height={720}
                                  sizes="(max-width: 992px) 100vw, 45vw"
                                  imgStyle={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    color: "rgba(0,0,0,0.25)",
                                    fontSize: 16,
                                    fontWeight: 600,
                                  }}
                                >
                                  IMAGE PLACEHOLDER
                                </span>
                              )}
                            </div>
                          </Col>
                          <Col xs={24} md={24} lg={14}>
                            <div className="slide-content">
                              {dateLabel ? (
                                <div
                                  className="slide-date"
                                  style={
                                    dateColor ? { color: dateColor } : undefined
                                  }
                                >
                                  {dateLabel}
                                </div>
                              ) : null}
                              <h2 className="slide-title">
                                <Link
                                  href={href}
                                  style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                  }}
                                >
                                  {ev.title}
                                </Link>
                              </h2>
                              {desc ? (
                                <p
                                  className="slide-desc"
                                  style={
                                    descColor ? { color: descColor } : undefined
                                  }
                                >
                                  {desc}
                                </p>
                              ) : null}
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
                          </Col>
                        </Row>
                      </div>
                    </div>
                  );
                })}
              </Carousel>
              {items.length > 1 && showArrows && (
                <div className="slider-nav">
                  <button
                    className="nav-btn"
                    onClick={() => carouselRef.current?.prev()}
                    aria-label="Previous"
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    className="nav-btn"
                    onClick={() => carouselRef.current?.next()}
                    aria-label="Next"
                  >
                    <RightOutlined />
                  </button>
                </div>
              )}
            </div>
          </div>

          {items.length > 1 && showDots && (
            <div className="dots-wrap">
              <div className="slider-dots" aria-label="Slides">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    className={`dot${idx === currentSlide ? " active" : ""}`}
                    onClick={() => carouselRef.current?.goTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </SliderWrapper>
      </PageContainer>
    </FullWidthBackground>
  );
}
