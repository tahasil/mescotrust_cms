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
    (k) =>
      String(k || "")
        .trim()
        .toLowerCase() === tokenLower,
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

export default function HeaderPreview({
  snapshot = {},
  paletteData = {},
}) {
  const logoUrl = snapshot?.logoLightUrl || "";
  const title = snapshot?.siteTitle || "Site Title";
  const navItems = Array.isArray(snapshot?.navItems) ? snapshot.navItems : [];
  const volunteerLabelRaw =
    snapshot?.headerVolunteerLabel != null
      ? String(snapshot.headerVolunteerLabel).trim()
      : "";
  const volunteerLabel = volunteerLabelRaw || "Volunteer";
  const menuPositionRaw = String(snapshot?.menuPosition || "center")
    .trim()
    .toLowerCase();
  const navJustifyContent =
    menuPositionRaw === "left"
      ? "flex-start"
      : menuPositionRaw === "right"
        ? "flex-end"
        : "center";
  const navColor = resolveColor(paletteData, snapshot?.navColor, "#223");
  const navHoverColor = resolveColor(
    paletteData,
    snapshot?.navHoverColor,
    navColor || "#223",
  );
  const navItemBackground = resolveColor(
    paletteData,
    snapshot?.navItemBackground,
    "transparent",
  );
  const navItemHoverBackground = resolveColor(
    paletteData,
    snapshot?.navItemHoverBackground,
    navItemBackground || "transparent",
  );
  const navFontWeight =
    snapshot?.navFontWeight != null && String(snapshot.navFontWeight).trim()
      ? String(snapshot.navFontWeight).trim()
      : "500";
  const navFontSizeRaw =
    snapshot?.navFontSize != null ? String(snapshot.navFontSize).trim() : "";
  const navFontSize = navFontSizeRaw
    ? /^\d+(\.\d+)?$/.test(navFontSizeRaw)
      ? `${navFontSizeRaw}px`
      : navFontSizeRaw
    : "14px";

  const ctaBg = resolveColor(
    paletteData,
    snapshot?.headerCtaBgColorKey,
    "#eef4f7",
  );
  const ctaText = resolveColor(
    paletteData,
    snapshot?.headerCtaTextColorKey,
    "#0f2f3a",
  );
  const sectionBg = resolveColor(paletteData, snapshot?._sectionBg, "#fafafa");
  const sectionPadding =
    snapshot?._sectionPadding && String(snapshot._sectionPadding).trim()
      ? String(snapshot._sectionPadding).trim()
      : "16px 0";

  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        overflow: "hidden",
        background: sectionBg || "#fafafa",
        padding: sectionPadding,
      }}
    >
      <div
        style={{
          background: "transparent",
          minHeight: 86,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 140, display: "flex", alignItems: "center" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxHeight: 42, width: "auto", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontWeight: 700, fontSize: 18 }}>{title}</span>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 180,
            display: "flex",
            justifyContent: navJustifyContent,
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {(navItems.length > 0 ? navItems : [{ label: "Menu" }]).map(
            (it, idx) => (
              <span
                key={`${String(it?.label || "")}-${idx}`}
                style={{
                  fontSize: navFontSize,
                  fontWeight: navFontWeight,
                  color: navColor || "#223",
                  background: navItemBackground || "transparent",
                  borderRadius: 8,
                  padding: "6px 10px",
                  border:
                    navItemHoverBackground &&
                    navItemHoverBackground !== "transparent"
                      ? `1px solid ${navItemHoverBackground}`
                      : "1px solid transparent",
                }}
                title={navHoverColor ? `Hover: ${navHoverColor}` : undefined}
              >
                {String(it?.label || "").trim() || "Menu"}
              </span>
            ),
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              border: "1px solid transparent",
              borderRadius: 999,
              background: ctaBg || "#eef4f7",
              color: ctaText || "#0f2f3a",
              padding: "8px 14px",
              fontWeight: 600,
            }}
          >
            {volunteerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
