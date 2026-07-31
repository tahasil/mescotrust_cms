"use client";

import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

function text(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

const ImpactMedia = styled.div`
  width: 80%;
  min-width: 0;
  margin-inline: auto;
`;

export default function ImpactShowcase(props) {
  const prefix = "impactShowcase";
  const imageDesktop = text(
    props.impactShowcaseImageDesktop ??
      props.impactShowcaseLeftImageDesktop ??
      props.impactShowcaseLeftImage,
    "/images/about-mesco-1.png",
  );
  const imageMobile = text(
    props.impactShowcaseImageMobile ?? props.impactShowcaseLeftImageMobile,
  );
  const imageAlt = text(
    props.impactShowcaseImageAlt,
    "MESCO: helping people live a better tomorrow",
  );
  const subTitle = text(props.impactShowcaseSubTitle, "Who We Are");
  const mainTitle = text(
    props.impactShowcaseMainTitle,
    "Education first, *then everything else.*",
  );
  const body1 = text(
    props.impactShowcaseBody1,
    "‘Education’ was identified as the core theme for human development, and the work later expanded to medical assistance and poverty relief. Well strategised schemes, programmes and institutions carry the mission.",
  );
  const body2 = text(
    props.impactShowcaseBody2,
    "The approach has always been to uphold ethical values in delivering, and to be a channel from those who want to give to those who need it most. MESCO is trusted by individuals, families, foundations, charities and corporates in India and abroad.",
  );
  const statValue = text(props.impactShowcaseStatValue, "15,000+");
  const statLabel = text(
    props.impactShowcaseStatLabel,
    "families touched every year",
  );
  const bodyFontSize = numberInRange(props.impactShowcaseBodyFontSize, 17, 10, 32);

  const color = (key, fallback) =>
    text(props[key]) ? getColor(props[key]) : fallback;
  const subtitleColor = color("impactShowcaseSubTitleColorKey", getColor("primary"));
  const titleColor = color("impactShowcaseTitleColorKey", getColor("black"));
  const bodyColor = color("impactShowcaseBodyColorKey", getColor("blackLight"));
  const statValueColor = color("impactShowcaseStatValueColorKey", getColor("black"));
  const statLabelColor = color("impactShowcaseStatLabelColorKey", getColor("blackMuted"));

  const sectionBgType = text(props[`${prefix}SectionBgType`], "default");
  const sectionBgImage = text(props[`${prefix}SectionBgImage`]);
  const sectionBgColorKey = text(props[`${prefix}SectionBgColorKey`]);
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = {
    ...(sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : {}),
    ...(props[`${prefix}SectionPaddingTop`] != null ? { paddingTop: `${Number(props[`${prefix}SectionPaddingTop`])}px` } : {}),
    ...(props[`${prefix}SectionPaddingBottom`] != null ? { paddingBottom: `${Number(props[`${prefix}SectionPaddingBottom`])}px` } : {}),
    ...(props[`${prefix}SectionMarginTop`] != null ? { marginTop: `${Number(props[`${prefix}SectionMarginTop`])}px` } : {}),
    ...(props[`${prefix}SectionMarginBottom`] != null ? { marginBottom: `${Number(props[`${prefix}SectionMarginBottom`])}px` } : {}),
  };
  const pageBgType = text(props[`${prefix}PageContainerBgType`], "default");
  const pageBgImage = text(props[`${prefix}PageContainerBgImage`]);
  const pageBgColorKey = text(props[`${prefix}PageContainerBgColorKey`]);
  const pageContainerBgStyle = {
    ...(pageBgType === "image" && pageBgImage
      ? { backgroundImage: `url(${pageBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageBgType === "color" && pageBgColorKey
        ? { backgroundColor: getColor(pageBgColorKey), backgroundImage: "none" }
        : {}),
    ...["Top", "Right", "Bottom", "Left"].reduce((style, side) => {
      const value = props[`${prefix}PageContainerPadding${side}`];
      if (value != null) style[`padding${side}`] = `${Number(value)}px`;
      return style;
    }, {}),
    ...(props[`${prefix}PageContainerMarginTop`] != null ? { marginTop: `${Number(props[`${prefix}PageContainerMarginTop`])}px` } : {}),
    ...(props[`${prefix}PageContainerMarginBottom`] != null ? { marginBottom: `${Number(props[`${prefix}PageContainerMarginBottom`])}px` } : {}),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section fable-about-intro">
          <ImpactMedia className="fable-about-intro__media">
            <div className="fable-about-intro__arch">
              <picture>
                {imageMobile ? <source media="(max-width: 767px)" srcSet={imageMobile} /> : null}
                <img src={imageDesktop || imageMobile} alt={imageAlt} loading="lazy" />
              </picture>
            </div>
            {(statValue || statLabel) ? (
              <p className="fable-about-intro__stat" style={{ color: statLabelColor }}>
                {statValue ? <strong style={{ color: statValueColor }}>{statValue}</strong> : null}
                {statLabel}
              </p>
            ) : null}
          </ImpactMedia>
          <div className="fable-about-intro__copy">
            {subTitle ? <p className="fable-eyebrow" style={{ color: subtitleColor }}>{subTitle}</p> : null}
            {mainTitle ? <h2 className="fable-heading" style={{ color: titleColor }}>{renderHighlightedTitle(mainTitle, props)}</h2> : null}
            {body1 ? <div className="fable-prose" style={{ color: bodyColor, fontSize: `${bodyFontSize}px` }}><SafeHtml html={body1} /></div> : null}
            {body2 ? <div className="fable-prose" style={{ color: bodyColor, fontSize: `${bodyFontSize}px` }}><SafeHtml html={body2} /></div> : null}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
