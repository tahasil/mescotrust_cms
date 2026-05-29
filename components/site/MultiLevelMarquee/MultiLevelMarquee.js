"use client";

import styled from "styled-components";
import ReactMarquee from "react-fast-marquee";
import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

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
  return String(value || "")
    .toLowerCase()
    .includes("gradient");
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
  };
}

function getBackgroundStyleFromThemeColor(rawKey) {
  const value = resolveThemeColorValue(rawKey);
  if (!value) return undefined;
  return { background: value };
}

const MultiLevelMarqueeSection = styled.section`
  width: 100%;
  position: relative;
  overflow: hidden;

  .mlm-title-wrap {
    margin-bottom: 22px;
  }

  .mlm-sub-title {
    margin-bottom: 8px;
  }

  .mlm-rows {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .mlm-row {
    overflow: hidden;
    position: relative;
  }

  .mlm-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mlm-logo-card {
    width: var(--mlm-logo-card-width, 130px);
    height: var(--mlm-logo-card-height, 70px);
    border-radius: 10px;
    background: ${getColor("white")};
    border: 1px solid rgba(0, 81, 111, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }

  .mlm-logo-card.is-transparent {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
  }

  .mlm-logo-card picture,
  .mlm-logo-card img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .mlm-logo-card img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    filter: grayscale(100%);
    mix-blend-mode: luminosity;
    transition: filter 0.3s ease;
  }

  .mlm-logo-card:hover img {
    filter: grayscale(0%);
  }

  .mlm-logo-skeleton {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background: linear-gradient(
      90deg,
      rgba(0, 81, 111, 0.08) 0%,
      rgba(0, 81, 111, 0.18) 45%,
      rgba(0, 81, 111, 0.08) 100%
    );
    background-size: 240px 100%;
    animation: mlmSkeletonShimmer 1.4s linear infinite;
  }

  @keyframes mlmSkeletonShimmer {
    0% {
      background-position: -240px 0;
    }
    100% {
      background-position: 240px 0;
    }
  }

  @media (max-width: 768px) {
    .mlm-title-wrap {
      margin-bottom: 16px;
    }

    .mlm-logo-card {
      width: var(--mlm-logo-card-width-mobile, 92px);
      height: var(--mlm-logo-card-height-mobile, 52px);
      padding: 8px;
    }
  }
`;

const SKELETON_COUNT = 8;

function toBool(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function toNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (typeof min === "number" && num < min) return min;
  if (typeof max === "number" && num > max) return max;
  return num;
}

function isLegacyAutoLogoUrl(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (!v) return false;
  return /partner-\d+(-mobile)?\.png$/.test(v);
}

function normalizeImageItem(item) {
  if (typeof item === "string") {
    const desktopRaw = item.trim();
    const desktop = isLegacyAutoLogoUrl(desktopRaw) ? "" : desktopRaw;
    return {
      desktop,
      mobile: "",
      alt: "Partner Logo",
      key: desktop || "partner",
    };
  }

  const desktop =
    item?.urlDesktop != null
      ? String(item.urlDesktop).trim()
      : item?.url != null
        ? String(item.url).trim()
        : item?.src != null
          ? String(item.src).trim()
          : "";
  const mobile =
    item?.urlMobile != null
      ? String(item.urlMobile).trim()
      : item?.mobileImage != null
        ? String(item.mobileImage).trim()
        : "";
  const desktopSafe = isLegacyAutoLogoUrl(desktop) ? "" : desktop;
  const mobileSafe = isLegacyAutoLogoUrl(mobile) ? "" : mobile;

  return {
    desktop: desktopSafe,
    mobile: mobileSafe,
    alt:
      item?.alt != null && String(item.alt).trim()
        ? String(item.alt).trim()
        : "Partner Logo",
    key: desktopSafe || mobileSafe || "partner",
  };
}

function normalizeRowItems(rawItems, fallbackItems = []) {
  const source =
    Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : fallbackItems;
  return source
    .map(normalizeImageItem)
    .filter((it) => Boolean(it.desktop || it.mobile));
}

function normalizeMarqueeConfig(raw = {}, fallbackDirection = "right") {
  return {
    enabled: toBool(raw?.enabled, true),
    direction:
      String(raw?.direction ?? fallbackDirection).toLowerCase() === "right"
        ? "right"
        : "left",
    speed: toNumber(raw?.speed, 30, 1, 200),
    pauseOnHover: toBool(raw?.pauseOnHover, true),
    gradient: toBool(raw?.gradient, false),
    gap: toNumber(raw?.gap, 16, 0, 120),
    items: normalizeRowItems(raw?.items, []),
  };
}

/**
 * Site component: MultiLevelMarquee (Multi Level Marquee).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Colors come from EditForm.
 */
