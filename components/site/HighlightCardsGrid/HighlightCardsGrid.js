"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import styled, { css } from "styled-components";

const GridRoot = styled.div`
  .hcg-card-col {
    display: flex;
  }

  @media (max-width: 991px) {
    .hcg-card-col {
      display: block;
    }
  }
`;

const hoverEnabledCardStyles = css`
  transform-origin: 14% 18%;
  transition:
    transform 0.28s ease,
    background-color 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.24s ease;

  &:hover {
    z-index: 6;
    background-color: #ffffff;
    background-image: none;
    border-color: rgba(16, 49, 63, 0.22);
    transform: rotate(5deg) translateY(-10px);
    box-shadow: 0 14px 30px rgba(8, 35, 50, 0.22);
  }

  &:hover .smallTitle {
    color: #10313f;
  }

  &:hover .smallTitle span {
    color: #10313f !important;
    background: none !important;
    -webkit-text-fill-color: #10313f !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
  }

  &:hover .details {
    color: #4d6675;
  }

  &:hover .hcg-card-icon {
    color: rgba(16, 49, 63, 0.4);
    background: transparent;
  }

  &:hover .hcg-card-icon img {
    filter: brightness(0) saturate(100%) invert(18%) sepia(20%) saturate(769%)
      hue-rotate(151deg) brightness(92%) contrast(90%);
  }

  @media (max-width: 767px) {
    &:hover {
      transform: rotate(2deg) translateY(-4px);
    }
  }
`;

const HighLightCard = styled.article`
  width: 100%;
  position: relative;
  overflow: hidden;
  z-index: 1;
  min-height: clamp(160px, 28vw, 260px);
  height: 100%;
  border-radius: 30px;
  padding: 24px 24px 32px 24px;
  border: 1px solid var(--hcg-card-border);
  background-color: var(--hcg-card-bg);
  background-image:
    radial-gradient(
      120% 120% at 10% 115%,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0) 58%
    ),
    var(--hcg-card-bg);
  ${({ $hoverEnabled }) => ($hoverEnabled ? hoverEnabledCardStyles : css``)}

  @media (max-width: 1199px) {
    min-height: 320px;
    border-radius: 26px;
  }

  @media (max-width: 991px) {
    min-height: 300px;
    padding: 20px 20px 24px 20px;
  }

  @media (max-width: 767px) {
    min-height: 260px;
    padding: 18px 16px 20px 16px;
    border-radius: 18px;
  }

  &.hcg-style-2 .hcg-style-2-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &.hcg-style-2 .hcg-style-2-head .hcg-card-icon {
    margin-left: 12px;
    flex-shrink: 0;
  }

  &.hcg-style-2 .smallTitle {
    margin: 0px;
    font-size: clamp(30px, 2.1vw, 44px);
    line-height: 1;
    font-weight: 700;
    letter-spacing: -0.02em;
    flex: 1 1 auto;
    min-height: 0;
  }

  &.hcg-style-2 .smallTitle span {
    color: var(--hcg-metric-accent, #f5b53a) !important;
    background: none !important;
    -webkit-text-fill-color: var(--hcg-metric-accent, #f5b53a) !important;
  }

  &.hcg-style-2 .details {
    font-size: clamp(20px, 1.4vw, 28px);
    line-height: 1.22;
    color: #dcecff;
    margin: 0px;
  }

  &.hcg-style-2 {
    min-height: var(--hcg-new-card-height-desktop);
    height: var(--hcg-new-card-height-desktop);
    padding: 24px;
  }

  @media (max-width: 767px) {
    &.hcg-style-2 {
      min-height: var(--hcg-new-card-height-mobile);
      height: var(--hcg-new-card-height-mobile);
    }
  }
`;

const CardIconWrap = styled.div`
  margin-left: auto;
  width: var(--hcg-icon-size-desktop);
  height: var(--hcg-icon-size-desktop);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hcg-card-icon-color);
  background: transparent;
  img {
    width: var(--hcg-icon-size-desktop);
    height: var(--hcg-icon-size-desktop);
    object-fit: contain;
    display: block;
  }

  @media (max-width: 767px) {
    width: var(--hcg-icon-size-mobile);
    height: var(--hcg-icon-size-mobile);

    img {
      width: var(--hcg-icon-size-mobile);
      height: var(--hcg-icon-size-mobile);
    }
  }
`;

const CardTitle = styled.h3`
  margin: 16px 0px 24px 0px;
  font-size: clamp(20px, 1.325vw, 26px);
  line-height: 1.2;
  min-height: calc(1.2em * 2);
  letter-spacing: -0.01em;
  font-weight: 400;
  @media (max-width: 767px) {
    margin: 8px 0px;
    line-height: 1.25;
    min-height: calc(1.25em * 2);
  }
`;

