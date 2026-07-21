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
import SafeHtml from "@/components/cms/SafeHtml";

const DescriptionWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  margin-bottom: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
  font-size: ${(p) => `${p.$fontSize}px`};
  font-weight: ${(p) => p.$fontWeight};
  line-height: ${(p) => p.$lineHeight};

  /* & > .rich-content,
  & > .rich-content * {
    font-size: inherit !important;
    font-weight: inherit !important;
    line-height: inherit !important;
  } */

  ${(p) =>
    p.$textColor
      ? `
    color: ${p.$textColor} !important;
    * { color: ${p.$textColor} !important; }
    span[style] { color: ${p.$textColor} !important; background-color: transparent !important; }
  `
      : ""}

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-bottom: 0;
    color: inherit;
  }
  h1 {
    font-size: 36px !important;
    font-weight: 500 !important;
    line-height: 40px !important;
  }
  h2 {
    font-size: 30px !important;
    font-weight: 500 !important;
    line-height: 36px !important;
  }
  h3 {
    font-size: 28px !important;
    font-weight: 500 !important;
    line-height: 36px !important;
  }
  h4 {
    font-size: 24px !important;
    font-weight: 500 !important;
    line-height: 32px !important;
  }
  h5 {
    font-size: 20px !important;
    font-weight: 500 !important;
    line-height: 24px !important;
  }
  h6 {
    font-size: 16px !important;
    font-weight: 500 !important;
    line-height: 22px !important;
  }
`;

/**
 * Site component: SectionIntro (Section Intro).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function SectionIntro(props) {
  const normalizeDescriptionHtml = (value) => {
    if (value == null) return "";
    return String(value)
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00A0/g, " ")
      .trim();
  };
  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const sectionIntroParagraph = normalizeDescriptionHtml(
    props?.sectionIntroParagraph,
  );
  const titleEnabled =
    props?.sectionIntroTitleEnabled !== false &&
    props?.sectionIntroTitleEnabled !== "false";
  const subTitleEnabled =
    props?.sectionIntroSubTitleEnabled !== false &&
    props?.sectionIntroSubTitleEnabled !== "false";
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const subTitleColorKey = (props?.sectionIntroSubTitleColorKey ?? "")
    .toString()
    .trim();
  const paragraphColorKey = (props?.sectionIntroParagraphColorKey ?? "")
    .toString()
    .trim();
  const descriptionFontSize = clamp(
    toNumber(props?.sectionIntroDescriptionFontSize, 16),
    10,
    80,
  );
  const descriptionFontWeight = clamp(
    toNumber(props?.sectionIntroDescriptionFontWeight, 400),
    100,
    900,
  );
  const descriptionLineHeight = clamp(
    toNumber(props?.sectionIntroDescriptionLineHeight, 1.7),
    1,
    3,
  );
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;
  const paragraphColor = paragraphColorKey
    ? getColor(paragraphColorKey)
    : undefined;

  const sectionBgType = (
    props?.sectionIntroSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.sectionIntroSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.sectionIntroSectionBgColorKey ?? "")
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
    props?.sectionIntroSectionPaddingTop != null
      ? Number(props.sectionIntroSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.sectionIntroSectionPaddingBottom != null
      ? Number(props.sectionIntroSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.sectionIntroSectionMarginTop != null
      ? Number(props.sectionIntroSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.sectionIntroSectionMarginBottom != null
      ? Number(props.sectionIntroSectionMarginBottom)
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
    props?.sectionIntroPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.sectionIntroPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.sectionIntroPageContainerBgColorKey ?? ""
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
    props?.sectionIntroPageContainerPaddingTop != null
      ? Number(props.sectionIntroPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.sectionIntroPageContainerPaddingRight != null
      ? Number(props.sectionIntroPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.sectionIntroPageContainerPaddingBottom != null
      ? Number(props.sectionIntroPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.sectionIntroPageContainerPaddingLeft != null
      ? Number(props.sectionIntroPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.sectionIntroPageContainerMarginTop != null
      ? Number(props.sectionIntroPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.sectionIntroPageContainerMarginBottom != null
      ? Number(props.sectionIntroPageContainerMarginBottom)
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
        <div className="fable-section">
        <Row gutter={[16, 16]}>
          <Col span={24} className="mb-4">
            {subTitleEnabled && subTitle ? (
              <SubTitle className="fable-eyebrow"
                style={subTitleColor ? { color: subTitleColor } : undefined}
              >
                {subTitle}
              </SubTitle>
            ) : null}
            {titleEnabled && mainTitle ? (
              <MainTitle className="fable-heading" color={titleColor}>{mainTitle}</MainTitle>
            ) : null}
            {sectionIntroParagraph && (
              <DescriptionWrapper className="fable-lead"
                $textColor={paragraphColor}
                $fontSize={descriptionFontSize}
                $fontWeight={descriptionFontWeight}
                $lineHeight={descriptionLineHeight}
              >
                <SafeHtml html={sectionIntroParagraph} />
              </DescriptionWrapper>
            )}
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={24}>{/* Add your content here */}</Col>
        </Row>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
