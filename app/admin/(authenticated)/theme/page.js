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
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  PictureOutlined,
  GlobalOutlined,
  MobileOutlined,
  CodeOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const POPULAR_GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Raleway", "Nunito", "Playfair Display", "Merriweather", "Source Sans Pro",
  "PT Sans", "Noto Sans", "Cairo", "Tajawal", "Ubuntu", "Oswald", "Rubik", "Work Sans", "Fira Sans",
];

function ColorCodeInput({ value, onChange, placeholder }) {
  const raw = String(value || "").trim();
  const isHex = /^#[0-9A-Fa-f]{3,8}$/.test(raw);
  const pickerHex = isHex
    ? (raw.length === 4 ? raw.replace(/([0-9a-f])([0-9a-f])([0-9a-f])/i, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`) : raw).slice(0, 7)
    : "#999999";
  return (
    <Space.Compact style={{ width: "100%", display: "flex" }}>
      {isHex && (
        <input
          type="color"
          value={pickerHex}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 32, padding: 2, border: "1px solid #d9d9d9", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}
        />
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "e.g. #1890ff, rgb(), linear-gradient(...)"}
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
  primaryColor: "",
  secondaryColor: "",
  bodyBackground: "",
  sectionBackground: "",
  cardBackground: "",
  headerBackground: "",
  footerBackground: "",
  headingColor: "",
  paragraphColor: "",
  linkColor: "",
  hoverColor: "",
  mutedTextColor: "",
  borderColor: "",
  dividerColor: "",
  inputBorderColor: "",
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
  buttonBackground: "",
  buttonTextColor: "",
  buttonHoverBackground: "",
  buttonHoverTextColor: "",
  buttonPadding: "8px 20px",
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
  const logoType = Form.useWatch("logoType", form) || "text";

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
        form.setFieldsValue({ ...initialFormValues, ...data, colors: Array.isArray(data.colors) ? data.colors : [] });
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
    setGoogleFonts([...googleFonts, { family: newFont, weights: ["400", "700"] }]);
    setNewFont(null);
  };

  const handleRemoveFont = (family) => setGoogleFonts(googleFonts.filter((f) => f.family !== family));

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
    const res = await fetch(`/api/admin/fonts?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
    if (!res.ok) message.error("Failed to delete font");
    else {
      message.success("Font deleted");
      fetchUploadedFonts();
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, googleFonts }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      message.success("Theme saved");
    } finally {
      setSaving(false);
    }
  };

  const collapseItems = [
    {
      key: "brand",
      label: <span><GlobalOutlined style={{ marginRight: 8 }} />Brand Identity</span>,
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="siteTitle" label="Site Title"><Input placeholder="Mesco Trust" /></Form.Item>
          <Form.Item name="tagline" label="Tagline"><Input placeholder="Short tagline" /></Form.Item>
          <Form.Item name="logoType" label="Logo type">
            <Segmented options={[{ value: "text", label: "Text" }, { value: "image", label: "Image" }]} />
          </Form.Item>
          {logoType === "image" && (
            <>
              <Form.Item name="logoLightUrl" label="Logo (Light version)"><Input placeholder="https://..." /></Form.Item>
              <Form.Item name="logoDarkUrl" label="Logo (Dark version)"><Input placeholder="https://..." /></Form.Item>
              <Form.Item name="logoImageUrl" label="Logo URL (fallback)"><Input placeholder="https://..." /></Form.Item>
            </>
          )}
          <Form.Item name="faviconUrl" label="Favicon"><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="footerCopyrightText" label="Footer Copyright Text"><Input.TextArea rows={2} placeholder="© 2025 Site Name. All rights reserved." /></Form.Item>
        </div>
      ),
    },
    {
      key: "colors-primary",
      label: <span><BgColorsOutlined style={{ marginRight: 8 }} />Colors</span>,
      children: (
        <div style={{ paddingBlock: 8 }}>
          <FormColor name="primaryColor" label="Primary Color" placeholder="#1890ff" />
          <FormColor name="secondaryColor" label="Secondary Color" placeholder="#722ed1" />
          <Typography.Title level={5} style={{ marginTop: 20, marginBottom: 8 }}>Custom Colors</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>Add extra colors (hex, rgb, gradient). Shown in block color picker.</Typography.Paragraph>
          <Form.List name="colors">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                    <Form.Item name={[name, "name"]} rules={[{ required: true }]} style={{ marginBottom: 0, flex: "1 1 140px" }}><Input placeholder="Title" /></Form.Item>
                    <Form.Item name={[name, "value"]} rules={[{ required: true }]} style={{ marginBottom: 0, flex: "1 1 200px" }}><ColorCodeInput /></Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </div>
                ))}
                <Button type="dashed" onClick={() => add({ name: "", value: "" })} icon={<PlusOutlined />} style={{ marginTop: 4 }}>Add color</Button>
              </>
            )}
          </Form.List>
        </div>
      ),
    },
    {
      key: "responsive",
      label: <span><MobileOutlined style={{ marginRight: 8 }} />Responsive</span>,
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="mobileFontSize" label="Mobile Font Size (px, 0 = no override)"><InputNumber min={0} max={24} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="mobileSectionSpacing" label="Mobile Section Spacing"><Input placeholder="e.g. 1rem 0" /></Form.Item>
          <Form.Item name="hideSectionOnMobile" label="Hide Section on Mobile Option" valuePropName="checked"><Switch /></Form.Item>
        </div>
      ),
    },
    {
      key: "advanced",
      label: <span><CodeOutlined style={{ marginRight: 8 }} />Advanced</span>,
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="customCss" label="Custom CSS"><Input.TextArea rows={6} placeholder=".my-class { color: red; }" style={{ fontFamily: "monospace", fontSize: 12 }} /></Form.Item>
          <Form.Item name="customJs" label="Custom JS"><Input.TextArea rows={4} placeholder="JavaScript" style={{ fontFamily: "monospace", fontSize: 12 }} /></Form.Item>
          <Form.Item name="headScripts" label="Head Scripts"><Input.TextArea rows={3} placeholder="<script>...</script>" style={{ fontFamily: "monospace", fontSize: 12 }} /></Form.Item>
          <Form.Item name="footerScripts" label="Footer Scripts"><Input.TextArea rows={3} placeholder="<script>...</script>" style={{ fontFamily: "monospace", fontSize: 12 }} /></Form.Item>
          <Form.Item name="googleAnalyticsId" label="Google Analytics ID"><Input placeholder="G-XXXXXXXXXX" /></Form.Item>
        </div>
      ),
    },
    {
      key: "layout",
      label: <span><BulbOutlined style={{ marginRight: 8 }} />Layout & Locale</span>,
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="layoutWidth" label="Container max-width (px)"><InputNumber min={600} max={1920} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="defaultLocale" label="Default locale"><Input placeholder="en" /></Form.Item>
          <Form.Item name="direction" label="Direction"><Select options={[{ value: "ltr", label: "LTR" }, { value: "rtl", label: "RTL" }]} /></Form.Item>
        </div>
      ),
    },
  ];

  return (
    <>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>Theme Settings</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>Control brand identity, global colors, and advanced options.</Typography.Paragraph>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialFormValues} style={{ maxWidth: 720 }}>
          <Collapse items={collapseItems} defaultActiveKey={["brand", "colors-primary", "layout"]} />
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" loading={saving}>Save theme</Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
