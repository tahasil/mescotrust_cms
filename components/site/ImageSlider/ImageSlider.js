"use client";

import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import CircularSlider from "@/components/site/CircularSlider";

/**
 * Site component: ImageSlider (Circular Image Slider).
 * Standalone reusable slider — can be added to any page via page builder.
 * Uses the same CircularSlider internally as HomeHero2.
 */
export default function ImageSlider(props) {
  const images = Array.isArray(props?.imageSliderImages)
    ? props.imageSliderImages.filter((s) => s && (s.src || s.url))
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

  if (images.length === 0) {
    return null;
  }

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <CircularSlider
        images={images.map((s) => ({
          src: s.src || s.url,
          alt: s.alt != null ? String(s.alt) : "Slider",
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
