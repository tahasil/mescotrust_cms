import Appearance from "@/models/Appearance";
import { resolveYearPlaceholder } from "@/lib/yearPlaceholder";

export const APPEARANCE_MODULE_KEYS = Object.freeze([
  "header",
  "header-ribbon",
  "footer",
]);

const HEADER_RIBBON_DEFAULTS = Object.freeze({
  ribbonAriaLabel: "Important notice",
  ribbonNoticeText:
    "Notice: List of Selected Students — School Scholarship 2026-27",
  ribbonActionText: "View Notice",
  ribbonActionUrl: "/get-involved/notices",
  ribbonActionTarget: "_self",
  ribbonDirection: "rtl",
  ribbonSpeed: 45,
  ribbonItems: [
    {
      noticeText:
        "Notice: List of Selected Students — School Scholarship 2026-27",
      actionText: "View Notice",
      actionUrl: "/get-involved/notices",
      actionTarget: "_self",
    },
  ],
  ribbonActionEnabled: true,
  ribbonShowNoticeIcon: true,
  ribbonShowLinkArrow: true,
  ribbonBackgroundColorKey: "Black",
  ribbonTextColorKey: "Cream",
  ribbonLinkColorKey: "White",
  ribbonHoverColorKey: "Primary Soft",
  ribbonIconColorKey: "Primary Soft",
  ribbonBorderColorKey: "rgba(250, 246, 239, 0.1)",
  ribbonLinkBorderColorKey: "rgba(250, 246, 239, 0.5)",
  ribbonFocusColorKey: "Primary Soft",
});

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
  headerVolunteerIconUrl: "/images/volunteer-icon.svg",
  headerDonateIconUrl: "/images/donate-now-icon.svg",
  headerBgColorKey: "#ffffff",
  headerNavTextColorKey: "#1a1a1a",
  headerCtaBgColorKey: "#FDF1F1",
  headerCtaTextColorKey: "#A82D2D",
  headerDonateBgColorKey: "#A82D2D",
  headerDonateTextColorKey: "#ffffff",
  headerResponsiveButtonBorderColorKey: "#A82D2D",
  headerDesktopSearchBorderColorKey: "rgba(0,0,0,.12)",
  headerResponsiveVolunteerIconColorKey: "#A82D2D",
  headerResponsiveVolunteerCircleBgColorKey: "#ffffff",
  headerResponsiveDonateIconColorKey: "#ffffff",
  headerResponsiveDonateCircleBgColorKey: "#A82D2D",
  headerMobileButton1IconUrl: "",
  headerMobileButton2IconUrl: "",
  headerMobileButton1Href: "",
  headerMobileButton2Href: "",
  headerMobileButton1Target: "_self",
  headerMobileButton2Target: "_self",
  headerMobileButton1AriaLabel: "Button 1",
  headerMobileButton2AriaLabel: "Button 2",
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
    { platform: "instagram", url: "https://www.instagram.com/mesco.trust/", target: "_blank" },
    { platform: "facebook", url: "https://www.facebook.com/mesco.trust", target: "_blank" },
    { platform: "linkedin", url: "https://www.linkedin.com/company/mesco-trust/", target: "_blank" },
    { platform: "youtube", url: "https://www.youtube.com/@mescotrust29", target: "_blank" },
    { platform: "x", url: "https://x.com/_mesco_trust", target: "_blank" },
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
  footerSectionTitleColorKey: "#ffffff",
  footerTopBorderColorKey: "",
  footerCopyrightTopBorderColorKey: "rgba(250,246,239,.14)",
  footerCopyrightTextColorKey: "",
  footerLinkHoverColorKey: "",
  footerBrandDescriptionColorKey: "",
});

export const APPEARANCE_DEFAULTS = Object.freeze({
  header: HEADER_DEFAULTS,
  "header-ribbon": HEADER_RIBBON_DEFAULTS,
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
          displayName:
            moduleKey === "header"
              ? "Header"
              : moduleKey === "header-ribbon"
                ? "Header Ribbon"
                : "Footer",
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

  for (const doc of existing) {
    const defaults = { ...(APPEARANCE_DEFAULTS[doc.moduleKey] || {}) };
    const savedProps =
      doc.defaultProps && typeof doc.defaultProps === "object"
        ? doc.defaultProps
        : {};
    if (doc.moduleKey === "header-ribbon") {
      let noticeText = String(savedProps.ribbonNoticeText || "").trim();
      let actionText = String(savedProps.ribbonActionText || "").trim();
      let actionUrl = String(savedProps.ribbonActionUrl || "").trim();
      let actionTarget =
        savedProps.ribbonActionTarget === "_blank" ? "_blank" : "_self";

      if (
        Array.isArray(savedProps.ribbonItems) &&
        savedProps.ribbonItems.length > 0
      ) {
        if (
          savedProps.ribbonItems.length === 2 &&
          !savedProps.ribbonItems[0]?.noticeText &&
          (savedProps.ribbonItems[0]?.text || savedProps.ribbonItems[0]?.label) &&
          (savedProps.ribbonItems[1]?.url || savedProps.ribbonItems[1]?.href)
        ) {
          const legacyNotice = savedProps.ribbonItems[0] || {};
          const legacyAction = savedProps.ribbonItems[1] || {};
          noticeText = String(
            legacyNotice.text || legacyNotice.label || defaults.ribbonNoticeText,
          ).trim();
          actionText = String(
            legacyAction.text || legacyAction.label || defaults.ribbonActionText,
          ).trim();
          actionUrl = String(
            legacyAction.url || legacyAction.href || defaults.ribbonActionUrl,
          ).trim();
          actionTarget = legacyAction.target === "_blank" ? "_blank" : "_self";
          defaults.ribbonItems = [
            {
              noticeText,
              actionText,
              actionUrl,
              actionTarget,
            },
          ];
        }
      } else if (noticeText || actionText || actionUrl) {
        defaults.ribbonItems = [
          {
            noticeText: noticeText || defaults.ribbonNoticeText,
            actionText: actionText || defaults.ribbonActionText,
            actionUrl: actionUrl || defaults.ribbonActionUrl,
            actionTarget,
          },
        ];
      }
    }
    const missingDefaults = Object.fromEntries(
      Object.entries(defaults).filter(
        ([key]) => !Object.prototype.hasOwnProperty.call(savedProps, key),
      ),
    );
    if (Object.keys(missingDefaults).length > 0) {
      const missingDefaultUpdates = Object.fromEntries(
        Object.entries(missingDefaults).map(([key, value]) => [
          `defaultProps.${key}`,
          value,
        ]),
      );
      await Appearance.updateOne(
        { _id: doc._id },
        { $set: missingDefaultUpdates },
      );
    }
  }

  return Appearance.find({ moduleKey: { $in: APPEARANCE_MODULE_KEYS } }).lean();
}
