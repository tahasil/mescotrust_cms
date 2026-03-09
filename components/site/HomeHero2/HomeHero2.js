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
 * Site component: HomeHero2 (Home Hero 2).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function HomeHero2(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");

  const sectionBgType = (props?.homeHero2SectionBgType ?? "default").toString();
  const sectionBgImage = (props?.homeHero2SectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.homeHero2SectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
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
  const sectionPaddingTop = props?.homeHero2SectionPaddingTop != null ? Number(props.homeHero2SectionPaddingTop) : null;
  const sectionPaddingBottom = props?.homeHero2SectionPaddingBottom != null ? Number(props.homeHero2SectionPaddingBottom) : null;
  const sectionMarginTop = props?.homeHero2SectionMarginTop != null ? Number(props.homeHero2SectionMarginTop) : null;
  const sectionMarginBottom = props?.homeHero2SectionMarginBottom != null ? Number(props.homeHero2SectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  const pageContainerBgType = (props?.homeHero2PageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.homeHero2PageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.homeHero2PageContainerBgColorKey ?? "").toString().trim();
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
  const containerPaddingTop = props?.homeHero2PageContainerPaddingTop != null ? Number(props.homeHero2PageContainerPaddingTop) : null;
  const containerPaddingRight = props?.homeHero2PageContainerPaddingRight != null ? Number(props.homeHero2PageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.homeHero2PageContainerPaddingBottom != null ? Number(props.homeHero2PageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.homeHero2PageContainerPaddingLeft != null ? Number(props.homeHero2PageContainerPaddingLeft) : null;
  const containerMarginTop = props?.homeHero2PageContainerMarginTop != null ? Number(props.homeHero2PageContainerMarginTop) : null;
  const containerMarginBottom = props?.homeHero2PageContainerMarginBottom != null ? Number(props.homeHero2PageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
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
          <Col span={24}>
            {/* Add your content here */}
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
