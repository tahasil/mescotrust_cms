"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
} from "@/styles/Theme";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import { Col, Row } from "antd";

/** Inner content wrapper (section + data-component come from ComponentRenderer) */
const ContentWrap = styled.div`
  padding: 40px 24px 60px;
  background: #fff;
  max-width: 1200px;
  margin: 0 auto;
  @media (max-width: 991px) {
    padding: 32px 20px 48px;
  }
  @media (max-width: 767px) {
    padding: 24px 16px 40px;
  }
`;

const Viewport = styled.div`
  width: 100%;
  overflow: hidden;
  cursor: ${(p) => (p.$draggable ? "grab" : "default")};
  &:active {
    cursor: ${(p) => (p.$draggable ? "grabbing" : "default")};
  }
`;

const Track = styled.div`
  display: flex;
  transition: transform ${(p) => (p.$speedMs ?? 400) / 1000}s ease;
  transform: ${(p) => `translateX(-${p.$offsetPercent}%)`};
  padding: 10px 0px;
`;

const Slide = styled.div`
  flex: 0 0 ${(p) => 100 / p.$perView}%;
  padding: 0 8px;
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  align-items: stretch;
  @media (max-width: 767px) {
    padding: 0 6px;
  }
`;

/** Card with L-shaped brackets in corners; fills slide so all cards in a row match height */
const Card = styled.div`
  background: #ffffff;
  border-radius: 44px;
  box-shadow: 0px 2px 12px rgba(31, 45, 61, 0.1);
  padding: 34px;
  text-align: left;
  min-height: 350px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  position: relative;
  flex: 1;
  min-height: 300px;
  @media (max-width: 768px) {
    border-radius: 24px;
    padding: 24px 20px 22px;
    min-height: 320px;
  }
`;

const Avatar = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: ${(p) => p.$bgColor || "#2f2a2a"};
  color: ${(p) => p.$textColor || "#fff"};
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Name = styled.div`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.15;
  color: ${(p) => p.$color || "#2F2A2A"};
  margin-bottom: ${(p) => (p.$hasRole ? 4 : 0)}px;
  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const Role = styled.div`
  font-size: 16px;
  line-height: 1.2;
  color: ${(p) => p.$color || "rgba(0,0,0,0.5)"};
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const QuoteText = styled.p`
  margin: 18px 0px 26px;
  font-size: 16px;
  line-height: 1.45;
  color: #2f2a2a;
  flex: 1;
  @media (max-width: 768px) {
    margin: 14px 0 20px;
    font-size: 15px;
  }
`;

const StarWrap = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 4px;
  .anticon {
    font-size: 22px;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: auto;
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const NavWrap = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  @media (max-width: 767px) {
    gap: 12px;
    margin-top: 20px;
  }
`;

const NavBtn = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid ${() => getColor("primary")};
  background: ${(p) => (p.$primary ? getColor("primary") : "#fff")};
  color: ${(p) => (p.$primary ? "#fff" : getColor("primary"))};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  .anticon {
    font-size: 18px;
  }
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @media (max-width: 767px) {
    width: 40px;
    height: 40px;
    .anticon {
      font-size: 16px;
    }
  }
`;

const DotsWrap = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  @media (max-width: 767px) {
    margin-top: 16px;
  }
`;

const Dot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  background: ${(p) => (p.$active ? getColor("primary") : "#d8d4de")};
  transition: background 0.2s;
  &:hover {
    background: ${(p) => (p.$active ? getColor("primary") : "#c0b8c8")};
  }
`;

function normalizeItem(it) {
  return {
    quote: it?.quote != null ? String(it.quote).trim() : "",
    name: it?.name != null ? String(it.name).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    rating: Math.min(5, Math.max(0, Number(it?.rating) || 0)),
  };
}

function getInitials(name) {
  const source = (name || "").trim();
  if (!source) return "T";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return (parts[0][0] || "T").toUpperCase();
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return `${first}${last}`.toUpperCase() || "T";
}

function getFirstLastName(name) {
  const source = (name || "").trim();
  if (!source) return "—";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function HalfStar({ color }) {
  return (
    <span
      style={{ display: "inline-block", width: "1em", position: "relative" }}
    >
      <span
        style={{
          overflow: "hidden",
          width: "50%",
          display: "inline-block",
          verticalAlign: "top",
        }}
      >
        <StarFilled style={{ color }} />
      </span>
      <span
        style={{
          overflow: "hidden",
          width: "50%",
          position: "absolute",
          left: "50%",
          top: 0,
          display: "inline-block",
        }}
      >
        <StarOutlined style={{ color, marginLeft: "-100%" }} />
      </span>
    </span>
  );
}

function StarRating({ rating, starColor }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  const color = starColor || getColor("primary");
  return (
    <StarWrap>
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= r) return <StarFilled key={i} style={{ color }} />;
        if (r >= i - 0.5) return <HalfStar key={i} color={color} />;
        return <StarOutlined key={i} style={{ color }} />;
      })}
    </StarWrap>
  );
}

