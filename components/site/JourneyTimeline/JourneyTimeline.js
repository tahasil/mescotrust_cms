"use client";

import { CheckOutlined } from "@ant-design/icons";
import { Card, Col, Row } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  ThemeButton,
} from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

const TimelineShell = styled.div`
  .jt-title-main-col {
    min-width: 0;
  }

  .jt-title-main-col h1 {
    margin-bottom: 8px;
  }

  .jt-title-main-col h2 {
    margin-bottom: 0;
  }

  .jt-image-panel {
    border-radius: 22px;
    padding: 10px;
    border: 1px solid rgba(15, 47, 58, 0.1);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(245, 247, 249, 0.98) 100%
    );
  }

  .jt-image-panel picture,
  .jt-image-panel img {
    display: block;
    width: 100%;
  }

  .jt-image {
    border-radius: 14px;
    aspect-ratio: 16 / 10;
    object-fit: cover;
  }

  .jt-right-col {
    min-width: 0;
  }

  .jt-cards {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .jt-title-cta-col {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
  }

  .jt-title-cta-col .ant-btn {
    min-height: 44px;
  }

  @media (max-width: 1199px) {
    .jt-cards {
      gap: 14px;
    }

    .jt-image-panel {
      border-radius: 18px;
      padding: 8px;
    }

    .jt-image {
      border-radius: 12px;
      aspect-ratio: 4 / 3;
    }
  }

  @media (max-width: 991px) and (min-width: 768px) {
    .jt-title-cta-col {
      justify-content: flex-end;
      margin-top: 0;
      margin-bottom: 0;
      align-items: flex-end;
    }

    .jt-title-cta-col .ant-btn {
      min-height: 42px;
      padding: 8px 18px;
      font-size: 15px;
    }
  }

  @media (max-width: 767px) {
    .jt-cards {
      gap: 12px;
    }

    .jt-image-panel {
      border-radius: 14px;
      padding: 6px;
    }

    .jt-image {
      border-radius: 10px;
      aspect-ratio: 16 / 11;
    }

    .jt-title-main-col {
      margin-bottom: 12px;
    }

    .jt-title-cta-col {
      margin-top: 0;
      margin-bottom: 12px;
      justify-content: flex-start;
    }

    .jt-title-cta-col .ant-btn {
      min-height: 40px;
      padding: 7px 16px;
      font-size: 14px;
    }

    .jt-media-row .jt-right-col {
      margin-top: 12px;
    }
  }

  @media (min-width: 992px) {
    .jt-title-cta-col {
      align-items: center;
    }

    .jt-title-cta-col .ant-btn {
      margin-top: 2px;
    }

    .jt-right-col {
      padding-left: 4px;
    }
  }
`;
const TimelineCards = styled(Card)`
  margin: 0;
  border-radius: 20px !important;
  background: #f6f3f2 !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  padding: 10px !important;
  overflow: hidden;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;

  &:hover {
    transform: translateY(-1px);
  }
  .ant-card-head {
    border-radius: 20px 20px 0px 0px !important;
    background: #fff !important;
  }
  .ant-card-head-title {
    padding: 0;
    white-space: normal;
    font-size: clamp(16px, 1.15vw, 24px);
    font-weight: 500;
    line-height: 1.18;
    color: var(--jt-card-title);
    letter-spacing: -0.01em;
  }

  .ant-card-body {
    padding: 0px 24px 24px 24px !important;
    background: #fff;
    border-radius: 0px 0px 20px 20px !important;
  }

  .ant-card-body::before {
    content: "";
    display: block;
    width: 100%;
    border-top: 1px dashed #dfe5eb;
    margin: 0 0 14px;
  }

  @media (max-width: 767px) {
    border-radius: 16px;
    padding: 6px !important;

    .ant-card-head {
      padding: 12px 12px 6px;
    }

    .ant-card-head-title {
      font-size: 15px;
      line-height: 1.28;
    }

    .ant-card-body {
      padding: 0 12px 12px !important;
      border-radius: 0px 0px 14px 14px !important;
    }
  }
`;

const TimelineList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--jt-card-text);
    font-size: clamp(14px, 0.86vw, 17px);
    line-height: 1.45;
    font-weight: 400;
    word-break: break-word;
  }

  @media (max-width: 767px) {
    gap: 8px;

    li {
      font-size: 14px;
      line-height: 1.45;
      gap: 8px;
    }
  }
