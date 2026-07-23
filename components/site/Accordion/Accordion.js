"use client";

import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";

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

function renderTitle(value) {
  return clean(value)
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      ),
    );
}

function resolveColor(props, key, fallback) {
  const colorKey = clean(props?.[key]);
  return getColor(colorKey || fallback);
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
  const customIconUrl = clean(props?.accordionExpandIconUrl);
  const defaultOpenIndex = Math.max(
    -1,
    Math.min(
      items.length - 1,
      Number.isFinite(Number(props?.accordionDefaultOpenIndex))
        ? Math.floor(Number(props.accordionDefaultOpenIndex))
        : 0,
    ),
  );
  const [openIndexes, setOpenIndexes] = useState(
    () => new Set(defaultOpenIndex >= 0 ? [defaultOpenIndex] : []),
  );

  useEffect(() => {
    setOpenIndexes(new Set(defaultOpenIndex >= 0 ? [defaultOpenIndex] : []));
  }, [defaultOpenIndex]);

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
  const sectionBgStyle = {
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
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer>
        <div className="fable-section fable-accordion-section" style={colorVars}>
          {subTitle || mainTitle ? (
            <header className="fable-section-heading">
              {subTitle ? <p className="fable-eyebrow">{subTitle}</p> : null}
              {mainTitle ? (
                <h2 className="fable-heading">{renderTitle(mainTitle)}</h2>
              ) : null}
            </header>
          ) : null}

          <div className="fable-accordion">
            {items.map((item, index) => {
              const hasImage = Boolean(item.imageDesktop || item.imageMobile);
              return (
                <details
                  key={item.key}
                  open={openIndexes.has(index)}
                  onToggle={(event) => {
                    const shouldOpen = event.currentTarget.open;
                    setOpenIndexes((current) => {
                      const next = new Set(current);
                      if (shouldOpen) next.add(index);
                      else next.delete(index);
                      return next;
                    });
                  }}
                >
                  <summary>
                    <span>{item.label}</span>
                    {customIconUrl ? (
                      <span
                        className="fable-accordion__custom-icon"
                        style={{
                          WebkitMaskImage: `url(${customIconUrl})`,
                          maskImage: `url(${customIconUrl})`,
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
                </details>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
