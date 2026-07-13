"use client";

import { usePathname } from "next/navigation";
import PublicShell from "@/components/layout/PublicShell";

function resolveThemeColor(theme, key) {
  if (!key) return "";
  const k = String(key).trim();
  const palette = theme?.themePalette || {};
  if (palette[k] != null && String(palette[k]).trim() !== "") {
    return String(palette[k]).trim();
  }
  const custom = Array.isArray(theme?.colors) ? theme.colors : [];
  const byName = custom.find((item) => item && String(item.name).trim() === k);
  if (byName?.value != null) return String(byName.value).trim();
  const byValue = custom.find(
    (item) => item && String(item.value).trim() === k,
  );
  if (byValue?.value != null) return String(byValue.value).trim();
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(k)) {
    return k;
  }
  return "";
}

export default function LayoutSwitcher({ children, data, theme, logoUrl, initialPathname = "", serverAdmin = false }) {
  const pathname = usePathname();
  const path = pathname ?? initialPathname;
  const isAdmin = serverAdmin || (typeof path === "string" && path.startsWith("/admin"));

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <PublicShell
      headerItems={data?.headerItems || []}
      footerItems={data?.footerItems || []}
      customHeaderLayout={data?.customHeaderLayout || null}
      customFooterLayout={data?.customFooterLayout || null}
      globalBefore={data?.globalBefore || []}
      globalAfter={data?.globalAfter || []}
      siteTitle={theme?.siteTitle || ""}
      tagline={theme?.tagline}
      logoUrl={theme?.logoUrl || ""}
      logoType={theme?.logoType || "text"}
      logoLightUrl={logoUrl}
      logoDarkUrl={theme?.logoDarkUrl || ""}
      footerCopyrightText={theme?.footerCopyrightText}
      headerSticky={theme?.headerSticky !== false}
      headerTransparent={theme?.headerTransparent}
      headerLayout={theme?.headerLayout || "default"}
      headerVolunteerLabel={theme?.headerVolunteerLabel}
      headerVolunteerHref={theme?.headerVolunteerHref}
      headerVolunteerHrefTarget={theme?.headerVolunteerHrefTarget ?? "_self"}
      headerVolunteerIconUrl={theme?.headerVolunteerIconUrl}
      headerAnnouncementEnabled={theme?.headerAnnouncementEnabled === true}
      headerAnnouncementItems={
        Array.isArray(theme?.headerAnnouncementItems)
          ? theme.headerAnnouncementItems
          : []
      }
      headerAnnouncementFontSize={theme?.headerAnnouncementFontSize}
      headerAnnouncementFontWeight={theme?.headerAnnouncementFontWeight ?? "600"}
      headerAnnouncementTextColor={resolveThemeColor(
        theme,
        theme?.headerAnnouncementTextColor ?? "",
      )}
      headerAnnouncementBackgroundColor={resolveThemeColor(
        theme,
        theme?.headerAnnouncementBackgroundColor ?? "",
      )}
      headerAnnouncementMarqueeSpeed={theme?.headerAnnouncementMarqueeSpeed}
      headerAnnouncementPaddingX={theme?.headerAnnouncementPaddingX}
      headerDonateLabel={theme?.headerDonateLabel}
      headerDonateHref={theme?.headerDonateHref}
      headerDonateIconUrl={theme?.headerDonateIconUrl}
      footerColumnsCount={theme?.footerColumnsCount ?? 4}
      footerSocialIcons={theme?.footerSocialIcons !== false}
      footerLayoutStyle={theme?.footerLayoutStyle}
    >
      {children}
    </PublicShell>
  );
}
