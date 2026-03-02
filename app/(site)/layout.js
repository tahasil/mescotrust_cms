import { headers } from "next/headers";
import Script from "next/script";
import { getLayoutData } from "@/lib/layoutData";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SiteLayout({ children }) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || headersList.get("X-Pathname") || "/";
  const data = await getLayoutData(pathname);
  const theme = data?.theme || {};
  const logoUrl = theme.logoLightUrl || theme.logoImageUrl || "";

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
        logoDarkUrl={theme.logoDarkUrl || ""}
        footerCopyrightText={theme.footerCopyrightText}
        headerSticky={theme.headerSticky !== false}
        headerTransparent={theme.headerTransparent}
        headerLayout={theme.headerLayout || "default"}
        headerVolunteerLabel={theme.headerVolunteerLabel}
        headerVolunteerHref={theme.headerVolunteerHref}
        headerVolunteerIconUrl={theme.headerVolunteerIconUrl}
        headerDonateLabel={theme.headerDonateLabel}
        headerDonateHref={theme.headerDonateHref}
        headerDonateIconUrl={theme.headerDonateIconUrl}
        footerColumnsCount={theme.footerColumnsCount ?? 4}
        footerSocialIcons={theme.footerSocialIcons !== false}
        footerLayoutStyle={theme.footerLayoutStyle}
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
