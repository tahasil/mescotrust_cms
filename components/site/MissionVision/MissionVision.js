"use client";

import {
  AimOutlined,
  BookOutlined,
  BulbOutlined,
  CompassOutlined,
  EyeOutlined,
  GlobalOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  CelebrationsMilestonesIcon,
  CharitablePhysiotherapyIcon,
  GuidanceMotivationIcon,
  MedicalAidDispensaryIcon,
  MumbaiCityUnitIcon,
  MumbaiSuburbanUnitIcon,
  SaturdayActivitiesIcon,
  SportsFacilitiesIcon,
  ThaneUnitIcon,
} from "./icons";

const clean = (value, fallback = "") => value == null ? fallback : String(value).trim();

const ICONS = {
  "mumbai-city-unit": MumbaiCityUnitIcon,
  "mumbai-suburban-unit": MumbaiSuburbanUnitIcon,
  "thane-unit": ThaneUnitIcon,
  "celebrations-milestones": CelebrationsMilestonesIcon,
  "guidance-motivation": GuidanceMotivationIcon,
  "sports-facilities": SportsFacilitiesIcon,
  "saturday-activities": SaturdayActivitiesIcon,
  "medical-aid-dispensary": MedicalAidDispensaryIcon,
  "charitable-physiotherapy": CharitablePhysiotherapyIcon,
  eye: EyeOutlined,
  compass: CompassOutlined,
  aim: AimOutlined,
  heart: HeartOutlined,
  bulb: BulbOutlined,
  team: TeamOutlined,
  book: BookOutlined,
  medicine: MedicineBoxOutlined,
  safety: SafetyCertificateOutlined,
  global: GlobalOutlined,
};

const getIcon = (value, fallback) => ICONS[clean(value)] || fallback;

function normalizeCard(item, index) {
  const fallbackIcons = [EyeOutlined, CompassOutlined];
  return {
    title: clean(item?.title),
    description: clean(item?.description),
    mobileNumber: clean(item?.mobileNumber),
    Icon: getIcon(item?.icon, fallbackIcons[index] || AimOutlined),
  };
}

export default function MissionVision(props) {
  const prefix = "missionVision";
  const mainTitle = clean(props.mainTitle);
  const subTitle = clean(props.subTitle);
  const titleEnabled = props.missionVisionTitleEnabled !== false;
  const subTitleEnabled = props.missionVisionSubTitleEnabled !== false;
  const visionTitle = clean(props.missionVisionVisionTitle, "Vision");
  const visionDescription = clean(props.missionVisionVisionDescription, "To help the underprivileged and marginalised live a better tomorrow through various interventions.");
  const missionTitle = clean(props.missionVisionMissionTitle, "Mission");
  const missionDescription = clean(props.missionVisionMissionDescription, "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.");
  const color = (field, fallback) => clean(props[field]) ? getColor(props[field]) : fallback;
  const subTitleColor = color("missionVisionSubTitleColorKey", getColor("primary"));
  const mainTitleColor = color("missionVisionMainTitleColorKey", getColor("black"));
  const cardBg = color("missionVisionCardBgColorKey", getColor("surface"));
  const cardHoverBg = color("missionVisionCardHoverBgColorKey", cardBg);
  const cardBorder = color("missionVisionCardBorderColorKey", getColor("border"));
  const cardHoverBorder = color("missionVisionCardHoverBorderColorKey", getColor("primary"));
  const iconColor = color("missionVisionIconColorKey", getColor("primary"));
  const iconBg = color("missionVisionIconBgColorKey", "transparent");
  const iconHoverColor = color("missionVisionIconHoverColorKey", iconColor);
  const iconHoverBg = color("missionVisionIconHoverBgColorKey", iconBg);
  const titleColor = color("missionVisionTitleColorKey", getColor("black"));
  const textColor = color("missionVisionTextColorKey", getColor("blackLight"));
  const mobileColor = color("missionVisionMobileColorKey", getColor("primary"));
  const cardsPerRow = Math.max(1, Math.min(4, Number(props.missionVisionCardsPerRow) || 2));

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
  const cards = Array.isArray(props.missionVisionItems)
    ? props.missionVisionItems.map(normalizeCard)
    : [
        normalizeCard({ title: visionTitle, description: visionDescription, icon: props.missionVisionVisionIcon }, 0),
        normalizeCard({ title: missionTitle, description: missionDescription, icon: props.missionVisionMissionIcon }, 1),
      ];
  const colorVars = {
    "--mission-vision-card-bg": cardBg,
    "--mission-vision-card-hover-bg": cardHoverBg,
    "--mission-vision-card-border": cardBorder,
    "--mission-vision-card-hover-border": cardHoverBorder,
    "--mission-vision-icon": iconColor,
    "--mission-vision-icon-bg": iconBg,
    "--mission-vision-icon-hover": iconHoverColor,
    "--mission-vision-icon-hover-bg": iconHoverBg,
    "--mission-vision-card-title": titleColor,
    "--mission-vision-description": textColor,
    "--mission-vision-mobile": mobileColor,
    "--mission-vision-columns": cardsPerRow,
    "--mission-vision-tablet-columns": Math.min(cardsPerRow, 2),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section fable-mission-vision" style={colorVars}>
          {(subTitleEnabled && subTitle) || (titleEnabled && mainTitle) ? (
            <header className="fable-section-heading">
              {subTitleEnabled && subTitle ? (
                <p className="fable-eyebrow" style={{ color: subTitleColor }}>{subTitle}</p>
              ) : null}
              {titleEnabled && mainTitle ? (
                <h2 className="fable-heading" style={{ color: mainTitleColor }}>{renderHighlightedTitle(mainTitle, props)}</h2>
              ) : null}
            </header>
          ) : null}
          <div className="fable-feature-grid">
            {cards.map(({ title, description, mobileNumber, Icon }, index) => (
              <article className="fable-feature is-tint" key={`${title}-${index}`}>
                <span className="fable-mission-vision__icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                {mobileNumber ? (
                  <a className="fable-mission-vision__mobile" href={`tel:${mobileNumber.replace(/[^+\d]/g, "")}`}>
                    {mobileNumber}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
