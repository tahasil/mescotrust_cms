"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
import Link from "next/link";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
  ThemeButton,
} from "@/styles/Theme";

/**
 * Card hover (matches reference: mescotrust src/pages/HomeStyle.js HomeEducationalCards).
 * .cardBackground: background image + ::after overlay; opacity 0 by default, opacity 1 on hover.
 * So on hover the card shows bg image with theme overlay color on top.
 */
const CardsWrapper = styled.div`
  width: 100%;
  position: relative;
  --card-border-color: ${(p) => p.$cardBorderColor || getColor("ctaBorder")};
  --button-color: ${(p) => p.$buttonColor || getColor("white")};
  --icon-hover-color: ${(p) => p.$iconHoverColor || "transparent"};
  --hover-overlay-color: ${(p) =>
    p.$hoverOverlayColor || "rgba(207, 55, 47, 0.5)"};
  --hover-overlay-opacity: ${(p) =>
    typeof p.$hoverOverlayOpacity === "number" &&
    p.$hoverOverlayOpacity >= 0 &&
    p.$hoverOverlayOpacity <= 1
      ? p.$hoverOverlayOpacity
      : 0.5};
  --title-font-family: ${(p) =>
    p.$titleFontFamily ? p.$titleFontFamily : "inherit"};
  --title-font-size: ${(p) =>
    typeof p.$titleFontSize === "number" && p.$titleFontSize > 0
      ? `${p.$titleFontSize}px`
      : "24px"};
  --title-font-size-mobile: ${(p) =>
    typeof p.$titleFontSizeMobile === "number" && p.$titleFontSizeMobile > 0
      ? `${p.$titleFontSizeMobile}px`
      : "20px"};
  --title-font-weight: ${(p) =>
    typeof p.$titleFontWeight === "number" && p.$titleFontWeight >= 100
      ? p.$titleFontWeight
      : 700};
  --title-font-style: ${(p) =>
    p.$titleFontStyle === "italic" ? "italic" : "normal"};
  --title-letter-spacing: ${(p) =>
    typeof p.$titleLetterSpacing === "number"
      ? `${p.$titleLetterSpacing}px`
      : "normal"};
  --title-line-height: ${(p) =>
    typeof p.$titleLineHeight === "number" && p.$titleLineHeight > 0
      ? p.$titleLineHeight
      : 1.2};
  .cardBackground {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.3s ease;
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: color-mix(
        in srgb,
        var(--hover-overlay-color) calc(var(--hover-overlay-opacity) * 100%),
        transparent
      );
      pointer-events: none;
    }
  }
  .innerCardBox {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 320px;
    background: ${() => getColor("black")};
    border: 1px solid var(--card-border-color);
    border-radius: 16px;
    padding: 54px 24px;
    overflow: hidden;
    transition: border-color 0.3s ease;
    > img,
    > h1,
    > button,
    > p,
    > .ant-btn,
    > a,
    > .cardIconWrap {
      position: relative;
      z-index: 1;
    }
    .cardIconWrap {
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      max-width: 48px;
      max-height: 48px;
      margin: 0 auto 12px;
      display: block;
      position: relative;
      flex-shrink: 0;
    }
    .cardIconImage {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      transition: opacity 0.3s ease, filter 0.3s ease;
    }
    .cardIconHoverTint {
      position: absolute;
      inset: 0;
      display: block;
      opacity: 0;
      pointer-events: none;
      background: var(--icon-hover-color);
      transition: opacity 0.3s ease;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
    }
    h1 {
      margin: 0 0 1rem 0;
      font-family: var(--title-font-family);
      font-size: var(--title-font-size);
      font-weight: var(--title-font-weight);
      font-style: var(--title-font-style);
      letter-spacing: var(--title-letter-spacing);
      line-height: var(--title-line-height);
      color: ${() => getColor("white")};
      text-align: center;
      min-height: 90px;
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .cardLinkWrap {
      flex-shrink: 0;
      margin-top: auto;
    }
    .cardLinkWrap .ant-btn,
    .cardLinkWrap .ant-btn > span,
    .cardLinkWrap .ant-btn .anticon {
      color: var(--button-color) !important;
    }
    .cardLinkWrap .ant-btn svg {
      fill: currentColor !important;
    }
    @media (max-width: 768px) {
      padding: 32px 20px;
      min-height: 280px;
      h1 {
        font-size: var(--title-font-size-mobile);
        min-height: 72px;
      }
    }
    &:hover {
      border-color: color-mix(
        in srgb,
        var(--hover-overlay-color) calc(var(--hover-overlay-opacity) * 100%),
        transparent
      );
      .cardBackground {
        opacity: 1;
      }
      .cardLinkWrap .ant-btn,
      .cardLinkWrap .ant-btn > span,
      .cardLinkWrap .ant-btn .anticon {
        color: var(--button-color) !important;
      }
      .cardLinkWrap .ant-btn svg {
        rotate: 0deg !important;
        fill: currentColor !important;
      }
      img:not(.cardBackground img):not(.cardIconImage) {
        filter: ${() =>
          getColor("imgFillWhite") || "brightness(0) invert(1)"} !important;
      }
      .cardIconWrap:not(.hasCustomHoverColor) .cardIconImage {
        filter: ${() =>
          getColor("imgFillWhite") || "brightness(0) invert(1)"} !important;
      }
      .cardIconWrap.hasCustomHoverColor .cardIconImage {
        opacity: 0;
        filter: none !important;
      }
      .cardIconWrap.hasCustomHoverColor .cardIconHoverTint {
        opacity: 1;
      }
    }
  }
  .overviewGrid {
    display: grid;
    grid-template-columns: repeat(
      var(--overview-cards-cols-desktop, 4),
      minmax(0, 1fr)
    );
    gap: 16px;
    align-items: stretch;
  }
  .overviewGridItem {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  @media (max-width: 992px) {
    .overviewGrid {
      grid-template-columns: repeat(
        var(--overview-cards-cols-tablet, 2),
        minmax(0, 1fr)
      );
    }
  }
  @media (max-width: 576px) {
    .overviewGrid {
      grid-template-columns: repeat(
        var(--overview-cards-cols-mobile, 1),
        minmax(0, 1fr)
      );
    }
  }
`;

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Site component: OverviewOfOurWork (Overview of Our Work).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 * UI: card grid with configurable desktop columns.
 */
