"use client";

import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";

/* ── Styled Components ── */
const Recognition = styled.div`
  .recognition-heading {
    max-width: 16ch;
    margin: 0 0 clamp(32px, 4vw, 56px);
    font-family: var(--fable-display);
    font-size: clamp(36px, 4.6vw, 64px);
    font-weight: 620;
    line-height: 1.08;
    letter-spacing: -.02em;
  }
  .recognition-award {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: clamp(20px, 3vw, 48px);
    align-items: start;
    padding-block: clamp(24px, 2.8vw, 38px);
    border-bottom: 1px solid var(--fable-border);
    transition: padding-left .3s cubic-bezier(.16, 1, .3, 1);
  }
  .recognition-award:first-of-type { border-top: 1px solid var(--fable-border); }
  .recognition-award:hover { padding-left: 10px; }
  .recognition-year {
    min-height: 1em;
    color: var(--recognition-accent, var(--fable-primary));
    font-family: var(--fable-display);
    font-size: clamp(22px, 2.4vw, 34px);
    font-weight: 650;
    line-height: 1.2;
  }
  .recognition-title {
    margin: 0 0 6px;
    font-family: var(--fable-display);
    font-size: clamp(19px, 1.9vw, 26px);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -.01em;
  }
  .recognition-text {
    max-width: 62ch;
    margin: 0;
    color: var(--fable-ink-soft);
    font-size: 15.5px;
    line-height: 1.5;
  }
  @media (max-width: 576px) {
    .recognition-heading { font-size: clamp(32px, 10vw, 48px); }
    .recognition-award { grid-template-columns: 72px minmax(0, 1fr); }
  }
  @media (prefers-reduced-motion: reduce) {
    .recognition-award { transition: none; }
    .recognition-award:hover { padding-left: 0; }
  }
`;

function legacyAwardMeta(item) {
  const text = (item?.text ?? "").toString().trim();
  let year = (item?.year ?? "").toString().trim();
  let heading = (item?.heading ?? "").toString().trim();
  if (!year && /18th February 2016|Certificate of Merit/i.test(text)) year = "2016";
  if (!year && /BSE SAMMAAN|29th April 2015/i.test(text)) year = "2015";
  if (!heading && /Certificate of Merit/i.test(text)) heading = "Certificate of Merit — The World CSR Day";
  if (!heading && /BSE SAMMAAN/i.test(text)) heading = "BSE Sammaan Empanelment";
  if (!heading && /Guide Star|GuideStar/i.test(text)) heading = "Guide Star Gold Transparency Award";
  return { year, heading, text };
}

/**
 * Site component: Alerts, presented as the CSR recognition timeline.
 */
export default function Alerts(props) {
  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.alertsTitleEnabled !== false;
  const subTitleEnabled = props?.alertsSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("black");
  const subTitleColorKey = (props?.alertsSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const iconColorKey = (props?.alertsIconColorKey ?? "").toString().trim();
  const iconColor = iconColorKey ? getColor(iconColorKey) : "#E03C33";
  const headingColorKey = (props?.alertsHeadingColorKey ?? "")
    .toString()
    .trim();
  const headingColor = headingColorKey ? getColor(headingColorKey) : undefined;
  const textColorKey = (props?.alertsTextColorKey ?? "").toString().trim();
  const textColor = textColorKey ? getColor(textColorKey) : undefined;

  /* ── Items ── */
  const items = Array.isArray(props?.alertsItems) ? props.alertsItems : [];

  /* ── Section bg ── */
  const PREFIX = "alerts";
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

  const recognitionItems = items
    .map((item, originalIndex) => ({ ...legacyAwardMeta(item), originalIndex }))
    .sort((a, b) => {
      const aYear = Number.parseInt(a.year, 10) || 0;
      const bYear = Number.parseInt(b.year, 10) || 0;
      return bYear - aYear || a.originalIndex - b.originalIndex;
    });

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <Recognition className="fable-section" style={{ "--recognition-accent": iconColor }}>
          {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) ? (
            <header>
              {subTitleEnabled && subTitle ? (
                <p className="fable-eyebrow" style={subTitleColor ? { color: subTitleColor } : undefined}>{subTitle}</p>
              ) : null}
              {titleEnabled && mainTitle ? (
                <h2 className="recognition-heading" style={{ color: titleColor }}>{mainTitle}</h2>
              ) : null}
            </header>
          ) : null}
          {recognitionItems.map(({ year, heading, text, originalIndex }) => {
            return (
              <div className="recognition-award" key={originalIndex}>
                <span className="recognition-year">{year || "\u00a0"}</span>
                <div>
                  {heading ? (
                    <h3 className="recognition-title" style={headingColor ? { color: headingColor } : undefined}>
                      {heading}
                    </h3>
                  ) : null}
                  {text ? (
                    <p className="recognition-text" style={textColor ? { color: textColor } : undefined}>
                      {text}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </Recognition>
      </PageContainer>
    </FullWidthBackground>
  );
}
