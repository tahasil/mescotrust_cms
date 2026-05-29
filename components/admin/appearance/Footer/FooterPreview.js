"use client";

import Footer from "./Footer";

function resolveColor(paletteData, key, fallback = "") {
  if (!key) return fallback;
  const token = String(key).trim();
  const palette = paletteData?.themePalette || {};
  if (palette[token] != null && String(palette[token]).trim() !== "") {
    return String(palette[token]).trim();
  }
  const tokenLower = token.toLowerCase();
  const paletteKey = Object.keys(palette).find(
    (k) => String(k || "").trim().toLowerCase() === tokenLower,
  );
  if (
    paletteKey &&
    palette[paletteKey] != null &&
    String(palette[paletteKey]).trim() !== ""
  ) {
    return String(palette[paletteKey]).trim();
  }
  const custom = Array.isArray(paletteData?.colors) ? paletteData.colors : [];
  const found = custom.find((c) => c && String(c.name || "").trim() === token);
  if (found?.value) return String(found.value).trim();
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(token)) {
    return token;
  }
  return fallback;
}

export default function FooterPreview({ snapshot = {}, paletteData = {} }) {
  return (
    <Footer
      preview
      siteTitle={snapshot?.siteTitle || ""}
      footerLogoUrl={snapshot?.footerLogoUrl || ""}
      footerAddress={snapshot?.footerAddress || ""}
      footerEmail={snapshot?.footerEmail || ""}
      footerPhone={snapshot?.footerPhone || ""}
      footerCol1Links={Array.isArray(snapshot?.footerCol1Links) ? snapshot.footerCol1Links : []}
      footerCol2Links={Array.isArray(snapshot?.footerCol2Links) ? snapshot.footerCol2Links : []}
      footerCol1Title={snapshot?.footerCol1Title || ""}
      footerCol2Title={snapshot?.footerCol2Title || ""}
      footerSocialLinks={Array.isArray(snapshot?.footerSocialLinks) ? snapshot.footerSocialLinks : []}
      footerLatestTitle={snapshot?.footerLatestTitle || ""}
      footerLatestPlaceholder={snapshot?.footerLatestPlaceholder || ""}
      footerCopyrightText={snapshot?.footerCopyrightText || ""}
      footerBgValue={resolveColor(paletteData, snapshot?.footerBgColorKey, "")}
      footerBackgroundImageUrl={snapshot?.footerBackgroundImageUrl || ""}
      footerSectionBgType={snapshot?.footerSectionBgType || "default"}
      footerSectionBgImage={snapshot?.footerSectionBgImage || ""}
      footerSectionBgColorValue={resolveColor(
        paletteData,
        snapshot?.footerSectionBgColorKey,
        "",
      )}
      footerTextValue={resolveColor(paletteData, snapshot?.footerTextColorKey, "")}
      footerSocialValue={resolveColor(
        paletteData,
        snapshot?.footerSocialColorKey,
        "",
      )}
      footerCopyrightBarValue={resolveColor(
        paletteData,
        snapshot?.footerCopyrightBarColorKey,
        "",
      )}
    />
  );
}
