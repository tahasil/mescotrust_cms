"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

const CARD_COUNT = 6;
const IMAGE_ENABLED_CARD_INDEXES = new Set([3, 5]); // Card 4 and Card 6
const DEFAULT_ITEMS = [
  {
    number: "80+",
    title: "Alliances",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "65",
    title: "Initiatives",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "4500+",
    title: "Applications so far",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "Rs 700 CR+",
    title: "Community Reach",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "190+",
    title: "Cities Reached",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "25000+",
    title: "Professionals in TSUV ecosystem",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
];

function toText(value) {
  return value != null ? String(value).trim() : "";
}

function normalizeDimensionValue(value, min = 8, max = 240) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < min) return min;
  if (n > max) return max;
  return Math.round(n);
}

function isGradientStyle(colorValue) {
  return typeof colorValue === "string" && /gradient/i.test(colorValue);
}

function normalizeItem(item = {}, index = 0) {
  const fallback =
    DEFAULT_ITEMS[index] || DEFAULT_ITEMS[DEFAULT_ITEMS.length - 1];
  const legacyNumber = `${toText(item?.counterPrefix)}${toText(item?.counterValue)}${toText(item?.counterSuffix)}`;

  return {
    _key: `milestone-${index}`,
    number: toText(item?.number) || toText(legacyNumber) || fallback.number,
    title: toText(item?.title) || toText(item?.label) || fallback.title,
    description: toText(item?.description) || fallback.description,
    iconUrl: toText(item?.iconUrl) || fallback.iconUrl,
    iconWidth: normalizeDimensionValue(item?.iconWidth),
    iconHeight: normalizeDimensionValue(item?.iconHeight),
    imageUrl:
      toText(item?.imageUrl) ||
      toText(item?.decorImageDesktop) ||
      toText(item?.decorImage) ||
      fallback.imageUrl,
  };
}

function normalizeItems(items) {
  const source = Array.isArray(items) ? items : [];
  return Array.from({ length: CARD_COUNT }, (_, index) =>
    normalizeItem(source[index], index),
  );
}

function normalizeAlign(value) {
  const normalized = toText(value).toLowerCase();
  if (
    normalized === "left" ||
    normalized === "right" ||
    normalized === "center"
  ) {
    return normalized;
  }
  return "center";
}

function parseCounterMeta(rawNumber) {
  const text = toText(rawNumber) || "0";
  const match = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);

  if (!match) {
    return {
      hasCounter: false,
      text,
    };
  }

  const numericPortion = match[1];
  const normalizedNumeric = numericPortion.replace(/,/g, "");
  const target = Number(normalizedNumeric);

  if (!Number.isFinite(target)) {
    return {
      hasCounter: false,
      text,
    };
  }

  return {
    hasCounter: true,
    prefix: text.slice(0, match.index),
    suffix: text.slice((match.index || 0) + numericPortion.length),
    target,
    decimals: (normalizedNumeric.split(".")[1] || "").length,
    useGrouping: numericPortion.includes(","),
  };
}

function formatCounterValue(counterMeta, progress) {
  if (!counterMeta?.hasCounter) {
    return counterMeta?.text || "0";
  }

  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const currentValue = counterMeta.target * clampedProgress;
  const roundedValue =
    counterMeta.decimals > 0
      ? Number(currentValue.toFixed(counterMeta.decimals))
      : Math.round(currentValue);

  const formattedValue = counterMeta.useGrouping
    ? roundedValue.toLocaleString("en-US", {
        minimumFractionDigits: counterMeta.decimals,
        maximumFractionDigits: counterMeta.decimals,
      })
    : roundedValue.toFixed(counterMeta.decimals);

  return `${counterMeta.prefix}${formattedValue}${counterMeta.suffix}`;
}

