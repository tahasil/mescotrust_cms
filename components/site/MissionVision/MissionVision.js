"use client";

import { CompassOutlined, EyeOutlined } from "@ant-design/icons";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

const clean = (value, fallback = "") => value == null ? fallback : String(value).trim();

export default function MissionVision(props) {
  const prefix = "missionVision";
  const visionTitle = clean(props.missionVisionVisionTitle, "Vision");
  const visionDescription = clean(props.missionVisionVisionDescription, "To help the underprivileged and marginalised live a better tomorrow through various interventions.");
  const missionTitle = clean(props.missionVisionMissionTitle, "Mission");
  const missionDescription = clean(props.missionVisionMissionDescription, "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.");
  const color = (field, fallback) => clean(props[field]) ? getColor(props[field]) : fallback;
  const cardBg = color("missionVisionCardBgColorKey", getColor("surface"));
  const cardBorder = color("missionVisionCardBorderColorKey", getColor("border"));
  const iconColor = color("missionVisionIconColorKey", getColor("primary"));
  const titleColor = color("missionVisionTitleColorKey", getColor("black"));
  const textColor = color("missionVisionTextColorKey", getColor("blackLight"));

  const sectionBgType = clean(props[`${prefix}SectionBgType`], "default");
  const sectionBgImage = clean(props[`${prefix}SectionBgImage`]);
  const sectionBgColorKey = clean(props[`${prefix}SectionBgColorKey`]);
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
  const pageBgType = clean(props[`${prefix}PageContainerBgType`], "default");
  const pageBgImage = clean(props[`${prefix}PageContainerBgImage`]);
  const pageBgColorKey = clean(props[`${prefix}PageContainerBgColorKey`]);
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
  const cards = [
    { title: visionTitle, description: visionDescription, Icon: EyeOutlined },
    { title: missionTitle, description: missionDescription, Icon: CompassOutlined },
  ];

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <div className="fable-section fable-feature-grid fable-mission-vision">
          {cards.map(({ title, description, Icon }, index) => (
            <article className="fable-feature is-tint" style={{ background: cardBg, borderColor: cardBorder }} key={`${title}-${index}`}>
              <Icon className="fable-mission-vision__icon" style={{ color: iconColor }} aria-hidden="true" />
              <h3 style={{ color: titleColor }}>{title}</h3>
              <p style={{ color: textColor }}>{description}</p>
            </article>
          ))}
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
