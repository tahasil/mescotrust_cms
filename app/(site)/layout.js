import { headers } from "next/headers";
import Script from "next/script";
import dynamicImport from "next/dynamic";
import { getLayoutData } from "@/lib/layoutData";
import PublicShell from "@/components/layout/PublicShell";

const SmoothScroll = dynamicImport(() => import("@/components/cms/SmoothScroll"), {
  ssr: false,
});
const CookieConsent = dynamicImport(() => import("@/components/site/CookieConsent"), {
  ssr: false,
});
const PageTransitionLoader = dynamicImport(
  () => import("@/components/site/PageTransitionLoader"),
  { ssr: false }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveThemeColor(theme, key) {
  if (!key) return "";
  const k = String(key).trim();
  const normalizedKey = k
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  // 1. Look up by name in palette
  const palette = theme.themePalette || {};
  const paletteEntry = Object.entries(palette).find(
    ([name, value]) =>
      value != null &&
      String(value).trim() !== "" &&
      String(name)
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[\s_-]+/g, "") === normalizedKey,
  );
  if (paletteEntry) return String(paletteEntry[1]).trim();
  // 2. Look up by name in custom colors
  const custom = Array.isArray(theme.colors) ? theme.colors : [];
  const found = custom.find(
    (c) =>
      c &&
      String(c.name || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[\s_-]+/g, "") === normalizedKey,
  );
  if (found && found.value != null) return String(found.value).trim();
  // 3. Look up by value in custom colors (handles legacy stored hex/rgba values)
  const byValue = custom.find((c) => c && String(c.value).trim() === k);
  if (byValue && byValue.value != null) return String(byValue.value).trim();
  // 4. If it looks like a raw color value (hex, rgb, rgba, gradient), use it directly
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(k)) return k;
  return "";
}

function sanitizeInlineScript(value) {
  return String(value || "").replace(/<\/script/gi, "<\\/script");
}

