"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  SubTitle,
  ThemeButton,
} from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

function isGradientColor(value) {
  return String(value || "")
    .toLowerCase()
    .includes("gradient");
}

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

const BannerShell = styled.section`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 24px;
  .cta-content,
  .cta-image-col {
    position: relative;
    z-index: 1;
  }

  .cta-content {
    text-align: ${(p) => p.$titleAlign || "left"};
  }

  .cta-subtitle {
    margin-bottom: 10px;
    font-size: clamp(13px, 1.1vw, 16px);
    line-height: 1.35;
    font-weight: 500;
  }

  .cta-title {
    margin: 10px 0 26px;
    font-size: clamp(16px, 1.8vw, 38px);
    line-height: 1.4;
    font-weight: 600;
    max-width: 600px;
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    line-height: 1;
    transition: all 0.3s ease;
  }

  .cta-button:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.85);
    outline-offset: 3px;
  }

  .cta-image-col {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .cta-right-image {
    width: min(100%, 260px);
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 4px 18px rgba(0, 0, 0, 0.2));
    opacity: 0.92;
  }

  @media (max-width: 991px) {
    border-radius: 18px;
    padding: 22px 18px;

    .cta-content {
      text-align: center;
      margin-top: -6px;
    }

    .cta-title {
      margin: 8px auto 14px;
      max-width: none;
    }

    .cta-image-col {
      justify-content: center;
      margin-top: 0;
      margin-bottom: -4px;
      line-height: 0;
    }

    .cta-right-image {
      width: min(42vw, 190px);
      display: block;
    }

    .cta-button {
      font-size: 16px;
      padding: 9px 18px;
    }
  }

  @media (max-width: 576px) {
    padding: 18px 14px;

    .cta-subtitle {
      margin-bottom: 6px;
    }

    .cta-title {
      margin: 6px auto 12px;
    }

    .cta-right-image {
      width: min(46vw, 165px);
    }

    .cta-button {
      font-size: 14px;
      padding: 8px 14px;
    }
  }
`;

const CtaGeneratedButton = styled(ThemeButton)`
  && {
    background: var(--cta-btn-bg) !important;
    color: var(--cta-btn-text) !important;
  }

  &&:hover,
  &&:active,
  &&:focus {
    background: var(--cta-btn-hover-bg) !important;
    color: var(--cta-btn-hover-text) !important;
  }
`;

/**
 * Site component: CallToActionBanner (Call To Action Banner).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Colors come from EditForm.
 */
