"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import {
  MAP_SLIDER_STATIC_MAP_URL,
  normalizeMapSliderConfig,
} from "@/lib/mapSliderAnimations";

const PREFIX = "mapSliderAnimations";
const ORBITAL_STAGE = 760;
const ORBITAL_CENTER = ORBITAL_STAGE / 2;
const ORBITAL_RING_RADIUS = 290;
const ORBITAL_INNER_RING_RADIUS = 175;
const ORBITAL_NODE_SIZE = 64;
const ORBITAL_TICK_COUNT = 60;
const ORBITAL_ACCENT = "#E4D9B8";

function toText(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function toNumber(value, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return next;
}

function isDirectCssColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.startsWith("#") ||
    raw.startsWith("rgb(") ||
    raw.startsWith("rgba(") ||
    raw.startsWith("hsl(") ||
    raw.startsWith("hsla(") ||
    raw.startsWith("linear-gradient(") ||
    raw.startsWith("radial-gradient(") ||
    raw.startsWith("conic-gradient(") ||
    raw.startsWith("var(")
  );
}

function resolveThemeColorValue(rawKey, fallbackKey) {
  const key = String(rawKey || "").trim();
  if (!key) return fallbackKey ? getColor(fallbackKey) : undefined;
  if (isDirectCssColor(key)) return key;
  return getColor(key) || key;
}

function isGradientColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.includes("gradient") ||
    raw.startsWith("var(--theme-primary-gradient") ||
    raw.startsWith("var(--theme-secondary-gradient")
  );
}

function getTextPaintStyle(colorValue) {
  const value = String(colorValue || "").trim();
  if (!value) return undefined;
  if (!isGradientColor(value)) return { color: value };
  return {
    color: "transparent",
    background: value,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "inline-block",
  };
}

function getBackgroundStyleFromThemeColor(rawKey) {
  const value = resolveThemeColorValue(rawKey);
  if (!value) return undefined;
  return { background: value };
}

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

const VisualRoot = styled.div.attrs((props) => ({
  $embedded: props.$embedded === true,
}))`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${(props) =>
    props.$embedded ? "0" : "clamp(8px, 1.2vw, 14px) 0 0"};

  .msa-stage {
    width: min(86vmin, ${ORBITAL_STAGE}px);
    max-width: 100%;
  }

  .orbital-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    isolation: isolate;
    --msa-node-size: var(--msa-node-size-desktop);
  }

  .orbital-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .orbital-nodes {
    position: absolute;
    inset: 0;
  }

  .orbital-node {
    position: absolute;
    display: block;
    width: var(--msa-node-size);
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    cursor: pointer;
    text-decoration: none;
    transition:
      transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1),
      filter 380ms ease;
    will-change: transform, filter;
    color: inherit;
    outline: none;
  }

  .orbital-node-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: visible;
    transition: transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  .orbital-node-img {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    filter: grayscale(100%) brightness(0.78) contrast(1.05);
    transition:
      filter 480ms cubic-bezier(0.22, 0.61, 0.36, 1),
      transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1),
      box-shadow 480ms ease;
    box-shadow:
      0 0 0 1.5px rgba(255, 255, 255, 0.55) inset,
      0 8px 24px rgba(0, 0, 0, 0.4);
    transform: scale(1);
  }

  .orbital-node-placeholder {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: #fff;
    text-transform: uppercase;
    background: radial-gradient(circle at 30% 20%, #5e6368 0%, #1d2228 75%);
    box-shadow:
      0 0 0 1.5px rgba(255, 255, 255, 0.55) inset,
      0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .orbital-node-ring {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 1px solid rgba(228, 217, 184, 0);
    transition:
      inset 380ms ease,
      border-color 380ms ease,
      opacity 380ms ease;
    pointer-events: none;
    opacity: 0;
  }

  .orbital-node:hover .orbital-node-img,
  .orbital-node.is-active .orbital-node-img,
  .orbital-node:focus-visible .orbital-node-img {
    filter: grayscale(0%) brightness(1.04) saturate(1.1) contrast(1.02);
    transform: scale(1.12);
    box-shadow:
      0 0 0 1.5px rgba(255, 255, 255, 0.9) inset,
      0 0 0 6px rgba(228, 217, 184, 0.06),
      0 16px 50px rgba(228, 217, 184, 0.25),
      0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .orbital-node:hover .orbital-node-ring,
  .orbital-node.is-active .orbital-node-ring,
  .orbital-node:focus-visible .orbital-node-ring {
    inset: -14px;
    opacity: 1;
    border-color: rgba(228, 217, 184, 0.35);
  }

  .orbital-node.is-dim .orbital-node-img,
  .orbital-node.is-dim .orbital-node-placeholder {
    filter: grayscale(100%) brightness(0.4) contrast(1) blur(0.4px);
    opacity: 0.55;
  }

  @media (max-width: 900px) {
    .msa-stage {
      width: min(92vmin, ${ORBITAL_STAGE}px);
    }
  }

  @media (max-width: 992px) {
    .orbital-stage {
      --msa-node-size: var(--msa-node-size-tablet);
    }
  }

  @media (max-width: 576px) {
    .orbital-stage {
      --msa-node-size: var(--msa-node-size-mobile);
    }
  }
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: clamp(14px, 2vw, 24px);

  .msa-subtitle {
    margin-bottom: 8px;
  }

  .msa-title {
    margin-bottom: 10px;
  }

  .msa-description {
    margin: 0 auto;
    max-width: min(760px, 100%);
    color: rgba(255, 255, 255, 0.78);
    font-size: clamp(0.92rem, 1.1vw, 1.06rem);
    line-height: 1.6;
  }
`;

