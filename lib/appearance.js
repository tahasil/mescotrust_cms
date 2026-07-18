import Appearance from "@/models/Appearance";
import { resolveYearPlaceholder } from "@/lib/yearPlaceholder";

export const APPEARANCE_MODULE_KEYS = Object.freeze(["header", "footer"]);

const HEADER_DEFAULTS = Object.freeze({
  logoType: "image",
  logoUrl: "/",
  logoLightUrl: "/uploads/1772597551416_logo.webp",
  logoMobileUrl: "/uploads/1772597551416_logo.webp",
  menuName: "",
  navItems: [
    { label: "About Us", url: "/about-us/mesco-at-glance", children: [] },
    {
      label: "Our Works",
      url: "/our-works/educational-support",
      children: [
        { label: "Educational Support Programmes", url: "/our-works/educational-support", children: [] },
        { label: "Medical Aid", url: "/our-works/medical-aid", children: [] },
        { label: "Clinics & Dispensaries", url: "/our-works/clinics-dispensaries", children: [] },
        { label: "Relief of Poverty", url: "/our-works/relief-of-poverty", children: [] },
      ],
    },
    { label: "Gallery", url: "/media/image-gallery", children: [] },
    { label: "News & Events", url: "/blogs", children: [] },
  ],
  headerSearchEnabled: false,
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
  headerAnnouncementEnabled: false,
  headerAnnouncementItems: [],
  headerAnnouncementText: "",
  headerAnnouncementLinkUrl: "",
  headerAnnouncementLinkTarget: "_self",
  headerAnnouncementFontSize: 14,
  headerAnnouncementFontWeight: "600",
  headerAnnouncementTextColor: "white",
  headerAnnouncementBackgroundColor: "primary",
  headerAnnouncementMarqueeSpeed: 20,
  headerAnnouncementDirection: "rtl",
  headerAnnouncementPaddingX: 24,
  headerVolunteerLabel: "Volunteer",
  headerVolunteerHref: "/about-us/volunteer",
  headerVolunteerHrefTarget: "_self",
  headerVolunteerIconUrl: "/images/volunteer-icon.svg",
  headerVolunteerIconUrlMobile: "/images/volunteer-icon.svg",
  headerDonateLabel: "Donate Now",
  headerDonateHref: "/donate-now",
  headerDonateIconUrl: "/images/donate-now-icon.svg",
  headerBgColorKey: "dark",
  headerCtaBgColorKey: "transparent",
  headerCtaTextColorKey: "white",
  headerDonateBgColorKey: "gradient",
  headerDonateTextColorKey: "white",
  _sectionBg: "",
  _sectionPadding: "",
  _sectionBorderSize: "",
  _sectionBorderStyle: "",
  _sectionBorderColor: "",
  _sectionShadow: "",
});

const FOOTER_DEFAULTS = Object.freeze({
  footerLogoUrl: "/uploads/1772597551416_logo.webp",
  footerDescription:
    "MESCO, the Modern Educational Social and Cultural Organisation, is a secular trust registered in 1968 with the Charity Commissioner of Mumbai.",
  footerAddress:
    "1 & 2, Plot No 423, Landmark Building, Senapati Bapat Marg, Mahim (W), Mumbai 400016",
  footerEmail: "mescotrust@mescotrust.org",
  footerPhone: "+91 22 2444 1442",
  footerCol1Title: "Our Works",
  footerCol1Links: [
    { label: "Educational Support", url: "/our-works/educational-support-programmes" },
    { label: "Medical Aid", url: "/our-works/medical-aid" },
    { label: "Clinics & Dispensaries", url: "/our-works/clinics-dispensaries" },
    { label: "Relief of Poverty", url: "/our-works/relief-of-poverty" },
    { label: "RC Mahim School Adoption", url: "/our-works/school-adoption" },
    { label: "Old Newspaper Units", url: "/our-works/old-newspaper-units" },
  ],
  footerCol2Title: "Media",
  footerCol2Links: [
    { label: "Image Gallery", url: "/media/image-gallery" },
    { label: "Video Gallery", url: "/media/video-gallery" },
    { label: "In Media", url: "/media/in-media" },
    { label: "Annual Reports", url: "/media/annual-reports" },
  ],
  footerContactTitle: "Contact",
  footerSocialLinks: [
    { platform: "youtube", url: "https://www.youtube.com/@mescotrust29" },
  ],
  footerCopyrightText: "Copyright © {{year}} MESCO Trust. All rights reserved.",
  footerPrivacyLabel: "Privacy Policy",
  footerPrivacyUrl: "/privacy-policy",
  footerRefundLabel: "Refund & Cancellation Policy",
  footerRefundUrl: "/refund-cancellation-policy",
  footerBgColorKey: "dark",
  footerBackgroundImageUrl: "",
  footerTextColorKey: "warmWhite",
  footerCopyrightBarColorKey: "dark",
  _sectionBg: "",
  _sectionPadding: "",
  _sectionBorderSize: "",
  _sectionBorderStyle: "",
  _sectionBorderColor: "",
  _sectionShadow: "",
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
          template: "mesco-fable",
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