/** Fallback when no testimonialsItems from theme/block props (e.g. right after "Add Component"). */
const DEFAULT_ITEMS = [
  {
    quote:
      "Ali's professionalism and dedication led our software project to success, delivering high-quality results on time and within budget. His expertise and reliability make him our top choice for any future tech/software needs.",
    name: "Tracye Lawyer",
    title: "",
    rating: 4,
  },
  {
    quote:
      "Ali's professionalism and dedication led our software project to success, delivering high-quality results on time and within budget. His expertise and reliability make him our top choice for any future tech/software needs.",
    name: "Tracye Lawyer",
    title: "",
    rating: 4,
  },
  {
    quote:
      "Ali's professionalism and dedication led our software project to success, delivering high-quality results on time and within budget. His expertise and reliability make him our top choice for any future tech/software needs.",
    name: "Tracye Lawyer",
    title: "",
    rating: 4,
  },
];

/** Breakpoints: mobile <768, tablet 768–991, desktop ≥992 */
const BREAKPOINT_SM = 768;
const BREAKPOINT_MD = 992;

function getPerViewFromWidth(width, slidesMobile, slidesTablet, slidesDesktop) {
  const m = Math.min(5, Math.max(1, Number(slidesMobile) || 1));
  const t = Math.min(5, Math.max(1, Number(slidesTablet) || 2));
  const d = Math.min(5, Math.max(1, Number(slidesDesktop) || 3));
  if (width < BREAKPOINT_SM) return m;
  if (width < BREAKPOINT_MD) return t;
  return d;
}

/**
 * Site component: Testimonials.
 * When used on a page (Page Builder), all props (settings + items) come from the page's block.props (pages collection).
 * Like CodePen Owl Carousel: responsive slides per view; auto-slide advances one-by-one.
 */
