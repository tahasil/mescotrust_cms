"use client";

import { Form, Input, Space } from "antd";

export function parseToHex(str) {
  if (!str || typeof str !== "string") return null;
  const raw = str.trim();
  const hexMatch = raw.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (hexMatch) {
    const h = hexMatch[1];
    return h.length === 3
      ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : `#${h}`;
  }
  const rgbMatch = raw.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/,
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  const anyHex = raw.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
  if (anyHex) {
    const h = anyHex[1];
    return h.length === 3
      ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : `#${h}`;
  }
  return null;
}

export function parseAlpha(str) {
  if (!str || typeof str !== "string") return 1;
  const m = str
    .trim()
    .match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

export function hexToRgba(hex, a = 1) {
  const match = String(hex).match(/^#?([0-9A-Fa-f]{6})$/);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function ColorCodeInput({ value, onChange, placeholder }) {
  const raw = String(value || "").trim();
  const pickerHex = parseToHex(raw) || "#999999";
  const wasRgba = /rgba\s*\(/.test(raw);
  const wasGradient = /linear-gradient|gradient\s*\(/.test(raw);
  const alpha = parseAlpha(raw);

  const handlePickerChange = (e) => {
    const hex = e.target.value;
    if (wasRgba) {
      onChange(hexToRgba(hex, alpha));
    } else if (wasGradient && raw) {
      const firstColor = raw.match(
        /#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b|rgba?\([^)]*\)/i,
      );
      const replacement = firstColor?.[0]?.toLowerCase().startsWith("rgba(")
        ? hexToRgba(hex, parseAlpha(firstColor[0]))
        : hex;
      onChange(firstColor ? raw.replace(firstColor[0], replacement) : raw);
    } else {
      onChange(hex);
    }
  };

  return (
    <Space.Compact style={{ width: "100%", display: "flex" }}>
      <input
        type="color"
        value={pickerHex}
        onChange={handlePickerChange}
        style={{
          width: 40,
          height: 32,
          padding: 2,
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          cursor: "pointer",
          flexShrink: 0,
        }}
        title="Pick color"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder || "e.g. #1890ff, rgba(...), linear-gradient(...)"
        }
        style={{ flex: 1, minWidth: 0 }}
      />
    </Space.Compact>
  );
}

export function completeColorRows(rows, keyField) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      ...row,
      [keyField]: String(row?.[keyField] || "").trim(),
      value: String(row?.value || "").trim(),
    }))
    .filter((row) => row[keyField] && row.value);
}

export function FormColor({ name, label, placeholder }) {
  return (
    <Form.Item name={name} label={label}>
      <ColorCodeInput placeholder={placeholder} />
    </Form.Item>
  );
}

export const initialFormValues = {
  siteTitle: "MESCO Trust",
  tagline: "",
  logoType: "text",
  logoLightUrl: "",
  logoDarkUrl: "",
  logoImageUrl: "",
  faviconUrl: "",
  footerCopyrightText: "",
  themePalette: {},
  paletteColors: [],
  colors: [],
  headingFont: "",
  bodyFont: "system-ui, sans-serif",
  buttonFont: "",
  baseFontSize: 16,
  h1Size: 0,
  h2Size: 0,
  h3Size: 0,
  h4Size: 0,
  h5Size: 0,
  h6Size: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  googleFonts: [],
  customFontUrl: "",
  buttonRadius: 6,
  cardRadius: 8,
  inputRadius: 6,
  cardShadow: true,
  buttonShadow: false,
  headerLayout: "default",
  headerSticky: true,
  headerTransparent: false,
  megaMenu: false,
  dropdownStyle: "default",
  mobileMenuStyle: "drawer",
  footerColumnsCount: 4,
  footerLayoutStyle: "default",
  footerSocialIcons: true,
  cardStyle: "elevated",
  alertStyle: "default",
  badgeStyle: "default",
  tableStyle: "default",
  formStyle: "default",
  inputStyle: "default",
  mobileFontSize: 0,
  mobileSectionSpacing: "",
  hideSectionOnMobile: false,
  blogLayout: "grid",
  blogSidebarPosition: "right",
  blogFeaturedImageRatio: "16/9",
  blogMetaStyle: "minimal",
  smoothScrollEnabled: true,
  smoothScrollDuration: 1.4,
  smoothScrollWheelMultiplier: 1,
  smoothScrollTouchMultiplier: 1.2,
  fadeAnimationEnabled: true,
  fadeAnimationDuration: 1,
  fadeAnimationDistance: 20,
  fadeAnimationThreshold: 0.1,
  pageLoaderEnabled: true,
  pageLoaderBgColor: "#211E30",
  pageLoaderBarColor: "#E03C33",
  pageLoaderMinDuration: 400,
  customCss: "",
  customJs: "",
  headScripts: "",
  footerScripts: "",
  googleAnalyticsId: "",
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  defaultMetaKeywords: "",
  defaultMetaImage: "",
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
  adminSiteName: "",
  adminLogoUrl: "",
  adminTextColor: "#333333",
  adminBorderColor: "rgba(0,0,0,0.06)",
  adminCtaBgColor: "#1677ff",
  adminCtaTextColor: "#ffffff",
  adminCtaHoverBgColor: "",
  adminCtaHoverTextColor: "",
  adminSidebarBg: "#ffffff",
  adminSidebarText: "rgba(0,0,0,0.65)",
  adminSidebarHoverBg: "rgba(0,0,0,0.04)",
  adminSidebarHoverText: "#1677ff",
  adminSidebarActiveBg: "#e6f4ff",
  adminSidebarActiveText: "#1677ff",
  adminLoaderColor: "#1677ff",
  adminLoaderBgColor: "rgba(255,255,255,0.5)",
};

export function mapThemeToFormValues(data) {
  const palette = data?.themePalette || {};
  return {
    ...initialFormValues,
    ...data,
    themePalette: palette,
    paletteColors: Object.entries(palette).map(([key, value]) => ({
      key,
      value,
    })),
    colors: Array.isArray(data?.colors) ? data.colors : [],
  };
}

export function buildThemeSavePayload(baseline, formValues, extras = {}) {
  const allValues = { ...baseline, ...formValues, ...extras };
  return {
    ...allValues,
    pageLoaderBgColor:
      allValues.pageLoaderBgColor == null
        ? undefined
        : String(allValues.pageLoaderBgColor).trim(),
    pageLoaderBarColor:
      allValues.pageLoaderBarColor == null
        ? undefined
        : String(allValues.pageLoaderBarColor).trim(),
    paletteColors:
      allValues.paletteColors === undefined
        ? undefined
        : completeColorRows(allValues.paletteColors, "key"),
    colors:
      allValues.colors === undefined
        ? undefined
        : completeColorRows(allValues.colors, "name"),
  };
}

export async function saveThemeSettings(form, baselineRef, extras = {}) {
  const allValues = { ...form.getFieldsValue(true) };
  const payload = buildThemeSavePayload(baselineRef.current, allValues, extras);
  const res = await fetch("/api/theme", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Save failed");
  }
  baselineRef.current = data;
  const palette = data.themePalette || {};
  form.setFieldsValue({
    ...mapThemeToFormValues(data),
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("admin-theme-updated", { detail: data }),
    );
  }
  return data;
}

export async function loadThemeSettings(form, baselineRef) {
  const res = await fetch("/api/theme");
  const data = await res.ok ? await res.json() : {};
  baselineRef.current = data || {};
  form.setFieldsValue(mapThemeToFormValues(data));
  return data;
}
