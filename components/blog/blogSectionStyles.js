import { getColor } from "@/styles/Theme";

function text(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

export function getBlogSectionStyles(props, prefix, defaultClassName = "defaultBackground") {
  const type = text(props?.[`${prefix}SectionBgType`], "default");
  const image = text(props?.[`${prefix}SectionBgImage`]);
  const color = text(props?.[`${prefix}SectionBgColorKey`]);
  const sectionBgClassName = type === "default" ? defaultClassName : undefined;
  const sectionBgStyle = type === "image" && image
    ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : type === "color" && color
      ? { backgroundColor: getColor(color), backgroundImage: "none" }
      : {};
  const px = (name) => {
    const value = Number(props?.[`${prefix}${name}`]);
    return Number.isFinite(value) && value >= 0 ? `${value}px` : undefined;
  };
  [["SectionPaddingTop", "paddingTop"], ["SectionPaddingBottom", "paddingBottom"], ["SectionMarginTop", "marginTop"], ["SectionMarginBottom", "marginBottom"]]
    .forEach(([name, cssName]) => { const value = px(name); if (value) sectionBgStyle[cssName] = value; });

  const containerType = text(props?.[`${prefix}PageContainerBgType`], "default");
  const containerImage = text(props?.[`${prefix}PageContainerBgImage`]);
  const containerColor = text(props?.[`${prefix}PageContainerBgColorKey`]);
  const pageContainerBgStyle = containerType === "image" && containerImage
    ? { backgroundImage: `url(${containerImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : containerType === "color" && containerColor
      ? { backgroundColor: getColor(containerColor), backgroundImage: "none" }
      : {};
  [["PageContainerPaddingTop", "paddingTop"], ["PageContainerPaddingRight", "paddingRight"], ["PageContainerPaddingBottom", "paddingBottom"], ["PageContainerPaddingLeft", "paddingLeft"], ["PageContainerMarginTop", "marginTop"], ["PageContainerMarginBottom", "marginBottom"]]
    .forEach(([name, cssName]) => { const value = px(name); if (value) pageContainerBgStyle[cssName] = value; });

  return {
    sectionBgClassName,
    sectionBgStyle: Object.keys(sectionBgStyle).length ? sectionBgStyle : undefined,
    pageContainerBgStyle: Object.keys(pageContainerBgStyle).length ? pageContainerBgStyle : undefined,
  };
}
