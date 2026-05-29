"use client";

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
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(token)) {
    return token;
  }
  return fallback;
}

export default function SubscribePreview({ snapshot = {}, paletteData = {} }) {
  const subtitle = snapshot?.subscribeSubtitle || "Latest News";
  const title = snapshot?.subscribeTitle || "To get weekly updates";
  const placeholder = snapshot?.subscribePlaceholder || "Enter email";
  const buttonText = snapshot?.subscribeButtonText || "Subscribe";
  const bgType =
    snapshot?.subscribeSectionBgType === "image" ||
    snapshot?.subscribeSectionBgType === "color"
      ? snapshot.subscribeSectionBgType
      : "default";
  const bgImageFromSection =
    snapshot?.subscribeSectionBgImage != null
      ? String(snapshot.subscribeSectionBgImage).trim()
      : "";
  const bgImage =
    bgType === "image"
      ? bgImageFromSection
      : snapshot?.subscribeBgDesktop || snapshot?.subscribeBgUrl || "";
  const bgColor = resolveColor(
    paletteData,
    bgType === "color" ? snapshot?.subscribeSectionBgColorKey : "",
    "#0f2f3a",
  );
  const subtitleColor = resolveColor(
    paletteData,
    snapshot?.subscribeSubtitleColorKey,
    "rgba(255,255,255,0.9)",
  );
  const titleColor = resolveColor(
    paletteData,
    snapshot?.subscribeTitleColorKey,
    "#ffffff",
  );
  const btnBg = resolveColor(
    paletteData,
    snapshot?.subscribeButtonBgColorKey,
    "#ffffff",
  );
  const btnText = resolveColor(
    paletteData,
    snapshot?.subscribeButtonTextColorKey,
    "#0f2f3a",
  );

  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        padding: 20,
        background: bgImage
          ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${bgImage}') center/cover no-repeat`
          : bgColor || "#0f2f3a",
        color: titleColor || "#fff",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div
          style={{
            fontSize: 13,
            opacity: 0.95,
            marginBottom: 6,
            color: subtitleColor,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: 12,
            color: titleColor,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            readOnly
            value={placeholder}
            style={{
              minWidth: 240,
              flex: 1,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
            }}
          />
          <button
            type="button"
            style={{
              borderRadius: 999,
              border: "1px solid transparent",
              padding: "10px 16px",
              fontWeight: 600,
              background: btnBg,
              color: btnText,
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
