"use client";

import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";

function normalizeItem(it, idx) {
  return {
    key: String(idx + 1),
    label: it?.label != null ? String(it.label).trim() : "",
    children: it?.content != null ? String(it.content).trim() : "",
  };
}

const DEFAULT_ITEMS = [
  {
    label: "Board of Trustees",
    content:
      "The Board of Trustees set the vision and broad guidelines for the organization and ensure good governance in liaison with the Advisory Board and various Committees.",
  },
  {
    label: "Managing Committee",
    content:
      "Members of Managing Committee are dedicated professionals and individuals from diverse backgrounds and experts in social engineering.",
  },
  {
    label: "Sub-Committee",
    content:
      "Members of the sub-committee are present in the monthly meetings and express their point of views and share their experiences regarding matters which are being discussed.",
  },
];

/**
 * Site component: Accordion.
 * Styled collapsible panels with repeater items.
 */
export default function Accordion(props) {
  const rawItems = Array.isArray(props?.accordionItems)
    ? props.accordionItems
    : DEFAULT_ITEMS;
  const normalizedItems = rawItems.map(normalizeItem).filter((it) => it.label);
  const customIconUrl = (props?.accordionExpandIconUrl ?? "").toString().trim();

  const headerColorKey = (props?.accordionHeaderColorKey ?? "")
    .toString()
    .trim();
  const headerColor = headerColorKey ? getColor(headerColorKey) : undefined;
  const contentColorKey = (props?.accordionContentColorKey ?? "")
    .toString()
    .trim();
  const contentColor = contentColorKey ? getColor(contentColorKey) : undefined;
  const borderColorKey = (props?.accordionBorderColorKey ?? "")
    .toString()
    .trim();
  const borderColor = borderColorKey ? getColor(borderColorKey) : undefined;
  const panelBgColorKey = (props?.accordionBgColorKey ?? "").toString().trim();
  const panelBgColor = panelBgColorKey ? getColor(panelBgColorKey) : undefined;

  const PREFIX = "accordion";

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
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <div className="fable-section fable-accordion">
          {normalizedItems.map((item, index) => (
            <details
              key={item.key}
              open={index === 0}
              style={{
                background: panelBgColor,
                borderColor,
              }}
            >
              <summary style={headerColor ? { color: headerColor } : undefined}>
                <span>{item.label}</span>
                {customIconUrl ? (
                  <img src={customIconUrl} alt="" width="22" height="22" />
                ) : (
                  <span className="fable-accordion__plus" aria-hidden="true">+</span>
                )}
              </summary>
              <div className="fable-accordion__body" style={contentColor ? { color: contentColor } : undefined}>
                <SafeHtml html={item.children || ""} />
              </div>
            </details>
          ))}
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