export function MapSliderAnimationsVisual({ config, embedded = false }) {
  const normalizedConfig = normalizeMapSliderConfig(config, {
    defaultItemCount: 10,
  });
  const orbitItems = Array.isArray(normalizedConfig.orbitItems)
    ? normalizedConfig.orbitItems
    : [];
  const orbitCount = Math.max(1, orbitItems.length);
  const rotationSeconds = Math.max(
    12,
    Number(normalizedConfig.rotationDuration) || 60,
  );
  const directionMultiplier =
    normalizedConfig.direction === "counterclockwise" ? -1 : 1;
  const nodeSizeDesktop = Math.max(
    24,
    Math.min(
      220,
      Number(normalizedConfig.nodeSizeDesktop) ||
        Number(normalizedConfig.nodeSize) ||
        ORBITAL_NODE_SIZE,
    ),
  );
  const nodeSizeTablet = Math.max(
    20,
    Math.min(
      200,
      Number(normalizedConfig.nodeSizeTablet) || Math.round(nodeSizeDesktop * 0.88),
    ),
  );
  const nodeSizeMobile = Math.max(
    18,
    Math.min(
      180,
      Number(normalizedConfig.nodeSizeMobile) || Math.round(nodeSizeDesktop * 0.76),
    ),
  );
  const nodeSizeDesktopPct = `${(nodeSizeDesktop / ORBITAL_STAGE) * 100}%`;
  const nodeSizeTabletPct = `${(nodeSizeTablet / ORBITAL_STAGE) * 100}%`;
  const nodeSizeMobilePct = `${(nodeSizeMobile / ORBITAL_STAGE) * 100}%`;

  const [hoverId, setHoverId] = useState(null);
  const [containerHover, setContainerHover] = useState(false);
  const [tick, setTick] = useState(0);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const factorRef = useRef(1);
  const gradientSeed = useId().replace(/:/g, "");

  useEffect(() => {
    let mounted = true;
    const loop = (t) => {
      if (!mounted) return;
      if (!lastRef.current) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;

      const target =
        normalizedConfig.pauseOnHover !== false && containerHover ? 0 : 1;
      const smooth = 1 - Math.exp(-dt / 380);
      factorRef.current += (target - factorRef.current) * smooth;
      pausedTimeRef.current += dt * factorRef.current;
      setTick(pausedTimeRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
  }, [containerHover, normalizedConfig.pauseOnHover]);

  const nodes = useMemo(
    () =>
      orbitItems.map((item, index) => ({
        key: `orbit-${index}`,
        slotAngle: (360 / orbitCount) * index,
        item,
      })),
    [orbitItems, orbitCount],
  );

  const baseAngle =
    (tick / 1000) * (360 / rotationSeconds) * directionMultiplier;
  const centerGlowId = `msa-center-glow-${gradientSeed}`;
  const ringStrokeId = `msa-ring-stroke-${gradientSeed}`;
  const mapScale = 420 / 411;
  const mapWidth = 362 * mapScale;
  const mapHeight = 411 * mapScale;

  return (
    <VisualRoot
      $embedded={embedded}
      style={{
        "--accent": ORBITAL_ACCENT,
        "--msa-node-size-desktop": nodeSizeDesktopPct,
        "--msa-node-size-tablet": nodeSizeTabletPct,
        "--msa-node-size-mobile": nodeSizeMobilePct,
      }}
      className="mt-lg-5"
    >
      <div
        className="orbital-stage msa-stage"
        onMouseEnter={() => {
          if (normalizedConfig.pauseOnHover !== false) setContainerHover(true);
        }}
        onMouseLeave={() => {
          if (normalizedConfig.pauseOnHover !== false) setContainerHover(false);
          setHoverId(null);
        }}
      >
        <svg
          viewBox={`0 0 ${ORBITAL_STAGE} ${ORBITAL_STAGE}`}
          className="orbital-svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={centerGlowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ORBITAL_ACCENT} stopOpacity="0.18" />
              <stop
                offset="60%"
                stopColor={ORBITAL_ACCENT}
                stopOpacity="0.04"
              />
              <stop offset="100%" stopColor={ORBITAL_ACCENT} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ringStrokeId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
            </linearGradient>
          </defs>

          <circle
            cx={ORBITAL_CENTER}
            cy={ORBITAL_CENTER}
            r={ORBITAL_STAGE / 2 - 6}
            fill="none"
            stroke={`url(#${ringStrokeId})`}
            strokeWidth="1"
          />
          <circle
            cx={ORBITAL_CENTER}
            cy={ORBITAL_CENTER}
            r={ORBITAL_RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          <circle
            cx={ORBITAL_CENTER}
            cy={ORBITAL_CENTER}
            r={ORBITAL_INNER_RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          <circle
            cx={ORBITAL_CENTER}
            cy={ORBITAL_CENTER}
            r="120"
            fill={`url(#${centerGlowId})`}
          />

          {Array.from({ length: ORBITAL_TICK_COUNT }).map((_, index) => {
            const angle = (index / ORBITAL_TICK_COUNT) * 360;
            const pointOuter = polar(
              ORBITAL_CENTER,
              ORBITAL_CENTER,
              ORBITAL_STAGE / 2 - 10,
              angle,
            );
            const pointInner = polar(
              ORBITAL_CENTER,
              ORBITAL_CENTER,
              ORBITAL_STAGE / 2 - (index % 5 === 0 ? 22 : 16),
              angle,
            );
            return (
              <line
                key={`tick-${index}`}
                x1={pointOuter.x}
                y1={pointOuter.y}
                x2={pointInner.x}
                y2={pointInner.y}
                stroke={ORBITAL_ACCENT}
                strokeOpacity={index % 5 === 0 ? 0.35 : 0.12}
                strokeWidth="1"
              />
            );
          })}

          <image
            href={MAP_SLIDER_STATIC_MAP_URL}
            x={ORBITAL_CENTER - mapWidth / 2}
            y={ORBITAL_CENTER - mapHeight / 2}
            width={mapWidth}
            height={mapHeight}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          />
        </svg>

        <div className="orbital-nodes">
          {nodes.map((node, index) => {
            const angle = node.slotAngle + baseAngle;
            const pos = polar(
              ORBITAL_CENTER,
              ORBITAL_CENTER,
              ORBITAL_RING_RADIUS,
              angle,
            );
            const active = hoverId === node.key;
            const dim = hoverId && !active;
            const counter = -angle;
            const depth = Math.sin(((angle - 90) * Math.PI) / 180);
            const depthScale = 1 + depth * 0.04;
            const z = Math.round(500 + depth * 100 + (active ? 200 : 0));
            const href = toText(node.item?.href, "");
            const altText = toText(
              node.item?.altText,
              `Orbit avatar ${index + 1}`,
            );
            const target = node.item?.target === "_blank" ? "_blank" : "_self";
            const isLink = href.length > 0;

            const inner = (
              <div
                className="orbital-node-inner"
                style={{ transform: `rotate(${counter}deg)` }}
              >
                {node.item?.imageUrl ? (
                  <div
                    className="orbital-node-img"
                    style={{ backgroundImage: `url(${node.item.imageUrl})` }}
                    role="img"
                    aria-label={altText}
                  />
                ) : (
                  <div className="orbital-node-placeholder">{index + 1}</div>
                )}
                <div className="orbital-node-ring" aria-hidden="true" />
              </div>
            );

            const className = `orbital-node${active ? " is-active" : ""}${dim ? " is-dim" : ""}`;
            const style = {
              left: `${(pos.x / ORBITAL_STAGE) * 100}%`,
              top: `${(pos.y / ORBITAL_STAGE) * 100}%`,
              zIndex: z,
              transform: `translate(-50%,-50%) scale(${depthScale})`,
            };
            const mouseHandlers = {
              onMouseEnter: () => setHoverId(node.key),
              onMouseLeave: () =>
                setHoverId((prev) => (prev === node.key ? null : prev)),
            };

            if (isLink) {
              return (
                <a
                  key={node.key}
                  href={href}
                  target={target}
                  rel={target === "_blank" ? "noopener noreferrer" : undefined}
                  className={className}
                  style={style}
                  aria-label={altText}
                  {...mouseHandlers}
                >
                  {inner}
                </a>
              );
            }

            return (
              <div
                key={node.key}
                className={className}
                style={style}
                aria-hidden="true"
                {...mouseHandlers}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </VisualRoot>
  );
}

/**
 * Site component: MapSliderAnimations.
 * Standalone reusable orbital map animation block driven by drawer-managed media and settings.
 */
export default function MapSliderAnimations(props) {
  const config = normalizeMapSliderConfig(props?.mapSliderAnimationsConfig, {
    defaultItemCount: 10,
  });

  if (props?.embedded === true) {
    return <MapSliderAnimationsVisual config={config} embedded />;
  }

  const mainTitle = toText(props?.mainTitle, "");
  const subTitle = toText(props?.subTitle, "");
  const description = toText(props?.mapSliderAnimationsDescription, "");
  const titleAlignRaw = toText(props?.titleAlign, "center").toLowerCase();
  const titleAlign =
    titleAlignRaw === "left" ||
    titleAlignRaw === "right" ||
    titleAlignRaw === "center"
      ? titleAlignRaw
      : "center";

  const titleColor = resolveThemeColorValue(props?.titleColorKey, "white");
  const subTitleColor = resolveThemeColorValue(
    props?.subTitleColorKey,
    "white",
  );
  const descriptionColor = resolveThemeColorValue(
    props?.mapSliderAnimationsDescriptionColorKey,
    "white",
  );

  const sectionBgType = toText(props?.[`${PREFIX}SectionBgType`], "default");
  const sectionBgImage = toText(props?.[`${PREFIX}SectionBgImage`], "");
  const sectionBgColorKey = toText(props?.[`${PREFIX}SectionBgColorKey`], "");
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
        ? getBackgroundStyleFromThemeColor(sectionBgColorKey)
        : undefined;
  const sectionPaddingTop =
    props?.[`${PREFIX}SectionPaddingTop`] != null
      ? toNumber(props[`${PREFIX}SectionPaddingTop`], null)
      : null;
  const sectionPaddingBottom =
    props?.[`${PREFIX}SectionPaddingBottom`] != null
      ? toNumber(props[`${PREFIX}SectionPaddingBottom`], null)
      : null;
  const sectionMarginTop =
    props?.[`${PREFIX}SectionMarginTop`] != null
      ? toNumber(props[`${PREFIX}SectionMarginTop`], null)
      : null;
  const sectionMarginBottom =
    props?.[`${PREFIX}SectionMarginBottom`] != null
      ? toNumber(props[`${PREFIX}SectionMarginBottom`], null)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = toText(
    props?.[`${PREFIX}PageContainerBgType`],
    "default",
  );
  const pageContainerBgImage = toText(
    props?.[`${PREFIX}PageContainerBgImage`],
    "",
  );
  const pageContainerBgColorKey = toText(
    props?.[`${PREFIX}PageContainerBgColorKey`],
    "",
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
        ? getBackgroundStyleFromThemeColor(pageContainerBgColorKey)
        : undefined;
  const containerPaddingTop =
    props?.[`${PREFIX}PageContainerPaddingTop`] != null
      ? toNumber(props[`${PREFIX}PageContainerPaddingTop`], null)
      : null;
  const containerPaddingRight =
    props?.[`${PREFIX}PageContainerPaddingRight`] != null
      ? toNumber(props[`${PREFIX}PageContainerPaddingRight`], null)
      : null;
  const containerPaddingBottom =
    props?.[`${PREFIX}PageContainerPaddingBottom`] != null
      ? toNumber(props[`${PREFIX}PageContainerPaddingBottom`], null)
      : null;
  const containerPaddingLeft =
    props?.[`${PREFIX}PageContainerPaddingLeft`] != null
      ? toNumber(props[`${PREFIX}PageContainerPaddingLeft`], null)
      : null;
  const containerMarginTop =
    props?.[`${PREFIX}PageContainerMarginTop`] != null
      ? toNumber(props[`${PREFIX}PageContainerMarginTop`], null)
      : null;
  const containerMarginBottom =
    props?.[`${PREFIX}PageContainerMarginBottom`] != null
      ? toNumber(props[`${PREFIX}PageContainerMarginBottom`], null)
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
          ...(containerPaddingTop != null
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {mainTitle || subTitle || description ? (
          <SectionHeader style={{ textAlign: titleAlign }}>
            {subTitle ? (
              <SubTitle
                className="msa-subtitle"
                style={{ textAlign: titleAlign }}
              >
                <span style={getTextPaintStyle(subTitleColor)}>{subTitle}</span>
              </SubTitle>
            ) : null}
            {mainTitle ? (
              <MainTitle
                className="msa-title"
                style={{ textAlign: titleAlign }}
              >
                <span style={getTextPaintStyle(titleColor)}>{mainTitle}</span>
              </MainTitle>
            ) : null}
            {description ? (
              <p
                className="msa-description"
                style={{
                  ...(descriptionColor
                    ? getTextPaintStyle(descriptionColor)
                    : {}),
                  textAlign: titleAlign,
                }}
              >
                {description}
              </p>
            ) : null}
          </SectionHeader>
        ) : null}
        <MapSliderAnimationsVisual config={config} />
      </PageContainer>
    </FullWidthBackground>
  );
}
