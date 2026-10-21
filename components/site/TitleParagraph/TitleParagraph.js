"use client";

import { Row, Col } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  getTitleAlign,
  getTitleAlignStyles,
  getSubtitleAlignStyles,
  getHeaderAlignStyles,
  getParagraphAlign,
} from "@/components/site/titleUtils";

function normalizeDescriptionHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&amp;nbsp;|&nbsp;|&#160;|&#x0*a0;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

const ContentWrapper = styled.div`
  font-family: var(--fable-body, "Instrument Sans", system-ui, sans-serif);
  font-size: 17px;
  line-height: 1.6;
  font-weight: 400;
  color: var(--fable-ink-soft, var(--theme-black-light, rgba(42, 40, 62, 0.76)));
  overflow-wrap: break-word;
  word-wrap: break-word;

  p {
    margin: 0 0 18px;
    font-size: 17px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  > :last-child {
    margin-bottom: 0;
  }
  ${(p) =>
    p.$textColor
      ? `
    color: ${p.$textColor} !important;
    * { color: ${p.$textColor} !important; }
    span[style] { color: ${p.$textColor} !important; background-color: transparent !important; }
  `
      : ""}
`;

/**
 * Site component: TitleParagraph (Title & Paragraph).
 * Full-width section with optional title/subtitle and multiple rich text paragraphs.
 */
export default function TitleParagraph(props) {
  const mainTitle = (props?.titleParagraphMainTitle ?? "").toString().trim();
  const titleAlign = getTitleAlign(props, "left", "titleParagraph");
  const paragraphAlign = getParagraphAlign(props, "left", "titleParagraph");
  const subTitle = (props?.titleParagraphSubTitle ?? "").toString().trim();
  const titleEnabled =
    props?.titleParagraphTitleEnabled !== false &&
    props?.titleParagraphTitleEnabled !== "false";
  const subTitleEnabled =
    props?.titleParagraphSubTitleEnabled === true ||
    props?.titleParagraphSubTitleEnabled === "true";

  const titleColorKey = (props?.titleParagraphTitleColorKey ?? "")
    .toString()
    .trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const subTitleColorKey = (props?.titleParagraphSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : getColor("primary");
  const textColorKey = (props?.titleParagraphTextColorKey ?? "")
    .toString()
    .trim();
  const textColor = textColorKey ? getColor(textColorKey) : undefined;

  const content = normalizeDescriptionHtml(props?.titleParagraphContent);

  const PREFIX = "titleParagraph";

  const sectionBgType = (
    props?.[PREFIX + "SectionBgType"] ?? "default"
  ).toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "")
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
    props?.[PREFIX + "SectionPaddingTop"] != null
      ? Number(props[PREFIX + "SectionPaddingTop"])
      : null;
  const sectionPaddingBottom =
    props?.[PREFIX + "SectionPaddingBottom"] != null
      ? Number(props[PREFIX + "SectionPaddingBottom"])
      : null;
  const sectionMarginTop =
    props?.[PREFIX + "SectionMarginTop"] != null
      ? Number(props[PREFIX + "SectionMarginTop"])
      : null;
  const sectionMarginBottom =
    props?.[PREFIX + "SectionMarginBottom"] != null
      ? Number(props[PREFIX + "SectionMarginBottom"])
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
    props?.[PREFIX + "PageContainerBgType"] ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.[PREFIX + "PageContainerBgColorKey"] ?? ""
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
    props?.[PREFIX + "PageContainerPaddingTop"] != null
      ? Number(props[PREFIX + "PageContainerPaddingTop"])
      : null;
  const containerPaddingRight =
    props?.[PREFIX + "PageContainerPaddingRight"] != null
      ? Number(props[PREFIX + "PageContainerPaddingRight"])
      : null;
  const containerPaddingBottom =
    props?.[PREFIX + "PageContainerPaddingBottom"] != null
      ? Number(props[PREFIX + "PageContainerPaddingBottom"])
      : null;
  const containerPaddingLeft =
    props?.[PREFIX + "PageContainerPaddingLeft"] != null
      ? Number(props[PREFIX + "PageContainerPaddingLeft"])
      : null;
  const containerMarginTop =
    props?.[PREFIX + "PageContainerMarginTop"] != null
      ? Number(props[PREFIX + "PageContainerMarginTop"])
      : null;
  const containerMarginBottom =
    props?.[PREFIX + "PageContainerMarginBottom"] != null
      ? Number(props[PREFIX + "PageContainerMarginBottom"])
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
        <div className="fable-section fable-scheme fable-title-paragraph">
        <Row justify="center">
          <Col xs={24} style={getHeaderAlignStyles(titleAlign)}>
            {subTitleEnabled && subTitle && (
              <p
                className="fable-eyebrow"
                style={{ ...(subTitleColor ? { color: subTitleColor } : {}), ...getSubtitleAlignStyles(titleAlign) }}
              >
                {subTitle}
              </p>
            )}
            {titleEnabled && mainTitle && (
              <h2
                className="fable-heading"
                style={{
                  maxWidth: "100%",
                  ...(titleColor ? { color: titleColor } : {}),
                  ...getTitleAlignStyles(titleAlign),
                }}
              >
                {renderHighlightedTitle(mainTitle, props)}
              </h2>
            )}
            {content && (
              <ContentWrapper
                className="fable-prose"
                $textColor={textColor}
                style={{
                  textAlign: paragraphAlign,
                }}
              >
                <SafeHtml html={content} />
              </ContentWrapper>
            )}
          </Col>
        </Row>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
