"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
  ThemeCard,
} from "@/styles/Theme";

/**
 * Site component: Vision.
 * ThemeCard with subtitle + main title (left) and image (right).
 * Font size/weight/lineHeight for subtitle & main title are editable.
 */
export default function Vision(props) {
  /* ── Vision card fields ── */
  const visionSubTitle = (props?.visionSubTitle ?? "Vision").toString().trim();
  const visionTitle = (
    props?.visionTitle ??
    "To help the underprivileged and marginalized live a better tomorrow through various interventions."
  )
    .toString()
    .trim();
  const visionImageDesktop = (
    props?.visionImageDesktop ?? props?.visionImage ?? "/images/vision.png"
  )
    .toString()
    .trim();
  const visionImageMobile = (props?.visionImageMobile ?? "")
    .toString()
    .trim();

  /* ── Colors ── */
  const subTitleColorKey = (props?.visionSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;
  const mainTitleColorKey = (props?.visionMainTitleColorKey ?? "")
    .toString()
    .trim();
  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : undefined;

  /* ── Card settings ── */
  const cardRadius =
    props?.visionCardRadius != null ? Number(props.visionCardRadius) : 40;
  const cardPadding =
    props?.visionCardPadding != null ? Number(props.visionCardPadding) : 40;

  /* ── Section bg ── */
  const sectionBgType = (props?.visionSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.visionSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.visionSectionBgColorKey ?? "")
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
    props?.visionSectionPaddingTop != null
      ? Number(props.visionSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.visionSectionPaddingBottom != null
      ? Number(props.visionSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.visionSectionMarginTop != null
      ? Number(props.visionSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.visionSectionMarginBottom != null
      ? Number(props.visionSectionMarginBottom)
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
    props?.visionPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.visionPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.visionPageContainerBgColorKey ?? "")
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
    props?.visionPageContainerPaddingTop != null
      ? Number(props.visionPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.visionPageContainerPaddingRight != null
      ? Number(props.visionPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.visionPageContainerPaddingBottom != null
      ? Number(props.visionPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.visionPageContainerPaddingLeft != null
      ? Number(props.visionPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.visionPageContainerMarginTop != null
      ? Number(props.visionPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.visionPageContainerMarginBottom != null
      ? Number(props.visionPageContainerMarginBottom)
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
      <PageContainer style={pageContainerBgStyle}>
        <ThemeCard
          radius={cardRadius}
          padding={cardPadding}
          style={{
            borderRadius: cardRadius,
            padding: cardPadding,
            overflow: "hidden",
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col
              xs={{ span: 24, order: 2 }}
              sm={{ span: 24, order: 2 }}
              md={{ span: 12, order: 1 }}
              lg={{ span: 12, order: 1 }}
            >
              <SubTitle
                className="mb-2"
                style={subTitleColor ? { color: subTitleColor } : undefined}
              >
                {visionSubTitle}
              </SubTitle>
              <MainTitle
                opacity={1}
                style={mainTitleColor ? { color: mainTitleColor } : undefined}
              >
                {visionTitle}
              </MainTitle>
            </Col>
            <Col
              xs={{ span: 24, order: 1 }}
              sm={{ span: 24, order: 1 }}
              md={{ span: 12, order: 2 }}
              lg={{ span: 12, order: 2 }}
            >
              <picture>
                {visionImageMobile ? (
                  <source
                    media="(max-width: 767px)"
                    srcSet={visionImageMobile}
                  />
                ) : null}
                <img
                  loading="lazy"
                  className="img-fluid"
                  style={{ display: "block", margin: "0 auto" }}
                  src={visionImageDesktop || visionImageMobile}
                  alt={visionSubTitle}
                />
              </picture>
            </Col>
          </Row>
        </ThemeCard>
      </PageContainer>
    </FullWidthBackground>
  );
}
