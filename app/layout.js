import "./globals.css";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";
import ThemeConfig from "@/models/ThemeConfig";
import Menu from "@/models/Menu";
import PublicShell from "@/components/layout/PublicShell";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Mesco Trust CMS",
    template: "%s | Mesco Trust CMS",
  },
  description: "Content management system",
  openGraph: {
    siteName: "Mesco Trust CMS",
  },
};

const THEME_DEFAULTS = {
  siteTitle: "Mesco Trust",
  logoType: "text",
  logoImageUrl: "",
  colors: [],
  fontFamily: "system-ui, sans-serif",
  fontSize: 16,
  headingFontFamily: "",
  headingFontSize: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeight: 400,
  headingFontWeight: 700,
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
  googleFonts: [],
  customFontUrl: "",
};

const NAME_TO_CSS_VAR = {
  primary: "--primary-color",
  secondary: "--secondary-color",
  background: "--bg-color",
  text: "--text-color",
  heading: "--heading-color",
  link: "--link-color",
  "section-background": "--section-bg-color",
};

function buildCssVarsFromColors(colors) {
  const vars = {};
  if (!Array.isArray(colors)) return vars;
  colors.forEach((c) => {
    if (!c?.name || c.value == null) return;
    const slug = c.name.toLowerCase().trim().replace(/\s+/g, "-");
    const cssKey = NAME_TO_CSS_VAR[slug] || `--theme-${slug.replace(/[^a-z0-9-]/gi, "")}`;
    vars[cssKey] = c.value;
  });
  return vars;
}

async function getLayoutData(pathname) {
  if (pathname?.startsWith("/admin")) return null;
  try {
    await connectDB();
    const [themeDoc, headerMenu, footerMenu] = await Promise.all([
      ThemeConfig.findOne().lean(),
      Menu.findOne({ name: "header" }).lean(),
      Menu.findOne({ name: "footer" }).lean(),
    ]);
    const theme = themeDoc ? { ...THEME_DEFAULTS, ...themeDoc } : THEME_DEFAULTS;
    return {
      theme: JSON.parse(JSON.stringify(theme)),
      headerItems: headerMenu?.items ? JSON.parse(JSON.stringify(headerMenu.items)) : [],
      footerItems: footerMenu?.items ? JSON.parse(JSON.stringify(footerMenu.items)) : [],
    };
  } catch {
    return { theme: THEME_DEFAULTS, headerItems: [], footerItems: [] };
  }
}

function buildGoogleFontsUrl(fonts) {
  if (!fonts?.length) return null;
  const families = fonts
    .map((f) => {
      const weights = f.weights?.length ? f.weights.join(";") : "400;700";
      return `family=${encodeURIComponent(f.family)}:wght@${weights}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export default async function RootLayout({ children }) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  const data = await getLayoutData(pathname);
  const theme = data?.theme || THEME_DEFAULTS;
  const dir = theme.direction || "ltr";
  const googleFontsUrl = buildGoogleFontsUrl(theme.googleFonts);

  const colorVars = buildCssVarsFromColors(theme.colors);
  const cssVars = {
    ...colorVars,
    "--font-family": theme.fontFamily || "system-ui, sans-serif",
    "--heading-font": theme.headingFontFamily || theme.fontFamily || "system-ui, sans-serif",
    "--font-size": `${theme.fontSize || 16}px`,
    "--heading-font-size": theme.headingFontSize ? `${theme.headingFontSize}px` : "inherit",
    "--line-height": String(theme.lineHeight || 1.6),
    "--letter-spacing": `${theme.letterSpacing || 0}px`,
    "--font-weight": String(theme.fontWeight || 400),
    "--heading-font-weight": String(theme.headingFontWeight || 700),
    "--layout-width": `${theme.layoutWidth || 1200}px`,
  };

  const siteName = theme.siteTitle || "Mesco Trust CMS";
  const orgJsonLd = !isAdmin
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteName,
        url: getSiteUrl(),
      }
    : null;

  return (
    <html lang={theme.defaultLocale || "en"} dir={dir} style={isAdmin ? undefined : cssVars}>
      <head>
        {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
        {theme.customFontUrl && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@font-face { font-family: 'CustomUpload'; src: url('${theme.customFontUrl}'); font-display: swap; }`,
            }}
          />
        )}
        {orgJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        )}
      </head>
      <body>
        {isAdmin ? (
          children
        ) : (
          <PublicShell
            headerItems={data?.headerItems || []}
            footerItems={data?.footerItems || []}
            siteTitle={theme.siteTitle || "Mesco Trust"}
            logoType={theme.logoType || "text"}
            logoImageUrl={theme.logoImageUrl || ""}
          >
            {children}
          </PublicShell>
        )}
      </body>
    </html>
  );
}
