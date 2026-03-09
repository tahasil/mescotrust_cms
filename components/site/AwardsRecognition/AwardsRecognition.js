"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

/**
 * Site component: AwardsRecognition (Awards Recognition).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function AwardsRecognition(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");

  const sectionBgType = (
    props?.awardsRecognitionSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.awardsRecognitionSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.awardsRecognitionSectionBgColorKey ?? "")
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
    props?.awardsRecognitionSectionPaddingTop != null
      ? Number(props.awardsRecognitionSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.awardsRecognitionSectionPaddingBottom != null
      ? Number(props.awardsRecognitionSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.awardsRecognitionSectionMarginTop != null
      ? Number(props.awardsRecognitionSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.awardsRecognitionSectionMarginBottom != null
      ? Number(props.awardsRecognitionSectionMarginBottom)
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
    props?.awardsRecognitionPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.awardsRecognitionPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.awardsRecognitionPageContainerBgColorKey ?? ""
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
    props?.awardsRecognitionPageContainerPaddingTop != null
      ? Number(props.awardsRecognitionPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.awardsRecognitionPageContainerPaddingRight != null
      ? Number(props.awardsRecognitionPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.awardsRecognitionPageContainerPaddingBottom != null
      ? Number(props.awardsRecognitionPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.awardsRecognitionPageContainerPaddingLeft != null
      ? Number(props.awardsRecognitionPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.awardsRecognitionPageContainerMarginTop != null
      ? Number(props.awardsRecognitionPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.awardsRecognitionPageContainerMarginBottom != null
      ? Number(props.awardsRecognitionPageContainerMarginBottom)
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
        <Row gutter={[16, 16]}>
          <Col span={24} className="mb-4">
            <SubTitle>{subTitle}</SubTitle>
            <MainTitle color={titleColor}>{mainTitle}</MainTitle>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={24}>{/* Add your content here */}</Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
