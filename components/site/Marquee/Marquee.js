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
  padding: 40px 0px;
  h2 {
    margin: 0px;
    font-size: 24px;
    font-weight: 600;
    color: ${getColor("black")};
    text-align: center;
    margin-bottom: 18px;
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  .marquee-item {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0px;
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
    max-height: 80px;
    height: auto;
    display: block;
  }
`;

const defaultImages = [
  "/images/partner-1.png",
  "/images/partner-2.png",
  "/images/partner-3.png",
  "/images/partner-4.png",
  "/images/partner-5.png",
  "/images/partner-6.png",
];

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
    (props?.marqueeTitle != null && String(props.marqueeTitle).trim() !== "" ? String(props.marqueeTitle).trim() : null) ??
    props?.title ??
    (data?.marqueeTitle != null && String(data.marqueeTitle).trim() !== "" ? String(data.marqueeTitle).trim() : null) ??
    "Our CSR Partners | Awards & Recognition";
  const images =
    Array.isArray(props?.marqueeItems) && props.marqueeItems.length > 0
      ? props.marqueeItems
      : Array.isArray(props?.images) && props.images.length > 0
        ? props.images
        : Array.isArray(data?.marqueeItems) && data.marqueeItems.length > 0
          ? data.marqueeItems
          : defaultImages;

  return (
    <PartnersSection
      className="site-component-marquee"
      data-component="Marquee"
    >
      <h2>{title}</h2>
      <ReactMarquee
        className="mb-5"
        loop={0}
        speed={props?.speed ?? 25}
        pauseOnHover={props?.pauseOnHover !== false}
        gradient={props?.gradient !== false}
        autoFill={true}
      >
        {images.map((src, i) => (
          <div key={`${i}-${typeof src === "string" ? src : src?.url}`} className="marquee-item">
            <img
              className="img-fluid"
              src={typeof src === "string" ? src : (src?.url ?? src)}
              alt={typeof src === "object" && src?.alt ? src.alt : "Partner"}
            />
          </div>
        ))}
      </ReactMarquee>
    </PartnersSection>
  );
}
