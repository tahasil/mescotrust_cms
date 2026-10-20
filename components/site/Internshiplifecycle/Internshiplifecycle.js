"use client";

import styled from "styled-components";
import { FullWidthBackground, PageContainer, getColor } from "@/styles/Theme";
import { getInternshipLifecycleDefaults } from "./constants";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles } from "@/components/site/titleUtils";

const TimelineSection = styled.div`
  width: 100%;
  position: relative;
  margin-inline: auto;
  --timeline-description-color: ${(p) => p.$descriptionColor};
  --timeline-accent-color: ${(p) => p.$accentColor};
  --timeline-connector-color: ${(p) => p.$connectorColor};
  --timeline-connector-color-safe: ${(p) => p.$connectorColor || "#d9d9d9"};

  .internshipLifecycleTitle {
    margin: 0;
    padding-bottom: 22px;
    color: var(--timeline-accent-color);
    border-bottom: 1px solid var(--timeline-connector-color-safe);
    font-family: ${(p) =>
      p.$titleFontFamily ? p.$titleFontFamily : "inherit"};
    font-size: clamp(11px, 0.9vw, 13px);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .internshipLifecycleTrack {
    position: relative;
  }

  .internshipLifecycleGrid {
    display: block;
  }

  .internshipLifecycleStep {
    min-width: 0;
    min-height: 96px;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    align-items: center;
    gap: clamp(18px, 2.4vw, 36px);
    padding: 22px 0;
    border-bottom: 1px solid var(--timeline-connector-color-safe);
  }

  .internshipLifecycleStepContent {
    width: 100%;
    min-width: 0;
  }

  .internshipLifecycleNumber {
    color: var(--timeline-accent-color);
    font-family: var(--fable-display, inherit);
    font-size: clamp(26px, 2.2vw, 34px);
    font-weight: 620;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .internshipLifecycleText,
  .internshipLifecycleDescription {
    margin: 0;
    text-align: left;
    color: var(--timeline-description-color);
    font-weight: 560;
    font-size: clamp(15px, 1.25vw, 18px);
    line-height: 1.5;
    letter-spacing: 0;
    white-space: pre-line;
  }

  @media (max-width: 767px) {
    .internshipLifecycleTitle {
      padding-bottom: 16px;
      font-size: 11px;
    }

    .internshipLifecycleStep {
      min-height: 82px;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 12px;
      padding: 18px 0;
    }

    .internshipLifecycleNumber {
      font-size: 26px;
    }

    .internshipLifecycleText,
    .internshipLifecycleDescription {
      font-size: 14px;
      line-height: 1.45;
    }
  }
`;

function getSectionStyles(props) {
  const sectionBgType = (
    props?.internshiplifecycleSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.internshiplifecycleSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.internshiplifecycleSectionBgColorKey ?? "")
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
    props?.internshiplifecycleSectionPaddingTop != null
      ? Number(props.internshiplifecycleSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.internshiplifecycleSectionPaddingBottom != null
      ? Number(props.internshiplifecycleSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.internshiplifecycleSectionMarginTop != null
      ? Number(props.internshiplifecycleSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.internshiplifecycleSectionMarginBottom != null
      ? Number(props.internshiplifecycleSectionMarginBottom)
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
  return { sectionBgClassName, sectionBgStyle };
}

function getContainerStyles(props) {
  const pageContainerBgType = (
    props?.internshiplifecyclePageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.internshiplifecyclePageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.internshiplifecyclePageContainerBgColorKey ?? ""
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
    props?.internshiplifecyclePageContainerPaddingTop != null
      ? Number(props.internshiplifecyclePageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.internshiplifecyclePageContainerPaddingRight != null
      ? Number(props.internshiplifecyclePageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.internshiplifecyclePageContainerPaddingBottom != null
      ? Number(props.internshiplifecyclePageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.internshiplifecyclePageContainerPaddingLeft != null
      ? Number(props.internshiplifecyclePageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.internshiplifecyclePageContainerMarginTop != null
      ? Number(props.internshiplifecyclePageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.internshiplifecyclePageContainerMarginBottom != null
      ? Number(props.internshiplifecyclePageContainerMarginBottom)
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
  return { pageContainerBgStyle };
}

/**
 * Site component: Internshiplifecycle.
 * Figma timeline layout rendered from drawer-controlled props only.
 */
export default function Internshiplifecycle(props) {
  const titleAlign = getTitleAlign(props, "left", "internshiplifecycle");
  const data = getInternshipLifecycleDefaults(props);
  const descriptionColor = getColor(
    data.internshiplifecycleDescriptionColorKey,
  );
  const accentColor = getColor(data.internshiplifecycleAccentColorKey);
  const connectorColor = getColor(data.internshiplifecycleConnectorColorKey);
  const { sectionBgClassName, sectionBgStyle } = getSectionStyles(props);
  const { pageContainerBgStyle } = getContainerStyles(props);

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        <TimelineSection
          $descriptionColor={descriptionColor}
          $accentColor={accentColor}
          $connectorColor={connectorColor}
          $titleFontFamily={data.internshiplifecycleTitleFontFamily}
        >
          <h2 className="internshipLifecycleTitle" style={getTitleAlignStyles(titleAlign)}>{renderHighlightedTitle(data.mainTitle, props)}</h2>

          <div className="internshipLifecycleTrack">
            <div className="internshipLifecycleGrid">
              {data.internshiplifecycleItems.map((item, index) => {
                return (
                  <div
                    key={`${item.title || "step"}-${index}`}
                    className="internshipLifecycleStep"
                  >
                    <div className="internshipLifecycleNumber" aria-hidden>
                      {index + 1}.
                    </div>
                    <div className="internshipLifecycleStepContent">
                      <span className="internshipLifecycleText">{item.title}</span>
                      {item.description ? (
                        <span className="internshipLifecycleDescription">
                          {` — ${item.description}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TimelineSection>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