`;

const BulletIcon = styled.span`
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  font-size: 11px;
  color: var(--jt-bullet-icon-color);
  background: var(--jt-bullet-icon-bg);
  border: 1px solid rgba(245, 171, 53, 0.45);

  @media (max-width: 767px) {
    width: 16px;
    height: 16px;
    min-width: 16px;
    font-size: 10px;
    margin-top: 1px;
  }
`;

const BulletContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitleText = styled.span`
  color: var(--jt-card-title);
`;

const TagsWrap = styled.div`
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 767px) {
    gap: 6px;
    margin-top: 8px;
  }
`;

const TagPill = styled.span`
  font-size: 12px;
  line-height: 1.2;
  color: var(--jt-tag-text);
  background: var(--jt-tag-bg);
  border: 1px solid #e7ebf0;
  border-radius: 6px;
  padding: 5px 8px;

  @media (max-width: 767px) {
    font-size: 11px;
    padding: 4px 7px;
  }
`;

const JourneyApplyButton = styled(ThemeButton)`
  && {
    background: var(--jt-apply-btn-bg) !important;
    color: var(--jt-apply-btn-text) !important;
  }

  &&:hover,
  &&:active,
  &&:focus {
    background: var(--jt-apply-btn-hover-bg) !important;
    color: var(--jt-apply-btn-hover-text) !important;
  }

  @media (max-width: 991px) {
    && {
      box-shadow: 0 5px 14px rgba(251, 176, 64, 0.24) !important;
    }
  }

  @media (max-width: 767px) {
    && {
      box-shadow: 0 4px 12px rgba(251, 176, 64, 0.24) !important;
    }
  }
