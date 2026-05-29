"use client";

import { Row, Col, Card } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  ThemeButton,
} from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";
import styled from "styled-components";

const InfoStatsShell = styled.div`
  .isg-title-main-col {
    min-width: 0;
  }

  .isg-title-main-col h1 {
    margin-bottom: 8px;
  }

  .isg-title-main-col h2 {
    margin-bottom: 0;
  }

  .isg-title-cta-col {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
  }

  .isg-title-cta-col .ant-btn {
    min-height: 44px;
  }

  @media (max-width: 991px) and (min-width: 768px) {
    .isg-title-cta-col {
      justify-content: flex-end;
      margin-top: 0;
      margin-bottom: 0;
      align-items: flex-end;
    }

    .isg-title-cta-col .ant-btn {
      min-height: 42px;
      padding: 8px 18px;
      font-size: 15px;
    }
  }

  @media (max-width: 767px) {
    .isg-title-main-col {
      margin-bottom: 12px;
    }

    .isg-title-cta-col {
      margin-top: 0;
      margin-bottom: 12px;
      justify-content: flex-start;
    }

    .isg-title-cta-col .ant-btn {
      min-height: 40px;
      padding: 7px 16px;
      font-size: 14px;
    }
  }

  @media (min-width: 992px) {
    .isg-title-cta-col {
      align-items: center;
    }

    .isg-title-cta-col .ant-btn {
      margin-top: 2px;
    }
  }
`;

const InfoStatsButton = styled(ThemeButton)`
  && {
    background: var(--isg-title-btn-bg) !important;
    color: var(--isg-title-btn-text) !important;
  }

  &&:hover,
  &&:active,
  &&:focus {
    background: var(--isg-title-btn-hover-bg) !important;
    color: var(--isg-title-btn-hover-text) !important;
  }
`;

