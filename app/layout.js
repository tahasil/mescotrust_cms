import "./globals.css";
import { headers } from "next/headers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import StyledComponentsRegistry from "@/lib/StyledComponentsRegistry";
import { getSiteUrl } from "@/lib/env";
import { getTheme } from "@/lib/layoutData";

/** Always fetch fresh theme and menu from DB; no cache so menu changes show immediately. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseKeywordList(raw) {
  const input = String(raw || "").trim();
  if (!input) return undefined;
  const list = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

function getGlobalMetaImage(theme) {
  const candidates = [
    theme?.defaultMetaImage,
    theme?.seoImage,
    theme?.ogImage,
    theme?.socialShareImage,
    theme?.logoLightUrl,
    theme?.logoImageUrl,
    theme?.logoMobileUrl,
    theme?.logoDarkUrl,
    theme?.faviconUrl,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return "";
}

export async function generateMetadata() {
  const theme = await getTheme();
  const siteName = String(theme?.siteTitle ?? "").trim();
  const defaultMetaTitle = String(theme?.defaultMetaTitle || "").trim();
  const defaultMetaDescription = String(theme?.defaultMetaDescription || "").trim();
  const defaultMetaKeywords = parseKeywordList(theme?.defaultMetaKeywords);
  const defaultMetaImage = getGlobalMetaImage(theme);
  const faviconUrl = String(theme?.faviconUrl || "").trim();
  const resolvedTitle = defaultMetaTitle || siteName || "Mesco Trust";
  const resolvedDescription = defaultMetaDescription || "Content management system";
  const titleTemplateBase = siteName || resolvedTitle;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: resolvedTitle,
      template: `%s | ${titleTemplateBase}`,
    },
    description: resolvedDescription,
    ...(defaultMetaKeywords ? { keywords: defaultMetaKeywords } : {}),
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      siteName,
      ...(defaultMetaImage
        ? {
            images: [{ url: defaultMetaImage, alt: resolvedTitle }],
          }
        : {}),
    },
    ...(faviconUrl
      ? {
          icons: {
            icon: faviconUrl,
            shortcut: faviconUrl,
            apple: faviconUrl,
          },
        }
      : {}),
  };
}

const NAME_TO_CSS_VAR = {
  primary: "--primary-color",
  secondary: "--secondary-color",
  background: "--bg-color",
  text: "--text-color",
  heading: "--heading-color",
  link: "--link-color",
  "section-background": "--section-bg-color",
};

function toColorSlug(name) {
  return String(name || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildCssVarsFromColors(colors) {
  const vars = {};
  if (!Array.isArray(colors)) return vars;
  const valuesBySlug = new Map();
  colors.forEach((c) => {
    if (!c?.name || c.value == null) return;
    const slug = toColorSlug(c.name);
    if (!slug) return;
    const cssKey = NAME_TO_CSS_VAR[slug] || `--theme-${slug}`;
    vars[cssKey] = c.value;
    valuesBySlug.set(slug, c.value);
  });

  const setAlias = (cssVar, slug) => {
    const value = valuesBySlug.get(slug);
    if (value != null && String(value).trim() !== "") vars[cssVar] = value;
  };

  // Semantic variables used by global CSS and reusable site components.
  setAlias("--secondary-color", "black");
  setAlias("--bg-color", "cream");
  setAlias("--section-bg-color", "cream");
  setAlias("--card-bg-color", "white");
  setAlias("--text-color", "black-light");
  setAlias("--heading-color", "black");
  setAlias("--link-color", "primary");
  setAlias("--link-hover-color", "primary-dark");
  setAlias("--muted-text-color", "black-muted");
  setAlias("--border-color", "border");
  setAlias("--divider-color", "border");
  setAlias("--input-border-color", "border");

  // Compatibility aliases for long-standing component keys.
  setAlias("--theme-secondary", "black");
  setAlias("--theme-cta-border", "border");
  setAlias("--theme-theme-border", "border");
  setAlias("--theme-img-fill-white", "img-white");
  setAlias("--theme-img-fill-theme", "img-color");
  setAlias("--theme-imgwhite", "img-white");
  setAlias("--theme-imgcolor", "img-color");
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
    ...set("--font-family", t.bodyFont),
    ...set("--heading-font", t.headingFont || t.bodyFont),
    ...set("--button-font", t.buttonFont || t.bodyFont),
    ...set("--font-size", t.baseFontSize != null ? `${t.baseFontSize}px` : undefined),
    ...set("--line-height", t.lineHeight),
    ...set("--letter-spacing", t.letterSpacing != null ? `${t.letterSpacing}px` : undefined),
    ...set("--font-weight", t.fontWeightNormal),
    ...set("--heading-font-weight", t.fontWeightBold),
    ...set("--button-radius", t.buttonRadius != null ? `${t.buttonRadius}px` : undefined),
    ...set("--card-radius", t.cardRadius != null ? `${t.cardRadius}px` : undefined),
    ...set("--input-radius", t.inputRadius != null ? `${t.inputRadius}px` : undefined),
    ...set("--layout-width", t.layoutWidth != null ? `${t.layoutWidth}px` : undefined),
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

function sanitizeInlineScript(value) {
  return String(value || "").replace(/<\/script/gi, "<\\/script");
}

function sanitizeInlineStyle(value) {
  return String(value || "").replace(/<\/style/gi, "<\\/style");
}

function sanitizeCssToken(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/[<>{};]/.test(raw)) return fallback;
  return raw;
}

function sanitizeFontUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/") || raw.startsWith("data:")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return raw;
  } catch {}
  return "";
}

function sanitizeGoogleAnalyticsId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^G-[A-Z0-9]+$/i.test(raw)) return raw;
  if (/^UA-\d+-\d+$/i.test(raw)) return raw;
  return "";
}

export default async function RootLayout({ children }) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || headersList.get("X-Pathname") || "";
  const theme = await getTheme();
  const isAdmin = pathname.startsWith("/admin");
  const dir = theme.direction;
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
    "--font-family": theme.bodyFont || theme.fontFamily,
    "--heading-font":
      theme.headingFont || theme.headingFontFamily || theme.bodyFont,
    "--font-size": `${theme.baseFontSize ?? theme.fontSize}px`,
    "--line-height": String(theme.lineHeight),
    "--letter-spacing": `${theme.letterSpacing}px`,
    "--font-weight": String(theme.fontWeightNormal ?? theme.fontWeight),
    "--heading-font-weight": String(
      theme.fontWeightBold ?? theme.headingFontWeight,
    ),
    "--layout-width": `${theme.layoutWidth}px`,
  };

  const loaderEnabled = !isAdmin && theme.pageLoaderEnabled !== false;
  const loaderBg = sanitizeCssToken(theme.pageLoaderBgColor, "#211E30");
  const loaderBar = sanitizeCssToken(theme.pageLoaderBarColor, "#E03C33");
  const loaderMinDuration = Number.isFinite(Number(theme.pageLoaderMinDuration))
    ? Math.max(100, Math.min(5000, Number(theme.pageLoaderMinDuration)))
    : 400;
  const safeCustomCss = sanitizeInlineStyle(theme.customCss);
  const safeHeadScripts = sanitizeInlineScript(theme.headScripts);
  const safeCustomFontUrl = sanitizeFontUrl(theme.customFontUrl);
  const safeGoogleAnalyticsId = sanitizeGoogleAnalyticsId(theme.googleAnalyticsId);

  const siteName = theme.siteTitle;
  const orgJsonLd = !isAdmin
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteName,
        url: getSiteUrl(),
      }
    : null;

  return (
    <html lang={theme.defaultLocale} dir={dir} style={cssVars} data-header-layout={theme.headerLayout} data-card-style={theme.cardStyle} className={loaderEnabled ? "page-loading" : undefined}>
      <head>
        {theme.faviconUrl && <link rel="icon" href={theme.faviconUrl} />}
        {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
        {safeCustomFontUrl && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@font-face { font-family: 'CustomUpload'; src: url('${safeCustomFontUrl}'); font-display: swap; }`,
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
        {safeCustomCss && <style dangerouslySetInnerHTML={{ __html: safeCustomCss }} />}
        {safeHeadScripts && <script dangerouslySetInnerHTML={{ __html: safeHeadScripts }} />}
        {safeGoogleAnalyticsId && (
          <>
            {/* Google Consent Mode v2 — default-deny until the user accepts via the
                cookie banner. The banner calls gtag('consent','update',...) on accept. */}
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});try{var c=window.localStorage.getItem('mesco_cookie_consent');if(c==='accepted'){gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}`,
              }}
            />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${safeGoogleAnalyticsId}`} />
            <script dangerouslySetInnerHTML={{ __html: `gtag('js',new Date());gtag('config','${safeGoogleAnalyticsId}');` }} />
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
