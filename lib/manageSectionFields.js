/**
 * Shared "Manage Section" (Fluid Container + Box Container) field names and helpers.
 * Used by all site component EditForms: Header, Footer, HomeHero, Marquee, Subscribe, Latest News, Testimonials.
 * Prefix = camelCase component id (e.g. "homeHero", "latestEvents1", "testimonials").
 */

/** Parse "40, 24, 60, 24" (Top, Right, Bottom, Left) into [t, r, b, l]. */
export function parsePaddingString(str) {
  if (str == null || String(str).trim() === "") return [undefined, undefined, undefined, undefined];
  const parts = String(str).split(",").map((s) => s.trim()).slice(0, 4);
  return parts.map((p) => {
    const n = Number(p);
    return p === "" || Number.isNaN(n) || n < 0 ? undefined : n;
  });
}

/** Format [t, r, b, l] to "40, 24, 60, 24". */
export function formatPaddingString(top, right, bottom, left) {
  const arr = [top, right, bottom, left].filter((n) => n != null && n !== "");
  return arr.length ? arr.join(", ") : "";
}

/** Parse "20, 40" (Top, Bottom) into [top, bottom]. */
export function parseMarginTopBottomString(str) {
  if (str == null || String(str).trim() === "") return [undefined, undefined];
  const parts = String(str).split(",").map((s) => s.trim()).slice(0, 2);
  return parts.map((p) => {
    const n = Number(p);
    return p === "" || Number.isNaN(n) || n < 0 ? undefined : n;
  });
}

/** Format [top, bottom] to "20, 40". */
export function formatMarginTopBottomString(top, bottom) {
  const arr = [top, bottom].filter((n) => n != null && n !== "");
  return arr.length ? arr.join(", ") : "";
}