`;

function isDirectCssColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.startsWith("#") ||
    raw.startsWith("rgb(") ||
    raw.startsWith("rgba(") ||
    raw.startsWith("hsl(") ||
    raw.startsWith("hsla(") ||
    raw.startsWith("linear-gradient(") ||
    raw.startsWith("radial-gradient(") ||
    raw.startsWith("conic-gradient(") ||
    raw.startsWith("var(")
  );
}

function resolveThemeColorValue(rawKey, fallbackKey) {
  const key = String(rawKey || "").trim();
  if (!key) return fallbackKey ? getColor(fallbackKey) : undefined;
  if (isDirectCssColor(key)) return key;
  return getColor(key) || key;
}

function isGradientColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.includes("gradient") ||
    raw.startsWith("var(--theme-primary-gradient") ||
    raw.startsWith("var(--theme-secondary-gradient")
  );
}

function getTextPaintStyle(colorValue) {
  const value = String(colorValue || "").trim();
  if (!value) return undefined;
  if (!isGradientColor(value)) return { color: value };
  return {
    color: "transparent",
    background: value,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "inline-block",
  };
}

function getBackgroundStyleFromThemeColor(rawKey) {
  const value = resolveThemeColorValue(rawKey);
  if (!value) return undefined;
  return { background: value };
}

function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function normalizeStringArray(values = []) {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => (typeof item === "string" ? item : item?.text))
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function normalizeCard(raw = {}) {
  const title = toText(raw.title, "Timeline Card");
  const highlightText = toText(raw.highlightText || raw.duration, "");
  const bulletPoints = normalizeStringArray(
    raw.bulletPoints || raw.points || raw.list,
  );
  const tags = normalizeStringArray(raw.tags || []);

  return {
    title,
    highlightText,
    bulletPoints:
      bulletPoints.length > 0 ? bulletPoints : ["Add bullet text from drawer"],
    tags,
  };
}

const DEFAULT_CARDS = [
  {
    title: "Lorem Ipsum",
    bulletPoints: [
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
    ],
    tags: [],
  },
  {
    title: "Lorem Ipsum",
    bulletPoints: [
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
    ],
    tags: [
      "Product-Market Fit",
      "Business Model Review",
      "Financial Readiness",
    ],
  },
  {
    title: "Lorem Ipsum",
    bulletPoints: [
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
      "Lorem Ipsum is simply dummy",
    ],
    tags: [],
  },
];

function normalizeCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return DEFAULT_CARDS.map((item) => normalizeCard(item));
  }
  return cards.map((item) => normalizeCard(item));
}

/**
 * Site component: JourneyTimeline (Journey Timeline).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Colors come from EditForm.
 */
export default function JourneyTimeline(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleAlignRaw = (props?.titleAlign ?? "center")
    .toString()
    .trim()
    .toLowerCase();
  const titleAlign =
    titleAlignRaw === "left" ||
    titleAlignRaw === "right" ||
    titleAlignRaw === "center"
      ? titleAlignRaw
      : "center";
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = resolveThemeColorValue(titleColorKey, "primary");
  const subTitleColorKey = (props?.subTitleColorKey ?? "").toString().trim();
  const subTitleColor = resolveThemeColorValue(subTitleColorKey, "black");

  const sectionBgType = (
    props?.journeyTimelineSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.journeyTimelineSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.journeyTimelineSectionBgColorKey ?? "")
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
        ? getBackgroundStyleFromThemeColor(sectionBgColorKey)
        : undefined;
  const sectionPaddingTop =
    props?.journeyTimelineSectionPaddingTop != null
      ? Number(props.journeyTimelineSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.journeyTimelineSectionPaddingBottom != null
      ? Number(props.journeyTimelineSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.journeyTimelineSectionMarginTop != null
      ? Number(props.journeyTimelineSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.journeyTimelineSectionMarginBottom != null
      ? Number(props.journeyTimelineSectionMarginBottom)
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
    props?.journeyTimelinePageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.journeyTimelinePageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.journeyTimelinePageContainerBgColorKey ?? ""
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
        ? getBackgroundStyleFromThemeColor(pageContainerBgColorKey)
        : undefined;
  const containerPaddingTop =
    props?.journeyTimelinePageContainerPaddingTop != null
      ? Number(props.journeyTimelinePageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.journeyTimelinePageContainerPaddingRight != null
      ? Number(props.journeyTimelinePageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.journeyTimelinePageContainerPaddingBottom != null
      ? Number(props.journeyTimelinePageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.journeyTimelinePageContainerPaddingLeft != null
      ? Number(props.journeyTimelinePageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.journeyTimelinePageContainerMarginTop != null
      ? Number(props.journeyTimelinePageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.journeyTimelinePageContainerMarginBottom != null
      ? Number(props.journeyTimelinePageContainerMarginBottom)
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

  const desktopImage = toText(
    props?.journeyTimelineImageDesktop ??
      props?.journeyTimelineSectionImageDesktop,
    "",
  );
  const mobileImage = toText(
    props?.journeyTimelineImageMobile ??
      props?.journeyTimelineSectionImageMobile,
    "",
  );
  const imageAlt = toText(
    props?.journeyTimelineImageAlt ?? props?.journeyTimelineSectionImageAlt,
    "Journey timeline",
  );
  const desktopImageSrc =
    desktopImage || mobileImage || "/images/about-us-team.jpg";
  const mobileImageSrc = mobileImage || desktopImage || desktopImageSrc;
  const applyButtonText = toText(
    props?.journeyTimelineApplyButtonText ??
      props?.journeyTimelineSectionApplyButtonText,
    "Apply Now",
  );
  const applyButtonLink = toText(
    props?.journeyTimelineApplyButtonLink ??
      props?.journeyTimelineSectionApplyButtonLink,
    "#",
  );
  const applyButtonHref = ensureMailto(applyButtonLink);
  const applyButtonTarget = normalizeTargetFromItem(
    {
      target:
        props?.journeyTimelineApplyButtonTarget ??
        props?.journeyTimelineSectionApplyButtonTarget,
      newTab:
        props?.journeyTimelineApplyButtonNewTab ??
        props?.journeyTimelineSectionApplyButtonNewTab,
    },
    { targetKeys: ["target"], boolKeys: ["newTab"], fallback: "_self" },
  );

  const cards = normalizeCards(
    props?.journeyTimelineCards ?? props?.journeyTimelineSectionCards,
  );

  const cardTitleColor = resolveThemeColorValue(
    props?.journeyTimelineCardTitleColorKey,
    "primary",
  );
  const cardTextColor = resolveThemeColorValue(
    props?.journeyTimelineCardTextColorKey,
    "textPrimary",
  );
  const bulletIconColor = resolveThemeColorValue(
    props?.journeyTimelineBulletIconColorKey,
    "",
  );
  const bulletIconBgColor = resolveThemeColorValue(
    props?.journeyTimelineBulletIconBgColorKey,
    "",
  );
  const tagTextColor = resolveThemeColorValue(
    props?.journeyTimelineTagTextColorKey,
    "",
  );
  const tagBgColor = resolveThemeColorValue(
    props?.journeyTimelineTagBgColorKey,
    "",
  );
  const applyButtonBgColor = resolveThemeColorValue(
    props?.journeyTimelineApplyButtonBgColorKey,
    "gradient",
  );
  const applyButtonTextColor = resolveThemeColorValue(
    props?.journeyTimelineApplyButtonTextColorKey,
    "white",
  );
  const applyButtonHoverBgColor = resolveThemeColorValue(
    props?.journeyTimelineApplyButtonHoverBgColorKey,
    "white",
  );
  const applyButtonHoverTextColor = resolveThemeColorValue(
    props?.journeyTimelineApplyButtonHoverTextColorKey,
    "primary",
  );

  const rootStyle = {
    "--jt-card-title": cardTitleColor || getColor("primary"),
    "--jt-card-text": cardTextColor || getColor("textPrimary"),
    "--jt-bullet-icon-color":
      bulletIconColor || cardTitleColor || getColor("primary"),
    "--jt-bullet-icon-bg": bulletIconBgColor || "#fff4df",
    "--jt-tag-text": tagTextColor || "#5f6772",
    "--jt-tag-bg": tagBgColor || "#f4f6f8",
    "--jt-apply-btn-bg": applyButtonBgColor || getColor("gradient"),
    "--jt-apply-btn-text": applyButtonTextColor || getColor("white"),
    "--jt-apply-btn-border": applyButtonTextColor || getColor("white"),
    "--jt-apply-btn-hover-bg": applyButtonHoverBgColor || getColor("white"),
    "--jt-apply-btn-hover-text":
      applyButtonHoverTextColor || getColor("primary"),
    "--jt-apply-btn-hover-border":
      applyButtonHoverTextColor || getColor("primary"),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <TimelineShell style={rootStyle}>
          <Row gutter={[16, 16]} align="top" className="mb-4">
            <Col
              xs={24}
              md={16}
              lg={17}
              className="jt-title-main-col"
              style={{ textAlign: titleAlign }}
            >
              <MainTitle style={{ textAlign: titleAlign }}>
                <span style={getTextPaintStyle(titleColor)}>{mainTitle}</span>
              </MainTitle>
              <SubTitle style={{ textAlign: titleAlign }}>
                <span style={getTextPaintStyle(subTitleColor)}>{subTitle}</span>
              </SubTitle>
            </Col>
            <Col xs={24} md={8} lg={7} className="jt-title-cta-col">
              {applyButtonText ? (
                <JourneyApplyButton
                  type="button"
                  size="large"
                  onClick={() => {
                    if (!applyButtonHref || applyButtonHref === "#") return;
                    if (applyButtonTarget === "_blank") {
                      window.open(
                        applyButtonHref,
                        "_blank",
                        "noopener,noreferrer",
                      );
                      return;
                    }
                    window.location.href = applyButtonHref;
                  }}
                >
                  {applyButtonText}
                </JourneyApplyButton>
              ) : null}
            </Col>
          </Row>
          <Row gutter={[16, 0]} className="jt-media-row">
            <Col xs={24} lg={9}>
              <div className="jt-image-panel">
                <picture>
                  <source media="(max-width: 767px)" srcSet={mobileImageSrc} />
                  <img
                    className="jt-image"
                    src={desktopImageSrc}
                    alt={imageAlt}
                    loading="lazy"
                  />
                </picture>
              </div>
            </Col>
            <Col xs={24} lg={15} className="jt-right-col">
              <div className="jt-cards">
                {cards.map((card, cardIndex) => (
                  <TimelineCards
                    key={`${card.title}-${cardIndex}`}
                    title={
                      <CardTitleText>
                        <span style={getTextPaintStyle(cardTitleColor)}>
                          {card.highlightText
                            ? `${card.title} ${card.highlightText}`
                            : card.title}
                        </span>
                      </CardTitleText>
                    }
                  >
                    <TimelineList>
                      {card.bulletPoints.map((point, pointIndex) => (
                        <li key={`${card.title}-${pointIndex}`}>
                          <BulletIcon>
                            <CheckOutlined />
                          </BulletIcon>
                          <BulletContent>
                            <span>{point}</span>
                            {pointIndex === 0 && card.tags.length > 0 ? (
                              <TagsWrap>
                                {card.tags.map((tag, tagIndex) => (
                                  <TagPill
                                    key={`${card.title}-tag-${tagIndex}`}
                                  >
                                    {tag}
                                  </TagPill>
                                ))}
                              </TagsWrap>
                            ) : null}
                          </BulletContent>
                        </li>
                      ))}
                    </TimelineList>
                  </TimelineCards>
                ))}
              </div>
            </Col>
          </Row>
        </TimelineShell>
      </PageContainer>
    </FullWidthBackground>
  );
}
