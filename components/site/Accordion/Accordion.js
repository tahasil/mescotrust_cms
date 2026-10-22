"use client";

import { useEffect, useRef, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { getTitleAlign, getTitleAlignStyles, getSubtitleAlignStyles, getHeaderAlignStyles } from "@/components/site/titleUtils";

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeItem(item, index) {
  const imageDesktop = clean(
    item?.imageDesktop ?? item?.image ?? item?.imageUrl,
  );
  return {
    key: clean(item?.key) || String(index + 1),
    label: clean(item?.label),
    content: clean(item?.content ?? item?.children),
    imageDesktop,
    imageMobile: clean(item?.imageMobile),
    imageAlt: clean(item?.imageAlt) || clean(item?.label),
  };
}

const DEFAULT_ITEMS = [
  {
    label: "Board of Trustees",
    content:
      "The Board of Trustees set the vision and broad guidelines for the organisation and ensure good governance in liaison with the Advisory Board and various committees.",
  },
  {
    label: "Managing Committee",
    content:
      "Members of the Managing Committee are dedicated professionals from diverse backgrounds who develop and review policies and schemes.",
  },
  {
    label: "Sub-Committee",
    content:
      "Sub-committee members work alongside the Managing Committee on specific schemes and programmes.",
  },
];

function resolveColor(props, key, fallback) {
  const colorKey = clean(props?.[key]);
  return getColor(colorKey || fallback);
}

function parseDefaultOpenIndexes(value, totalItems = Infinity) {
  if (value == null) return new Set();
  const str = String(value).trim();
  if (!str) return new Set();

  const tokens = str.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  const indexes = new Set();

  for (const token of tokens) {
    const num = Number(token);
    if (!Number.isFinite(num)) continue;
    const panelNum = Math.floor(num);
    // 0 or negative values mean no panel
    if (panelNum <= 0) continue;
    // 1-based panel index to 0-based array index
    const index = panelNum - 1;
    if (index >= 0 && index < totalItems) {
      indexes.add(index);
    }
  }

  return indexes;
}

function AccordionPanel({
  item,
  index,
  isOpen,
  onToggle,
  customIconUrl,
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(isOpen);
  const [isContentOpen, setIsContentOpen] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsDetailsOpen(true);
      setIsClosing(false);
      const raf = requestAnimationFrame(() => {
        setIsContentOpen(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      if (isDetailsOpen) {
        setIsClosing(true);
        setIsContentOpen(false);
        timerRef.current = setTimeout(() => {
          setIsDetailsOpen(false);
          setIsClosing(false);
        }, 360);
      }
    }
  }, [isOpen, isDetailsOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleToggleClick = (e) => {
    e.preventDefault();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isContentOpen) {
      setIsClosing(true);
      setIsContentOpen(false);
      onToggle(index, false);
      timerRef.current = setTimeout(() => {
        setIsDetailsOpen(false);
        setIsClosing(false);
      }, 360);
    } else {
      setIsDetailsOpen(true);
      setIsClosing(false);
      onToggle(index, true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsContentOpen(true);
        });
      });
    }
  };

  const hasImage = Boolean(item.imageDesktop || item.imageMobile);

  return (
    <details
      open={isDetailsOpen}
      className={`${isContentOpen ? "is-panel-open" : ""} ${
        isClosing ? "is-closing" : ""
      }`}
    >
      <summary onClick={handleToggleClick}>
        <span>{item.label}</span>
        {customIconUrl ? (
          <span
            className="fable-accordion__custom-icon"
            style={{
              backgroundImage: `url(${JSON.stringify(customIconUrl)})`,
            }}
            aria-hidden="true"
          />
        ) : (
          <PlusOutlined
            className="fable-accordion__plus"
            aria-hidden="true"
          />
        )}
      </summary>
      <div
        className={`fable-accordion__collapse${
          isContentOpen ? " is-open" : ""
        }`}
      >
        <div className="fable-accordion__collapse-inner">
          <div
            className={`fable-accordion__body${
              hasImage ? "" : " fable-accordion__body--no-image"
            }`}
          >
            <div className="fable-accordion__content">
              <SafeHtml html={item.content} />
            </div>
            {hasImage ? (
              <div className="fable-accordion__media">
                <picture>
                  {item.imageMobile ? (
                    <source
                      media="(max-width: 767px)"
                      srcSet={item.imageMobile}
                    />
                  ) : null}
                  <img
                    src={item.imageDesktop || item.imageMobile}
                    alt={item.imageAlt}
                    loading="lazy"
                  />
                </picture>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </details>
  );
}

/**
 * Site component: Accordion.
 * Reference-style native details/summary panels with optional responsive images.
 */
export default function Accordion(props) {
  const rawItems = Array.isArray(props?.accordionItems)
    ? props.accordionItems
    : DEFAULT_ITEMS;
  const items = rawItems.map(normalizeItem).filter((item) => item.label);
  const subTitle = clean(props?.accordionSubTitle);
  const mainTitle = clean(props?.accordionMainTitle);
  const titleAlign = getTitleAlign(props, "left", "accordion");
  const customIconUrl = clean(props?.accordionExpandIconUrl);
  const defaultOpenProp = props?.accordionDefaultOpenIndex;
  const [openIndexes, setOpenIndexes] = useState(() =>
    parseDefaultOpenIndexes(defaultOpenProp, items.length),
  );

  useEffect(() => {
    setOpenIndexes(parseDefaultOpenIndexes(defaultOpenProp, items.length));
  }, [defaultOpenProp, items.length]);

  const handleToggle = (index, shouldOpen) => {
    setOpenIndexes((current) => {
      const next = new Set(current);
      if (shouldOpen) next.add(index);
      else next.delete(index);
      return next;
    });
  };

  const colorVars = {
    "--accordion-subtitle": resolveColor(
      props,
      "accordionSubTitleColorKey",
      "primary",
    ),
    "--accordion-title": resolveColor(
      props,
      "accordionTitleColorKey",
      "black",
    ),
    "--accordion-title-accent": resolveColor(
      props,
      "accordionTitleAccentColorKey",
      "black",
    ),
    "--accordion-header": resolveColor(
      props,
      "accordionHeaderColorKey",
      "black",
    ),
    "--accordion-content": resolveColor(
      props,
      "accordionContentColorKey",
      "blackLight",
    ),
    "--accordion-content-strong": resolveColor(
      props,
      "accordionContentStrongColorKey",
      "black",
    ),
    "--accordion-link": resolveColor(
      props,
      "accordionLinkColorKey",
      "primary",
    ),
    "--accordion-link-hover": resolveColor(
      props,
      "accordionLinkHoverColorKey",
      "primaryDark",
    ),
    "--accordion-panel-bg": resolveColor(
      props,
      "accordionBgColorKey",
      "transparent",
    ),
    "--accordion-border": resolveColor(
      props,
      "accordionBorderColorKey",
      "border",
    ),
    "--accordion-icon": resolveColor(
      props,
      "accordionIconColorKey",
      "primary",
    ),
    "--accordion-open-icon": resolveColor(
      props,
      "accordionOpenIconColorKey",
      "primary",
    ),
    "--accordion-focus": resolveColor(
      props,
      "accordionFocusColorKey",
      "primary",
    ),
    "--accordion-image-bg": resolveColor(
      props,
      "accordionImageBgColorKey",
      "surface",
    ),
    "--accordion-image-border": resolveColor(
      props,
      "accordionImageBorderColorKey",
      "border",
    ),
  };

  const sectionBgType = clean(props?.accordionSectionBgType) || "default";
  const sectionBgImage = clean(props?.accordionSectionBgImage);
  const sectionBgColorKey = clean(props?.accordionSectionBgColorKey);
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
    props?.accordionSectionPaddingTop != null
      ? Number(props.accordionSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.accordionSectionPaddingBottom != null
      ? Number(props.accordionSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.accordionSectionMarginTop != null
      ? Number(props.accordionSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.accordionSectionMarginBottom != null
      ? Number(props.accordionSectionMarginBottom)
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

  const pageContainerBgType =
    clean(props?.accordionPageContainerBgType) || "default";
  const pageContainerBgImage = clean(props?.accordionPageContainerBgImage);
  const pageContainerBgColorKey = clean(
    props?.accordionPageContainerBgColorKey,
  );
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
    props?.accordionPageContainerPaddingTop != null
      ? Number(props.accordionPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.accordionPageContainerPaddingRight != null
      ? Number(props.accordionPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.accordionPageContainerPaddingBottom != null
      ? Number(props.accordionPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.accordionPageContainerPaddingLeft != null
      ? Number(props.accordionPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.accordionPageContainerMarginTop != null
      ? Number(props.accordionPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.accordionPageContainerMarginBottom != null
      ? Number(props.accordionPageContainerMarginBottom)
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
    <FullWidthBackground
      className={sectionBgClassName}
      style={sectionBgStyle}
      $managedStyle={sectionBgStyle}
    >
      <PageContainer
        style={pageContainerBgStyle}
        $managedStyle={pageContainerBgStyle}
      >
        <div className="fable-section fable-accordion-section" style={colorVars}>
          {subTitle || mainTitle ? (
            <header className="fable-section-heading" style={getHeaderAlignStyles(titleAlign)}>
              {subTitle ? <p className="fable-eyebrow" style={{ color: "var(--accordion-subtitle)", ...getSubtitleAlignStyles(titleAlign) }}>{subTitle}</p> : null}
              {mainTitle ? (
                <h2 className="fable-heading" style={{ color: "var(--accordion-title)", ...getTitleAlignStyles(titleAlign) }}>{renderHighlightedTitle(mainTitle, props, { legacyColorKey: props?.accordionTitleAccentColorKey })}</h2>
              ) : null}
            </header>
          ) : null}

          <div className="fable-accordion">
            {items.map((item, index) => (
              <AccordionPanel
                key={item.key}
                item={item}
                index={index}
                isOpen={openIndexes.has(index)}
                onToggle={handleToggle}
                customIconUrl={customIconUrl}
              />
            ))}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
