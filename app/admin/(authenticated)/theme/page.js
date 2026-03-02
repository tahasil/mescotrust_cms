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
} from "@ant-design/icons";

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

/** Parse hex or rgb/rgba or first hex in gradient to a 6-char hex for the color picker */
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
      const firstHex = raw.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
      onChange(firstHex ? raw.replace(firstHex[0], hex) : hex);
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

function FormColor({ name, label, placeholder }) {
  return (
    <Form.Item name={name} label={label}>
      <ColorCodeInput placeholder={placeholder} />
    </Form.Item>
  );
}

const initialFormValues = {
  siteTitle: "Mesco Trust",
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
  customCss: "",
  customJs: "",
  headScripts: "",
  footerScripts: "",
  googleAnalyticsId: "",
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
};

export default function AdminThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [googleFonts, setGoogleFonts] = useState([]);
  const [newFont, setNewFont] = useState(null);
  const [uploadedFonts, setUploadedFonts] = useState([]);
  const [fontUploading, setFontUploading] = useState(false);

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

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        googleFonts,
        paletteColors: Array.isArray(values.paletteColors)
          ? values.paletteColors
          : [],
        colors: Array.isArray(values.colors) ? values.colors : [],
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
    } finally {
      setSaving(false);
    }
  };

  const collapseItems = [
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
              <Form.Item name="siteTitle" label="Site title">
                <Input placeholder="Mesco Trust" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="layoutWidth" label="Container max-width (px)">
                <InputNumber min={600} max={1920} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="defaultLocale" label="Default locale">
                <Input placeholder="en" />
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
                          rules={[{ required: true, message: "Name required" }]}
                          style={{ marginBottom: 0, flex: "1 1 100px", minWidth: 0 }}
                          label={null}
                        >
                          <Input placeholder="e.g. accent" />
                        </Form.Item>
                        <Form.Item
                          name={[name, "value"]}
                          rules={[{ required: true, message: "Value required" }]}
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
                          rules={[{ required: true, message: "Name" }]}
                          style={{ marginBottom: 0, flex: "1 1 100px", minWidth: 0 }}
                          label={null}
                        >
                          <Input placeholder="e.g. primary, headerBg" />
                        </Form.Item>
                        <Form.Item
                          name={[name, "value"]}
                          rules={[{ required: true, message: "Value" }]}
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
      key: "advanced",
      label: (
        <span>
          <CodeOutlined style={{ marginRight: 8 }} />
          Advanced
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
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
              placeholder="<script>...</script>"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </Form.Item>
          <Form.Item name="footerScripts" label="Footer Scripts">
            <Input.TextArea
              rows={3}
              placeholder="<script>...</script>"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </Form.Item>
          <Form.Item name="googleAnalyticsId" label="Google Analytics ID">
            <Input placeholder="G-XXXXXXXXXX" />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Theme Settings
      </Typography.Title>
      <Divider />
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialFormValues}
        loading={loading}
      >
        <Collapse items={collapseItems} defaultActiveKey={[]} />
        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={saving}
          >
            Save theme
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
