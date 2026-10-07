"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import ReactMarquee from "react-fast-marquee";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

function fetchMarquee() {
  return fetch("/api/theme/marquee", {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
}

const PartnersSection = styled.section`
  width: 100%;
  position: relative;
  background: transparent;
  overflow: visible;
  /* border-top: 1px solid ${getColor("border")}; */

  .partners-head {
    width: 100%;
    margin: 0 0 40px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .partners-sub-title {
    margin: 0;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.4;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .partners-note {
    margin: 0;
    color: ${getColor("blackMuted")};
    font-size: 15px;
    line-height: 1.6;
  }

  .partners-marquee {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    overflow: hidden;
    ${(p) =>
    p.$showGradient
      ? `
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    `
      : ""}
  }

  .marquee-item {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0;
    margin-right: clamp(40px, 5.5vw, 88px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .marquee-item picture {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: var(--marquee-image-max-width, 190px);
    width: auto;
  }

  .marquee-item img {
    display: block;
    width: auto;
    max-width: var(--marquee-image-max-width, 190px);
    height: auto;
    max-height: 84px;
    object-fit: contain;
    // filter: grayscale(1);
    // opacity: 0.72;
    transition: filter 0.3s ease, opacity 0.3s ease;
  }

  .marquee-item img:hover {
    filter: none;
    opacity: 1;
  }

  @media (max-width: 768px) {
    .partners-head {
      width: 100%;
    }

    .marquee-item {
      margin-right: clamp(24px, 4vw, 44px);
    }

    .marquee-item picture {
      max-width: min(var(--marquee-image-max-width, 190px), clamp(90px, 32vw, 150px));
    }

    .marquee-item img {
      max-width: min(var(--marquee-image-max-width, 190px), clamp(90px, 32vw, 150px));
      max-height: 60px;
    }
  }

  @media (max-width: 480px) {
    .marquee-item {
      margin-right: clamp(16px, 3.5vw, 30px);
    }

    .marquee-item picture {
      max-width: min(var(--marquee-image-max-width, 190px), clamp(75px, 28vw, 120px));
    }

    .marquee-item img {
      max-width: min(var(--marquee-image-max-width, 190px), clamp(75px, 28vw, 120px));
      max-height: 48px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rfm-marquee {
      animation-play-state: paused !important;
    }

    .marquee-item img {
      transition: none;
    }
  }
`;

function normalizeImageItem(item) {
  if (typeof item === "string") {
    const url = item.trim();
    return {
      desktop: url,
      mobile: "",
      alt: "Partner",
      key: url,
    };
  }
  const desktop =
    item?.urlDesktop != null
      ? String(item.urlDesktop).trim()
      : item?.url != null
        ? String(item.url).trim()
        : item?.src != null
          ? String(item.src).trim()
          : "";
  const mobile =
    item?.urlMobile != null
      ? String(item.urlMobile).trim()
      : item?.mobileImage != null
        ? String(item.mobileImage).trim()
        : "";
  return {
    desktop,
    mobile,
    alt:
      item?.alt != null && String(item.alt).trim()
        ? String(item.alt).trim()
        : "Partner",
    key: desktop || mobile || "partner",
  };
}

/**
 * Site component: Marquee — CSR Partners / Awards & Recognition scrolling strip.
 * Data source: page block props (marqueeTitle, marqueeItems from pages collection) first, else theme API (components collection).
 */
export default function Marquee(props) {
  const [data, setData] = useState(null);
  const fromPage =
    props?.marqueeTitle != null ||
    props?.marqueePartnersTitle != null ||
    props?.marqueeAwardsTitle != null ||
    (Array.isArray(props?.marqueeItems) && props.marqueeItems.length > 0) ||
    props?.title != null ||
    (Array.isArray(props?.images) && props.images.length > 0);

  useEffect(() => {
    if (fromPage) return;
    fetchMarquee().then(setData);
  }, [fromPage]);

  const title =
    (props?.marqueeTitle != null && String(props.marqueeTitle).trim() !== ""
      ? String(props.marqueeTitle).trim()
      : null) ??
    props?.title ??
    (data?.marqueeTitle != null && String(data.marqueeTitle).trim() !== ""
      ? String(data.marqueeTitle).trim()
      : null) ??
    "";
  const imageItems =
    Array.isArray(props?.marqueeItems) && props.marqueeItems.length > 0
      ? props.marqueeItems
      : Array.isArray(props?.images) && props.images.length > 0
        ? props.images
        : Array.isArray(data?.marqueeItems) && data.marqueeItems.length > 0
          ? data.marqueeItems
          : [];

  if (imageItems.length === 0) return null;

  const settings = fromPage ? props : { ...(data || {}), ...(props || {}) };
  const titleParts = String(title || "")
    .split("|")
    .map((part) => part.trim());
  const legacyPartnersTitle = titleParts.shift() || "";
  const legacyAwardsTitle = titleParts.join(" | ");
  const partnersTitle =
    settings?.marqueePartnersTitle != null
      ? String(settings.marqueePartnersTitle).trim()
      : legacyPartnersTitle;
  const awardsTitle =
    settings?.marqueeAwardsTitle != null
      ? String(settings.marqueeAwardsTitle).trim()
      : legacyAwardsTitle;
  const partnersTitleColor = getColor(
    settings?.marqueePartnersTitleColorKey ||
    settings?.marqueeTitleColorKey ||
    "black",
  );
  const awardsTitleColor = getColor(
    settings?.marqueeAwardsTitleColorKey || "blackMuted",
  );
  const showGradient = settings?.gradient !== false;

  const sectionBgType = String(
    settings?.marqueeSectionBgType ?? "default",
  );
  const sectionBgImage = String(
    settings?.marqueeSectionBgImage ?? "",
  ).trim();
  const sectionBgColorKey = String(
    settings?.marqueeSectionBgColorKey ?? "",
  ).trim();
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
  const sectionSpacing = {
    paddingTop: settings?.marqueeSectionPaddingTop,
    paddingBottom: settings?.marqueeSectionPaddingBottom,
    marginTop: settings?.marqueeSectionMarginTop,
    marginBottom: settings?.marqueeSectionMarginBottom,
  };
  const sectionBgStyle = {
    ...(sectionBgStyleBase || {}),
    ...Object.fromEntries(
      Object.entries(sectionSpacing)
        .filter(
          ([, value]) =>
            value != null &&
            value !== "" &&
            Number.isFinite(Number(value)) &&
            Number(value) >= 0,
        )
        .map(([key, value]) => [key, `${Number(value)}px`]),
    ),
  };

  const pageContainerBgType = String(
    settings?.marqueePageContainerBgType ?? "default",
  );
  const pageContainerBgImage = String(
    settings?.marqueePageContainerBgImage ?? "",
  ).trim();
  const pageContainerBgColorKey = String(
    settings?.marqueePageContainerBgColorKey ?? "",
  ).trim();
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
  const pageContainerSpacing = {
    paddingTop: settings?.marqueePageContainerPaddingTop,
    paddingRight: settings?.marqueePageContainerPaddingRight,
    paddingBottom: settings?.marqueePageContainerPaddingBottom,
    paddingLeft: settings?.marqueePageContainerPaddingLeft,
    marginTop: settings?.marqueePageContainerMarginTop,
    marginBottom: settings?.marqueePageContainerMarginBottom,
  };
  const pageContainerBgStyle = {
    ...(pageContainerBgStyleBase || {}),
    ...Object.fromEntries(
      Object.entries(pageContainerSpacing)
        .filter(
          ([, value]) =>
            value != null &&
            value !== "" &&
            Number.isFinite(Number(value)) &&
            Number(value) >= 0,
        )
        .map(([key, value]) => [key, `${Number(value)}px`]),
    ),
  };

  const formatMaxWidth = (val, fallback = "190px") => {
    if (!val) return fallback;
    const s = String(val).trim();
    if (!s) return fallback;
    if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
    return s;
  };

  const imageMaxWidth = formatMaxWidth(
    settings?.marqueeImageMaxWidth ?? settings?.imageMaxWidth,
    "190px",
  );

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <PartnersSection
          className="site-component-marquee"
          data-component="Marquee"
          $showGradient={showGradient}
          style={{ "--marquee-image-max-width": imageMaxWidth }}
          aria-label={
            [partnersTitle, awardsTitle].filter(Boolean).join(" | ") ||
            undefined
          }
        >
          {partnersTitle || awardsTitle ? (
            <div className="partners-head">
              {partnersTitle ? (
                <h2
                  className="partners-sub-title"
                  style={{ color: partnersTitleColor }}
                >
                  {renderHighlightedTitle(partnersTitle, settings)}
                </h2>
              ) : null}
              {awardsTitle ? (
                <p
                  className="partners-note"
                  style={{ color: awardsTitleColor }}
                >
                  {renderHighlightedTitle(awardsTitle, settings)}
                </p>
              ) : null}
            </div>
          ) : null}
          <ReactMarquee
            className="partners-marquee"
            loop={0}
            speed={settings?.speed ?? 25}
            pauseOnHover={settings?.pauseOnHover !== false}
            gradient={false}
            autoFill={true}
          >
            {imageItems.map((rawItem, i) => {
              const item = normalizeImageItem(rawItem);
              const desktop = item.desktop || item.mobile;
              if (!desktop) return null;
              return (
                <div key={`${i}-${item.key}`} className="marquee-item">
                  <picture>
                    {item.mobile ? (
                      <source
                        media="(max-width: 767px)"
                        srcSet={item.mobile}
                      />
                    ) : null}
                    <img
                      loading="lazy"
                      className="img-fluid"
                      src={desktop}
                      alt={item.alt}
                    />
                  </picture>
                </div>
              );
            })}
          </ReactMarquee>
        </PartnersSection>
      </PageContainer>
    </FullWidthBackground>
  );
}
