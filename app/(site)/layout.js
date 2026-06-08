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
  // 1. Look up by name in palette
  const palette = theme.themePalette || {};
  if (palette[k] != null && String(palette[k]).trim() !== "") return String(palette[k]).trim();
  // 2. Look up by name in custom colors
  const custom = Array.isArray(theme.colors) ? theme.colors : [];
  const found = custom.find((c) => c && String(c.name).trim() === k);
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