export default function MultiLevelMarquee(props) {
  const mainTitle = (props?.mainTitle ?? "Ecosystem Partners")
    .toString()
    .trim();
  const subTitle = (props?.subTitle ?? props?.subtitle ?? "").toString().trim();
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
  const titleColorKey = (props?.titleColorKey ?? "")
    .toString()
    .trim();
  const titleColor = resolveThemeColorValue(titleColorKey, "primary");
  const subTitleColorKey = (props?.subTitleColorKey ?? "").toString().trim();
  const subTitleColor = resolveThemeColorValue(subTitleColorKey, "black");
  const logoCardTypeRaw = (props?.logoCardType ?? "box")
    .toString()
    .trim()
    .toLowerCase();
  const logoCardType =
    logoCardTypeRaw === "transparent" ? "transparent" : "box";
  const logoCardWidth = toNumber(props?.logoCardWidth, 130, 40, 800);
  const logoCardHeight = toNumber(props?.logoCardHeight, 70, 40, 800);
  const logoCardWidthMobile = Math.max(60, Math.round(logoCardWidth * 0.72));
  const logoCardHeightMobile = Math.max(40, Math.round(logoCardHeight * 0.72));
  const configuredMarquees = Array.isArray(props?.marquees)
    ? props.marquees.map((row, idx) =>
        normalizeMarqueeConfig(row, idx === 1 ? "left" : "right"),
      )
    : [];
  const sourceMarquees = configuredMarquees;
  const filteredMarquees = sourceMarquees.filter(
    (row) => row.enabled !== false,
  );
  const rowsToRender =
    sourceMarquees.length > 0
      ? filteredMarquees
      : [normalizeMarqueeConfig({ items: [] }, "right")];

  const sectionBgType = (
    props?.multiLevelMarqueeSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.multiLevelMarqueeSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.multiLevelMarqueeSectionBgColorKey ?? "")
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
    props?.multiLevelMarqueeSectionPaddingTop != null
      ? Number(props.multiLevelMarqueeSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.multiLevelMarqueeSectionPaddingBottom != null
      ? Number(props.multiLevelMarqueeSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.multiLevelMarqueeSectionMarginTop != null
      ? Number(props.multiLevelMarqueeSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.multiLevelMarqueeSectionMarginBottom != null
      ? Number(props.multiLevelMarqueeSectionMarginBottom)
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
    props?.multiLevelMarqueePageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.multiLevelMarqueePageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.multiLevelMarqueePageContainerBgColorKey ?? ""
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
    props?.multiLevelMarqueePageContainerPaddingTop != null
      ? Number(props.multiLevelMarqueePageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.multiLevelMarqueePageContainerPaddingRight != null
      ? Number(props.multiLevelMarqueePageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.multiLevelMarqueePageContainerPaddingBottom != null
      ? Number(props.multiLevelMarqueePageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.multiLevelMarqueePageContainerPaddingLeft != null
      ? Number(props.multiLevelMarqueePageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.multiLevelMarqueePageContainerMarginTop != null
      ? Number(props.multiLevelMarqueePageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.multiLevelMarqueePageContainerMarginBottom != null
      ? Number(props.multiLevelMarqueePageContainerMarginBottom)
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
      <PageContainer className="px-0 w-100 mw-100" style={pageContainerBgStyle}>
        <MultiLevelMarqueeSection
          style={{
            "--mlm-logo-card-width": `${logoCardWidth}px`,
            "--mlm-logo-card-height": `${logoCardHeight}px`,
            "--mlm-logo-card-width-mobile": `${logoCardWidthMobile}px`,
            "--mlm-logo-card-height-mobile": `${logoCardHeightMobile}px`,
          }}
        >
          <Row gutter={[16, 16]}>
            <Col
              span={24}
              className="mlm-title-wrap"
              style={{ textAlign: titleAlign }}
            >
              {subTitle ? (
                <SubTitle
                  className="mlm-sub-title"
                  style={{
                    textAlign: titleAlign,
                    ...(getTextPaintStyle(subTitleColor) || {}),
                  }}
                >
                  {subTitle}
                </SubTitle>
              ) : null}
              {mainTitle ? (
                <MainTitle
                  className="mb-4"
                  style={{
                    textAlign: titleAlign,
                    ...(getTextPaintStyle(titleColor) || {}),
                  }}
                >
                  {mainTitle}
                </MainTitle>
              ) : null}
            </Col>
          </Row>

          <div className="mlm-rows">
            {rowsToRender.map((row, rowIndex) => {
              const rowKey = `marquee-${rowIndex + 1}`;
              const rowHasLogos =
                Array.isArray(row.items) && row.items.length > 0;
              return (
                <div key={rowKey} className="mlm-row">
                  <ReactMarquee
                    loop={0}
                    speed={row.speed}
                    direction={row.direction}
                    pauseOnHover={row.pauseOnHover}
                    gradient={row.gradient}
                    autoFill
                  >
                    {rowHasLogos
                      ? row.items.map((item, idx) => {
                          const desktop = item.desktop || item.mobile;
                          if (!desktop) return null;
                          return (
                            <div
                              key={`${rowKey}-${idx}-${item.key}`}
                              className="mlm-item"
                              style={{ marginRight: `${row.gap}px` }}
                            >
                              <div
                                className={`mlm-logo-card${
                                  logoCardType === "transparent"
                                    ? " is-transparent"
                                    : ""
                                }`}
                              >
                                <picture>
                                  {item.mobile ? (
                                    <source
                                      media="(max-width: 767px)"
                                      srcSet={item.mobile}
                                    />
                                  ) : null}
                                  <img
                                    src={desktop}
                                    alt={item.alt}
                                    loading="lazy"
                                  />
                                </picture>
                              </div>
                            </div>
                          );
                        })
                      : Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                          <div
                            key={`${rowKey}-skeleton-${idx}`}
                            className="mlm-item"
                            style={{ marginRight: `${row.gap}px` }}
                          >
                            <div
                              className={`mlm-logo-card${
                                logoCardType === "transparent"
                                  ? " is-transparent"
                                  : ""
                              }`}
                              aria-hidden="true"
                            >
                              <div className="mlm-logo-skeleton" />
                            </div>
                          </div>
                        ))}
                  </ReactMarquee>
                </div>
              );
            })}
          </div>
        </MultiLevelMarqueeSection>
      </PageContainer>
    </FullWidthBackground>
  );
}
