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
 * Site component: CareersUpload (Careers Upload).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function CareersUpload(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");

  const sectionBgType = (props?.careersUploadSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.careersUploadSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.careersUploadSectionBgColorKey ?? "").toString().trim();
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
  const sectionPaddingTop = props?.careersUploadSectionPaddingTop != null ? Number(props.careersUploadSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.careersUploadSectionPaddingBottom != null ? Number(props.careersUploadSectionPaddingBottom) : null;
  const sectionMarginTop = props?.careersUploadSectionMarginTop != null ? Number(props.careersUploadSectionMarginTop) : null;
  const sectionMarginBottom = props?.careersUploadSectionMarginBottom != null ? Number(props.careersUploadSectionMarginBottom) : null;
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

  const pageContainerBgType = (props?.careersUploadPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.careersUploadPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.careersUploadPageContainerBgColorKey ?? "").toString().trim();
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
  const containerPaddingTop = props?.careersUploadPageContainerPaddingTop != null ? Number(props.careersUploadPageContainerPaddingTop) : null;
  const containerPaddingRight = props?.careersUploadPageContainerPaddingRight != null ? Number(props.careersUploadPageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.careersUploadPageContainerPaddingBottom != null ? Number(props.careersUploadPageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.careersUploadPageContainerPaddingLeft != null ? Number(props.careersUploadPageContainerPaddingLeft) : null;
  const containerMarginTop = props?.careersUploadPageContainerMarginTop != null ? Number(props.careersUploadPageContainerMarginTop) : null;
  const containerMarginBottom = props?.careersUploadPageContainerMarginBottom != null ? Number(props.careersUploadPageContainerMarginBottom) : null;
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
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
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
