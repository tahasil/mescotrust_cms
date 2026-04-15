import { headers } from "next/headers";
import Script from "next/script";
import { getLayoutData } from "@/lib/layoutData";
import PublicShell from "@/components/layout/PublicShell";
import SmoothScroll from "@/components/cms/SmoothScroll";
import CookieConsent from "@/components/site/CookieConsent";

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

export default async function SiteLayout({ children }) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || headersList.get("X-Pathname") || "/";
  const data = await getLayoutData(pathname);
  const theme = data?.theme || {};
  const logoUrl = theme.logoLightUrl || theme.logoImageUrl || "";

  const headerBgKey = theme.headerBgColorKey || "headerBg";
  const headerCtaBgKey = theme.headerCtaBgColorKey || "headerCta";
  const headerCtaTextKey = theme.headerCtaTextColorKey || "primary";
  const headerDonateBgKey = theme.headerDonateBgColorKey || "gradient";
  const headerDonateTextKey = theme.headerDonateTextColorKey || "white";

  const footerBgKey = theme.footerBgColorKey || "";
  const footerTextKey = theme.footerTextColorKey || "";
  const footerCopyrightBarKey = theme.footerCopyrightBarColorKey || "";

  return (
    <>
      <SmoothScroll />
      <PublicShell
        globalTheme={theme}
        headerItems={data?.headerItems || []}
        footerItems={data?.footerItems || []}
        customHeaderLayout={data?.customHeaderLayout || null}
        customFooterLayout={data?.customFooterLayout || null}
        globalBefore={data?.globalBefore || []}
        globalAfter={data?.globalAfter || []}
        siteTitle={theme.siteTitle ?? ""}
        tagline={theme.tagline}
        logoType={theme.logoType || "text"}
        logoLightUrl={logoUrl}
        logoMobileUrl={theme.logoMobileUrl || ""}
        logoDarkUrl={theme.logoDarkUrl || ""}
        footerCopyrightText={theme.footerCopyrightText}
        headerSticky={theme.headerSticky !== false}
        headerTransparent={theme.headerTransparent}
        headerLayout={theme.headerLayout || "default"}
        headerVolunteerLabel={theme.headerVolunteerLabel}
        headerVolunteerHref={theme.headerVolunteerHref}
        headerVolunteerIconUrl={theme.headerVolunteerIconUrl}
        headerVolunteerIconUrlMobile={theme.headerVolunteerIconUrlMobile || ""}
        headerDonateLabel={theme.headerDonateLabel}
        headerDonateHref={theme.headerDonateHref}
        headerDonateIconUrl={theme.headerDonateIconUrl}
        headerDonateIconUrlMobile={theme.headerDonateIconUrlMobile || ""}
        headerBgValue={resolveThemeColor(theme, headerBgKey)}
        headerCtaBgValue={resolveThemeColor(theme, headerCtaBgKey)}
        headerCtaTextValue={resolveThemeColor(theme, headerCtaTextKey)}
        headerDonateBgValue={resolveThemeColor(theme, headerDonateBgKey)}
        headerDonateTextValue={resolveThemeColor(theme, headerDonateTextKey)}
        volunteerModalTitle={theme.volunteerModalTitle || "Leave us a message"}
        volunteerModalBtnBg={resolveThemeColor(theme, theme.volunteerModalBtnBg)}
        volunteerModalBtnText={resolveThemeColor(theme, theme.volunteerModalBtnText)}
        volunteerModalCancelColor={resolveThemeColor(theme, theme.volunteerModalCancelColor)}
        headerSectionBg={theme._sectionBg ?? ""}
        headerSectionPadding={theme._sectionPadding ?? ""}
        headerSectionBorderSize={theme._sectionBorderSize ?? ""}
        headerSectionBorderStyle={theme._sectionBorderStyle ?? ""}
        headerSectionBorderColor={theme._sectionBorderColor ?? ""}
        headerSectionShadow={theme._sectionShadow ?? ""}
        footerColumnsCount={theme.footerColumnsCount ?? 4}
        footerSocialIcons={theme.footerSocialIcons !== false}
        footerLayoutStyle={theme.footerLayoutStyle}
        footerLogoUrl={theme.footerLogoUrl || ""}
        footerAddress={theme.footerAddress || ""}
        footerEmail={theme.footerEmail || ""}
        footerPhone={theme.footerPhone || ""}
        footerCol1Links={theme.footerCol1Links || []}
        footerCol2Links={theme.footerCol2Links || []}
        footerSocialLinks={theme.footerSocialLinks || []}
        footerBgValue={resolveThemeColor(theme, footerBgKey)}
        footerBackgroundImageUrl={theme.footerBackgroundImageUrl || ""}
        footerTextValue={resolveThemeColor(theme, footerTextKey)}
        footerCopyrightBarValue={resolveThemeColor(theme, footerCopyrightBarKey)}
      >
        {children}
      </PublicShell>
      <style dangerouslySetInnerHTML={{ __html: `:root {
        --layout-width: ${Number(theme.layoutWidth) > 0 ? Number(theme.layoutWidth) : 1200}px;
        --smooth-scroll-enabled: ${theme.smoothScrollEnabled !== false ? "1" : "0"};
        --smooth-scroll-duration: ${Number(theme.smoothScrollDuration) > 0 ? Number(theme.smoothScrollDuration) : 1.4};
        --smooth-scroll-wheel: ${Number(theme.smoothScrollWheelMultiplier) > 0 ? Number(theme.smoothScrollWheelMultiplier) : 1};
        --smooth-scroll-touch: ${Number(theme.smoothScrollTouchMultiplier) > 0 ? Number(theme.smoothScrollTouchMultiplier) : 1.2};
        --fade-enabled: ${theme.fadeAnimationEnabled !== false ? "1" : "0"};
        --fade-duration: ${Number(theme.fadeAnimationDuration) > 0 ? Number(theme.fadeAnimationDuration) : 1}s;
        --fade-distance: ${Number(theme.fadeAnimationDistance) > 0 ? Number(theme.fadeAnimationDistance) : 20}vh;
        --fade-threshold: ${Number(theme.fadeAnimationThreshold) >= 0 ? Number(theme.fadeAnimationThreshold) : 0.1};
      }` }} />
      {theme.footerScripts && <script dangerouslySetInnerHTML={{ __html: theme.footerScripts }} />}
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
      <CookieConsent />
    </>
  );
}
