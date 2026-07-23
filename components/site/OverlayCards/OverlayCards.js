"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

/* ── Styled Components ── */
const CardsWrapper = styled.div`
  width: 100%;
  position: relative;

  .innerCardBox {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 280px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 54px 24px;
    overflow: hidden;
    transition: border-color 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .cardBackground {
      position: absolute;
      inset: 0;
      z-index: 0;
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
        background: var(--overlay-cards-hover-color, rgba(224, 60, 51, 0.5));
        pointer-events: none;
      }
    }

    > h3,
    > .card-description {
      position: relative;
      z-index: 1;
    }

    h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
      color: #fff;
      text-align: center;
      @media (max-width: 768px) {
        font-size: 20px;
      }
    }

    .card-description {
      font-size: 16px;
      line-height: 24px;
      font-weight: 400;
      color: #fff;
      text-align: center;
      opacity: 0.8;
      margin-top: 8px;
      margin-bottom: 0;
    }

    &:hover {
      border-color: var(--overlay-cards-hover-color, rgba(224, 60, 51, 0.5));
      .cardBackground {
        opacity: 1;
      }
      .card-description {
        opacity: 1;
      }
    }
  }
`;

/**
 * Site component: OverlayCards.
 * Cards with background image overlay on hover.
 */
export default function OverlayCards(props) {
  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.overlayCardsTitleEnabled !== false;
  const subTitleEnabled = props?.overlayCardsSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.overlayCardsSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const hoverColorKey = (props?.overlayCardsHoverColorKey ?? "")
    .toString()
    .trim();
  const hoverColor = hoverColorKey ? getColor(hoverColorKey) : undefined;

  /* ── Items ── */
  const items = Array.isArray(props?.overlayCardsItems)
    ? props.overlayCardsItems.map((item) => {
        const desktopImage =
          item?.bgImageDesktop != null
            ? String(item.bgImageDesktop).trim()
            : item?.bgImage != null
              ? String(item.bgImage).trim()
              : "";
        const mobileImage =
          item?.bgImageMobile != null ? String(item.bgImageMobile).trim() : "";
        return {
          ...item,
          bgImageDesktop: desktopImage,
          bgImageMobile: mobileImage,
          bgImage: desktopImage,
        };
      })
    : [];

  /* ── Section bg ── */
  const sectionBgType = (
    props?.overlayCardsSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.overlayCardsSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.overlayCardsSectionBgColorKey ?? "")
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
    props?.overlayCardsSectionPaddingTop != null
      ? Number(props.overlayCardsSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.overlayCardsSectionPaddingBottom != null
      ? Number(props.overlayCardsSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.overlayCardsSectionMarginTop != null
      ? Number(props.overlayCardsSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.overlayCardsSectionMarginBottom != null
      ? Number(props.overlayCardsSectionMarginBottom)
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
    props?.overlayCardsPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.overlayCardsPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.overlayCardsPageContainerBgColorKey ?? ""
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
    props?.overlayCardsPageContainerPaddingTop != null
      ? Number(props.overlayCardsPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.overlayCardsPageContainerPaddingRight != null
      ? Number(props.overlayCardsPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.overlayCardsPageContainerPaddingBottom != null
      ? Number(props.overlayCardsPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.overlayCardsPageContainerPaddingLeft != null
      ? Number(props.overlayCardsPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.overlayCardsPageContainerMarginTop != null
      ? Number(props.overlayCardsPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.overlayCardsPageContainerMarginBottom != null
      ? Number(props.overlayCardsPageContainerMarginBottom)
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

  const cssVars = hoverColor
    ? { "--overlay-cards-hover-color": hoverColor }
    : {};

  return (
      <FullWidthBackground
        className={sectionBgClassName}
        $managedStyle={{ ...sectionBgStyle, ...cssVars }}
      >
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle className="fable-eyebrow"
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle className="fable-heading" color={titleColor}>{mainTitle}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        <CardsWrapper className="fable-card-grid">
          <Row gutter={[24, 24]}>
            {items.map((item, idx) => {
              const title = (item?.title ?? "").toString().trim();
              const description = (item?.description ?? "").toString().trim();
              const bgImageDesktop = (
                item?.bgImageDesktop ?? item?.bgImage ?? ""
              )
                .toString()
                .trim();
              const bgImageMobile = (item?.bgImageMobile ?? "")
                .toString()
                .trim();
              const bgImage = bgImageDesktop || bgImageMobile;
              return (
                <Col key={idx} xs={24} sm={12} md={12} lg={8}>
                  <div className="innerCardBox fable-card">
                    {bgImage && (
                      <div className="cardBackground fable-card__media">
                        <picture>
                          {bgImageMobile ? (
                            <source
                              media="(max-width: 767px)"
                              srcSet={bgImageMobile}
                            />
                          ) : null}
                          <img loading="lazy" src={bgImage} alt={title} />
                        </picture>
                      </div>
                    )}
                    <div className="fable-card__body">
                    {title && <h3>{title}</h3>}
                    {description && (
                      <p className="card-description">{description}</p>
                    )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </CardsWrapper>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
