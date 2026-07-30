"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRightOutlined } from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { LATEST_IMAGE_GALLERY_DEFAULT_PROPS } from "./defaults";

const moveRightToLeft = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-33.333333%, 0, 0); }
`;

const moveLeftToRight = keyframes`
  from { transform: translate3d(-33.333333%, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
`;

const GallerySection = styled.section`
  width: 100%;
  overflow: hidden;
  color: var(--latest-gallery-title);
  font-family: var(--fable-body, "Instrument Sans", system-ui, sans-serif);
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;

  .latest-gallery__head {
    width: min(90%, var(--layout-width, 1440px));
    margin: 0 auto clamp(36px, 4vw, 56px);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .latest-gallery__eyebrow {
    margin: 0 0 14px;
    color: var(--latest-gallery-subtitle);
    font-size: clamp(11px, calc(var(--latest-gallery-subtitle-size) * 1px), 20px);
    font-weight: 650;
    line-height: 1.4;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .latest-gallery__title {
    max-width: 14ch;
    margin: 0;
    color: var(--latest-gallery-title);
    font-family: var(--fable-display, "Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif);
    font-size: clamp(34px, calc(var(--latest-gallery-title-size) * 1px), 72px);
    font-weight: 620;
    line-height: 1.08;
    letter-spacing: -0.03em;
  }

  .latest-gallery__title em {
    color: var(--latest-gallery-accent);
    font-style: normal;
  }

  .latest-gallery__link {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding-bottom: 5px;
    border-bottom: 1px solid currentColor;
    color: var(--latest-gallery-link);
    font-size: 14px;
    font-weight: 650;
    text-decoration: none;
  }

  .latest-gallery__link:hover {
    color: var(--latest-gallery-link);
  }

  .latest-gallery__link svg {
    transition: transform 260ms ease;
  }

  .latest-gallery__link:hover svg {
    transform: translateX(4px);
  }

  .latest-gallery__marquee {
    position: relative;
    isolation: isolate;
    contain: layout paint;
    width: 100%;
    overflow: hidden;
    margin-bottom: calc(var(--latest-gallery-row-gap) * 1px);
  }

  .latest-gallery__track {
    display: flex;
    width: max-content;
    transform: translateZ(0);
    backface-visibility: hidden;
    will-change: transform;
    animation-delay: var(--latest-gallery-delay);
    animation-fill-mode: both;
  }

  .latest-gallery__track--rtl {
    animation: ${moveRightToLeft} calc(var(--latest-gallery-speed) * 1s) linear infinite;
  }

  .latest-gallery__track--ltr {
    animation: ${moveLeftToRight} calc(var(--latest-gallery-speed) * 1s) linear infinite;
  }

  .latest-gallery__marquee[data-pause="true"]:hover .latest-gallery__track {
    animation-play-state: paused;
  }

  .latest-gallery__group {
    display: flex;
    flex: 0 0 auto;
    gap: calc(var(--latest-gallery-image-gap) * 1px);
    padding-right: calc(var(--latest-gallery-image-gap) * 1px);
  }

  .latest-gallery__image {
    display: block;
    width: clamp(240px, 24vw, 380px);
    height: clamp(180px, 18vw, 285px);
    aspect-ratio: 4 / 3;
    flex: 0 0 auto;
    object-fit: cover;
    object-position: center;
    border-radius: calc(var(--latest-gallery-radius) * 1px);
    background: color-mix(in srgb, var(--latest-gallery-title) 7%, transparent);
    transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .latest-gallery__image:hover {
    transform: scale(0.97);
  }

  .latest-gallery__status {
    width: min(90%, var(--layout-width, 1440px));
    margin: 0 auto;
    padding: 34px 0 56px;
    color: color-mix(in srgb, var(--latest-gallery-title) 62%, transparent);
    text-align: center;
  }

  @media (max-width: 767px) {
    .latest-gallery__head {
      width: 100%;
      padding-inline: 20px;
      align-items: flex-start;
      flex-direction: column;
      margin-bottom: 30px;
    }

    .latest-gallery__title {
      font-size: clamp(32px, 10vw, 48px);
    }

    .latest-gallery__image {
      width: clamp(190px, 68vw, 280px);
      height: clamp(143px, 51vw, 210px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .latest-gallery__track {
      animation-play-state: paused;
    }

    .latest-gallery__image {
      transition: none;
    }
  }
`;

function text(value) {
  return value == null ? "" : String(value).trim();
}

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function resolveColor(value, fallback) {
  return text(value) ? getColor(text(value)) : fallback;
}

function normalizeDirection(value, fallback) {
  return value === "ltr" || value === "rtl" ? value : fallback;
}

function getBackgroundStyles(props) {
  const prefix = "latestImageGallery";
  const sectionType = text(props?.[`${prefix}SectionBgType`] || "color");
  const sectionImage = text(props?.[`${prefix}SectionBgImage`]);
  const sectionColor = text(props?.[`${prefix}SectionBgColorKey`] || "cream");
  const sectionStyle = {
    ...(sectionType === "image" && sectionImage
      ? {
          backgroundImage: `url(${sectionImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : sectionType === "color" && sectionColor
        ? { backgroundColor: getColor(sectionColor), backgroundImage: "none" }
        : {}),
  };
  ["PaddingTop", "PaddingBottom", "MarginTop", "MarginBottom"].forEach((suffix) => {
    const value = props?.[`${prefix}Section${suffix}`];
    if (value !== "" && value != null && Number(value) >= 0) {
      sectionStyle[`${suffix[0].toLowerCase()}${suffix.slice(1)}`] = `${Number(value)}px`;
    }
  });

  const pageType = text(props?.[`${prefix}PageContainerBgType`] || "default");
  const pageImage = text(props?.[`${prefix}PageContainerBgImage`]);
  const pageColor = text(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageStyle = {
    width: "100%",
    padding: 0,
    ...(pageType === "image" && pageImage
      ? {
          backgroundImage: `url(${pageImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageType === "color" && pageColor
        ? { backgroundColor: getColor(pageColor), backgroundImage: "none" }
        : {}),
  };
  ["PaddingTop", "PaddingRight", "PaddingBottom", "PaddingLeft", "MarginTop", "MarginBottom"].forEach(
    (suffix) => {
      const value = props?.[`${prefix}PageContainer${suffix}`];
      if (value !== "" && value != null && Number(value) >= 0) {
        pageStyle[`${suffix[0].toLowerCase()}${suffix.slice(1)}`] = `${Number(value)}px`;
      }
    },
  );

  return {
    sectionBgClassName: sectionType === "default" ? "defaultBackground" : undefined,
    sectionBgStyle: sectionStyle,
    pageContainerBgStyle: pageStyle,
  };
}

function MarqueeRow({ images, direction, pauseOnHover }) {
  if (images.length === 0) return null;
  const group = (copy) => (
    <div className="latest-gallery__group" aria-hidden={copy > 0} key={copy}>
      {images.map((image, index) => (
        <Image
          className="latest-gallery__image"
          src={image.url}
          alt={copy === 0 ? image.alt : ""}
          width={380}
          height={285}
          sizes="(max-width: 767px) 68vw, 24vw"
          unoptimized
          loading="eager"
          decoding="async"
          draggable="false"
          key={`${copy}-${image.url}-${index}`}
        />
      ))}
    </div>
  );

  return (
    <div className="latest-gallery__marquee" data-pause={pauseOnHover ? "true" : "false"}>
      <div className={`latest-gallery__track latest-gallery__track--${direction}`}>
        {group(0)}
        {group(1)}
        {group(2)}
      </div>
    </div>
  );
}

export default function LatestImageGallery(inputProps) {
  const props = { ...LATEST_IMAGE_GALLERY_DEFAULT_PROPS, ...(inputProps || {}) };
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/latest-image-gallery", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load failed"))))
      .then((data) => setImages(Array.isArray(data?.images) ? data.images.slice(0, 16) : []))
      .catch((error) => {
        if (error?.name !== "AbortError") setImages([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const rows = useMemo(
    () => ({ first: images.slice(0, 8), second: images.slice(8, 16) }),
    [images],
  );
  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } = getBackgroundStyles(props);
  const subtitle = text(props.latestImageGallerySubTitle);
  const title = text(props.latestImageGalleryTitle);
  const accent = text(props.latestImageGalleryHeadingAccent);
  const viewAllText = text(props.latestImageGalleryViewAllText);
  const viewAllLink = text(props.latestImageGalleryViewAllLink);
  const showHeading =
    (props.latestImageGallerySubTitleVisible !== false && subtitle) ||
    (props.latestImageGalleryTitleVisible !== false && (title || accent));
  const speed = numberInRange(props.latestImageGallerySpeed, 42, 10, 180);
  const firstDirection = normalizeDirection(
    props.latestImageGalleryFirstDirection,
    "rtl",
  );
  const secondDirection = normalizeDirection(
    props.latestImageGallerySecondDirection,
    "ltr",
  );
  const designStyle = {
    "--latest-gallery-subtitle": resolveColor(props.latestImageGallerySubTitleColorKey, getColor("primary")),
    "--latest-gallery-title": resolveColor(props.latestImageGalleryTitleColorKey, getColor("black")),
    "--latest-gallery-accent": resolveColor(props.latestImageGalleryAccentColorKey, getColor("black")),
    "--latest-gallery-link": resolveColor(props.latestImageGalleryLinkColorKey, getColor("black")),
    "--latest-gallery-title-size": numberInRange(props.latestImageGalleryTitleFontSize, 56, 24, 96),
    "--latest-gallery-subtitle-size": numberInRange(props.latestImageGallerySubTitleFontSize, 13, 10, 28),
    "--latest-gallery-speed": speed,
    "--latest-gallery-delay": `${-(speed * 0.28).toFixed(2)}s`,
    "--latest-gallery-radius": numberInRange(props.latestImageGalleryImageRadius, 18, 0, 80),
    "--latest-gallery-image-gap": numberInRange(props.latestImageGalleryImageGap, 24, 0, 64),
    "--latest-gallery-row-gap": numberInRange(props.latestImageGalleryRowGap, 24, 0, 80),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <GallerySection id={text(props.latestImageGallerySectionId) || undefined} style={designStyle}>
          {showHeading || (props.latestImageGalleryViewAllVisible !== false && viewAllText && viewAllLink) ? (
            <div className="latest-gallery__head">
              <div>
                {props.latestImageGallerySubTitleVisible !== false && subtitle ? (
                  <p className="latest-gallery__eyebrow">{subtitle}</p>
                ) : null}
                {props.latestImageGalleryTitleVisible !== false && (title || accent) ? (
                  <h2 className="latest-gallery__title">
                    {renderHighlightedTitle(
                      accent ? `${title}${title ? " " : ""}*${accent}*` : title,
                      props,
                      { legacyColorKey: props?.latestImageGalleryAccentColorKey },
                    )}
                  </h2>
                ) : null}
              </div>
              {props.latestImageGalleryViewAllVisible !== false && viewAllText && viewAllLink ? (
                <a
                  className="latest-gallery__link"
                  href={viewAllLink}
                  target={props.latestImageGalleryViewAllTarget === "_blank" ? "_blank" : undefined}
                  rel={props.latestImageGalleryViewAllTarget === "_blank" ? "noreferrer" : undefined}
                >
                  {viewAllText} <ArrowRightOutlined aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}

          {loading ? <div className="latest-gallery__status">Loading latest images…</div> : null}
          {!loading && images.length === 0 ? (
            <div className="latest-gallery__status">No gallery images are available.</div>
          ) : null}
          {!loading ? (
            <>
              <MarqueeRow images={rows.first} direction={firstDirection} pauseOnHover={props.latestImageGalleryPauseOnHover !== false} />
              <MarqueeRow images={rows.second} direction={secondDirection} pauseOnHover={props.latestImageGalleryPauseOnHover !== false} />
            </>
          ) : null}
        </GallerySection>
      </PageContainer>
    </FullWidthBackground>
  );
}
