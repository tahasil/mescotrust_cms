"use client";

import { useEffect, useState } from "react";
import { FullWidthBackground, getColor } from "@/styles/Theme";
import CircularSliderCore from "./CircularSliderCore";

/**
 * Site component: ImageSlider (Circular Image Slider).
 * Standalone reusable slider — can be added to any page via page builder.
 * Uses the same CircularSlider internally as HomeHero2.
 */
export default function ImageSlider(props) {
  const [isMobileView, setIsMobileView] = useState(false);
  const images = Array.isArray(props?.imageSliderImages)
    ? props.imageSliderImages
      .map((s) => ({
        desktopSrc:
          s?.desktopSrc != null
            ? String(s.desktopSrc).trim()
            : s?.src != null
              ? String(s.src).trim()
              : s?.url != null
                ? String(s.url).trim()
                : "",
        mobileSrc: s?.mobileSrc != null ? String(s.mobileSrc).trim() : "",
        alt: s?.alt != null ? String(s.alt) : "Slider",
      }))
      .filter((s) => s.desktopSrc || s.mobileSrc)
    : [];
  const slideCount = props?.imageSliderSlideCount != null ? Number(props.imageSliderSlideCount) : 37;
  const autoInterval = props?.imageSliderAutoInterval != null ? Number(props.imageSliderAutoInterval) : 4000;
  const stepDeg = props?.imageSliderStepDeg != null ? Number(props.imageSliderStepDeg) : 10;
  const duration = props?.imageSliderDuration != null ? Number(props.imageSliderDuration) : 0.6;
  const autoplay = props?.imageSliderAutoplay !== false && props?.imageSliderAutoplay !== "false";
  const draggable = props?.imageSliderDraggable !== false && props?.imageSliderDraggable !== "false";

  const PREFIX = "imageSlider";

  const sectionBgType = (props?.[PREFIX + "SectionBgType"] ?? "default").toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "").toString().trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.[PREFIX + "SectionPaddingTop"] != null ? Number(props[PREFIX + "SectionPaddingTop"]) : null;
  const sectionPaddingBottom = props?.[PREFIX + "SectionPaddingBottom"] != null ? Number(props[PREFIX + "SectionPaddingBottom"]) : null;
  const sectionMarginTop = props?.[PREFIX + "SectionMarginTop"] != null ? Number(props[PREFIX + "SectionMarginTop"]) : null;
  const sectionMarginBottom = props?.[PREFIX + "SectionMarginBottom"] != null ? Number(props[PREFIX + "SectionMarginBottom"]) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileView(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  if (images.length === 0) {
    return (
      <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
        <div
          style={{
            width: "min(920px, calc(100% - 32px))",
            margin: "24px auto",
            borderRadius: 20,
            border: "1px dashed rgba(0, 81, 111, 0.32)",
            background:
              "linear-gradient(135deg, rgba(0,81,111,0.06), rgba(0,81,111,0.12))",
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "rgba(0, 81, 111, 0.9)",
              marginBottom: 6,
            }}
          >
            ImageSlider Placeholder
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(0, 0, 0, 0.6)",
            }}
          >
            No slider images are configured. Add images from the ImageSlider drawer.
          </div>
        </div>
      </FullWidthBackground>
    );
  }

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <CircularSliderCore
        images={images.map((s) => ({
          src: isMobileView
            ? s.mobileSrc || s.desktopSrc
            : s.desktopSrc || s.mobileSrc,
          alt: s.alt,
        }))}
        slideCount={slideCount}
        autoInterval={autoplay ? autoInterval : 0}
        stepDeg={stepDeg}
        duration={duration}
        draggable={draggable}
      />
    </FullWidthBackground>
  );
}
