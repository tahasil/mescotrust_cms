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
 * Site component: VolunteersFeedback (Volunteers Feedback).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function VolunteersFeedback(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");

  const sectionBgType = (props?.volunteersFeedbackSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.volunteersFeedbackSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.volunteersFeedbackSectionBgColorKey ?? "").toString().trim();
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
  const sectionPaddingTop = props?.volunteersFeedbackSectionPaddingTop != null ? Number(props.volunteersFeedbackSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.volunteersFeedbackSectionPaddingBottom != null ? Number(props.volunteersFeedbackSectionPaddingBottom) : null;
  const sectionMarginTop = props?.volunteersFeedbackSectionMarginTop != null ? Number(props.volunteersFeedbackSectionMarginTop) : null;
  const sectionMarginBottom = props?.volunteersFeedbackSectionMarginBottom != null ? Number(props.volunteersFeedbackSectionMarginBottom) : null;
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

  const pageContainerBgType = (props?.volunteersFeedbackPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.volunteersFeedbackPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.volunteersFeedbackPageContainerBgColorKey ?? "").toString().trim();
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
  const containerPaddingTop = props?.volunteersFeedbackPageContainerPaddingTop != null ? Number(props.volunteersFeedbackPageContainerPaddingTop) : null;
  const containerPaddingRight = props?.volunteersFeedbackPageContainerPaddingRight != null ? Number(props.volunteersFeedbackPageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.volunteersFeedbackPageContainerPaddingBottom != null ? Number(props.volunteersFeedbackPageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.volunteersFeedbackPageContainerPaddingLeft != null ? Number(props.volunteersFeedbackPageContainerPaddingLeft) : null;
  const containerMarginTop = props?.volunteersFeedbackPageContainerMarginTop != null ? Number(props.volunteersFeedbackPageContainerMarginTop) : null;
  const containerMarginBottom = props?.volunteersFeedbackPageContainerMarginBottom != null ? Number(props.volunteersFeedbackPageContainerMarginBottom) : null;
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