export default function Milestones(props) {
  const sectionRef = useRef(null);
  const animationFrameRef = useRef(null);
  const wasInViewportRef = useRef(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [counterProgress, setCounterProgress] = useState(0);

  const mainTitle = toText(props?.mainTitle) || "Our Milestones";
  const subTitle = toText(props?.subTitle);
  const titleAlign = normalizeAlign(props?.titleAlign || "center");

  const titleColor = toText(props?.titleColorKey)
    ? getColor(props.titleColorKey)
    : getColor("textGradient");
  const subTitleColor = toText(props?.milestonesSubTitleColorKey)
    ? getColor(props.milestonesSubTitleColorKey)
    : getColor("primary");
  const cardBgColor = toText(props?.milestonesCardBgColorKey)
    ? getColor(props.milestonesCardBgColorKey)
    : "linear-gradient(180deg, #005f86 0%, #005072 100%)";
  const cardHoverOverlayColor = toText(
    props?.milestonesCardHoverOverlayColorKey,
  )
    ? getColor(props.milestonesCardHoverOverlayColorKey)
    : "rgba(255,255,255,0.12)";

  const numberColor = toText(props?.milestonesNumberColorKey)
    ? getColor(props.milestonesNumberColorKey)
    : "#FFC83D";
  const titleTextColor = toText(props?.milestonesCardTitleColorKey)
    ? getColor(props.milestonesCardTitleColorKey)
    : "#ffffff";

  const titleUsesGradient = isGradientStyle(titleColor);

  const sectionBgType = (
    props?.milestonesSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = toText(props?.milestonesSectionBgImage);
  const sectionBgColorKey = toText(props?.milestonesSectionBgColorKey);
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
    props?.milestonesSectionPaddingTop != null
      ? Number(props.milestonesSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.milestonesSectionPaddingBottom != null
      ? Number(props.milestonesSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.milestonesSectionMarginTop != null
      ? Number(props.milestonesSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.milestonesSectionMarginBottom != null
      ? Number(props.milestonesSectionMarginBottom)
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

  const pageContainerBgType = (
    props?.milestonesPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = toText(props?.milestonesPageContainerBgImage);
  const pageContainerBgColorKey = toText(
    props?.milestonesPageContainerBgColorKey,
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
    props?.milestonesPageContainerPaddingTop != null
      ? Number(props.milestonesPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.milestonesPageContainerPaddingRight != null
      ? Number(props.milestonesPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.milestonesPageContainerPaddingBottom != null
      ? Number(props.milestonesPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.milestonesPageContainerPaddingLeft != null
      ? Number(props.milestonesPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.milestonesPageContainerMarginTop != null
      ? Number(props.milestonesPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.milestonesPageContainerMarginBottom != null
      ? Number(props.milestonesPageContainerMarginBottom)
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

  const items = normalizeItems(props?.milestonesItems);
  const numberSignature = items.map((item) => toText(item.number)).join("||");
  const counterMetas = useMemo(
    () => items.map((item) => parseCounterMeta(item.number)),
    [numberSignature],
  );

  useEffect(() => {
    setCounterProgress(0);
    setIsInViewport(false);
    setAnimationCycle(0);
    wasInViewportRef.current = false;
  }, [numberSignature]);

  useEffect(() => {
    if (!sectionRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const currentlyInViewport = !!entry?.isIntersecting;

        if (currentlyInViewport && !wasInViewportRef.current) {
          setCounterProgress(0);
          setAnimationCycle((currentCycle) => currentCycle + 1);
        }

        if (!currentlyInViewport && wasInViewportRef.current) {
          setCounterProgress(0);
        }

        wasInViewportRef.current = currentlyInViewport;
        setIsInViewport(currentlyInViewport);
      },
      {
        threshold: 0.25,
      },
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInViewport || animationCycle <= 0) {
      return undefined;
    }

    const animationDurationMs = 1500;
    let startTime = null;

    const tick = (timestamp) => {
      if (startTime == null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / animationDurationMs, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

      setCounterProgress(easedProgress);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isInViewport, animationCycle, numberSignature]);

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <section
          ref={sectionRef}
          className="site-milestones"
          aria-label={mainTitle || "Milestones"}
        >
          {(subTitle || mainTitle) && (
            <header className="site-milestones-header">
              {subTitle ? (
                <SubTitle
                  as="p"
                  color={subTitleColor}
                  style={{ marginBottom: 8, textAlign: titleAlign }}
                >
                  {subTitle}
                </SubTitle>
              ) : null}
              {mainTitle ? (
                <MainTitle
                  className="mb-5"
                  as="h2"
                  color={titleUsesGradient ? "transparent" : titleColor}
                  style={
                    titleUsesGradient
                      ? {
                          background: titleColor,
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textAlign: titleAlign,
                        }
                      : { textAlign: titleAlign }
                  }
                >
                  {mainTitle}
                </MainTitle>
              ) : null}
            </header>
          )}

          <div className="site-milestones-grid">
            {items.map((item, index) => {
              const slotClass = `site-milestones-card--slot-${Math.min(index + 1, CARD_COUNT)}`;
              const hasIcon = !!item.iconUrl;
              const hasImage =
                IMAGE_ENABLED_CARD_INDEXES.has(index) && !!item.imageUrl;
              const iconWidth = normalizeDimensionValue(item?.iconWidth);
              const iconHeight = normalizeDimensionValue(item?.iconHeight);
              const iconStyle = {
                objectFit: "contain",
                ...(iconWidth ? { width: `${iconWidth}px`, maxWidth: `${iconWidth}px` } : {}),
                ...(iconHeight
                  ? { height: `${iconHeight}px`, maxHeight: `${iconHeight}px` }
                  : {}),
              };
              return (
                <article
                  key={`${item._key}-${index}`}
                  className={`site-milestones-card ${slotClass}${hasImage ? " site-milestones-card--with-image" : ""}`}
                >
                  {hasImage ? (
                    <div className="site-milestones-image" aria-hidden="true">
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}

                  <div className="site-milestones-card-inner">
                    {hasIcon ? (
                      <img
                        className={`site-milestones-icon site-milestones-icon--slot-${Math.min(index + 1, CARD_COUNT)}`}
                        src={item.iconUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={iconWidth || 34}
                        height={iconHeight || 34}
                        style={iconStyle}
                      />
                    ) : null}

                    <h3 className="site-milestones-number">
                      {formatCounterValue(
                        counterMetas[index],
                        isInViewport ? counterProgress : 0,
                      )}
                    </h3>
                    {item.title ? (
                      <p className="site-milestones-title">{item.title}</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </PageContainer>

      <style jsx>{`
        .site-milestones {
          width: 100%;
          position: relative;
          max-width: 1780px;
          margin: 0 auto;
        }

        .site-milestones-header {
          text-align: ${titleAlign};
          margin: 0 auto 20px;
          max-width: 920px;
        }

        .site-milestones-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 10px;
          align-items: stretch;
        }

        .site-milestones-card {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          min-height: 148px;
          isolation: isolate;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.02) 0%,
              rgba(255, 255, 255, 0) 55%
            ),
            ${cardBgColor};
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 8px 16px rgba(2, 17, 28, 0.22);
          transition:
            transform 0.28s ease,
            box-shadow 0.28s ease,
            border-color 0.28s ease;
        }

        .site-milestones-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            ${cardHoverOverlayColor} 0%,
            rgba(0, 0, 0, 0.12) 100%
          );
          opacity: 0;
          transition: opacity 0.28s ease;
          z-index: 0;
        }

        .site-milestones-card:hover::before {
          opacity: 0.42;
        }

        .site-milestones-card:hover {
          border-color: rgba(133, 224, 255, 0.58);
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            inset 0 0 0 999px rgba(132, 214, 236, 0.1),
            0 12px 26px rgba(2, 17, 28, 0.28);
        }

        .site-milestones-image {
          position: absolute;
          right: 0px;
          top: 0px;
          width: min(46%, 168px);
          z-index: 0;
          opacity: 0.62;
          pointer-events: none;
          text-align: end;
        }

        .site-milestones-image img {
          object-fit: contain;
          /* display: block; */
        }

        .site-milestones-card-inner {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          gap: 2px;
          padding: 18px 22px 18px;
        }

        .site-milestones-icon {
          width: 34px;
          height: 34px;
          display: block;
          object-fit: contain;
          opacity: 1;
          transform: translateZ(0);
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        .site-milestones-number {
          margin: 10px 0px 4px 0px;
          font-size: clamp(32px, 2.15vw, 50px);
          line-height: 1.02;
          font-weight: 600;
          letter-spacing: 0.005em;
          color: ${numberColor};
          word-break: break-word;
        }

        .site-milestones-title {
          margin: 0px 0px 10px 0px;
          font-size: clamp(18px, 1.16vw, 26px);
          line-height: 1.18;
          font-weight: 300;
          letter-spacing: 0.002em;
          color: ${titleTextColor};
        }

        .site-milestones-icon--slot-1 {
          width: auto;
          height: 34px;
          max-width: 88px;
        }

        .site-milestones-card--slot-4 .site-milestones-number {
          font-size: clamp(38px, 2.55vw, 62px);
        }

        .site-milestones-card--slot-4 .site-milestones-title {
          max-width: 72%;
          line-height: 1.16;
        }

        .site-milestones-card--slot-6 .site-milestones-number {
          font-size: clamp(42px, 2.75vw, 68px);
          margin-top: 0;
        }

        .site-milestones-card--slot-6 .site-milestones-title {
          max-width: 82%;
          line-height: 1.2;
          letter-spacing: 0.003em;
        }

        .site-milestones-card--slot-6 .site-milestones-icon {
          margin-bottom: 8px;
        }

        @media (min-width: 768px) and (max-width: 1199.98px) {
          .site-milestones-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            grid-template-rows: repeat(2, minmax(148px, 1fr));
            gap: 12px;
          }

          .site-milestones-card--slot-1 {
            grid-column: 1;
            grid-row: 1;
          }

          .site-milestones-card--slot-2 {
            grid-column: 2;
            grid-row: 1;
          }

          .site-milestones-card--slot-3 {
            grid-column: 3;
            grid-row: 1;
          }

          .site-milestones-card--slot-4 {
            grid-column: 1 / 3;
            grid-row: 2;
          }

          .site-milestones-card--slot-5 {
            grid-column: 3;
            grid-row: 2;
          }

          .site-milestones-card--slot-6 {
            grid-column: 4;
            grid-row: 1 / 3;
          }

          .site-milestones-card--slot-4 .site-milestones-image {
            width: min(37%, 182px);
            right: 0px;
            top: 0px;
            opacity: 0.7;
          }

          .site-milestones-card--slot-6 .site-milestones-card-inner {
            justify-content: flex-start;
            padding: 116px 18px 18px;
          }

          .site-milestones-card--slot-6 .site-milestones-image {
            left: 50%;
            transform: translateX(-50%);
            right: auto;
            top: 12px;
            width: min(76%, 212px);
            opacity: 0.62;
          }
          .site-milestones-card--slot-6 .site-milestones-image img {
            display: block !important;
          }
          .site-milestones-card--slot-6 .site-milestones-title {
            max-width: 88%;
          }
        }

        @media (min-width: 1200px) {
          .site-milestones-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(
                280px,
                1.14fr
              );
            grid-template-rows: repeat(2, minmax(160px, 1fr));
            gap: 12px;
          }

          .site-milestones-card--slot-1 {
            grid-column: 1;
            grid-row: 1;
          }

          .site-milestones-card--slot-2 {
            grid-column: 2;
            grid-row: 1;
          }

          .site-milestones-card--slot-3 {
            grid-column: 3;
            grid-row: 1;
          }

          .site-milestones-card--slot-4 {
            grid-column: 1 / 3;
            grid-row: 2;
          }

          .site-milestones-card--slot-5 {
            grid-column: 3;
            grid-row: 2;
          }

          .site-milestones-card--slot-6 {
            grid-column: 4;
            grid-row: 1 / 3;
          }

          .site-milestones-card--slot-6 .site-milestones-card-inner {
            justify-content: flex-start;
            gap: 6px;
            padding: 150px 28px 22px;
          }

          .site-milestones-card--slot-6 .site-milestones-image {
            left: 50%;
            transform: translateX(-50%);
            right: auto;
            top: 20px;
            /* width: min(68%, 226px); */
            opacity: 0.66;
          }

          .site-milestones-card--slot-4 .site-milestones-image {
            width: min(34%, 206px);
            right: 0px;
            top: 0px;
            opacity: 0.7;
          }

          .site-milestones-card--slot-6 .site-milestones-icon {
            margin-top: 4px;
            margin-bottom: 8px;
          }
        }

        @media (max-width: 767.98px) {
          .site-milestones-header {
            text-align: left;
          }

          .site-milestones-card-inner {
            padding: 14px 16px 16px;
          }

          .site-milestones-icon {
            width: 30px;
            height: 30px;
          }

          .site-milestones-icon--slot-1 {
            width: auto;
            height: 30px;
            max-width: 78px;
          }

          .site-milestones-number {
            font-size: clamp(24px, 8vw, 32px);
          }

          .site-milestones-title {
            font-size: clamp(15px, 4.6vw, 20px);
            line-height: 1.2;
          }

          .site-milestones-card--slot-4 .site-milestones-title,
          .site-milestones-card--slot-6 .site-milestones-title {
            max-width: 100%;
          }

          .site-milestones-card--slot-6 .site-milestones-card-inner {
            justify-content: flex-start;
            padding-top: 98px;
          }

          .site-milestones-card--slot-6 .site-milestones-image {
            left: 50%;
            transform: translateX(-50%);
            right: auto;
            width: min(68%, 186px);
            opacity: 0.64;
          }

          .site-milestones-card--slot-4 .site-milestones-image {
            width: min(44%, 162px);
            right: 0px;
            top: 0px;
            opacity: 0.72;
          }
        }
      `}</style>
    </FullWidthBackground>
  );
}
