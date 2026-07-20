"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import ReactMarquee from "react-fast-marquee";
import { getColor } from "@/styles/Theme";

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
  overflow: hidden;
  padding-block: clamp(72px, 8vw, 110px);
  border-top: 1px solid ${getColor("border")};

  .partners-head {
    width: 90%;
    max-width: var(--layout-width, 1400px);
    margin: 0 auto 40px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .partners-eyebrow {
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
    margin-right: clamp(44px, 5.5vw, 88px);
  }

  .marquee-item img {
    display: block;
    width: auto;
    max-width: 190px;
    height: 72px;
    object-fit: contain;
    filter: grayscale(1);
    opacity: 0.72;
    transition: filter 0.3s ease, opacity 0.3s ease;
  }

  .marquee-item img:hover {
    filter: none;
    opacity: 1;
  }

  @media (max-width: 768px) {
    .partners-head {
      width: 100%;
      padding-inline: 20px;
    }

    .marquee-item img {
      max-width: 150px;
      height: 60px;
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

  const titleColor = getColor(props?.marqueeTitleColorKey || "black");
  const titleParts = String(title || "")
    .split("|")
    .map((part) => part.trim());
  const eyebrow = titleParts.shift() || "";
  const note = titleParts.join(" | ");
  const showGradient = props?.gradient !== false;

  return (
    <PartnersSection
      className="site-component-marquee"
      data-component="Marquee"
      $showGradient={showGradient}
      aria-label={title || undefined}
    >
      {eyebrow || note ? (
        <div className="partners-head">
          {eyebrow ? (
            <h2 className="partners-eyebrow" style={{ color: titleColor }}>
              {eyebrow}
            </h2>
          ) : null}
          {note ? <p className="partners-note">{note}</p> : null}
        </div>
      ) : null}
      <ReactMarquee
        className="partners-marquee"
        loop={0}
        speed={props?.speed ?? 25}
        pauseOnHover={props?.pauseOnHover !== false}
        gradient={false}
        autoFill={true}
      >
        {imageItems.map((rawItem, i) => {
          const item = normalizeImageItem(rawItem);
          const desktop = item.desktop || item.mobile;
          if (!desktop) return null;
          return (
          <div
            key={`${i}-${item.key}`}
            className="marquee-item"
          >
            <picture>
              {item.mobile ? (
                <source media="(max-width: 767px)" srcSet={item.mobile} />
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
  );
}