function sanitizeInlineStyle(value) {
  return String(value || "").replace(/<\/style/gi, "<\\/style");
}

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default async function SiteLayout({ children }) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || headersList.get("X-Pathname") || "/";
  const data = await getLayoutData(pathname);
  const theme = data?.theme || {};
  const logoUrl = theme.logoLightUrl || theme.logoImageUrl || "";
  const appearanceHeaderRecord = data?.appearance?.header || null;
  const appearanceHeaderRibbonRecord = data?.appearance?.headerRibbon || null;
  const appearanceFooterRecord = data?.appearance?.footer || null;
  const appearanceHeaderProps = appearanceHeaderRecord?.defaultProps || {};
  const appearanceHeaderRibbonProps =
    appearanceHeaderRibbonRecord?.defaultProps || {};
  const appearanceFooterProps = appearanceFooterRecord?.defaultProps || {};
  const appearanceHeader = appearanceHeaderRecord
    ? {
        ...appearanceHeaderProps,
        active: appearanceHeaderRecord.active !== false,
        siteTitle: theme.siteTitle || "MESCO Trust",
        menuItems:
          Array.isArray(data?.headerItems) && data.headerItems.length > 0
            ? data.headerItems
            : appearanceHeaderProps.navItems || [],
        logoImageUrl: appearanceHeaderProps.logoLightUrl || "",
        volunteerLabel: appearanceHeaderProps.headerVolunteerLabel || "",
        volunteerHref: appearanceHeaderProps.headerVolunteerHref || "",
        volunteerHrefTarget:
          appearanceHeaderProps.headerVolunteerHrefTarget || "_self",
        volunteerIconUrl: appearanceHeaderProps.headerVolunteerIconUrl || "",
        volunteerIconUrlMobile:
          appearanceHeaderProps.headerVolunteerIconUrlMobile || "",
        donateLabel: appearanceHeaderProps.headerDonateLabel || "",
        donateHref: appearanceHeaderProps.headerDonateHref || "",
        donateHrefTarget:
          appearanceHeaderProps.headerDonateHrefTarget || "_self",
        donateIconUrl: appearanceHeaderProps.headerDonateIconUrl || "",
        headerAnnouncementTextColor: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerAnnouncementTextColor,
        ),
        headerAnnouncementBackgroundColor: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerAnnouncementBackgroundColor,
        ),
        headerBgValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerBgColorKey,
        ),
        headerNavTextValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerNavTextColorKey,
        ),
        headerCtaBgValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerCtaBgColorKey,
        ),
        headerCtaTextValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerCtaTextColorKey,
        ),
        headerDonateBgValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerDonateBgColorKey,
        ),
        headerDonateTextValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerDonateTextColorKey,
        ),
        headerResponsiveButtonBorderValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerResponsiveButtonBorderColorKey,
        ),
        headerDesktopSearchBorderValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerDesktopSearchBorderColorKey,
        ),
        headerResponsiveVolunteerIconValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerResponsiveVolunteerIconColorKey,
        ),
        headerResponsiveVolunteerCircleBgValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerResponsiveVolunteerCircleBgColorKey,
        ),
        headerResponsiveDonateIconValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerResponsiveDonateIconColorKey,
        ),
        headerResponsiveDonateCircleBgValue: resolveThemeColor(
          theme,
          appearanceHeaderProps.headerResponsiveDonateCircleBgColorKey,
        ),
        headerMobileButton1IconUrl:
          appearanceHeaderProps.headerMobileButton1IconUrl || "",
        headerMobileButton2IconUrl:
          appearanceHeaderProps.headerMobileButton2IconUrl || "",
        headerMobileButton1Href:
          appearanceHeaderProps.headerMobileButton1Href || "",
        headerMobileButton2Href:
          appearanceHeaderProps.headerMobileButton2Href || "",
        headerMobileButton1Target:
          appearanceHeaderProps.headerMobileButton1Target || "_self",
        headerMobileButton2Target:
          appearanceHeaderProps.headerMobileButton2Target || "_self",
        headerMobileButton1AriaLabel:
          appearanceHeaderProps.headerMobileButton1AriaLabel || "Button 1",
        headerMobileButton2AriaLabel:
          appearanceHeaderProps.headerMobileButton2AriaLabel || "Button 2",
        sectionBg: appearanceHeaderProps._sectionBg || "",
        sectionPadding: appearanceHeaderProps._sectionPadding || "",
        sectionBorderSize: appearanceHeaderProps._sectionBorderSize || "",
        sectionBorderStyle: appearanceHeaderProps._sectionBorderStyle || "",
        sectionBorderColor: appearanceHeaderProps._sectionBorderColor || "",
        sectionShadow: appearanceHeaderProps._sectionShadow || "",
      }
    : null;
  const appearanceFooter = appearanceFooterRecord
    ? {
        ...appearanceFooterProps,
        active: appearanceFooterRecord.active !== false,
        siteTitle: theme.siteTitle || "MESCO Trust",
        footerBgValue: resolveThemeColor(
          theme,
          appearanceFooterProps.footerBgColorKey,
        ),
        footerTextValue: resolveThemeColor(
          theme,
          appearanceFooterProps.footerTextColorKey,
        ),
        footerCopyrightBarValue: resolveThemeColor(
          theme,
          appearanceFooterProps.footerCopyrightBarColorKey,
        ),
      }
    : null;
  const appearanceHeaderRibbon = appearanceHeaderRibbonRecord
    ? {
        ...appearanceHeaderRibbonProps,
        active: appearanceHeaderRibbonRecord.active !== false,
      }
    : null;

  const headerBgKey = theme.headerBgColorKey ?? "";
  const headerCtaBgKey = theme.headerCtaBgColorKey ?? "";
  const headerCtaTextKey = theme.headerCtaTextColorKey ?? "";
  const headerDonateBgKey = theme.headerDonateBgColorKey ?? "";
  const headerDonateTextKey = theme.headerDonateTextColorKey ?? "";

  const footerBgKey = theme.footerBgColorKey ?? "";
  const footerTextKey = theme.footerTextColorKey ?? "";
  const footerCopyrightBarKey = theme.footerCopyrightBarColorKey ?? "";
  const safeFooterScripts = sanitizeInlineScript(theme.footerScripts);
  const safeRootVarsCss = sanitizeInlineStyle(`:root {
        --layout-width: ${safeNumber(theme.layoutWidth, 1200)}px;
        --smooth-scroll-enabled: ${theme.smoothScrollEnabled !== false ? "1" : "0"};
        --smooth-scroll-duration: ${safeNumber(theme.smoothScrollDuration, 1.4)};
        --smooth-scroll-wheel: ${safeNumber(theme.smoothScrollWheelMultiplier, 1)};
        --smooth-scroll-touch: ${safeNumber(theme.smoothScrollTouchMultiplier, 1.2)};
        --fade-enabled: ${theme.fadeAnimationEnabled !== false ? "1" : "0"};
        --fade-duration: ${safeNumber(theme.fadeAnimationDuration, 1)}s;
        --fade-distance: ${safeNumber(theme.fadeAnimationDistance, 20)}vh;
        --fade-threshold: ${safeNumber(theme.fadeAnimationThreshold, 0.1)};
      }`);

  return (
    <>
      <PageTransitionLoader
        enabled={theme.pageLoaderEnabled !== false}
        minDuration={theme.pageLoaderMinDuration}
      />
      <SmoothScroll />
      <PublicShell
        globalTheme={theme}
        appearanceHeader={appearanceHeader}
        appearanceHeaderRibbon={appearanceHeaderRibbon}
        appearanceFooter={appearanceFooter}
        headerItems={data?.headerItems || []}
        footerItems={data?.footerItems || []}
        customHeaderLayout={data?.customHeaderLayout || null}
        customFooterLayout={data?.customFooterLayout || null}
        globalBefore={data?.globalBefore || []}
        globalAfter={data?.globalAfter || []}
        siteTitle={theme.siteTitle}
        tagline={theme.tagline}
        logoUrl={theme.logoUrl ?? ""}
        headerSearchEnabled={theme.headerSearchEnabled === true}
        headerSearchLabel={theme.headerSearchLabel ?? ""}
        headerSearchOpenAriaLabel={theme.headerSearchOpenAriaLabel ?? ""}
        headerSearchPlaceholder={theme.headerSearchPlaceholder ?? ""}
        headerSearchDialogLabel={theme.headerSearchDialogLabel ?? ""}
        headerSearchInputAriaLabel={theme.headerSearchInputAriaLabel ?? ""}
        headerSearchCloseAriaLabel={theme.headerSearchCloseAriaLabel ?? ""}
        headerSearchMinCharsMessage={theme.headerSearchMinCharsMessage ?? ""}
        headerSearchLoadingMessage={theme.headerSearchLoadingMessage ?? ""}
        headerSearchNoResultsMessage={theme.headerSearchNoResultsMessage ?? ""}
        headerSearchErrorMessage={theme.headerSearchErrorMessage ?? ""}
        headerSearchResultTypePageLabel={theme.headerSearchResultTypePageLabel ?? ""}
        headerSearchResultTypeBlogLabel={theme.headerSearchResultTypeBlogLabel ?? ""}
        headerSearchResultTypeEventLabel={theme.headerSearchResultTypeEventLabel ?? ""}
        headerSearchFallbackTitle={theme.headerSearchFallbackTitle ?? ""}
        headerSearchFallbackMeta={theme.headerSearchFallbackMeta ?? ""}
        headerAnnouncementEnabled={theme.headerAnnouncementEnabled === true}
        headerAnnouncementItems={
          Array.isArray(theme.headerAnnouncementItems)
            ? theme.headerAnnouncementItems
            : []
        }
        headerAnnouncementText={theme.headerAnnouncementText ?? ""}
        headerAnnouncementLinkUrl={theme.headerAnnouncementLinkUrl ?? ""}
        headerAnnouncementLinkTarget={theme.headerAnnouncementLinkTarget ?? "_self"}
        headerAnnouncementFontSize={theme.headerAnnouncementFontSize}
        headerAnnouncementFontWeight={theme.headerAnnouncementFontWeight ?? "600"}
        headerAnnouncementTextColor={resolveThemeColor(
          theme,
          theme.headerAnnouncementTextColor ?? "",
        )}
        headerAnnouncementBackgroundColor={resolveThemeColor(
          theme,
          theme.headerAnnouncementBackgroundColor ?? "",
        )}
        headerAnnouncementMarqueeSpeed={theme.headerAnnouncementMarqueeSpeed}
        headerAnnouncementDirection={
          String(theme.headerAnnouncementDirection || "").trim().toLowerCase() ===
          "ltr"
            ? "ltr"
            : "rtl"
        }
        headerAnnouncementPaddingX={theme.headerAnnouncementPaddingX}
        logoType={theme.logoType}
        logoLightUrl={logoUrl}
        logoMobileUrl={theme.logoMobileUrl ?? ""}
        logoDarkUrl={theme.logoDarkUrl ?? ""}
        footerCopyrightText={theme.footerCopyrightText}
        headerSticky={theme.headerSticky !== false}
        headerTransparent={theme.headerTransparent}
        headerLayout={theme.headerLayout}
        headerVolunteerLabel={theme.headerVolunteerLabel}
        headerVolunteerHref={theme.headerVolunteerHref}
        headerVolunteerHrefTarget={theme.headerVolunteerHrefTarget ?? "_self"}
        headerVolunteerIconUrl={theme.headerVolunteerIconUrl}
        headerVolunteerIconUrlMobile={theme.headerVolunteerIconUrlMobile ?? ""}
        headerDonateLabel={theme.headerDonateLabel}
        headerDonateHref={theme.headerDonateHref}
        headerDonateIconUrl={theme.headerDonateIconUrl}
        headerDonateIconUrlMobile={theme.headerDonateIconUrlMobile ?? ""}
        headerBgValue={resolveThemeColor(theme, headerBgKey)}
        headerCtaBgValue={resolveThemeColor(theme, headerCtaBgKey)}
        headerCtaTextValue={resolveThemeColor(theme, headerCtaTextKey)}
        headerDonateBgValue={resolveThemeColor(theme, headerDonateBgKey)}
        headerDonateTextValue={resolveThemeColor(theme, headerDonateTextKey)}
        volunteerModalTitle={theme.volunteerModalTitle}
        volunteerModalSuccessTitle={theme.volunteerModalSuccessTitle ?? ""}
        volunteerModalSuccessDescription={theme.volunteerModalSuccessDescription ?? ""}
        volunteerModalErrorTitle={theme.volunteerModalErrorTitle ?? ""}
        volunteerModalNameLabel={theme.volunteerModalNameLabel ?? ""}
        volunteerModalEmailLabel={theme.volunteerModalEmailLabel ?? ""}
        volunteerModalSubjectLabel={theme.volunteerModalSubjectLabel ?? ""}
        volunteerModalMessageLabel={theme.volunteerModalMessageLabel ?? ""}
        volunteerModalNamePlaceholder={theme.volunteerModalNamePlaceholder ?? ""}
        volunteerModalEmailPlaceholder={theme.volunteerModalEmailPlaceholder ?? ""}
        volunteerModalSubjectPlaceholder={theme.volunteerModalSubjectPlaceholder ?? ""}
        volunteerModalMessagePlaceholder={theme.volunteerModalMessagePlaceholder ?? ""}
        volunteerModalCancelLabel={theme.volunteerModalCancelLabel ?? ""}
        volunteerModalSendLabel={theme.volunteerModalSendLabel ?? ""}
        volunteerModalSendingLabel={theme.volunteerModalSendingLabel ?? ""}
        volunteerModalNameRequiredMessage={theme.volunteerModalNameRequiredMessage ?? ""}
        volunteerModalEmailRequiredMessage={theme.volunteerModalEmailRequiredMessage ?? ""}
        volunteerModalEmailInvalidMessage={theme.volunteerModalEmailInvalidMessage ?? ""}
        volunteerModalSubjectRequiredMessage={theme.volunteerModalSubjectRequiredMessage ?? ""}
        volunteerModalSubjectMinMessage={theme.volunteerModalSubjectMinMessage ?? ""}
        volunteerModalMessageRequiredMessage={theme.volunteerModalMessageRequiredMessage ?? ""}
        volunteerModalMessageMinMessage={theme.volunteerModalMessageMinMessage ?? ""}
        volunteerModalBtnBg={resolveThemeColor(theme, theme.volunteerModalBtnBg)}
        volunteerModalBtnText={resolveThemeColor(theme, theme.volunteerModalBtnText)}
        volunteerModalCancelColor={resolveThemeColor(theme, theme.volunteerModalCancelColor)}
        headerSectionBg={theme._sectionBg ?? ""}
        headerSectionPadding={theme._sectionPadding ?? ""}
        headerSectionBorderSize={theme._sectionBorderSize ?? ""}
        headerSectionBorderStyle={theme._sectionBorderStyle ?? ""}
        headerSectionBorderColor={theme._sectionBorderColor ?? ""}
        headerSectionShadow={theme._sectionShadow ?? ""}
        footerColumnsCount={theme.footerColumnsCount}
        footerSocialIcons={theme.footerSocialIcons !== false}
        footerLayoutStyle={theme.footerLayoutStyle}
        footerLogoUrl={theme.footerLogoUrl ?? ""}
        footerAddress={theme.footerAddress ?? ""}
        footerEmail={theme.footerEmail ?? ""}
        footerPhone={theme.footerPhone ?? ""}
        footerCol1Links={theme.footerCol1Links || []}
        footerCol2Links={theme.footerCol2Links || []}
        footerSocialLinks={theme.footerSocialLinks || []}
        footerBgValue={resolveThemeColor(theme, footerBgKey)}
        footerBackgroundImageUrl={theme.footerBackgroundImageUrl ?? ""}
        footerTextValue={resolveThemeColor(theme, footerTextKey)}
        footerCopyrightBarValue={resolveThemeColor(theme, footerCopyrightBarKey)}
      >
        {children}
      </PublicShell>
      <style dangerouslySetInnerHTML={{ __html: safeRootVarsCss }} />
      {safeFooterScripts && <script dangerouslySetInnerHTML={{ __html: safeFooterScripts }} />}
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="lazyOnload"
      />
      <CookieConsent />
    </>
  );
}