export default function OverviewOfOurWork(props) {
  const cardTitleColorKeyDefault = (
    props?.overviewOfOurWorkCardTitleColorKey ?? ""
  )
    .toString()
    .trim();
  const cardBorderColorKey = (props?.overviewOfOurWorkCardBorderColorKey ?? "")
    .toString()
    .trim();
  const buttonColorKey = (props?.overviewOfOurWorkButtonColorKey ?? "")
    .toString()
    .trim();
  const hoverColorKey = (props?.overviewOfOurWorkHoverColorKey ?? "")
    .toString()
    .trim();
  const iconHoverColorKey = (props?.overviewOfOurWorkIconHoverColorKey ?? "")
    .toString()
    .trim();
  const hoverOverlayOpacity =
    props?.overviewOfOurWorkHoverOverlayOpacity != null
      ? Math.min(
          1,
          Math.max(0, Number(props.overviewOfOurWorkHoverOverlayOpacity)),
        )
      : 0.5;
  const cardsPerRowDesktop = clamp(
    props?.overviewOfOurWorkCardsPerRow ?? props?.cardsPerRow,
    1,
    8,
    4,
  );
  const cardsPerRowTablet = Math.max(
    1,
    Math.min(3, Math.ceil(cardsPerRowDesktop / 2)),
  );
  const cardsPerRowMobile = 1;
  const titleFontFamily = (
    props?.overviewOfOurWorkTitleFontFamily ?? ""
  )
    .toString()
    .trim();
  const titleFontSize = clamp(props?.overviewOfOurWorkTitleFontSize, 10, 96, 24);
  const titleFontSizeMobile = clamp(
    props?.overviewOfOurWorkTitleFontSizeMobile,
    10,
    96,
    Math.max(10, Math.round(titleFontSize * 0.8333)),
  );
  const titleFontWeight = clamp(
    props?.overviewOfOurWorkTitleFontWeight,
    100,
    900,
    700,
  );
  const titleFontStyle =
    (props?.overviewOfOurWorkTitleFontStyle ?? "normal").toString() === "italic"
      ? "italic"
      : "normal";
  const titleLetterSpacing = clamp(
    props?.overviewOfOurWorkTitleLetterSpacing,
    -2,
    20,
    0,
  );
  const titleLineHeight = clamp(
    props?.overviewOfOurWorkTitleLineHeight,
    0.8,
    3,
    1.2,
  );

  const rawItems = props?.overviewOfOurWorkItems ?? props?.items;
  const cards = Array.isArray(rawItems)
    ? rawItems.map((it) => ({
        title: (it?.title ?? "").toString().trim() || "Card",
        bgImageUrlDesktop: (
          it?.bgImageUrlDesktop ??
          it?.bgImageUrl ??
          it?.bgImage ??
          it?.bgImageUrlMobile ??
          ""
        )
          .toString()
          .trim(),
        bgImageUrl: (
          it?.bgImageUrlDesktop ??
          it?.bgImageUrl ??
          it?.bgImage ??
          it?.bgImageUrlMobile ??
          ""
        )
          .toString()
          .trim(),
        link: (it?.link ?? it?.url ?? "").toString().trim(),
        linkText: (it?.linkText ?? it?.buttonText ?? "").toString().trim(),
        titleColorKey: (it?.titleColorKey ?? it?.cardTitleColorKey ?? "")
          .toString()
          .trim(),
        icon: (it?.icon ?? "").toString().trim(),
      }))
    : [];

  const sectionBgType = (
    props?.overviewOfOurWorkSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.overviewOfOurWorkSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.overviewOfOurWorkSectionBgColorKey ?? "")
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
    props?.overviewOfOurWorkSectionPaddingTop != null
      ? Number(props.overviewOfOurWorkSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.overviewOfOurWorkSectionPaddingBottom != null
      ? Number(props.overviewOfOurWorkSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.overviewOfOurWorkSectionMarginTop != null
      ? Number(props.overviewOfOurWorkSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.overviewOfOurWorkSectionMarginBottom != null
      ? Number(props.overviewOfOurWorkSectionMarginBottom)
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
    props?.overviewOfOurWorkPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.overviewOfOurWorkPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.overviewOfOurWorkPageContainerBgColorKey ?? ""
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
    props?.overviewOfOurWorkPageContainerPaddingTop != null
      ? Number(props.overviewOfOurWorkPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.overviewOfOurWorkPageContainerPaddingRight != null
      ? Number(props.overviewOfOurWorkPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.overviewOfOurWorkPageContainerPaddingBottom != null
      ? Number(props.overviewOfOurWorkPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.overviewOfOurWorkPageContainerPaddingLeft != null
      ? Number(props.overviewOfOurWorkPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.overviewOfOurWorkPageContainerMarginTop != null
      ? Number(props.overviewOfOurWorkPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.overviewOfOurWorkPageContainerMarginBottom != null
      ? Number(props.overviewOfOurWorkPageContainerMarginBottom)
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

  const cardTitleColor = (key) => {
    const k = (key ?? "").toString().trim() || cardTitleColorKeyDefault;
    return k ? getColor(k) : getColor("white");
  };
  const cardBorderColor = cardBorderColorKey
    ? getColor(cardBorderColorKey)
    : getColor("ctaBorder");
  const buttonColor = buttonColorKey
    ? getColor(buttonColorKey)
    : getColor("white");
  const hoverOverlayColor = hoverColorKey
    ? getColor(hoverColorKey)
    : "rgba(207, 55, 47, 0.5)";
  const iconHoverColor = iconHoverColorKey
    ? getColor(iconHoverColorKey)
    : undefined;
  const hasCustomIconHoverColor = Boolean(iconHoverColorKey);

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <CardsWrapper
          $cardBorderColor={cardBorderColor}
          $buttonColor={buttonColor}
          $iconHoverColor={iconHoverColor}
          $hoverOverlayColor={hoverOverlayColor}
          $hoverOverlayOpacity={hoverOverlayOpacity}
          $titleFontFamily={titleFontFamily}
          $titleFontSize={titleFontSize}
          $titleFontSizeMobile={titleFontSizeMobile}
          $titleFontWeight={titleFontWeight}
          $titleFontStyle={titleFontStyle}
          $titleLetterSpacing={titleLetterSpacing}
          $titleLineHeight={titleLineHeight}
        >
          {cards.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              No cards yet. Edit this component and add items under Content.
            </div>
          ) : (
            <div
              className="overviewGrid"
              style={{
                "--overview-cards-cols-desktop": cardsPerRowDesktop,
                "--overview-cards-cols-tablet": cardsPerRowTablet,
                "--overview-cards-cols-mobile": cardsPerRowMobile,
              }}
            >
              {cards.map((card, i) => {
                const hasCardLink = Boolean(card.linkText && card.link);
                return (
                  <div key={i} className="overviewGridItem">
                    <div
                      className="innerCardBox text-center"
                      style={{ width: "100%", flex: 1 }}
                    >
                      <div className="cardBackground">
                        {card.bgImageUrlDesktop ? (
                          <img
                            loading="lazy"
                            src={card.bgImageUrlDesktop}
                            alt=""
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      {card.icon &&
                      (card.icon.startsWith("http") ||
                        card.icon.startsWith("/")) ? (
                        <span
                          className={`cardIconWrap${
                            hasCustomIconHoverColor ? " hasCustomHoverColor" : ""
                          }`}
                        >
                          <img
                            loading="lazy"
                            className="cardIconImage"
                            src={card.icon}
                            alt=""
                            width={48}
                            height={48}
                          />
                          {hasCustomIconHoverColor ? (
                            <span
                              className="cardIconHoverTint"
                              aria-hidden
                              style={{
                                WebkitMaskImage: `url("${card.icon}")`,
                                maskImage: `url("${card.icon}")`,
                              }}
                            />
                          ) : null}
                        </span>
                      ) : null}
                      <h1
                        className="my-4"
                        style={{ color: cardTitleColor(card.titleColorKey) }}
                      >
                        {card.title}
                      </h1>
                      {hasCardLink ? (
                        <div className="cardLinkWrap">
                          <Link
                            href={card.link}
                            style={{ textDecoration: "none" }}
                          >
                            <ThemeButton
                              className="link"
                              type="button"
                              color={buttonColor}
                              size="large"
                              icon={<ArrowRightOutlined />}
                              iconPosition="end"
                            >
                              {card.linkText}
                            </ThemeButton>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardsWrapper>
      </PageContainer>
    </FullWidthBackground>
  );
}
