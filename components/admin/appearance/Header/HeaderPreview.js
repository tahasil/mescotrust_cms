"use client";

import SiteHeader from "@/components/site/Header/Header";

function resolveColor(paletteData, key, fallback = "") {
  if (!key) return fallback;
  const token = String(key).trim();
  const palette = paletteData?.themePalette || {};
  if (palette[token] != null && String(palette[token]).trim() !== "") {
    return String(palette[token]).trim();
  }
  const tokenLower = token.toLowerCase();
  const paletteKey = Object.keys(palette).find(
    (k) =>
      String(k || "")
        .trim()
        .toLowerCase() === tokenLower,
  );
  if (
    paletteKey &&
    palette[paletteKey] != null &&
    String(palette[paletteKey]).trim() !== ""
  ) {
    return String(palette[paletteKey]).trim();
  }
  const custom = Array.isArray(paletteData?.colors) ? paletteData.colors : [];
  const found = custom.find((c) => c && String(c.name || "").trim() === token);
  if (found?.value) return String(found.value).trim();
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(token)) {
    return token;
  }
  return fallback;
}

/**
 * Header preview — renders the REAL site Header in preview mode so the admin
 * preview matches the live site exactly (dropdowns, Search, Volunteer, Donate).
 * The Header's `preview` flag makes it position:relative and disables scroll
 * behavior so it sits inside the preview frame. Props are mapped from the live
 * form snapshot; color keys are resolved to values via the loaded palette.
 */
export default function HeaderPreview({ snapshot = {}, paletteData = {} }) {
  const headerProps = {
    siteTitle: snapshot?.siteTitle || "",
    logoType:
      snapshot?.logoType || (snapshot?.logoLightUrl ? "image" : "text"),
    logoImageUrl: snapshot?.logoLightUrl || snapshot?.logoImageUrl || "",
    logoLightUrl: snapshot?.logoLightUrl || snapshot?.logoImageUrl || "",
    logoMobileUrl: snapshot?.logoMobileUrl || "",
    logoDarkUrl: snapshot?.logoDarkUrl || "",
    menuItems: Array.isArray(snapshot?.navItems) ? snapshot.navItems : [],
    volunteerLabel: snapshot?.headerVolunteerLabel || "",
    volunteerHref: snapshot?.headerVolunteerHref || "",
    volunteerIconUrl: snapshot?.headerVolunteerIconUrl || "",
    donateLabel: snapshot?.headerDonateLabel || "",
    donateHref: snapshot?.headerDonateHref || "",
    donateIconUrl: snapshot?.headerDonateIconUrl || "",
    headerBgValue: resolveColor(paletteData, snapshot?.headerBgColorKey, ""),
    headerCtaBgValue: resolveColor(
      paletteData,
      snapshot?.headerCtaBgColorKey,
      "",
    ),
    headerCtaTextValue: resolveColor(
      paletteData,
      snapshot?.headerCtaTextColorKey,
      "",
    ),
    headerDonateBgValue: resolveColor(
      paletteData,
      snapshot?.headerDonateBgColorKey,
      "",
    ),
    headerDonateTextValue: resolveColor(
      paletteData,
      snapshot?.headerDonateTextColorKey,
      "",
    ),
    sectionBg: resolveColor(paletteData, snapshot?._sectionBg, ""),
    sectionPadding: snapshot?._sectionPadding || "",
    preview: true,
  };

  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        overflow: "hidden",
        background: headerProps.sectionBg || "#fafafa",
      }}
    >
      <SiteHeader {...headerProps} />
    </div>
  );
}
