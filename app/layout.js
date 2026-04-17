import "./globals.css";
import { headers } from "next/headers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import StyledComponentsRegistry from "@/lib/StyledComponentsRegistry";
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
    Object.entries(palette).filter(([, v]) => v != null && String(v).trim() !== "").map(([k, v]) => {
      const slug = String(k)
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      return [`--theme-${slug}`, v];
    })
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

  const loaderEnabled = !isAdmin && theme.pageLoaderEnabled !== false;
  const loaderBg = theme.pageLoaderBgColor || "#000000";
  const loaderBar = theme.pageLoaderBarColor || "#CF372F";
  const loaderMinDuration = theme.pageLoaderMinDuration ?? 400;

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
    <html lang={theme.defaultLocale || "en"} dir={dir} style={cssVars} data-header-layout={theme.headerLayout} data-card-style={theme.cardStyle} className={loaderEnabled ? "page-loading" : undefined}>
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
        {loaderEnabled && (
          <style dangerouslySetInnerHTML={{ __html: `
html.page-loading,body.page-loading{overflow:hidden;margin:0;padding:0}
#page-loader{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:${loaderBg};transition:opacity .5s ease-out,visibility .5s ease-out}
#page-loader.page-loader-hidden{opacity:0;visibility:hidden;pointer-events:none}
.page-loader-bars{display:flex;align-items:center;justify-content:center;gap:6px;height:50px}
.page-loader-bar{width:6px;height:50px;background:${loaderBar};border-radius:3px;animation:page-loader-bounce 1.2s ease-in-out infinite both}
.page-loader-bar:nth-child(1){animation-delay:-.4s}
.page-loader-bar:nth-child(2){animation-delay:-.32s}
.page-loader-bar:nth-child(3){animation-delay:-.24s}
.page-loader-bar:nth-child(4){animation-delay:-.16s}
.page-loader-bar:nth-child(5){animation-delay:-.08s}
@keyframes page-loader-bounce{0%,80%,100%{transform:scaleY(.4)}40%{transform:scaleY(1)}}
` }} />
        )}
        {theme.customCss && <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />}
        {theme.headScripts && <script dangerouslySetInnerHTML={{ __html: theme.headScripts }} />}
        {theme.googleAnalyticsId && (
          <>
            {/* Google Consent Mode v2 — default-deny until the user accepts via the
                cookie banner. The banner calls gtag('consent','update',...) on accept. */}
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});try{var c=window.localStorage.getItem('mesco_cookie_consent');if(c==='accepted'){gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}`,
              }}
            />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${theme.googleAnalyticsId}`} />
            <script dangerouslySetInnerHTML={{ __html: `gtag('js',new Date());gtag('config','${theme.googleAnalyticsId}');` }} />
          </>
        )}
        {orgJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        )}
      </head>
      <body className={loaderEnabled ? "page-loading" : undefined}>
        <StyledComponentsRegistry>
          <AntdRegistry>{children}</AntdRegistry>
        </StyledComponentsRegistry>
        {loaderEnabled && (
          <>
            <div id="page-loader" aria-hidden="false" aria-label="Loading">
              <div className="page-loader-bars">
                <span className="page-loader-bar" />
                <span className="page-loader-bar" />
                <span className="page-loader-bar" />
                <span className="page-loader-bar" />
                <span className="page-loader-bar" />
              </div>
            </div>
            <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var d=${loaderMinDuration};
  function hide(){
    var el=document.getElementById("page-loader");
    if(el){el.classList.add("page-loader-hidden");el.setAttribute("aria-hidden","true")}
    document.documentElement.classList.remove("page-loading");
    document.body.classList.remove("page-loading");
  }
  function ready(){setTimeout(hide,d)}
  if(document.readyState==="complete"){ready()}
  else{window.addEventListener("load",ready)}
})();
` }} />
          </>
        )}
      </body>
    </html>
  );
}
