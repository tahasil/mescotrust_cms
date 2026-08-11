"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Tag,
  Upload,
  message,
  Collapse,
  Segmented,
  Typography,
  Switch,
  Divider,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  BgColorsOutlined,
  PictureOutlined,
  CodeOutlined,
  BulbOutlined,
  LoadingOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { LOCALE_OPTIONS } from "@/lib/localeOptions";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

const POPULAR_GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Playfair Display",
  "Merriweather",
  "Source Sans Pro",
  "PT Sans",
  "Noto Sans",
  "Cairo",
  "Tajawal",
  "Ubuntu",
  "Oswald",
  "Rubik",
  "Work Sans",
  "Fira Sans",
];

/** Parse hex, rgb/rgba, or the first supported gradient color for the picker. */
function parseToHex(str) {
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

/** Get alpha from rgba string or 1 */
function parseAlpha(str) {
  if (!str || typeof str !== "string") return 1;
  const m = str
    .trim()
    .match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

/** Convert #rrggbb to rgba(r,g,b,a) */
function hexToRgba(hex, a = 1) {
  const match = String(hex).match(/^#?([0-9A-Fa-f]{6})$/);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function ColorCodeInput({ value, onChange, placeholder }) {
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

function completeColorRows(rows, keyField) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      ...row,
      [keyField]: String(row?.[keyField] || "").trim(),
      value: String(row?.value || "").trim(),
    }))
    .filter((row) => row[keyField] && row.value);
}

function FormColor({ name, label, placeholder }) {
  return (
    <Form.Item name={name} label={label}>
      <ColorCodeInput placeholder={placeholder} />
    </Form.Item>
  );
}