const InfoCards = styled(Card)`
  && {
    width: 100%;
    position: relative;
    background: var(--isg-card-bg, rgba(31, 62, 72, 0.5)) !important;
    border: 1px solid var(--isg-card-border, rgba(255, 255, 255, 0.1)) !important;
    border-radius: 20px !important;
    overflow: hidden;
  }

  && .ant-card-body {
    background: transparent !important;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .leftData {
    flex: 1;
    min-width: 0;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 400;
    color: var(--isg-card-text, #fff);
    word-break: break-word;
  }

  .rightData {
    flex: 0 0 auto;
    max-width: 48%;
    text-align: end;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 400;
    color: var(--isg-card-footer, #fff);
    word-break: break-word;
  }

  @media (max-width: 767px) {
    .ant-card-body {
      flex-direction: column;
      align-items: flex-start;
    }

    .rightData {
      max-width: 100%;
      text-align: left;
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

function isLikelyUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("/") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:")
  );
}

function normalizeItem(it = {}) {
  const description =
    it?.description != null
      ? String(it.description).trim()
      : it?.leftData != null
        ? String(it.leftData).trim()
        : it?.title != null
          ? String(it.title).trim()
          : "";
  const legacyLink = it?.link != null ? String(it.link).trim() : "";
  const bottomText =
    it?.bottomText != null
      ? String(it.bottomText).trim()
      : it?.rightData != null
        ? String(it.rightData).trim()
        : it?.linkText != null
          ? String(it.linkText).trim()
          : legacyLink && !isLikelyUrl(legacyLink)
            ? legacyLink
            : "";
  return {
    description,
    bottomText,
  };
}

/**
 * Site component: InfoStatsGrid.
 * Content managed via drawer: title/subtitle, button, and text cards.
 */
export default function InfoStatsGrid(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleButtonText = (props?.infoStatsGridTitleButtonText ?? "")
    .toString()
    .trim();
  const titleButtonLink = ensureMailto(props?.infoStatsGridTitleButtonLink);
  const titleButtonTarget = normalizeTargetFromItem(
    {
      target: props?.infoStatsGridTitleButtonTarget,
      newTab: props?.infoStatsGridTitleButtonNewTab,
    },
    { targetKeys: ["target"], boolKeys: ["newTab"], fallback: "_self" },
  );

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

  const titleButtonBgColorKey = (
    props?.infoStatsGridTitleButtonBgColorKey ?? ""
  )
    .toString()
    .trim();
  const titleButtonTextColorKey = (
    props?.infoStatsGridTitleButtonTextColorKey ?? ""
  )
    .toString()
    .trim();
  const titleButtonHoverBgColorKey = (
    props?.infoStatsGridTitleButtonHoverBgColorKey ?? ""
  )
    .toString()
    .trim();
  const titleButtonHoverTextColorKey = (
    props?.infoStatsGridTitleButtonHoverTextColorKey ?? ""
  )
    .toString()
    .trim();
  const cardBgColorKey = (props?.infoStatsGridCardBgColorKey ?? "")
    .toString()
    .trim();
  const cardTextColorKey = (props?.infoStatsGridCardTextColorKey ?? "")
    .toString()
    .trim();
  const cardFooterColorKey = (props?.infoStatsGridCardFooterColorKey ?? "")
    .toString()
    .trim();
  const cardBorderColorKey = (props?.infoStatsGridCardBorderColorKey ?? "")
    .toString()
    .trim();

  const titleButtonBgColor = resolveThemeColorValue(
    titleButtonBgColorKey,
    "gradient",
  );
  const titleButtonTextColor = resolveThemeColorValue(
    titleButtonTextColorKey,
    "white",
  );
  const titleButtonHoverBgColor = resolveThemeColorValue(
    titleButtonHoverBgColorKey,
    "white",
  );
  const titleButtonHoverTextColor = resolveThemeColorValue(
    titleButtonHoverTextColorKey,
    "primary",
  );
  const cardBgColor =
    resolveThemeColorValue(cardBgColorKey, "") || "rgba(31, 62, 72, 0.5)";
  const cardTextColor = resolveThemeColorValue(cardTextColorKey, "white");
  const cardFooterColor =
    resolveThemeColorValue(cardFooterColorKey, "") ||
    cardTextColor ||
    getColor("white");
  const cardBorderColor =
    resolveThemeColorValue(cardBorderColorKey, "") ||
    "rgba(255, 255, 255, 0.1)";

  const rawItems = Array.isArray(props?.infoStatsGridItems)
    ? props.infoStatsGridItems
    : [];
  const items = rawItems
    .map(normalizeItem)
    .filter((item) => item.description || item.bottomText);

  const sectionBgType = (
    props?.infoStatsGridSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.infoStatsGridSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.infoStatsGridSectionBgColorKey ?? "")
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
    props?.infoStatsGridSectionPaddingTop != null
      ? Number(props.infoStatsGridSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.infoStatsGridSectionPaddingBottom != null
      ? Number(props.infoStatsGridSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.infoStatsGridSectionMarginTop != null
      ? Number(props.infoStatsGridSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.infoStatsGridSectionMarginBottom != null
      ? Number(props.infoStatsGridSectionMarginBottom)
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
    props?.infoStatsGridPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.infoStatsGridPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.infoStatsGridPageContainerBgColorKey ?? ""
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
    props?.infoStatsGridPageContainerPaddingTop != null
      ? Number(props.infoStatsGridPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.infoStatsGridPageContainerPaddingRight != null
      ? Number(props.infoStatsGridPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.infoStatsGridPageContainerPaddingBottom != null
      ? Number(props.infoStatsGridPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.infoStatsGridPageContainerPaddingLeft != null
      ? Number(props.infoStatsGridPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.infoStatsGridPageContainerMarginTop != null
      ? Number(props.infoStatsGridPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.infoStatsGridPageContainerMarginBottom != null
      ? Number(props.infoStatsGridPageContainerMarginBottom)
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

  const rootStyle = {
    "--isg-title-btn-bg": titleButtonBgColor || getColor("gradient"),
    "--isg-title-btn-text": titleButtonTextColor || getColor("white"),
    "--isg-title-btn-border": titleButtonTextColor || getColor("white"),
    "--isg-title-btn-hover-bg": titleButtonHoverBgColor || getColor("white"),
    "--isg-title-btn-hover-text":
      titleButtonHoverTextColor || getColor("primary"),
    "--isg-title-btn-hover-border":
      titleButtonHoverTextColor || getColor("primary"),
    "--isg-card-bg": cardBgColor,
    "--isg-card-text": cardTextColor || getColor("white"),
    "--isg-card-footer": cardFooterColor || getColor("white"),
    "--isg-card-border": cardBorderColor,
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <InfoStatsShell style={rootStyle}>
          {subTitle || mainTitle || titleButtonText ? (
            <Row gutter={[16, 16]} align="top" className="mb-4">
              <Col
                xs={24}
                md={16}
                lg={17}
                className="isg-title-main-col"
                style={{ textAlign: titleAlign }}
              >
                {mainTitle ? (
                  <MainTitle style={{ textAlign: titleAlign }}>
                    <span style={getTextPaintStyle(titleColor)}>
                      {mainTitle}
                    </span>
                  </MainTitle>
                ) : null}
                {subTitle ? (
                  <SubTitle style={{ textAlign: titleAlign }}>
                    <span style={getTextPaintStyle(subTitleColor)}>
                      {subTitle}
                    </span>
                  </SubTitle>
                ) : null}
              </Col>
              <Col xs={24} md={8} lg={7} className="isg-title-cta-col">
                {titleButtonText ? (
                  <InfoStatsButton
                    type="button"
                    size="large"
                    onClick={() => {
                      if (!titleButtonLink || titleButtonLink === "#") return;
                      if (titleButtonTarget === "_blank") {
                        window.open(
                          titleButtonLink,
                          "_blank",
                          "noopener,noreferrer",
                        );
                        return;
                      }
                      window.location.href = titleButtonLink;
                    }}
                  >
                    {titleButtonText}
                  </InfoStatsButton>
                ) : null}
              </Col>
            </Row>
          ) : null}
          <Row gutter={[16, 16]}>
            {items.map((item, idx) => (
              <Col
                span={24}
                sm={24}
                md={24}
                lg={12}
                key={`${item.description || item.bottomText}-${idx}`}
              >
                <InfoCards>
                  <div className="leftData">
                    <span style={getTextPaintStyle(cardTextColor)}>
                      {item.description}
                    </span>
                  </div>
                  <div className="rightData">
                    <span style={getTextPaintStyle(cardFooterColor)}>
                      {item.bottomText}
                    </span>
                  </div>
                </InfoCards>
              </Col>
            ))}
          </Row>
        </InfoStatsShell>
      </PageContainer>
    </FullWidthBackground>
  );
}
