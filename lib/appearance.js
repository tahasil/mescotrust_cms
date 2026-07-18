import Appearance from "@/models/Appearance";
import { resolveYearPlaceholder } from "@/lib/yearPlaceholder";

export const APPEARANCE_MODULE_KEYS = Object.freeze(["header", "footer"]);

const HEADER_DEFAULTS = Object.freeze({
  logoType: "image",
  logoUrl: "/",
  logoTarget: "_self",
  logoLightUrl: "/uploads/1772597551416_logo.webp",
  logoMobileUrl: "/uploads/1772597551416_logo.webp",
  menuName: "Primary Menu",
  navItems: [],
  headerSearchEnabled: true,
  headerSearchLabel: "Search",
  headerSearchOpenAriaLabel: "Open search",
  headerSearchPlaceholder: "Search the website",
  headerSearchDialogLabel: "Site search",
  headerSearchInputAriaLabel: "Search",
  headerSearchCloseAriaLabel: "Close search",
  headerSearchMinCharsMessage: "Enter at least 2 characters",
  headerSearchLoadingMessage: "Searching...",
  headerSearchNoResultsMessage: "No results found for {query}",
  headerSearchErrorMessage: "Search is temporarily unavailable",
  headerSearchResultTypePageLabel: "Page",
  headerSearchResultTypeBlogLabel: "Blog",
  headerSearchResultTypeEventLabel: "Event",
  headerSearchFallbackTitle: "Untitled",
  headerSearchFallbackMeta: "",
  headerVolunteerLabel: "Volunteer",
  headerVolunteerHref: "/about-us/volunteer",
  headerVolunteerHrefTarget: "_self",
  headerDonateLabel: "Donate Now",
  headerDonateHref: "/donate-now",
  headerDonateHrefTarget: "_self",
  headerBgColorKey: "rgba(27, 24, 38, 0.72)",
  headerCtaBgColorKey: "Primary Light",
  headerCtaTextColorKey: "Black",
  headerDonateBgColorKey: "#E03C33",
  headerDonateTextColorKey: "white",
});

const FOOTER_DEFAULTS = Object.freeze({
  footerLogoUrl: "/uploads/1772597551416_logo.webp",
  footerLogoHref: "/",
  footerLogoTarget: "_self",
  footerDescription:
    "MESCO, the Modern Educational Social and Cultural Organisation, is a secular trust registered in 1968 with the Charity Commissioner of Mumbai.",
  footerAddress:
    "1 & 2, Plot No 423, Landmark Building, Senapati Bapat Marg, Mahim (W), Mumbai 400016",
  footerEmail: "mescotrust@mescotrust.org",
  footerEmailTarget: "_self",
  footerPhone: "+91 22 2444 1442",
  footerPhoneTarget: "_self",
  footerCol1Title: "Our Works",
  footerCol1Links: [
    { label: "Educational Support", url: "/our-works/educational-support-programmes", target: "_self" },
    { label: "Medical Aid", url: "/our-works/medical-aid", target: "_self" },
    { label: "Clinics & Dispensaries", url: "/our-works/clinics-dispensaries", target: "_self" },
    { label: "Relief of Poverty", url: "/our-works/relief-of-poverty", target: "_self" },
    { label: "RC Mahim School Adoption", url: "/our-works/school-adoption", target: "_self" },
    { label: "Old Newspaper Units", url: "/our-works/old-newspaper-units", target: "_self" },
  ],
  footerCol2Title: "Media",
  footerCol2Links: [
    { label: "Image Gallery", url: "/media/image-gallery", target: "_self" },
    { label: "Video Gallery", url: "/media/video-gallery", target: "_self" },
    { label: "In Media", url: "/media/in-media", target: "_self" },
    { label: "Annual Reports", url: "/media/annual-reports", target: "_self" },
  ],
  footerContactTitle: "Contact",
  footerSocialLinks: [
    { platform: "youtube", url: "https://www.youtube.com/@mescotrust29", target: "_blank" },
  ],
  footerCopyrightText: "Copyright © {{year}} MESCO Trust. All rights reserved.",
  footerPrivacyLabel: "Privacy Policy",
  footerPrivacyUrl: "/privacy-policy",
  footerPrivacyTarget: "_self",
  footerRefundLabel: "Refund & Cancellation Policy",
  footerRefundUrl: "/refund-cancellation-policy",
  footerRefundTarget: "_self",
  footerBgColorKey: "dark",
  footerBackgroundImageUrl: "",
  footerTextColorKey: "rgba(250, 246, 239, 0.82)",
  footerCopyrightBarColorKey: "dark",
});

export const APPEARANCE_DEFAULTS = Object.freeze({
  header: HEADER_DEFAULTS,
  footer: FOOTER_DEFAULTS,
});

export function isAppearanceModuleKey(value) {
  return APPEARANCE_MODULE_KEYS.includes(String(value || "").trim().toLowerCase());
}

export function serializeAppearanceDocument(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const props =
    plain.defaultProps && typeof plain.defaultProps === "object"
      ? { ...plain.defaultProps }
      : {};
  if (plain.moduleKey === "footer") {
    props.footerCopyrightText = resolveYearPlaceholder(
      props.footerCopyrightText,
    );
  }
  return JSON.parse(
    JSON.stringify({
      moduleKey: plain.moduleKey,
      displayName: plain.displayName,
      template: plain.template,
      active: plain.active !== false,
      layout: Array.isArray(plain.layout) ? plain.layout : [],
      defaultProps: props,
      updatedAt: plain.updatedAt,
    }),
  );
}

export async function ensureAppearanceDocuments() {
  const existing = await Appearance.find({
    moduleKey: { $in: APPEARANCE_MODULE_KEYS },
  }).lean();
  const existingKeys = new Set(existing.map((item) => item.moduleKey));
  const missing = APPEARANCE_MODULE_KEYS.filter((key) => !existingKeys.has(key));

  if (missing.length > 0) {
    try {
      await Appearance.insertMany(
        missing.map((moduleKey) => ({
          moduleKey,
          displayName: moduleKey === "header" ? "Header" : "Footer",
          template: "appearance-default",
          defaultProps: { ...APPEARANCE_DEFAULTS[moduleKey] },
          layout: [],
          active: true,
          publishedAt: new Date(),
        })),
        { ordered: false },
      );
    } catch (error) {
      if (error?.code !== 11000 && !error?.writeErrors?.every((item) => item?.code === 11000)) {
        throw error;
      }
    }
  }

  return Appearance.find({ moduleKey: { $in: APPEARANCE_MODULE_KEYS } }).lean();
}