const initialFormValues = {
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
  // Admin theme defaults
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

export default function AdminThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [googleFonts, setGoogleFonts] = useState([]);
  const [newFont, setNewFont] = useState(null);
  const [uploadedFonts, setUploadedFonts] = useState([]);
  const [fontUploading, setFontUploading] = useState(false);
  const [adminLogoUploading, setAdminLogoUploading] = useState(false);

  const fetchUploadedFonts = () => {
    fetch("/api/admin/fonts")
      .then((res) => (res.ok ? res.json() : { fonts: [] }))
      .then((data) => setUploadedFonts(data.fonts || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUploadedFonts();
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const palette = data.themePalette || {};
        form.setFieldsValue({
          ...initialFormValues,
          ...data,
          themePalette: palette,
          paletteColors: Object.entries(palette).map(([key, value]) => ({
            key,
            value,
          })),
          colors: Array.isArray(data.colors) ? data.colors : [],
        });
        setGoogleFonts(data.googleFonts || []);
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, [form]);

  const handleAddGoogleFont = () => {
    if (!newFont) return;
    if (googleFonts.some((f) => f.family === newFont)) {
      message.warning("Font already added");
      return;
    }
    setGoogleFonts([
      ...googleFonts,
      { family: newFont, weights: ["400", "700"] },
    ]);
    setNewFont(null);
  };

  const handleRemoveFont = (family) =>
    setGoogleFonts(googleFonts.filter((f) => f.family !== family));

  const handleFontUpload = async (info) => {
    const file = info.file;
    if (!file) return;
    setFontUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/fonts", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "Upload failed");
        return;
      }
      message.success(`Font "${data.filename}" uploaded`);
      fetchUploadedFonts();
    } catch {
      message.error("Font upload failed");
    } finally {
      setFontUploading(false);
    }
  };

  const handleDeleteFont = async (filename) => {
    const res = await fetch(
      `/api/admin/fonts?filename=${encodeURIComponent(filename)}`,
      { method: "DELETE" },
    );
    if (!res.ok) message.error("Failed to delete font");
    else {
      message.success("Font deleted");
      fetchUploadedFonts();
    }
  };

  const handleAdminLogoUpload = async (info) => {
    const file = info.file;
    if (!file) return;
    setAdminLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "Upload failed");
        return;
      }
      const url = data.url || data.path || "";
      form.setFieldsValue({ adminLogoUrl: url });
      message.success("Admin logo uploaded");
    } catch {
      message.error("Logo upload failed");
    } finally {
      setAdminLogoUploading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      // Collapse panels are lazy-mounted. Include values loaded into the form
      // store even when their panel has not been opened in this session.
      const allValues = { ...form.getFieldsValue(true), ...values };
      const payload = {
        ...allValues,
        googleFonts,
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
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success("Theme saved");
      const palette = data.themePalette || {};
      form.setFieldsValue({
        ...data,
        paletteColors: Object.entries(palette).map(([key, value]) => ({
          key,
          value,
        })),
        colors: Array.isArray(data.colors)
          ? data.colors
          : (form.getFieldValue("colors") ?? []),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin-theme-updated", { detail: data }),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const faviconUrl = Form.useWatch("faviconUrl", form);
  const adminLogoUrl = Form.useWatch("adminLogoUrl", form);

  const websiteCollapseItems = [
    {
      key: "identity-branding",
      label: (
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          Identity & Branding
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="siteTitle"
                label="Branding name"
                tooltip="Used across website title, header and branding references."
              >
                <Input placeholder="e.g. MESCO Trust" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="faviconUrl"
                label="Favicon (Title icon)"
                tooltip="Choose from media library or upload a new icon."
              >
                <MediaPickerInput
                  placeholder="/media/..."
                  showVariants={false}
                  hintText="Recommended: square icon (32x32 or 64x64), PNG/ICO/SVG."
                />
              </Form.Item>
            </Col>
          </Row>
          {faviconUrl ? (
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Favicon preview
              </Typography.Text>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fff",
                  }}
                >
                  <img
                    src={faviconUrl}
                    alt="Favicon preview"
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                </div>
                <Button
                  size="small"
                  danger
                  onClick={() => form.setFieldsValue({ faviconUrl: "" })}
                >
                  Remove favicon
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "layout",
      label: (
        <span>
          <BulbOutlined style={{ marginRight: 8 }} />
          Layout & Locale
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="layoutWidth" label="Container max-width (px)">
                <InputNumber min={600} max={1920} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="defaultLocale" label="Default locale">
                <Select
                  placeholder="Select locale"
                  allowClear={false}
                  options={LOCALE_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="direction" label="Direction">
                <Select
                  options={[
                    { value: "ltr", label: "LTR" },
                    { value: "rtl", label: "RTL" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "16px 0 12px" }}>Smooth Scroll (Lenis)</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="smoothScrollEnabled" label="Enable smooth scroll" valuePropName="checked" tooltip="Smooth scroll effect using Lenis library">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="smoothScrollDuration" label="Duration" tooltip="Scroll animation duration (higher = slower, smoother)">
                <InputNumber min={0.5} max={5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="smoothScrollWheelMultiplier" label="Wheel speed" tooltip="Mouse wheel scroll speed multiplier">
                <InputNumber min={0.1} max={5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="smoothScrollTouchMultiplier" label="Touch speed" tooltip="Touch/swipe scroll speed multiplier (mobile)">
                <InputNumber min={0.1} max={5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "16px 0 12px" }}>Scroll Animation</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fadeAnimationEnabled" label="Enable scroll animation" valuePropName="checked" tooltip="Fade-in effect when sections scroll into view">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fadeAnimationDuration" label="Duration (seconds)" tooltip="How long the fade-in transition takes">
                <InputNumber min={0.1} max={3} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fadeAnimationDistance" label="Distance (vh)" tooltip="How far the section slides up from (in viewport height units)">
                <InputNumber min={0} max={50} step={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fadeAnimationThreshold" label="Trigger threshold" tooltip="How much of the section must be visible to trigger (0 = any part, 1 = fully visible)">
                <InputNumber min={0} max={1} step={0.05} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "colors-primary",
      label: (
        <span>
          <BgColorsOutlined style={{ marginRight: 8 }} />
          Colors
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.List name="colors">
            {(fields, { add, remove }) => (
              <>
                <Row gutter={[16, 12]}>
                  {fields.map(({ key, name }) => (
                    <Col xs={24} md={12} key={key}>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          marginBottom: 0,
                        }}
                      >
                        <Form.Item
                          name={[name, "name"]}
                          style={{ marginBottom: 0, flex: "1 1 100px", minWidth: 0 }}
                          label={null}
                        >
                          <Input placeholder="e.g. accent" />
                        </Form.Item>
                        <Form.Item
                          name={[name, "value"]}
                          style={{ marginBottom: 0, flex: "1 1 140px", minWidth: 0 }}
                          label={null}
                        >
                          <ColorCodeInput placeholder="#hex or rgba(...)" />
                        </Form.Item>
                        <Button
                          type="default"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          style={{ flexShrink: 0, marginTop: 4 }}
                          aria-label="Delete"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
                <Button
                  type="dashed"
                  onClick={() => add({ name: "", value: "" })}
                  icon={<PlusOutlined />}
                  style={{ marginTop: 12 }}
                >
                  Add color
                </Button>
              </>
            )}
          </Form.List>

          <Form.List name="paletteColors">
            {(fields, { add, remove }) => (
              <>
                <Row gutter={[16, 12]} style={{ marginTop: 16 }}>
                  {fields.map(({ key, name }) => (
                    <Col xs={24} md={12} key={key}>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          marginBottom: 0,
                        }}
                      >
                        <Form.Item
                          name={[name, "key"]}
                          style={{ marginBottom: 0, flex: "1 1 100px", minWidth: 0 }}
                          label={null}
                        >
                          <Input placeholder="e.g. primary, headerBg" />
                        </Form.Item>
                        <Form.Item
                          name={[name, "value"]}
                          style={{ marginBottom: 0, flex: "1 1 140px", minWidth: 0 }}
                          label={null}
                        >
                          <ColorCodeInput placeholder="#hex or rgba(...)" />
                        </Form.Item>
                        <Button
                          type="default"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          style={{ flexShrink: 0, marginTop: 4 }}
                          aria-label="Delete"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Form.List>
        </div>
      ),
    },
    {
      key: "page-loader",
      label: (
        <span>
          <LoadingOutlined style={{ marginRight: 8 }} />
          Page Loader
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="pageLoaderEnabled" label="Enable page loader" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="pageLoaderBgColor" label="Background color">
                <ColorCodeInput placeholder="#hex, rgb(), rgba(), or linear-gradient()" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="pageLoaderBarColor" label="Bar color">
                <ColorCodeInput placeholder="#hex, rgb(), rgba(), or linear-gradient()" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="pageLoaderMinDuration" label="Minimum duration (ms)" tooltip="Minimum time the loader stays visible to avoid flickering">
            <InputNumber min={0} max={3000} step={100} style={{ width: 160 }} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: "advanced",
      label: (
        <span>
          <CodeOutlined style={{ marginRight: 8 }} />
          Advanced
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Collapse
            defaultActiveKey={["global-seo-performance"]}
            size="small"
            items={[
              {
                key: "global-seo-performance",
                label: "Global SEO & Performance",
                children: (
                  <Row gutter={[16, 0]}>
                    <Col xs={24}>
                      <Form.Item name="defaultMetaTitle" label="Default Meta Title">
                        <Input placeholder="Default title for pages without page-level SEO title" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item name="defaultMetaDescription" label="Default Meta Description">
                        <Input.TextArea
                          rows={2}
                          placeholder="Default description fallback for pages without page-level SEO description"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        name="defaultMetaKeywords"
                        label="Default Meta Keywords"
                        extra="Comma separated. Example: education, ngo, charity"
                      >
                        <Input placeholder="keyword 1, keyword 2, keyword 3" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        name="defaultMetaImage"
                        label="Default Meta Image"
                        extra="Used as default Open Graph / social image when page-level image is not available."
                      >
                        <MediaPickerInput
                          placeholder="/media/..."
                          showVariants={false}
                          hintText="Recommended: 1200x630"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "custom-code-integrations",
                label: "Custom Code & Integrations",
                children: (
                  <>
                    <Form.Item name="customCss" label="Custom CSS">
                      <Input.TextArea
                        rows={6}
                        placeholder=".my-class { color: red; }"
                        style={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    </Form.Item>
                    <Form.Item name="customJs" label="Custom JS">
                      <Input.TextArea
                        rows={4}
                        placeholder="JavaScript"
                        style={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    </Form.Item>
                    <Form.Item name="headScripts" label="Head Scripts">
                      <Input.TextArea
                        rows={3}
                        placeholder="Raw JavaScript (without <script> wrapper)"
                        style={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    </Form.Item>
                    <Form.Item name="footerScripts" label="Footer Scripts">
                      <Input.TextArea
                        rows={3}
                        placeholder="Raw JavaScript (without <script> wrapper)"
                        style={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    </Form.Item>
                    <Form.Item name="googleAnalyticsId" label="Google Analytics ID">
                      <Input placeholder="G-XXXXXXXXXX" />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const adminCollapseItems = [
    {
      key: "admin-identity",
      label: (
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          Identity & Branding
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="adminSiteName" label="Admin panel title" tooltip="Displayed in the sidebar header. Falls back to Site Title if empty.">
                <Input placeholder="e.g. MESCO CMS" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="adminLogoUrl" label="Admin logo URL">
                <MediaPickerInput placeholder="/media/..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]} align="middle">
            <Col xs={24} sm={12}>
              <Upload
                showUploadList={false}
                accept="image/*"
                customRequest={handleAdminLogoUpload}
              >
                <Button icon={adminLogoUploading ? <LoadingOutlined /> : <UploadOutlined />} loading={adminLogoUploading}>
                  Upload admin logo
                </Button>
              </Upload>
            </Col>
            <Col xs={24} sm={12}>
              {adminLogoUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <img
                    src={adminLogoUrl}
                    alt="Admin logo preview"
                    style={{ maxHeight: 40, maxWidth: 160, objectFit: "contain", border: "1px solid #f0f0f0", borderRadius: 4, padding: 4 }}
                  />
                  <Button size="small" danger onClick={() => form.setFieldsValue({ adminLogoUrl: "" })}>
                    Remove
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "admin-colors",
      label: (
        <span>
          <BgColorsOutlined style={{ marginRight: 8 }} />
          Colors & Buttons
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminTextColor" label="Text color" placeholder="#333333" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminBorderColor" label="Border color" placeholder="rgba(0,0,0,0.06)" />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>CTA Button</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminCtaBgColor" label="Button background" placeholder="#1677ff" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminCtaTextColor" label="Button text color" placeholder="#ffffff" />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>CTA Hover</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminCtaHoverBgColor" label="Hover background" placeholder="Leave empty for auto" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminCtaHoverTextColor" label="Hover text color" placeholder="Leave empty for auto" />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "admin-sidebar",
      label: (
        <span>
          <BulbOutlined style={{ marginRight: 8 }} />
          Sidebar
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Divider orientation="left" plain style={{ margin: "0 0 12px" }}>Default</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminSidebarBg" label="Background" placeholder="#ffffff" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminSidebarText" label="Text color" placeholder="rgba(0,0,0,0.65)" />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>Hover</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminSidebarHoverBg" label="Hover background" placeholder="rgba(0,0,0,0.04)" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminSidebarHoverText" label="Hover text" placeholder="#1677ff" />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>Active</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminSidebarActiveBg" label="Active background" placeholder="#e6f4ff" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminSidebarActiveText" label="Active text" placeholder="#1677ff" />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "admin-loader",
      label: (
        <span>
          <LoadingOutlined style={{ marginRight: 8 }} />
          Admin Loader
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor name="adminLoaderColor" label="Loader color" placeholder="#1677ff" />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor name="adminLoaderBgColor" label="Overlay background" placeholder="rgba(255,255,255,0.5)" />
            </Col>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Preview:
            </Typography.Text>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 24, marginTop: 8, background: "#fafafa", borderRadius: 8 }}>
              <AdminLoaderPreview form={form} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialFormValues}
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {/* Website Theme Settings */}
        <Col xs={24} xl={12}>
          <ThemeAdminCard
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                <BgColorsOutlined style={{ marginRight: 8 }} />
                Website Theme Settings
              </span>
            }
          >
            <Collapse items={websiteCollapseItems} defaultActiveKey={[]} destroyInactivePanel={false} />
          </ThemeAdminCard>
        </Col>

        {/* Admin Theme Settings */}
        <Col xs={24} xl={12}>
          <ThemeAdminCard
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                <SettingOutlined style={{ marginRight: 8 }} />
                Admin Theme Settings
              </span>
            }
          >
            <Collapse items={adminCollapseItems} defaultActiveKey={[]} destroyInactivePanel={false} />
          </ThemeAdminCard>
        </Col>
      </Row>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={saving}
          style={{ minWidth: 200 }}
        >
          Save all settings
        </Button>
      </div>
    </Form>
  );
}

/** Live preview of the admin loader spinner */
function AdminLoaderPreview({ form }) {
  const loaderColor = Form.useWatch("adminLoaderColor", form) || "#1677ff";
  const loaderBgColor =
    Form.useWatch("adminLoaderBgColor", form) || "rgba(255,255,255,0.5)";
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        height: 88,
        borderRadius: 8,
        border: "1px solid #f0f0f0",
        backgroundImage:
          "linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: loaderBgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid #f0f0f0`,
            borderTop: `3px solid ${loaderColor}`,
            borderRadius: "50%",
            animation: "adminLoaderSpin 0.8s linear infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes adminLoaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
