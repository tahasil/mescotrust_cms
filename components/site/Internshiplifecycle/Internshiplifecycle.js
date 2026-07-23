"use client";

import styled from "styled-components";
import { FullWidthBackground, PageContainer, getColor } from "@/styles/Theme";
import { getInternshipLifecycleDefaults } from "./constants";

const TimelineSection = styled.div`
  width: 100%;
  position: relative;
  --timeline-title-size: ${(p) => `${p.$titleSize}px`};
  --timeline-title-weight: ${(p) => p.$titleWeight};
  --timeline-title-line-height: ${(p) => p.$titleLineHeight};
  --timeline-title-letter-spacing: ${(p) => `${p.$titleLetterSpacing}px`};
  --timeline-circle-size: ${(p) => `${p.$circleSize}px`};
  --timeline-icon-size: ${(p) => `${p.$iconSize}px`};
  --timeline-step-gap: ${(p) => `${p.$stepGap}px`};
  --timeline-title-color: ${(p) => p.$titleColor};
  --timeline-description-color: ${(p) => p.$descriptionColor};
  --timeline-circle-bg: ${(p) => p.$circleBg};
  --timeline-circle-bg-hover: ${(p) => p.$circleHoverBg};
  --timeline-icon-color: ${(p) => p.$iconColor};
  --timeline-icon-hover-color: ${(p) => p.$iconHoverColor};
  --timeline-connector-color: ${(p) => p.$connectorColor};
  --timeline-connector-color-safe: ${(p) => p.$connectorColor || "#d9d9d9"};
  --timeline-mobile-row-gap: 18px;
  --timeline-mobile-content-gap: 12px;

  .internshipLifecycleTitle {
    margin: 0;
    color: var(--timeline-title-color);
    font-family: ${(p) =>
      p.$titleFontFamily ? p.$titleFontFamily : "inherit"};
    font-size: var(--timeline-title-size);
    font-weight: var(--timeline-title-weight);
    line-height: var(--timeline-title-line-height);
    letter-spacing: var(--timeline-title-letter-spacing);
    text-transform: ${(p) => p.$titleTextTransform || "none"};
  }

  .internshipLifecycleTrack {
    position: relative;
    margin-top: clamp(18px, 2.5vw, 32px);
    isolation: isolate;
  }

  .internshipLifecycleTrack::before {
    content: "";
    position: absolute;
    left: calc(var(--timeline-circle-size) / 2);
    right: calc(var(--timeline-circle-size) / 2);
    top: calc(var(--timeline-circle-size) / 2);
    border-top: 2px dotted var(--timeline-connector-color-safe);
    opacity: 1;
    z-index: 0;
    pointer-events: none;
  }

  .internshipLifecycleGrid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(var(--timeline-columns, 5), minmax(0, 1fr));
    gap: var(--timeline-step-gap);
  }

  .internshipLifecycleStep {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .internshipLifecycleStepContent {
    width: 100%;
    margin-top: 14px;
  }

  .internshipLifecycleCircle {
    width: var(--timeline-circle-size);
    height: var(--timeline-circle-size);
    border-radius: 999px;
    margin: 0 auto;
    background: var(--timeline-circle-bg);
    display: grid;
    place-items: center;
    transition:
      background-color 0.25s ease,
      transform 0.25s ease;
  }

  .internshipLifecycleIconMask {
    position: relative;
    width: var(--timeline-icon-size);
    height: var(--timeline-icon-size);
    display: inline-block;
    flex-shrink: 0;
  }

  .internshipLifecycleIconMaskLayer {
    position: absolute;
    inset: 0;
    display: block;
    transition: opacity 0.25s ease;
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  .internshipLifecycleIconMaskDefault {
    opacity: 1;
    background: var(--timeline-icon-color);
  }

  .internshipLifecycleIconMaskHover {
    opacity: 0;
    background: var(--timeline-icon-hover-color);
  }

  .internshipLifecycleText {
    text-align: center;
    color: var(--timeline-description-color);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.2;
    letter-spacing: 0;
    text-wrap: balance;
  }

  .internshipLifecycleDescription {
    margin-top: 6px;
    text-align: center;
    color: var(--timeline-description-color);
    font-weight: 500;
    font-size: 14px;
    line-height: 1.45;
    opacity: 0.95;
    white-space: pre-line;
  }

  .internshipLifecycleStep.isHighlighted .internshipLifecycleCircle,
  .internshipLifecycleStep:hover .internshipLifecycleCircle {
    background: var(--timeline-circle-bg-hover);
    transform: translateY(-2px);
  }

  .internshipLifecycleStep.isHighlighted .internshipLifecycleIconMaskDefault,
  .internshipLifecycleStep:hover .internshipLifecycleIconMaskDefault {
    opacity: 0;
  }

  .internshipLifecycleStep.isHighlighted .internshipLifecycleIconMaskHover,
  .internshipLifecycleStep:hover .internshipLifecycleIconMaskHover {
    opacity: 1;
  }

  @media (max-width: 1200px) {
    .internshipLifecycleGrid {
      gap: clamp(20px, 2.2vw, var(--timeline-step-gap));
    }
    .internshipLifecycleTitle {
      font-size: min(var(--timeline-title-size), 48px);
    }
    .internshipLifecycleText {
      font-size: 15px;
    }
  }

  @media (max-width: 900px) {
    .internshipLifecycleTrack::before {
      display: none;
    }

    .internshipLifecycleGrid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .internshipLifecycleStep {
      display: grid;
      grid-template-columns: var(--timeline-circle-size) minmax(0, 1fr);
      column-gap: var(--timeline-mobile-content-gap);
      align-items: flex-start;
      padding-bottom: 0;
    }

    .internshipLifecycleStep:not(.isLast) {
      padding-bottom: var(--timeline-mobile-row-gap);
    }

    .internshipLifecycleStepContent {
      margin-top: 2px;
      min-height: calc(var(--timeline-circle-size) - 2px);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .internshipLifecycleCircle {
      margin: 0;
    }

    .internshipLifecycleStep:not(.isLast)::after {
      content: "";
      position: absolute;
      top: calc(var(--timeline-circle-size) + 6px);
      bottom: 0;
      left: calc(var(--timeline-circle-size) / 2);
      border-left: 2px dotted var(--timeline-connector-color-safe);
      pointer-events: none;
    }

    .internshipLifecycleText {
      text-align: left;
      font-size: 15px;
      line-height: 1.25;
    }

    .internshipLifecycleDescription {
      text-align: left;
      font-size: 13px;
      line-height: 1.45;
    }

    .internshipLifecycleStep.isHighlighted .internshipLifecycleCircle,
    .internshipLifecycleStep:hover .internshipLifecycleCircle {
      transform: none;
    }
  }

  @media (max-width: 767px) {
    .internshipLifecycleTitle {
      font-size: min(var(--timeline-title-size), 34px);
      line-height: 1.15;
    }
    .internshipLifecycleText {
      font-size: 14px;
    }
    .internshipLifecycleDescription {
      font-size: 13px;
    }
  }

  @media (max-width: 460px) {
    .internshipLifecycleStep {
      grid-template-columns: calc(var(--timeline-circle-size) - 4px) minmax(0, 1fr);
      column-gap: 10px;
    }
    .internshipLifecycleStep:not(.isLast)::after {
      left: calc((var(--timeline-circle-size) - 4px) / 2);
    }
  }
`;

function toMaskUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const escaped = value.replace(/"/g, '\\"');
  return `url("${escaped}")`;
}

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
  const data = getInternshipLifecycleDefaults(props);
  const titleColor = getColor(data.titleColorKey);
  const descriptionColor = getColor(
    data.internshiplifecycleDescriptionColorKey,
  );
  const circleBg = getColor(data.internshiplifecycleCircleBgColorKey);
  const circleHoverBg = getColor(data.internshiplifecycleCircleHoverBgColorKey);
  const iconColor = getColor(data.internshiplifecycleIconColorKey);
  const iconHoverColor = getColor(data.internshiplifecycleIconHoverColorKey);
  const connectorColor = getColor(data.internshiplifecycleConnectorColorKey);
  const { sectionBgClassName, sectionBgStyle } = getSectionStyles(props);
  const { pageContainerBgStyle } = getContainerStyles(props);

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        <TimelineSection
          $titleColor={titleColor}
          $descriptionColor={descriptionColor}
          $circleBg={circleBg}
          $circleHoverBg={circleHoverBg}
          $iconColor={iconColor}
          $iconHoverColor={iconHoverColor}
          $connectorColor={connectorColor}
          $titleFontFamily={data.internshiplifecycleTitleFontFamily}
          $titleTextTransform={data.internshiplifecycleTitleTextTransform}
          $titleSize={data.internshiplifecycleTitleFontSize}
          $titleWeight={data.internshiplifecycleTitleFontWeight}
          $titleLineHeight={data.internshiplifecycleTitleLineHeight}
          $titleLetterSpacing={data.internshiplifecycleTitleLetterSpacing}
          $circleSize={data.internshiplifecycleCircleSize}
          $iconSize={data.internshiplifecycleIconSize}
          $stepGap={data.internshiplifecycleStepGap}
        >
          <h2 className="internshipLifecycleTitle">{data.mainTitle}</h2>

          <div className="internshipLifecycleTrack">
            <div
              className="internshipLifecycleGrid"
              style={{
                "--timeline-columns": Math.max(
                  data.internshiplifecycleItems.length,
                  1,
                ),
              }}
            >
              {data.internshiplifecycleItems.map((item, index) => {
                const iconMask = toMaskUrl(item.icon);
                const isLast =
                  index === data.internshiplifecycleItems.length - 1;
                return (
                  <div
                    key={`${item.title || "step"}-${index}`}
                    className={`internshipLifecycleStep${item.highlighted ? " isHighlighted" : ""}${isLast ? " isLast" : ""}`}
                  >
                    <div className="internshipLifecycleCircle">
                      {iconMask ? (
                        <span
                          className="internshipLifecycleIconMask"
                          aria-hidden
                        >
                          <span
                            className="internshipLifecycleIconMaskLayer internshipLifecycleIconMaskDefault"
                            style={{
                              WebkitMaskImage: iconMask,
                              maskImage: iconMask,
                            }}
                          />
                          <span
                            className="internshipLifecycleIconMaskLayer internshipLifecycleIconMaskHover"
                            style={{
                              WebkitMaskImage: iconMask,
                              maskImage: iconMask,
                            }}
                          />
                        </span>
                      ) : null}
                    </div>
                    <div className="internshipLifecycleStepContent">
                      <div className="internshipLifecycleText">{item.title}</div>
                      {item.description ? (
                        <div className="internshipLifecycleDescription">
                          {item.description}
                        </div>
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