const CardText = styled.p`
  color: var(--hcg-card-text);
  font-size: clamp(16px, 1vw, 16px);
  line-height: 1.28;
  font-weight: 400;
  letter-spacing: -0.01em;
  white-space: pre-line;
  overflow-wrap: anywhere;
  @media (max-width: 767px) {
    line-height: 1.34;
  }
`;
const BottomText = styled.div`
  width: 100vw;
  margin: clamp(20px, 3vw, 40px) 0 0 0;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  padding-inline: 0;
  color: var(--hcg-card-text);
  font-size: clamp(28px, 11.6vw, 220px);
  line-height: 0.9;
  font-weight: 600;
  letter-spacing: clamp(-0.5px, -0.16vw, -2px);
  white-space: nowrap;
  text-overflow: clip;
  text-align: center;

  @media (max-width: 991px) {
    font-size: clamp(24px, 11vw, 120px);
  }

  @media (max-width: 767px) {
    font-size: clamp(20px, 10.5vw, 64px);
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

function normalizeSolidColor(value, fallback) {
  if (!value) return fallback;
  if (isGradientColor(value)) return fallback;
  return value;
}

function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toPositiveNumber(value, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) return fallback;
  return next;
}

function toBool(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function normalizeCardDesign(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (
    raw === "style-2" ||
    raw === "style2" ||
    raw === "newdesign" ||
    raw === "new" ||
    raw === "metricaccent" ||
    raw === "metric"
  ) {
    return "style-2";
  }
  if (
    raw === "style-1" ||
    raw === "style1" ||
    raw === "standard" ||
    raw === "existing" ||
    raw === "minimal"
  ) {
    return "style-1";
  }
  return "style-1";
}

function normalizeCard(raw = {}) {
  return {
    title: toText(raw?.title, ""),
    description: toText(raw?.description || raw?.text || raw?.content, ""),
    iconUrl: toText(raw?.iconUrl || raw?.icon || raw?.image, ""),
    cardDesign: normalizeCardDesign(raw?.cardDesign ?? raw?.variant),
  };
}

function normalizeCards(rawCards) {
  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    return [];
  }
  return rawCards.map((card) => normalizeCard(card));
}

function DefaultCardIcon() {
  return (
    <svg
      width="58"
      height="58"
      viewBox="0 0 58 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="8"
        width="50"
        height="34"
        rx="9"
        stroke="currentColor"
        strokeWidth="4"
      />
      <circle cx="29" cy="25" r="6.5" stroke="currentColor" strokeWidth="4" />
      <circle cx="13" cy="25" r="2" fill="currentColor" />
      <circle cx="45" cy="25" r="2" fill="currentColor" />
      <rect
        x="10"
        y="46"
        width="38"
        height="4.5"
        rx="2.25"
        fill="currentColor"
      />
      <rect
        x="7"
        y="54"
        width="44"
        height="4.5"
        rx="2.25"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Site component: HighlightCardsGrid (Highlight Cards Grid).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Colors come from EditForm.
 */
export default function HighlightCardsGrid(props) {
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const hasMainTitle = Boolean(mainTitle);
  const hasSubTitle = Boolean(subTitle);
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
  const cardTitleColor = resolveThemeColorValue(
    props?.highlightCardsGridCardTitleColorKey,
    "",
  );
  const cardTextColor = resolveThemeColorValue(
    props?.highlightCardsGridCardTextColorKey,
    "",
  );
  const bottomText = toText(
    props?.highlightCardsGridBottomText ?? props?.bottomText,
    "",
  );
  const bottomTextColor =
    "linear-gradient(180deg, rgba(255,255,255,0.1) -47.14%, rgba(255,255,255,0) 154.29%)";

  const sectionBgType = (
    props?.highlightCardsGridSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.highlightCardsGridSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.highlightCardsGridSectionBgColorKey ?? "")
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
    props?.highlightCardsGridSectionPaddingTop != null
      ? Number(props.highlightCardsGridSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.highlightCardsGridSectionPaddingBottom != null
      ? Number(props.highlightCardsGridSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.highlightCardsGridSectionMarginTop != null
      ? Number(props.highlightCardsGridSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.highlightCardsGridSectionMarginBottom != null
      ? Number(props.highlightCardsGridSectionMarginBottom)
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
    props?.highlightCardsGridPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.highlightCardsGridPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.highlightCardsGridPageContainerBgColorKey ?? ""
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
    props?.highlightCardsGridPageContainerPaddingTop != null
      ? Number(props.highlightCardsGridPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.highlightCardsGridPageContainerPaddingRight != null
      ? Number(props.highlightCardsGridPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.highlightCardsGridPageContainerPaddingBottom != null
      ? Number(props.highlightCardsGridPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.highlightCardsGridPageContainerPaddingLeft != null
      ? Number(props.highlightCardsGridPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.highlightCardsGridPageContainerMarginTop != null
      ? Number(props.highlightCardsGridPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.highlightCardsGridPageContainerMarginBottom != null
      ? Number(props.highlightCardsGridPageContainerMarginBottom)
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

  const cards = normalizeCards(props?.highlightCardsGridCards ?? props?.cards);
  const cardDesign = normalizeCardDesign(
    props?.highlightCardsGridCardDesign ??
      props?.cardDesign ??
      cards?.[0]?.cardDesign,
  );
  const cardHoverEnabled = toBool(
    props?.highlightCardsGridEnableCardHover,
    true,
  );
  const iconSizeDesktop = toPositiveNumber(
    props?.highlightCardsGridIconSizeDesktop,
    60,
  );
  const iconSizeMobile = toPositiveNumber(
    props?.highlightCardsGridIconSizeMobile,
    Math.max(16, Math.round(iconSizeDesktop * 0.8)),
  );
  const style2CardHeightDesktop = toPositiveNumber(
    props?.highlightCardsGridStyle2CardHeightDesktop,
    220,
  );
  const style2CardHeightMobile = toPositiveNumber(
    props?.highlightCardsGridStyle2CardHeightMobile,
    Math.max(120, Math.round(style2CardHeightDesktop * 0.8)),
  );

  const rootStyle = {
    "--hcg-card-bg": "#045E82",
    "--hcg-card-border": "rgba(76, 171, 204, 0.35)",
    "--hcg-card-text": normalizeSolidColor(
      cardTextColor,
      "rgba(180, 220, 236, 0.95)",
    ),
    "--hcg-card-icon-color": "rgba(75, 173, 210, 0.7)",
    "--hcg-card-icon-bg": "rgba(10, 93, 128, 0.58)",
    "--hcg-icon-size-desktop": `${iconSizeDesktop}px`,
    "--hcg-icon-size-mobile": `${iconSizeMobile}px`,
    "--hcg-metric-accent": "#f5b53a",
    "--hcg-new-card-height-desktop": `${style2CardHeightDesktop}px`,
    "--hcg-new-card-height-mobile": `${style2CardHeightMobile}px`,
  };

  const renderCardIcon = (card) => (
    <CardIconWrap className="hcg-card-icon">
      {card.iconUrl ? (
        <img src={card.iconUrl} alt="" loading="lazy" />
      ) : (
        <DefaultCardIcon />
      )}
    </CardIconWrap>
  );

  const renderStyleOneCardContent = (card) => (
    <>
      {renderCardIcon(card)}
      {card.title ? (
        <CardTitle className="smallTitle">
          <span style={getTextPaintStyle(cardTitleColor || "#ffffff")}>
            {card.title}
          </span>
        </CardTitle>
      ) : null}
      {card.description ? (
        <CardText className="details">{card.description}</CardText>
      ) : null}
    </>
  );

  const renderStyleTwoCardContent = (card) => (
    <>
      <div className="hcg-style-2-head">
        {card.title ? (
          <CardTitle className="smallTitle">
            <span style={getTextPaintStyle(cardTitleColor || "#ffffff")}>
              {card.title}
            </span>
          </CardTitle>
        ) : (
          <span />
        )}
        {renderCardIcon(card)}
      </div>
      {card.description ? (
        <CardText className="details">{card.description}</CardText>
      ) : null}
    </>
  );

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle} className="pb-0">
        <GridRoot style={rootStyle}>
          {hasMainTitle || hasSubTitle ? (
            <Row gutter={[16, 16]}>
              <Col span={24} className="mb-4" style={{ textAlign: titleAlign }}>
                {hasSubTitle ? (
                  <SubTitle style={{ textAlign: titleAlign }}>
                    <span style={getTextPaintStyle(subTitleColor)}>
                      {subTitle}
                    </span>
                  </SubTitle>
                ) : null}
                {hasMainTitle ? (
                  <MainTitle style={{ textAlign: titleAlign }}>
                    <span style={getTextPaintStyle(titleColor)}>
                      {mainTitle}
                    </span>
                  </MainTitle>
                ) : null}
              </Col>
            </Row>
          ) : null}
          <Row gutter={[20, 20]}>
            {cards.map((card, index) => (
              <Col
                key={`hcg-card-${index}`}
                xs={24}
                sm={12}
                md={12}
                xl={6}
                className="hcg-card-col"
              >
                <HighLightCard
                  $hoverEnabled={cardHoverEnabled}
                  className={
                    cardDesign === "style-2" ? "hcg-style-2" : "hcg-style-1"
                  }
                >
                  {cardDesign === "style-2"
                    ? renderStyleTwoCardContent(card)
                    : renderStyleOneCardContent(card)}
                </HighLightCard>
              </Col>
            ))}
          </Row>
        </GridRoot>
      </PageContainer>
      {bottomText ? (
        <BottomText className="py-4" style={getTextPaintStyle(bottomTextColor)}>
          {bottomText}
        </BottomText>
      ) : null}
    </FullWidthBackground>
  );
}