export default function Testimonials(props) {
  const raw = props?.testimonialsItems ?? props?.items;
  const items =
    Array.isArray(raw) && raw.length > 0
      ? raw.map(normalizeItem).filter((i) => i.quote || i.name)
      : DEFAULT_ITEMS;

  const title =
    (props?.testimonialsTitle ?? props?.title ?? "Testimonials")
      .toString()
      .trim() || "Testimonials";

  const titleEnabled = props?.testimonialsTitleEnabled !== false;
  const titleAlignRaw = (props?.testimonialsTitleAlign ?? "center")
    .toString()
    .trim()
    .toLowerCase();
  const titleAlign =
    titleAlignRaw === "left" || titleAlignRaw === "right"
      ? titleAlignRaw
      : "center";
  const titleColorKey = (props?.testimonialsTitleColorKey ?? "")
    .toString()
    .trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const nameColorKey = (props?.testimonialsNameColorKey ?? "")
    .toString()
    .trim();
  const nameColor = nameColorKey ? getColor(nameColorKey) : "#1e1e1e";
  const roleColorKey = (props?.testimonialsRoleColorKey ?? "")
    .toString()
    .trim();
  const roleColor = roleColorKey ? getColor(roleColorKey) : "rgba(0,0,0,0.5)";
  const ratingColorKey = (props?.testimonialsRatingColorKey ?? "")
    .toString()
    .trim();
  const ratingColor = ratingColorKey ? getColor(ratingColorKey) : "#d63a33";
  const avatarBgColorKey = (props?.testimonialsAvatarBgColorKey ?? "")
    .toString()
    .trim();
  const avatarBgColor = avatarBgColorKey ? getColor(avatarBgColorKey) : "#2f2a2a";
  const avatarTextColorKey = (props?.testimonialsAvatarTextColorKey ?? "")
    .toString()
    .trim();
  const avatarTextColor = avatarTextColorKey
    ? getColor(avatarTextColorKey)
    : "#ffffff";

  const sectionBgType = (
    props?.testimonialsSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.testimonialsSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.testimonialsSectionBgColorKey ?? "")
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
    props?.testimonialsSectionPaddingTop != null
      ? Number(props.testimonialsSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.testimonialsSectionPaddingBottom != null
      ? Number(props.testimonialsSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.testimonialsSectionMarginTop != null
      ? Number(props.testimonialsSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.testimonialsSectionMarginBottom != null
      ? Number(props.testimonialsSectionMarginBottom)
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
    props?.testimonialsPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.testimonialsPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.testimonialsPageContainerBgColorKey ?? ""
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
    props?.testimonialsPageContainerPaddingTop != null
      ? Number(props.testimonialsPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.testimonialsPageContainerPaddingRight != null
      ? Number(props.testimonialsPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.testimonialsPageContainerPaddingBottom != null
      ? Number(props.testimonialsPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.testimonialsPageContainerPaddingLeft != null
      ? Number(props.testimonialsPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.testimonialsPageContainerMarginTop != null
      ? Number(props.testimonialsPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.testimonialsPageContainerMarginBottom != null
      ? Number(props.testimonialsPageContainerMarginBottom)
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

  const autoplay = props?.testimonialsAutoplay === true;
  const autoplaySpeed = Math.max(
    1000,
    parseInt(props?.testimonialsAutoplaySpeed, 10) || 5000,
  );
  const showArrows = props?.testimonialsShowArrows !== false;
  const showDots = props?.testimonialsShowDots !== false;
  const draggable = props?.testimonialsDraggable === true;
  const infinite = props?.testimonialsInfinite !== false;
  const speedMs = Math.max(200, parseInt(props?.testimonialsSpeed, 10) || 400);
  const slidesDesktop = props?.testimonialsSlidesDesktop;
  const slidesTablet = props?.testimonialsSlidesTablet;
  const slidesMobile = props?.testimonialsSlidesMobile;

  const [perView, setPerView] = useState(3);
  useEffect(() => {
    const update = () =>
      setPerView(
        getPerViewFromWidth(
          window.innerWidth,
          slidesMobile,
          slidesTablet,
          slidesDesktop,
        ),
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [slidesMobile, slidesTablet, slidesDesktop]);

  const perViewClamped = Math.min(perView, items.length) || 1;
  const maxIndex = Math.max(0, items.length - perViewClamped);
  const [currentIndex, setCurrentIndex] = useState(0);
  const offsetPercent = currentIndex * (100 / perViewClamped);

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) =>
      infinite && i >= maxIndex ? 0 : Math.min(maxIndex, i + 1),
    );
  }, [infinite, maxIndex]);
  const goPrev = useCallback(() => {
    setCurrentIndex((i) =>
      infinite && i <= 0 ? maxIndex : Math.max(0, i - 1),
    );
  }, [infinite, maxIndex]);

  useEffect(() => {
    if (!autoplay || items.length <= perViewClamped) return;
    const t = setInterval(() => {
      setCurrentIndex((i) =>
        infinite && i >= maxIndex ? 0 : Math.min(maxIndex, i + 1),
      );
    }, autoplaySpeed);
    return () => clearInterval(t);
  }, [
    autoplay,
    autoplaySpeed,
    items.length,
    perViewClamped,
    maxIndex,
    infinite,
  ]);

  const dragStartX = useRef(0);
  const handleDragStart = useCallback(
    (e) => {
      if (!draggable || items.length <= perViewClamped) return;
      dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    },
    [draggable, items.length, perViewClamped],
  );
  const handleDragEnd = useCallback(
    (e) => {
      if (!draggable || items.length <= perViewClamped) return;
      const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const delta = dragStartX.current - endX;
      if (delta > 40) goNext();
      else if (delta < -40) goPrev();
    },
    [draggable, items.length, perViewClamped, goNext, goPrev],
  );
  const handleMouseDown = useCallback(
    (e) => {
      if (!draggable || items.length <= perViewClamped) return;
      dragStartX.current = e.clientX;
    },
    [draggable, items.length, perViewClamped],
  );
  const handleMouseUp = useCallback(
    (e) => {
      if (!draggable || items.length <= perViewClamped) return;
      const delta = dragStartX.current - e.clientX;
      if (delta > 40) goNext();
      else if (delta < -40) goPrev();
    },
    [draggable, items.length, perViewClamped, goNext, goPrev],
  );

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {titleEnabled && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4" style={{ textAlign: titleAlign }}>
              <MainTitle color={titleColor}>{title}</MainTitle>
            </Col>
          </Row>
        )}
        <Viewport
          $draggable={draggable}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <Track $offsetPercent={offsetPercent} $speedMs={speedMs}>
            {items.map((item, i) => (
              <Slide key={i} $perView={perViewClamped}>
                <Card>
                  <StarRating rating={item.rating} starColor={ratingColor} />
                  <QuoteText>{item.quote || "—"}</QuoteText>
                  <Footer>
                    <Avatar $bgColor={avatarBgColor} $textColor={avatarTextColor}>
                      {getInitials(item.name)}
                    </Avatar>
                    <AuthorInfo>
                      <Name $color={nameColor} $hasRole={!!item.title}>
                        {getFirstLastName(item.name)}
                      </Name>
                      {item.title ? (
                        <Role $color={roleColor}>{item.title}</Role>
                      ) : null}
                    </AuthorInfo>
                  </Footer>
                </Card>
              </Slide>
            ))}
          </Track>
        </Viewport>
        {items.length > perViewClamped && showArrows && (
          <NavWrap>
            <NavBtn
              $primary={false}
              onClick={goPrev}
              disabled={!infinite && currentIndex === 0}
              aria-label="Previous testimonials"
            >
              <LeftOutlined />
            </NavBtn>
            <NavBtn
              $primary
              onClick={goNext}
              disabled={!infinite && currentIndex >= maxIndex}
              aria-label="Next testimonials"
            >
              <RightOutlined />
            </NavBtn>
          </NavWrap>
        )}
        {items.length > perViewClamped && showDots && maxIndex >= 0 && (
          <DotsWrap>
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <Dot
                key={i}
                $active={i === currentIndex}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </DotsWrap>
        )}
      </PageContainer>
    </FullWidthBackground>
  );
}
