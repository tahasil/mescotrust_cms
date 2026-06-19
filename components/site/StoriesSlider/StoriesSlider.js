"use client";

import { useRef, useState } from "react";
import { Row, Col, Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

const REQUIRED_STORY_IMAGE_WIDTH = 375;
const REQUIRED_STORY_IMAGE_HEIGHT = 500;

/* ── Styled Components ── */
const SliderWrapper = styled.div`
  .slide-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 24px;
    overflow: hidden;
    background: #fff;
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
    aspect-ratio: 3 / 4;
    height: auto;
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
      border-radius: 12px;
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

  .slide-quote {
    font-size: 15px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.75);
    margin-bottom: 24px;
    @media (max-width: 991px) {
      font-size: 14px;
      margin-bottom: 16px;
    }
    @media (max-width: 576px) {
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 12px;
    }
  }

  .slide-divider {
    border: none;
    border-top: 2px dashed rgba(0, 0, 0, 0.12);
    margin: 0 0 16px 0;
    @media (max-width: 576px) {
      margin: 0 0 12px 0;
    }
  }

  .slide-name {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 4px;
    @media (max-width: 576px) {
      font-size: 16px;
    }
  }

  .slide-role {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.55);
    line-height: 1.4;
    @media (max-width: 576px) {
      font-size: 13px;
    }
  }

  .slider-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 32px;
    @media (max-width: 576px) {
      margin-top: 20px;
      gap: 8px;
    }
  }

  .nav-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--stories-arrow-color, rgba(0, 0, 0, 0.35));
    font-size: 16px;
    padding: 0;
    &:hover {
      color: var(--stories-arrow-color, rgba(0, 0, 0, 0.7));
      opacity: 0.8;
    }
  }

  .slider-dots {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 28px;
    height: 4px;
    border-radius: 2px;
    background: var(--stories-dot-inactive, rgba(0, 0, 0, 0.12));
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
    &.active {
      background: var(--stories-dot-active, rgba(0, 0, 0, 0.7));
      width: 36px;
    }
  }

  /* Hide default Ant carousel dots */
  .ant-carousel .slick-dots {
    display: none !important;
  }
`;

/**
 * Site component: StoriesSlider.
 * Carousel with image left + quote/name/role right.
 */
export default function StoriesSlider(props) {
  const carouselRef = useRef(null);

  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.storiesSliderTitleEnabled !== false;
  const subTitleEnabled = props?.storiesSliderSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.storiesSliderSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const nameColorKey = (props?.storiesSliderNameColorKey ?? "")
    .toString()
    .trim();
  const nameColor = nameColorKey ? getColor(nameColorKey) : getColor("primary");
  const quoteColorKey = (props?.storiesSliderQuoteColorKey ?? "")
    .toString()
    .trim();
  const quoteColor = quoteColorKey ? getColor(quoteColorKey) : undefined;
  const roleColorKey = (props?.storiesSliderRoleColorKey ?? "")
    .toString()
    .trim();
  const roleColor = roleColorKey ? getColor(roleColorKey) : undefined;
  const arrowColorKey = (props?.storiesSliderArrowColorKey ?? "")
    .toString()
    .trim();
  const arrowColor = arrowColorKey ? getColor(arrowColorKey) : undefined;
  const dotActiveColorKey = (props?.storiesSliderDotActiveColorKey ?? "")
    .toString()
    .trim();
  const dotActiveColor = dotActiveColorKey
    ? getColor(dotActiveColorKey)
    : undefined;

  /* ── Slider settings ── */
  const autoplay = props?.storiesSliderAutoplay === true;
  const showArrows = props?.storiesSliderShowArrows !== false;
  const showDots = props?.storiesSliderShowDots !== false;
  const infinite = props?.storiesSliderInfinite !== false;
  const autoplaySpeed =
    props?.storiesSliderAutoplaySpeed != null
      ? Number(props.storiesSliderAutoplaySpeed)
      : 5000;
  const speed =
    props?.storiesSliderSpeed != null ? Number(props.storiesSliderSpeed) : 400;

  /* ── Items ── */
  const items = Array.isArray(props?.storiesSliderItems)
    ? props.storiesSliderItems
    : [];

  /* ── Current slide for dots ── */
  const [currentSlide, setCurrentSlide] = useState(0);

  /* ── Section bg ── */
  const sectionBgType = (
    props?.storiesSliderSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.storiesSliderSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.storiesSliderSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.storiesSliderSectionPaddingTop != null
      ? Number(props.storiesSliderSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.storiesSliderSectionPaddingBottom != null
      ? Number(props.storiesSliderSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.storiesSliderSectionMarginTop != null
      ? Number(props.storiesSliderSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.storiesSliderSectionMarginBottom != null
      ? Number(props.storiesSliderSectionMarginBottom)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = (
    props?.storiesSliderPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.storiesSliderPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.storiesSliderPageContainerBgColorKey ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop =
    props?.storiesSliderPageContainerPaddingTop != null
      ? Number(props.storiesSliderPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.storiesSliderPageContainerPaddingRight != null
      ? Number(props.storiesSliderPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.storiesSliderPageContainerPaddingBottom != null
      ? Number(props.storiesSliderPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.storiesSliderPageContainerPaddingLeft != null
      ? Number(props.storiesSliderPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.storiesSliderPageContainerMarginTop != null
      ? Number(props.storiesSliderPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.storiesSliderPageContainerMarginBottom != null
      ? Number(props.storiesSliderPageContainerMarginBottom)
      : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle color={titleColor}>{mainTitle}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        {items.length > 0 && (
          <SliderWrapper
            style={{
              ...(arrowColor ? { "--stories-arrow-color": arrowColor } : {}),
              ...(dotActiveColor
                ? { "--stories-dot-active": dotActiveColor }
                : {}),
            }}
          >
            <Carousel
              ref={carouselRef}
              dots={false}
              infinite={infinite && items.length > 1}
              autoplay={autoplay}
              autoplaySpeed={autoplaySpeed}
              speed={speed}
              afterChange={(idx) => setCurrentSlide(idx)}
            >
              {items.map((item, idx) => {
                const quote = (item?.quote ?? "").toString().trim();
                const name = (item?.name ?? "").toString().trim();
                const role = (item?.role ?? "").toString().trim();
                const image = (item?.image ?? "").toString().trim();
                const mobileImage = (item?.mobileImage ?? "").toString().trim();
                const hasImage = image || mobileImage;
                return (
                  <div key={idx}>
                    <div className="slide-card">
                      <Row gutter={[32, 24]} align="stretch">
                        <Col xs={24} md={24} lg={10}>
                          <div className="slide-image">
                            {hasImage ? (
                              <picture>
                                {mobileImage && (
                                  <source
                                    media="(max-width: 767px)"
                                    srcSet={mobileImage}
                                  />
                                )}
                                <img loading="lazy"
                                  src={image || mobileImage}
                                  alt={name || "Story"}
                                  width={REQUIRED_STORY_IMAGE_WIDTH}
                                  height={REQUIRED_STORY_IMAGE_HEIGHT}
                                />
                              </picture>
                            ) : (
                              <span
                                style={{
                                  color: "rgba(0,0,0,0.25)",
                                  fontSize: 16,
                                  fontWeight: 500,
                                }}
                              >
                                IMAGE PLACEHOLDER
                              </span>
                            )}
                          </div>
                        </Col>
                        <Col xs={24} md={24} lg={14}>
                          <div className="slide-content">
                            {quote && (
                              <div
                                className="slide-quote"
                                style={
                                  quoteColor ? { color: quoteColor } : undefined
                                }
                              >
                                {quote}
                              </div>
                            )}
                            <hr className="slide-divider" />
                            {name && (
                              <div
                                className="slide-name"
                                style={{ color: nameColor }}
                              >
                                {name}
                              </div>
                            )}
                            {role && (
                              <div
                                className="slide-role"
                                style={
                                  roleColor ? { color: roleColor } : undefined
                                }
                              >
                                {role}
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                );
              })}
            </Carousel>

            {items.length > 1 && (showArrows || showDots) && (
              <div className="slider-nav">
                {showArrows && (
                  <button
                    className="nav-btn"
                    onClick={() => carouselRef.current?.prev()}
                  >
                    <LeftOutlined />
                  </button>
                )}
                {showDots && (
                  <div className="slider-dots">
                    {items.map((_, idx) => (
                      <button
                        key={idx}
                        className={`dot${idx === currentSlide ? " active" : ""}`}
                        onClick={() => carouselRef.current?.goTo(idx)}
                      />
                    ))}
                  </div>
                )}
                {showArrows && (
                  <button
                    className="nav-btn"
                    onClick={() => carouselRef.current?.next()}
                  >
                    <RightOutlined />
                  </button>
                )}
              </div>
            )}
          </SliderWrapper>
        )}
      </PageContainer>
    </FullWidthBackground>
  );
}
