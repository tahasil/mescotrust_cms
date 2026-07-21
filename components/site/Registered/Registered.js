"use client";

import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";

function normalizeItem(it) {
  return {
    text: it?.text != null ? String(it.text).trim() : "",
    iconUrl:
      it?.iconUrl != null
        ? String(it.iconUrl).trim()
        : it?.icon != null
          ? String(it.icon).trim()
          : "",
  };
}

/** Parse *highlighted* parts in text and render as <em> (primary color) */
function RenderCardText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

const DEFAULT_ITEMS = [
  { text: "The Societies Registration Act, *1860.*" },
  { text: "The Bombay Public Trust Act *1950.*" },
  { text: "Section 80-G of the Income Tax, *1961.*" },
  { text: "Foreign Contribution Regulation Act, (FCRA) *2010*, Ministry of Home Affairs. GOI." },
];

/**
 * Site component: Registered (Registered Under).
 * Centered title + 2x2 grid of cards with trademark icon.
 */
export default function Registered(props) {
  const subTitle = (props?.registeredSubTitle ?? props?.registeredMainTitle ?? "Registered Under").toString().trim();
  const mainTitle = (props?.registeredHeading ?? "Accountable, *by design.*").toString().trim();
  const subTitleColorKey = (props?.registeredSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : getColor("primary");
  const titleColorKey = (props?.registeredHeadingColorKey ?? props?.registeredTitleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const cardBgKey = (props?.registeredCardBgColorKey ?? "").toString().trim();
  const cardBg = cardBgKey ? getColor(cardBgKey) : undefined;
  const cardTextKey = (props?.registeredCardTextColorKey ?? "").toString().trim();
  const cardText = cardTextKey ? getColor(cardTextKey) : undefined;
  const iconColorKey = (props?.registeredIconColorKey ?? "").toString().trim();
  const iconColor = iconColorKey ? getColor(iconColorKey) : undefined;

  const rawItems = props?.registeredItems;
  const items =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map(normalizeItem).filter((i) => i.text)
      : DEFAULT_ITEMS;

  const PREFIX = "registered";

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
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <div className="fable-section">
          <header className="fable-section-heading">
            {subTitle ? <p className="fable-eyebrow" style={{ color: subTitleColor }}>{subTitle}</p> : null}
            <h2 className="fable-heading" style={titleColor ? { color: titleColor } : undefined}><RenderCardText text={mainTitle} /></h2>
          </header>
          <div className="fable-badges">
          {items.map((item, index) => (
            <div className="fable-badge" style={cardBg ? { background: cardBg } : undefined} key={`${item.text}-${index}`}>
                {item.iconUrl ? (
                  <span
                    className="fable-badge__icon"
                    style={iconColor ? { color: iconColor } : undefined}
                    aria-hidden="true"
                  >
                    <img src={item.iconUrl} alt="" loading="lazy" />
                  </span>
                ) : null}
                <p style={cardText ? { color: cardText } : undefined}>
                  <RenderCardText text={item.text} />
                </p>
            </div>
          ))}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
