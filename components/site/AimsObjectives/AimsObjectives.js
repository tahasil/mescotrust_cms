"use client";

import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles } from "@/components/site/titleUtils";

function normalizeItem(it) {
  return { text: it?.text != null ? String(it.text).trim() : "" };
}

const ROMAN_NUMERALS = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."];

const DEFAULT_ITEMS = [
  { text: "To promote education amongst the weaker section of society primarily and others generally. The promotion of education shall include the promotion of Science and Literature." },
  { text: "To work for the social upliftment of the backward sections of society." },
  { text: "To bring about a better understanding and appreciation of universal cultural values." },
];

/**
 * Site component: AimsObjectives (Aims & Objectives).
 * Centered title + stacked dark cards with white left border.
 */
export default function AimsObjectives(props) {
  const titleAlign = getTitleAlign(props, "center", "aimsObjectives");
  const subTitle = (props?.aimsObjectivesSubTitle ?? props?.aimsObjectivesMainTitle ?? "Aims & Objectives").toString().trim();
  const mainTitle = (props?.aimsObjectivesHeading ?? "What we *work toward.*").toString().trim();
  const subTitleColorKey = (props?.aimsObjectivesSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : getColor("primary");
  const titleColorKey = (props?.aimsObjectivesHeadingColorKey ?? props?.aimsObjectivesTitleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("black");
  const textColorKey = (props?.aimsObjectivesTextColorKey ?? "").toString().trim();
  const textColor = textColorKey ? getColor(textColorKey) : undefined;
  const numberColorKey = (props?.aimsObjectivesNumberColorKey ?? "").toString().trim();
  const numberColor = numberColorKey ? getColor(numberColorKey) : undefined;
  const borderColorKey = (props?.aimsObjectivesBorderColorKey ?? "").toString().trim();
  const borderColor = borderColorKey ? getColor(borderColorKey) : undefined;

  const rawItems = props?.aimsObjectivesItems;
  const items =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map(normalizeItem).filter((i) => i.text)
      : DEFAULT_ITEMS;

  const PREFIX = "aimsObjectives";

  // Section background
  const sectionBgType = (props?.[PREFIX + "SectionBgType"] ?? "default").toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "").toString().trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.[PREFIX + "SectionPaddingTop"] != null ? Number(props[PREFIX + "SectionPaddingTop"]) : null;
  const sectionPaddingBottom = props?.[PREFIX + "SectionPaddingBottom"] != null ? Number(props[PREFIX + "SectionPaddingBottom"]) : null;
  const sectionMarginTop = props?.[PREFIX + "SectionMarginTop"] != null ? Number(props[PREFIX + "SectionMarginTop"]) : null;
  const sectionMarginBottom = props?.[PREFIX + "SectionMarginBottom"] != null ? Number(props[PREFIX + "SectionMarginBottom"]) : null;
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

  // Page container background
  const pageContainerBgType = (props?.[PREFIX + "PageContainerBgType"] ?? "default").toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.[PREFIX + "PageContainerBgColorKey"] ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop = props?.[PREFIX + "PageContainerPaddingTop"] != null ? Number(props[PREFIX + "PageContainerPaddingTop"]) : null;
  const containerPaddingRight = props?.[PREFIX + "PageContainerPaddingRight"] != null ? Number(props[PREFIX + "PageContainerPaddingRight"]) : null;
  const containerPaddingBottom = props?.[PREFIX + "PageContainerPaddingBottom"] != null ? Number(props[PREFIX + "PageContainerPaddingBottom"]) : null;
  const containerPaddingLeft = props?.[PREFIX + "PageContainerPaddingLeft"] != null ? Number(props[PREFIX + "PageContainerPaddingLeft"]) : null;
  const containerMarginTop = props?.[PREFIX + "PageContainerMarginTop"] != null ? Number(props[PREFIX + "PageContainerMarginTop"]) : null;
  const containerMarginBottom = props?.[PREFIX + "PageContainerMarginBottom"] != null ? Number(props[PREFIX + "PageContainerMarginBottom"]) : null;
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
        <div className="fable-section">
          <header className="fable-section-heading" style={getHeaderAlignStyles(titleAlign)}>
            {subTitle ? <p className="fable-eyebrow" style={{ color: subTitleColor, ...getSubtitleAlignStyles(titleAlign) }}>{subTitle}</p> : null}
            {mainTitle ? <h2 className="fable-heading" style={{ color: titleColor, ...getTitleAlignStyles(titleAlign) }}>{renderHighlightedTitle(mainTitle, props)}</h2> : null}
          </header>
          <div className="fable-aims">
            {items.map((item, index) => (
              <div className="fable-aim" key={`${item.text}-${index}`} style={borderColor ? { borderColor } : undefined}>
                <span className="fable-aim__number" style={numberColor ? { color: numberColor } : undefined} aria-hidden="true">
                  {ROMAN_NUMERALS[index] || `${index + 1}.`}
                </span>
                <p style={textColor ? { color: textColor } : undefined}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
