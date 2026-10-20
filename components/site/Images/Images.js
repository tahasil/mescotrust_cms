"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles } from "@/components/site/titleUtils";

/**
 * Site component: Images (Images).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function Images(props) {
  const titleAlign = getTitleAlign(props, "left", "images");
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleEnabled = props?.imagesTitleEnabled !== false;
  const subTitleEnabled = props?.imagesSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.imagesSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;
  const imageUrlDesktop = (
    props?.imageUrlDesktop ?? props?.imageUrl ?? "/images/clinics-dispensaries.png"
  )
    .toString()
    .trim();
  const imageUrlMobile = (props?.imageUrlMobile ?? "")
    .toString()
    .trim();
  const imageAlt = (props?.imageAlt ?? "Clinics And Dispensaries")
    .toString()
    .trim();

  const sectionBgType = (props?.imagesSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.imagesSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.imagesSectionBgColorKey ?? "")
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
    props?.imagesSectionPaddingTop != null
      ? Number(props.imagesSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.imagesSectionPaddingBottom != null
      ? Number(props.imagesSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.imagesSectionMarginTop != null
      ? Number(props.imagesSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.imagesSectionMarginBottom != null
      ? Number(props.imagesSectionMarginBottom)
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
    props?.imagesPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.imagesPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.imagesPageContainerBgColorKey ?? "")
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
    props?.imagesPageContainerPaddingTop != null
      ? Number(props.imagesPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.imagesPageContainerPaddingRight != null
      ? Number(props.imagesPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.imagesPageContainerPaddingBottom != null
      ? Number(props.imagesPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.imagesPageContainerPaddingLeft != null
      ? Number(props.imagesPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.imagesPageContainerMarginTop != null
      ? Number(props.imagesPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.imagesPageContainerMarginBottom != null
      ? Number(props.imagesPageContainerMarginBottom)
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
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        {(titleEnabled || subTitleEnabled) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4" style={getHeaderAlignStyles(titleAlign)}>
              {subTitleEnabled && (
                <SubTitle className="fable-eyebrow"
                  style={{ ...(subTitleColor ? { color: subTitleColor } : {}), ...getSubtitleAlignStyles(titleAlign) }}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && (
                <MainTitle className="fable-heading" color={titleColor} style={getTitleAlignStyles(titleAlign)}>{renderHighlightedTitle(mainTitle, props)}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        <Row gutter={[16, 16]}>
          <Col span={24} className="fable-media" style={{ aspectRatio: "16 / 9" }}>
            <picture>
              {imageUrlMobile ? (
                <source media="(max-width: 767px)" srcSet={imageUrlMobile} />
              ) : null}
              <img
                loading="lazy"
                src={imageUrlDesktop || imageUrlMobile}
                alt={imageAlt}
              />
            </picture>
          </Col>
        </Row>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
