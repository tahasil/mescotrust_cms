import { headers } from "next/headers";
import Script from "next/script";
import { getLayoutData } from "@/lib/layoutData";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveThemeColor(theme, key) {
  if (!key) return "";
  const palette = theme.themePalette || {};
  if (palette[key] != null && String(palette[key]).trim() !== "") return String(palette[key]).trim();
  const custom = Array.isArray(theme.colors) ? theme.colors : [];
  const found = custom.find((c) => c && String(c.name).trim() === String(key).trim());
  return found && found.value != null ? String(found.value).trim() : "";
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
      <PublicShell
        headerItems={data?.headerItems || []}
        footerItems={data?.footerItems || []}
        customHeaderLayout={data?.customHeaderLayout || null}
        customFooterLayout={data?.customFooterLayout || null}
        globalBefore={data?.globalBefore || []}
        globalAfter={data?.globalAfter || []}
        siteTitle={theme.siteTitle || "Mesco Trust"}
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
        footerColumnsCount={theme.footerColumnsCount ?? 4}
        footerSocialIcons={theme.footerSocialIcons !== false}
        footerLayoutStyle={theme.footerLayoutStyle}
        footerLogoUrl={theme.footerLogoUrl || ""}
        footerAddress={theme.footerAddress || ""}
        footerEmail={theme.footerEmail || ""}
        footerPhone={theme.footerPhone || ""}
        footerCol1Links={theme.footerCol1Links || []}
        footerCol2Links={theme.footerCol2Links || []}
        footerBgValue={resolveThemeColor(theme, footerBgKey)}
        footerTextValue={resolveThemeColor(theme, footerTextKey)}
        footerCopyrightBarValue={resolveThemeColor(theme, footerCopyrightBarKey)}
      >
        {children}
      </PublicShell>
      {theme.footerScripts && <script dangerouslySetInnerHTML={{ __html: theme.footerScripts }} />}
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}
