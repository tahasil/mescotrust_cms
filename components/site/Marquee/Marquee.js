"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import ReactMarquee from "react-fast-marquee";
import { getColor } from "@/styles/Theme";

function fetchTheme() {
  return fetch("/api/theme", {
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
 * Title and items from props (admin preview) or from /api/theme (frontend).
 * Editable via MarqueeEditForm in page builder or component edit.
 */
export default function Marquee(props) {
  const [theme, setTheme] = useState(null);
  const fromProps =
    props?.title != null ||
    (Array.isArray(props?.images) && props.images.length > 0);

  useEffect(() => {
    if (fromProps) return;
    fetchTheme().then(setTheme);
  }, [fromProps]);

  const title =
    props?.title ??
    (theme?.marqueeTitle != null && String(theme.marqueeTitle).trim() !== ""
      ? String(theme.marqueeTitle).trim()
      : "Our CSR Partners | Awards & Recognition");
  const images =
    Array.isArray(props?.images) && props.images.length > 0
      ? props.images
      : Array.isArray(theme?.marqueeItems) && theme.marqueeItems.length > 0
        ? theme.marqueeItems
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
