import "./globals.css";
import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/env";
import { getTheme, THEME_DEFAULTS } from "@/lib/layoutData";

/** Always fetch fresh theme and menu from DB; no cache so menu changes show immediately. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function buildThemeCssVars(theme) {
  const t = theme || {};
  const set = (key, value) => (value != null && value !== "" ? { [key]: value } : {});
  return {
    ...set("--primary-color", t.primaryColor),
    ...set("--secondary-color", t.secondaryColor),
    ...set("--bg-color", t.bodyBackground || t.sectionBackground),
    ...set("--section-bg-color", t.sectionBackground),
    ...set("--card-bg-color", t.cardBackground),
    ...set("--header-bg-color", t.headerBackground),
    ...set("--footer-bg-color", t.footerBackground),
    ...set("--text-color", t.paragraphColor),
    ...set("--heading-color", t.headingColor),
    ...set("--link-color", t.linkColor),
    ...set("--link-hover-color", t.hoverColor),
    ...set("--muted-text-color", t.mutedTextColor),
    ...set("--border-color", t.borderColor),
    ...set("--divider-color", t.dividerColor),
    ...set("--input-border-color", t.inputBorderColor),
    ...set("--font-family", t.bodyFont || "system-ui, sans-serif"),
    ...set("--heading-font", t.headingFont || t.bodyFont || "system-ui, sans-serif"),
    ...set("--button-font", t.buttonFont || t.bodyFont),
    ...set("--font-size", t.baseFontSize ? `${t.baseFontSize}px` : "16px"),
    ...set("--line-height", t.lineHeight),
    ...set("--letter-spacing", t.letterSpacing != null ? `${t.letterSpacing}px` : undefined),
    ...set("--font-weight", t.fontWeightNormal),
    ...set("--heading-font-weight", t.fontWeightBold),
    ...set("--button-radius", t.buttonRadius != null ? `${t.buttonRadius}px` : undefined),
    ...set("--card-radius", t.cardRadius != null ? `${t.cardRadius}px` : undefined),
    ...set("--input-radius", t.inputRadius != null ? `${t.inputRadius}px` : undefined),
    ...set("--layout-width", t.layoutWidth ? `${t.layoutWidth}px` : "1200px"),
    ...(t.cardShadow === false ? { "--card-shadow": "none" } : {}),
    ...(t.buttonShadow === true ? { "--button-shadow": "0 2px 4px rgba(0,0,0,0.1)" } : {}),
    ...set("--button-bg", t.buttonBackground),
    ...set("--button-color", t.buttonTextColor),
    ...set("--button-hover-bg", t.buttonHoverBackground),
    ...set("--button-hover-color", t.buttonHoverTextColor),
    ...set("--button-padding", t.buttonPadding),
  };
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
  const pathname = headersList.get("x-pathname") || headersList.get("X-Pathname") || "";
  const theme = await getTheme();
  const isAdmin = pathname.startsWith("/admin");
  const dir = theme.direction || "ltr";
  const googleFontsUrl = buildGoogleFontsUrl(theme.googleFonts);

  const colorVars = buildCssVarsFromColors(theme.colors);
  const themeVars = buildThemeCssVars(theme);
  const palette = theme.themePalette || {};
  const themePaletteVars = Object.fromEntries(
    Object.entries(palette).filter(([, v]) => v != null && String(v).trim() !== "").map(([k, v]) => [`--theme-${k}`, v])
  );
  const cssVars = {
    ...themeVars,
    ...themePaletteVars,
    ...colorVars,
    "--font-family": theme.bodyFont || theme.fontFamily || "system-ui, sans-serif",
    "--heading-font": theme.headingFont || theme.headingFontFamily || theme.bodyFont || "system-ui, sans-serif",
    "--font-size": `${theme.baseFontSize ?? theme.fontSize ?? 16}px`,
    "--line-height": String(theme.lineHeight ?? 1.6),
    "--letter-spacing": `${theme.letterSpacing ?? 0}px`,
    "--font-weight": String(theme.fontWeightNormal ?? theme.fontWeight ?? 400),
    "--heading-font-weight": String(theme.fontWeightBold ?? theme.headingFontWeight ?? 700),
    "--layout-width": `${theme.layoutWidth ?? 1200}px`,
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
    <html lang={theme.defaultLocale || "en"} dir={dir} style={cssVars} data-header-layout={theme.headerLayout} data-card-style={theme.cardStyle}>
      <head>
        {theme.faviconUrl && <link rel="icon" href={theme.faviconUrl} />}
        {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
        {theme.customFontUrl && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@font-face { font-family: 'CustomUpload'; src: url('${theme.customFontUrl}'); font-display: swap; }`,
            }}
          />
        )}
        {theme.customCss && <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />}
        {theme.headScripts && <script dangerouslySetInnerHTML={{ __html: theme.headScripts }} />}
        {theme.googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${theme.googleAnalyticsId}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${theme.googleAnalyticsId}');` }} />
          </>
        )}
        {orgJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
