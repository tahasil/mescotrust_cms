"use client";

import { usePathname } from "next/navigation";
import PublicShell from "@/components/layout/PublicShell";

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
