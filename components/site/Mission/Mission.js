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
 * Site component: Mission.
 * ThemeCard with image (left) and subtitle + main title (right).
 * Font size/weight/lineHeight for subtitle & main title are editable.
 */
export default function Mission(props) {
  /* ── Content fields ── */
  const missionSubTitle = (props?.missionSubTitle ?? "Mission").toString().trim();
  const missionTitle = (
    props?.missionTitle ??
    "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education & health."
  )
    .toString()
    .trim();
  const missionImageDesktop = (
    props?.missionImageDesktop ?? props?.missionImage ?? "/images/mission.png"
  )
    .toString()
    .trim();
  const missionImageMobile = (props?.missionImageMobile ?? "")
    .toString()
    .trim();

  /* ── Colors ── */
  const subTitleColorKey = (props?.missionSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;
  const mainTitleColorKey = (props?.missionMainTitleColorKey ?? "")
    .toString()
    .trim();
  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : undefined;

  /* ── Card settings ── */
  const cardRadius =
    props?.missionCardRadius != null ? Number(props.missionCardRadius) : 40;
  const cardPadding =
    props?.missionCardPadding != null ? Number(props.missionCardPadding) : 40;

  /* ── Section bg ── */
  const sectionBgType = (props?.missionSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.missionSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.missionSectionBgColorKey ?? "")
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
    props?.missionSectionPaddingTop != null
      ? Number(props.missionSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.missionSectionPaddingBottom != null
      ? Number(props.missionSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.missionSectionMarginTop != null
      ? Number(props.missionSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.missionSectionMarginBottom != null
      ? Number(props.missionSectionMarginBottom)
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
    props?.missionPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.missionPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.missionPageContainerBgColorKey ?? "")
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
    props?.missionPageContainerPaddingTop != null
      ? Number(props.missionPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.missionPageContainerPaddingRight != null
      ? Number(props.missionPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.missionPageContainerPaddingBottom != null
      ? Number(props.missionPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.missionPageContainerPaddingLeft != null
      ? Number(props.missionPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.missionPageContainerMarginTop != null
      ? Number(props.missionPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.missionPageContainerMarginBottom != null
      ? Number(props.missionPageContainerMarginBottom)
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
            <Col xs={24} sm={24} md={12} lg={12}>
              <picture>
                {missionImageMobile ? (
                  <source
                    media="(max-width: 767px)"
                    srcSet={missionImageMobile}
                  />
                ) : null}
                <img
                  loading="lazy"
                  className="img-fluid"
                  style={{ display: "block", margin: "0 auto" }}
                  src={missionImageDesktop || missionImageMobile}
                  alt={missionSubTitle}
                />
              </picture>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12}>
              <SubTitle
                className="mb-2"
                style={subTitleColor ? { color: subTitleColor } : undefined}
              >
                {missionSubTitle}
              </SubTitle>
              <MainTitle
                opacity={1}
                style={mainTitleColor ? { color: mainTitleColor } : undefined}
              >
                {missionTitle}
              </MainTitle>
            </Col>
          </Row>
        </ThemeCard>
      </PageContainer>
    </FullWidthBackground>
  );
}