/** Normalize an optional HTML anchor id entered with or without a leading #. */
export function normalizeSectionId(value) {
  return value == null
    ? ""
    : String(value).trim().replace(/^#+/, "").trim();
}

/** Initial values for setFieldsValue. Fluid Container uses padding top/bottom only (SectionPadding = "top, bottom"). */
export function getManageSectionInitialValues(prefix, data) {
  const p = (key) => (data && data[prefix + key] != null ? data[prefix + key] : undefined);
  const sectionPadding = formatMarginTopBottomString(p("SectionPaddingTop"), p("SectionPaddingBottom"));
  const pageContainerPadding = formatPaddingString(
    p("PageContainerPaddingTop"),
    p("PageContainerPaddingRight"),
    p("PageContainerPaddingBottom"),
    p("PageContainerPaddingLeft"),
  );
  const sectionMargin = formatMarginTopBottomString(p("SectionMarginTop"), p("SectionMarginBottom"));
  const pageContainerMargin = formatMarginTopBottomString(p("PageContainerMarginTop"), p("PageContainerMarginBottom"));
  return {
    [prefix + "SectionId"]: normalizeSectionId(data?.[prefix + "SectionId"]),
    [prefix + "SectionBgType"]:
      data?.[prefix + "SectionBgType"] === "image" || data?.[prefix + "SectionBgType"] === "color"
        ? data[prefix + "SectionBgType"]
        : "default",
    [prefix + "SectionBgImage"]: data?.[prefix + "SectionBgImage"] != null ? String(data[prefix + "SectionBgImage"]).trim() : "",
    [prefix + "SectionBgColorKey"]: data?.[prefix + "SectionBgColorKey"] != null ? String(data[prefix + "SectionBgColorKey"]).trim() : "",
    [prefix + "SectionPadding"]: sectionPadding,
    [prefix + "SectionMargin"]: sectionMargin,
    [prefix + "PageContainerBgType"]:
      data?.[prefix + "PageContainerBgType"] === "image" || data?.[prefix + "PageContainerBgType"] === "color"
        ? data[prefix + "PageContainerBgType"]
        : "default",
    [prefix + "PageContainerBgImage"]: data?.[prefix + "PageContainerBgImage"] != null ? String(data[prefix + "PageContainerBgImage"]).trim() : "",
    [prefix + "PageContainerBgColorKey"]: data?.[prefix + "PageContainerBgColorKey"] != null ? String(data[prefix + "PageContainerBgColorKey"]).trim() : "",
    [prefix + "PageContainerPadding"]: pageContainerPadding,
    [prefix + "PageContainerMargin"]: pageContainerMargin,
    _disableFadeAnimation: data?._disableFadeAnimation === true,
  };
}

/** Payload from form values. Section padding = top/bottom only; container padding = all 4. */
export function getManageSectionPayload(prefix, values) {
  const v = (key) => values[prefix + key];
  const [sPT, sPB] = parseMarginTopBottomString(v("SectionPadding"));
  const [cPT, cPR, cPB, cPL] = parsePaddingString(v("PageContainerPadding"));
  const [sMT, sMB] = parseMarginTopBottomString(v("SectionMargin"));
  const [cMT, cMB] = parseMarginTopBottomString(v("PageContainerMargin"));
  return {
    [prefix + "SectionId"]: normalizeSectionId(v("SectionId")),
    [prefix + "SectionBgType"]: v("SectionBgType") === "image" || v("SectionBgType") === "color" ? v("SectionBgType") : "default",
    [prefix + "SectionBgImage"]: v("SectionBgType") === "image" && v("SectionBgImage") != null ? String(v("SectionBgImage")).trim() : "",
    [prefix + "SectionBgColorKey"]: v("SectionBgType") === "color" && v("SectionBgColorKey") != null ? String(v("SectionBgColorKey")).trim() : "",
    [prefix + "SectionPaddingTop"]: sPT != null ? Number(sPT) : undefined,
    [prefix + "SectionPaddingRight"]: undefined,
    [prefix + "SectionPaddingBottom"]: sPB != null ? Number(sPB) : undefined,
    [prefix + "SectionPaddingLeft"]: undefined,
    [prefix + "SectionMarginTop"]: sMT != null ? Number(sMT) : undefined,
    [prefix + "SectionMarginBottom"]: sMB != null ? Number(sMB) : undefined,
    [prefix + "PageContainerBgType"]: v("PageContainerBgType") === "image" || v("PageContainerBgType") === "color" ? v("PageContainerBgType") : "default",
    [prefix + "PageContainerBgImage"]: v("PageContainerBgType") === "image" && v("PageContainerBgImage") != null ? String(v("PageContainerBgImage")).trim() : "",
    [prefix + "PageContainerBgColorKey"]: v("PageContainerBgType") === "color" && v("PageContainerBgColorKey") != null ? String(v("PageContainerBgColorKey")).trim() : "",
    [prefix + "PageContainerPaddingTop"]: cPT != null ? Number(cPT) : undefined,
    [prefix + "PageContainerPaddingRight"]: cPR != null ? Number(cPR) : undefined,
    [prefix + "PageContainerPaddingBottom"]: cPB != null ? Number(cPB) : undefined,
    [prefix + "PageContainerPaddingLeft"]: cPL != null ? Number(cPL) : undefined,
    [prefix + "PageContainerMarginTop"]: cMT != null ? Number(cMT) : undefined,
    [prefix + "PageContainerMarginBottom"]: cMB != null ? Number(cMB) : undefined,
    _disableFadeAnimation: values._disableFadeAnimation === true,
  };
}

/** Snapshot object for admin preview: expanded keys for component props. Pass-through from data with defaults. */
export function getManageSectionSnapshot(prefix, data) {
  const get = (key) => (data && data[prefix + key] !== undefined ? data[prefix + key] : undefined);
  return {
    [prefix + "SectionId"]: normalizeSectionId(get("SectionId")),
    [prefix + "SectionBgType"]: get("SectionBgType") === "image" || get("SectionBgType") === "color" ? get("SectionBgType") : "default",
    [prefix + "SectionBgImage"]: get("SectionBgImage") != null ? String(get("SectionBgImage")).trim() : "",
    [prefix + "SectionBgColorKey"]: get("SectionBgColorKey") != null ? String(get("SectionBgColorKey")).trim() : "",
    [prefix + "SectionPaddingTop"]: get("SectionPaddingTop"),
    [prefix + "SectionPaddingRight"]: get("SectionPaddingRight"),
    [prefix + "SectionPaddingBottom"]: get("SectionPaddingBottom"),
    [prefix + "SectionPaddingLeft"]: get("SectionPaddingLeft"),
    [prefix + "SectionMarginTop"]: get("SectionMarginTop"),
    [prefix + "SectionMarginBottom"]: get("SectionMarginBottom"),
    [prefix + "PageContainerBgType"]: get("PageContainerBgType") === "image" || get("PageContainerBgType") === "color" ? get("PageContainerBgType") : "default",
    [prefix + "PageContainerBgImage"]: get("PageContainerBgImage") != null ? String(get("PageContainerBgImage")).trim() : "",
    [prefix + "PageContainerBgColorKey"]: get("PageContainerBgColorKey") != null ? String(get("PageContainerBgColorKey")).trim() : "",
    [prefix + "PageContainerPaddingTop"]: get("PageContainerPaddingTop"),
    [prefix + "PageContainerPaddingRight"]: get("PageContainerPaddingRight"),
    [prefix + "PageContainerPaddingBottom"]: get("PageContainerPaddingBottom"),
    [prefix + "PageContainerPaddingLeft"]: get("PageContainerPaddingLeft"),
    [prefix + "PageContainerMarginTop"]: get("PageContainerMarginTop"),
    [prefix + "PageContainerMarginBottom"]: get("PageContainerMarginBottom"),
  };
}

export const MANAGE_SECTION_PREFIX_BY_COMPONENT_ID = {
  Header: "header",
  Footer: "footer",
  HomeHero: "homeHero",
  Marquee: "marquee",
  Subscribe: "subscribe",
  Cards: "cards",
  // Persisted namespace retained for content created before the component rename.
  LatestNews: "latestEvents1",
  EventsSlider: "eventsSlider",
  Testimonials: "testimonials",
  OverviewOfOurWork: "overviewOfOurWork",
  OurImpact: "ourImpact",
  HomeHero2: "homeHero2",
};

/** Prefix for components not in the map (e.g. newly created). camelCase of componentId. */
export function getManageSectionPrefix(componentId) {
  if (!componentId || typeof componentId !== "string") return null;
  return (
    MANAGE_SECTION_PREFIX_BY_COMPONENT_ID[componentId] ??
    componentId.charAt(0).toLowerCase() + componentId.slice(1)
  );
}

/** Default manage section props for new components (so Manage Section is available by default). */
export function getDefaultManageSectionProps(prefix) {
  return {
    [prefix + "SectionId"]: "",
    [prefix + "SectionBgType"]: "default",
    [prefix + "SectionBgImage"]: "",
    [prefix + "SectionBgColorKey"]: "",
    [prefix + "SectionPaddingTop"]: undefined,
    [prefix + "SectionPaddingRight"]: undefined,
    [prefix + "SectionPaddingBottom"]: undefined,
    [prefix + "SectionPaddingLeft"]: undefined,
    [prefix + "SectionMarginTop"]: undefined,
    [prefix + "SectionMarginBottom"]: undefined,
    [prefix + "PageContainerBgType"]: "default",
    [prefix + "PageContainerBgImage"]: "",
    [prefix + "PageContainerBgColorKey"]: "",
    [prefix + "PageContainerPaddingTop"]: undefined,
    [prefix + "PageContainerPaddingRight"]: undefined,
    [prefix + "PageContainerPaddingBottom"]: undefined,
    [prefix + "PageContainerPaddingLeft"]: undefined,
    [prefix + "PageContainerMarginTop"]: undefined,
    [prefix + "PageContainerMarginBottom"]: undefined,
  };
}