export default function CallToActionBanner(props) {
  const mainTitle = (
    props?.mainTitle ??
    "If you would like to get involved, we will be happy to help."
  )
    .toString()
    .trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleAlignRaw = (props?.titleAlign ?? "left")
    .toString()
    .trim()
    .toLowerCase();
  const titleAlign =
    titleAlignRaw === "left" ||
    titleAlignRaw === "right" ||
    titleAlignRaw === "center"
      ? titleAlignRaw
      : "left";

  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = resolveThemeColorValue(titleColorKey, "white");
  const subTitleColorKey = (props?.subTitleColorKey ?? "").toString().trim();
  const subTitleColor =
    resolveThemeColorValue(subTitleColorKey, "white") ||
    "rgba(255,255,255,0.85)";

  const ctaButtonText = (props?.ctaButtonText ?? "Apply Now").toString().trim();
  const ctaButtonLink = ensureMailto(
    (props?.ctaButtonLink ?? "#").toString().trim(),
  );
  const ctaButtonTarget = normalizeTargetFromItem(
    {
      target: props?.ctaButtonTarget,
      newTab: props?.ctaButtonNewTab,
    },
    { targetKeys: ["target"], boolKeys: ["newTab"], fallback: "_self" },
  );
  const ctaButtonBg = resolveThemeColorValue(
    props?.ctaButtonBgColorKey,
    "secondary",
  );
  const ctaButtonTextColor = resolveThemeColorValue(
    props?.ctaButtonTextColorKey,
    "primaryDark",
  );
  const ctaButtonHoverBgColor = resolveThemeColorValue(
    props?.ctaButtonHoverBgColorKey,
    "white",
  );
  const ctaButtonHoverTextColor = resolveThemeColorValue(
    props?.ctaButtonHoverTextColorKey,
    "primary",
  );
  const ctaButtonBorderColor = resolveThemeColorValue(
    props?.ctaButtonBorderColorKey,
    "white",
  );
  const ctaButtonBgValue = String(ctaButtonBg || "").trim();
  const isGradientCtaButton = /gradient\(/i.test(ctaButtonBgValue);
  const ctaButtonVars = {
    "--cta-btn-bg": ctaButtonBgValue || getColor("secondary") || "#f7b733",
    "--cta-btn-text": ctaButtonTextColor || getColor("primary") || "#333",
    "--cta-btn-hover-bg":
      ctaButtonHoverBgColor || getColor("white") || "#ffffff",
    "--cta-btn-hover-text":
      ctaButtonHoverTextColor || getColor("primary") || "#333",
    "--cta-btn-border":
      ctaButtonBorderColor ||
      (isGradientCtaButton ? "transparent" : ctaButtonBgValue),
    "--cta-btn-shadow": "0 3px 10px rgba(247, 183, 51, 0.45)",
  };
  const ctaButtonStyle = {
    borderRadius: 24,
    minWidth: 120,
    minHeight: 44,
    fontWeight: 700,
    fontSize: 16,
    padding: "10px 20px",
    lineHeight: 1,
    background: isGradientCtaButton ? undefined : ctaButtonBgValue,
    backgroundImage: isGradientCtaButton ? ctaButtonBgValue : undefined,
  };

  const ctaShowRightImage = props?.ctaShowRightImage !== false;
  const ctaRightImage = (props?.ctaRightImage ?? "").toString().trim();
  const ctaRightImageMobile = (props?.ctaRightImageMobile ?? "")
    .toString()
    .trim();
  const ctaRightImageAlt = (props?.ctaRightImageAlt ?? "CTA image")
    .toString()
    .trim();
  const sectionBgType = (
    props?.callToActionBannerSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.callToActionBannerSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.callToActionBannerSectionBgColorKey ?? "")
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
    props?.callToActionBannerSectionPaddingTop != null
      ? Number(props.callToActionBannerSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.callToActionBannerSectionPaddingBottom != null
      ? Number(props.callToActionBannerSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.callToActionBannerSectionMarginTop != null
      ? Number(props.callToActionBannerSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.callToActionBannerSectionMarginBottom != null
      ? Number(props.callToActionBannerSectionMarginBottom)
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
    props?.callToActionBannerPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.callToActionBannerPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.callToActionBannerPageContainerBgColorKey ?? ""
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
    props?.callToActionBannerPageContainerPaddingTop != null
      ? Number(props.callToActionBannerPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.callToActionBannerPageContainerPaddingRight != null
      ? Number(props.callToActionBannerPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.callToActionBannerPageContainerPaddingBottom != null
      ? Number(props.callToActionBannerPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.callToActionBannerPageContainerPaddingLeft != null
      ? Number(props.callToActionBannerPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.callToActionBannerPageContainerMarginTop != null
      ? Number(props.callToActionBannerPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.callToActionBannerPageContainerMarginBottom != null
      ? Number(props.callToActionBannerPageContainerMarginBottom)
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

  const handleCtaClick = () => {
    const href = (ctaButtonLink || "").trim();
    if (!href || href === "#") return;
    if (ctaButtonTarget === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = href;
  };

  return (
    <div className={sectionBgClassName} style={sectionBgStyle}>
      <div className="rounded-4" style={pageContainerBgStyle}>
        <BannerShell $titleAlign={titleAlign} className="test01">
          <Row gutter={[16, 8]} align="middle">
            <Col
              xs={{ span: 24, order: 2 }}
              sm={{ span: 24, order: 2 }}
              md={{ span: 24, order: 2 }}
              lg={{ span: 16, order: 1 }}
            >
              <div className="cta-content">
                {subTitle ? (
                  <SubTitle
                    className="cta-subtitle"
                    style={{
                      ...(getTextPaintStyle(subTitleColor) || {}),
                    }}
                  >
                    {subTitle}
                  </SubTitle>
                ) : null}

                {mainTitle ? (
                  <div
                    className="cta-title"
                    style={{
                      ...(getTextPaintStyle(titleColor) || {}),
                    }}
                  >
                    {mainTitle}
                  </div>
                ) : null}

                {ctaButtonText ? (
                  <CtaGeneratedButton
                    type="default"
                    htmlType="button"
                    className="cta-button"
                    onClick={handleCtaClick}
                    style={{
                      ...ctaButtonStyle,
                      ...ctaButtonVars,
                    }}
                  >
                    {ctaButtonText}
                  </CtaGeneratedButton>
                ) : null}
              </div>
            </Col>

            {ctaShowRightImage && ctaRightImage ? (
              <Col
                xs={{ span: 24, order: 1 }}
                sm={{ span: 24, order: 1 }}
                md={{ span: 24, order: 1 }}
                lg={{ span: 8, order: 2 }}
                className="cta-image-col"
              >
                <picture>
                  {ctaRightImageMobile ? (
                    <source
                      media="(max-width: 767px)"
                      srcSet={ctaRightImageMobile}
                    />
                  ) : null}
                  <img
                    className="cta-right-image"
                    src={ctaRightImage}
                    alt={ctaRightImageAlt || "CTA image"}
                    loading="lazy"
                  />
                </picture>
              </Col>
            ) : null}
          </Row>
        </BannerShell>
      </div>
    </div>
  );
}
