"use client";

import { Row, Col } from "antd";
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
  --hover-overlay-color: ${(p) =>
    p.$hoverOverlayColor || "rgba(207, 55, 47, 0.5)"};
  --hover-overlay-opacity: ${(p) =>
    typeof p.$hoverOverlayOpacity === "number" &&
    p.$hoverOverlayOpacity >= 0 &&
    p.$hoverOverlayOpacity <= 1
      ? p.$hoverOverlayOpacity
      : 0.5};
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
    > a {
      position: relative;
      z-index: 1;
    }
    h1 {
      margin: 0 0 1rem 0;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
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
    button,
    .ant-btn {
      color: var(--button-color);
    }
    button svg,
    .ant-btn svg {
      fill: var(--button-color);
    }
    @media (max-width: 768px) {
      padding: 32px 20px;
      min-height: 280px;
      h1 {
        font-size: 20px;
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
      button,
      .ant-btn {
        color: var(--button-color) !important;
      }
      svg {
        rotate: 0deg !important;
        fill: var(--button-color) !important;
      }
      img:not(.cardBackground img) {
        filter: ${() =>
          getColor("imgFillWhite") || "brightness(0) invert(1)"} !important;
      }
    }
  }
`;

/**
 * Site component: OverviewOfOurWork (Overview of Our Work).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 * UI: 4-card grid (Educational Support, Medical Aid, Clinics & Dispensaries, Relief of Poverty).
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
  const hoverOverlayOpacity =
    props?.overviewOfOurWorkHoverOverlayOpacity != null
      ? Math.min(
          1,
          Math.max(0, Number(props.overviewOfOurWorkHoverOverlayOpacity)),
        )
      : 0.5;

  const rawItems = props?.overviewOfOurWorkItems ?? props?.items;
  const cards = Array.isArray(rawItems)
    ? rawItems.map((it) => ({
        title: (it?.title ?? "").toString().trim() || "Card",
        imageUrlDesktop: (
          it?.imageUrlDesktop ?? it?.imageUrl ?? it?.image ?? ""
        )
          .toString()
          .trim(),
        imageUrlMobile: (it?.imageUrlMobile ?? "").toString().trim(),
        imageUrl: (
          it?.imageUrlDesktop ?? it?.imageUrl ?? it?.image ?? ""
        )
          .toString()
          .trim(),
        bgImageUrlDesktop: (
          it?.bgImageUrlDesktop ?? it?.bgImageUrl ?? it?.bgImage ?? ""
        )
          .toString()
          .trim(),
        bgImageUrlMobile: (it?.bgImageUrlMobile ?? "").toString().trim(),
        bgImageUrl: (
          it?.bgImageUrlDesktop ?? it?.bgImageUrl ?? it?.bgImage ?? ""
        )
          .toString()
          .trim(),
        link: (it?.link ?? it?.url ?? "/").toString().trim(),
        linkText:
          (it?.linkText ?? it?.buttonText ?? "").toString().trim() ||
          "More Details",
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

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <CardsWrapper
          $cardBorderColor={cardBorderColor}
          $buttonColor={buttonColor}
          $hoverOverlayColor={hoverOverlayColor}
          $hoverOverlayOpacity={hoverOverlayOpacity}
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
            <Row gutter={[16, 16]} style={{ alignItems: "stretch" }}>
              {cards.map((card, i) => (
                <Col
                  key={i}
                  xs={24}
                  sm={12}
                  md={12}
                  lg={6}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <div
                    className="innerCardBox text-center"
                    style={{ width: "100%", flex: 1 }}
                  >
                    <div className="cardBackground">
                      {card.bgImageUrlDesktop || card.bgImageUrlMobile ? (
                        <picture>
                          {card.bgImageUrlMobile ? (
                            <source
                              media="(max-width: 767px)"
                              srcSet={card.bgImageUrlMobile}
                            />
                          ) : null}
                          <img
                            loading="lazy"
                            src={card.bgImageUrlDesktop || card.bgImageUrlMobile}
                            alt=""
                            aria-hidden
                          />
                        </picture>
                      ) : null}
                    </div>
                    {card.icon &&
                    (card.icon.startsWith("http") ||
                      card.icon.startsWith("/")) ? (
                      <img loading="lazy"
                        src={card.icon}
                        alt=""
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "contain",
                          margin: "0 auto 12px",
                          display: "block",
                        }}
                      />
                    ) : null}
                    {card.imageUrlDesktop || card.imageUrlMobile ? (
                      <picture>
                        {card.imageUrlMobile ? (
                          <source
                            media="(max-width: 767px)"
                            srcSet={card.imageUrlMobile}
                          />
                        ) : null}
                        <img
                          loading="lazy"
                          className="m-auto"
                          src={card.imageUrlDesktop || card.imageUrlMobile}
                          alt={card.title}
                          style={{ display: "block", margin: "0 auto" }}
                        />
                      </picture>
                    ) : null}
                    <h1
                      className="my-4"
                      style={{ color: cardTitleColor(card.titleColorKey) }}
                    >
                      {card.title}
                    </h1>
                    <div className="cardLinkWrap">
                      <Link
                        href={card.link || "#"}
                        style={{ textDecoration: "none" }}
                      >
                        <ThemeButton
                          className="link"
                          type="button"
                          size="large"
                          icon={<ArrowRightOutlined />}
                          iconPosition="end"
                        >
                          {card.linkText}
                        </ThemeButton>
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </CardsWrapper>
      </PageContainer>
    </FullWidthBackground>
  );
}
