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
  padding: 80px 0px;
  h2 {
    margin: 0px;
    font-size: 24px;
    font-weight: 600;
    color: ${getColor("black")};
    text-align: center;
    margin-bottom: 24px;
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  .marquee-item {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0px;
    margin-right: 40px;
    @media (max-width: 992px) {
      width: 80px;
      margin-right: 20px;
    }
    @media (max-width: 576px) {
      width: 70px;
      margin-right: 10px;
    }
  }
  .marquee-item img {
    max-width: 100%;
    max-height: 90px;
    height: auto;
    display: block;
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

  return (
    <PartnersSection
      className="site-component-marquee"
      data-component="Marquee"
    >
      <h2 style={{ color: titleColor }}>{title}</h2>
      <ReactMarquee
        loop={0}
        speed={props?.speed ?? 25}
        pauseOnHover={props?.pauseOnHover !== false}
        gradient={props?.gradient !== false}
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
