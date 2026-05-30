"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  Paragraph,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

/**
 * Site component: SectionIntro (Section Intro).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function SectionIntro(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const sectionIntroParagraph = (props?.sectionIntroParagraph ?? "").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const subTitleColorKey = (props?.sectionIntroSubTitleColorKey ?? "").toString().trim();
  const paragraphColorKey = (props?.sectionIntroParagraphColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;
  const paragraphColor = paragraphColorKey ? getColor(paragraphColorKey) : undefined;

  const sectionBgType = (props?.sectionIntroSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.sectionIntroSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.sectionIntroSectionBgColorKey ?? "").toString().trim();
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
  const sectionPaddingTop = props?.sectionIntroSectionPaddingTop != null ? Number(props.sectionIntroSectionPaddingTop) : null;
  const sectionPaddingBottom = props?.sectionIntroSectionPaddingBottom != null ? Number(props.sectionIntroSectionPaddingBottom) : null;
  const sectionMarginTop = props?.sectionIntroSectionMarginTop != null ? Number(props.sectionIntroSectionMarginTop) : null;
  const sectionMarginBottom = props?.sectionIntroSectionMarginBottom != null ? Number(props.sectionIntroSectionMarginBottom) : null;
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

  const pageContainerBgType = (props?.sectionIntroPageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.sectionIntroPageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.sectionIntroPageContainerBgColorKey ?? "").toString().trim();
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
  const containerPaddingTop = props?.sectionIntroPageContainerPaddingTop != null ? Number(props.sectionIntroPageContainerPaddingTop) : null;
  const containerPaddingRight = props?.sectionIntroPageContainerPaddingRight != null ? Number(props.sectionIntroPageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.sectionIntroPageContainerPaddingBottom != null ? Number(props.sectionIntroPageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.sectionIntroPageContainerPaddingLeft != null ? Number(props.sectionIntroPageContainerPaddingLeft) : null;
  const containerMarginTop = props?.sectionIntroPageContainerMarginTop != null ? Number(props.sectionIntroPageContainerMarginTop) : null;
  const containerMarginBottom = props?.sectionIntroPageContainerMarginBottom != null ? Number(props.sectionIntroPageContainerMarginBottom) : null;
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
            <SubTitle style={subTitleColor ? { color: subTitleColor } : undefined}>{subTitle}</SubTitle>
            <MainTitle color={titleColor}>{mainTitle}</MainTitle>
            {sectionIntroParagraph && (
              <Paragraph
                style={{
                  maxWidth: 1100,
                  marginBottom: 0,
                  whiteSpace: "pre-line",
                  ...(paragraphColor ? { color: paragraphColor } : {}),
                }}
              >
                {sectionIntroParagraph}
              </Paragraph>
            )}
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
