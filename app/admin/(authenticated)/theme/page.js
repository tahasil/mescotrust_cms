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
} from "antd";
import { PlusOutlined, UploadOutlined, DeleteOutlined, BulbOutlined, BgColorsOutlined, FontSizeOutlined, PictureOutlined, GlobalOutlined } from "@ant-design/icons";

const POPULAR_GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Raleway", "Nunito", "Playfair Display", "Merriweather", "Source Sans Pro",
  "PT Sans", "Noto Sans", "Noto Sans Arabic", "Cairo", "Tajawal",
  "Ubuntu", "Oswald", "Rubik", "Work Sans", "Fira Sans",
];

/** Accepts hex, rgb(), rgba(), or gradient. Optional hex picker when value is hex. */
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
          style={{
            width: 40,
            height: 32,
            padding: 2,
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "e.g. #1890ff, rgb(24,144,255), linear-gradient(...)"}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Space.Compact>
  );
}

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
        form.setFieldsValue({
          siteTitle: data.siteTitle || "Mesco Trust",
          logoType: data.logoType || "text",
          logoImageUrl: data.logoImageUrl || "",
          colors: Array.isArray(data.colors) ? data.colors : [],
          fontFamily: data.fontFamily || "system-ui, sans-serif",
          fontSize: data.fontSize || 16,
          headingFontFamily: data.headingFontFamily || "",
          headingFontSize: data.headingFontSize || 0,
          lineHeight: data.lineHeight ?? 1.6,
          letterSpacing: data.letterSpacing ?? 0,
          fontWeight: data.fontWeight || 400,
          headingFontWeight: data.headingFontWeight || 700,
          layoutWidth: data.layoutWidth || 1200,
          defaultLocale: data.defaultLocale || "en",
          direction: data.direction || "ltr",
          customFontUrl: data.customFontUrl || "",
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
    setGoogleFonts([...googleFonts, { family: newFont, weights: ["400", "700"] }]);
    setNewFont(null);
  };

  const handleRemoveFont = (family) => {
    setGoogleFonts(googleFonts.filter((f) => f.family !== family));
  };

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
    if (!res.ok) {
      message.error("Failed to delete font");
      return;
    }
    message.success("Font deleted");
    fetchUploadedFonts();
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
      key: "identity",
      label: (
        <span>
          <GlobalOutlined style={{ marginRight: 8 }} />
          Site identity
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item
            name="siteTitle"
            label="Site title"
            extra="Used in the header, footer, and browser tab."
          >
            <Input placeholder="Mesco Trust" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: "logo",
      label: (
        <span>
          <PictureOutlined style={{ marginRight: 8 }} />
          Logo
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="logoType" label="Logo type">
            <Segmented
              options={[
                { value: "text", label: "Text (site title)" },
                { value: "image", label: "Image" },
              ]}
            />
          </Form.Item>
          {logoType === "image" && (
            <Form.Item
              name="logoImageUrl"
              label="Logo image URL"
              extra="Enter a full URL to your logo image (e.g. from your media library or CDN)."
            >
              <Input placeholder="https://example.com/logo.png" />
            </Form.Item>
          )}
        </div>
      ),
    },
    {
      key: "colors",
      label: (
        <span>
          <BgColorsOutlined style={{ marginRight: 8 }} />
          Theme colors
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Add colors by title and color code. Use <strong>hex</strong> (#fff, #ffffff), <strong>rgb</strong> (rgb(0,0,0)), <strong>rgba</strong> (rgba(0,0,0,0.5)), or <strong>gradient</strong> (linear-gradient(...), radial-gradient(...)). These appear in the color selector when editing page or component elements.
          </Typography.Paragraph>
          <Form.List name="colors">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                    <Form.Item name={[name, "name"]} {...rest} rules={[{ required: true, message: "Title" }]} style={{ marginBottom: 0, flex: "1 1 140px" }}>
                      <Input placeholder="Title (e.g. Primary, Background)" />
                    </Form.Item>
                    <Form.Item name={[name, "value"]} {...rest} rules={[{ required: true, message: "Color code" }]} style={{ marginBottom: 0, flex: "1 1 220px" }}>
                      <ColorCodeInput placeholder="#hex, rgb(), rgba(), or gradient" />
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} aria-label="Remove color" />
                  </div>
                ))}
                <Button type="dashed" onClick={() => add({ name: "", value: "" })} icon={<PlusOutlined />} style={{ marginTop: 4 }}>
                  Add color
                </Button>
              </>
            )}
          </Form.List>
        </div>
      ),
    },
    {
      key: "typography",
      label: (
        <span>
          <FontSizeOutlined style={{ marginRight: 8 }} />
          Typography
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item name="fontFamily" label="Body font">
            <Input placeholder="system-ui, sans-serif" />
          </Form.Item>
          <Form.Item name="headingFontFamily" label="Heading font (optional)">
            <Input placeholder="Same as body if empty" />
          </Form.Item>
          <Form.Item name="fontSize" label="Base font size (px)">
            <InputNumber min={10} max={24} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="headingFontSize" label="Heading base size (px, 0 = default)">
            <InputNumber min={0} max={72} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="lineHeight" label="Line height">
            <InputNumber min={1} max={3} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="letterSpacing" label="Letter spacing (px)">
            <InputNumber min={-2} max={10} step={0.5} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="fontWeight" label="Body weight">
            <Select
              style={{ width: "100%" }}
              options={[
                { value: 300, label: "300 — Light" },
                { value: 400, label: "400 — Regular" },
                { value: 500, label: "500 — Medium" },
                { value: 600, label: "600 — Semi-bold" },
                { value: 700, label: "700 — Bold" },
              ]}
            />
          </Form.Item>
          <Form.Item name="headingFontWeight" label="Heading weight">
            <Select
              style={{ width: "100%" }}
              options={[
                { value: 400, label: "400" },
                { value: 500, label: "500" },
                { value: 600, label: "600" },
                { value: 700, label: "700 — Bold" },
                { value: 800, label: "800" },
                { value: 900, label: "900" },
              ]}
            />
          </Form.Item>

          <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>Google Fonts</Typography.Title>
          <div style={{ marginBottom: 12 }}>
            {googleFonts.length === 0 && <p style={{ color: "#999", marginBottom: 8 }}>No Google Fonts added.</p>}
            <Space wrap style={{ marginBottom: 8 }}>
              {googleFonts.map((f) => (
                <Tag key={f.family} closable onClose={() => handleRemoveFont(f.family)}>
                  {f.family}
                </Tag>
              ))}
            </Space>
            <Space>
              <Select
                showSearch
                style={{ width: 220 }}
                placeholder="Select font"
                value={newFont}
                onChange={setNewFont}
                options={POPULAR_GOOGLE_FONTS.map((f) => ({ value: f, label: f }))}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
              <Button icon={<PlusOutlined />} onClick={handleAddGoogleFont} disabled={!newFont}>
                Add
              </Button>
            </Space>
          </div>

          <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>Custom font</Typography.Title>
          <Upload
            beforeUpload={() => false}
            onChange={handleFontUpload}
            showUploadList={false}
            accept=".woff2,.woff,.ttf"
          >
            <Button icon={<UploadOutlined />} loading={fontUploading} style={{ marginBottom: 12 }}>
              Upload .woff2 / .woff / .ttf
            </Button>
          </Upload>
          {uploadedFonts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {uploadedFonts.map((f) => (
                <Tag key={f.filename} closable onClose={() => handleDeleteFont(f.filename)}>
                  {f.filename}
                </Tag>
              ))}
            </div>
          )}
          <Form.Item name="customFontUrl" label="Active custom font" extra="Choose uploaded or paste URL.">
            <Select
              allowClear
              placeholder="Select or paste URL"
              showSearch
              options={uploadedFonts.map((f) => ({ value: f.url, label: f.filename }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: "4px 8px", borderTop: "1px solid #eee" }}>
                    <Input
                      size="small"
                      placeholder="Paste font URL"
                      onPressEnter={(e) => {
                        const val = e.target.value?.trim();
                        if (val) form.setFieldValue("customFontUrl", val);
                      }}
                    />
                  </div>
                </>
              )}
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: "layout",
      label: (
        <span>
          <BulbOutlined style={{ marginRight: 8 }} />
          Layout & locale
        </span>
      ),
      children: (
        <div style={{ paddingBlock: 8 }}>
          <Form.Item
            name="layoutWidth"
            label="Container max-width (px)"
            extra="Max width for main content area."
          >
            <InputNumber min={600} max={1920} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="defaultLocale" label="Default locale" extra="e.g. en, ar, he">
            <Input placeholder="en" />
          </Form.Item>
          <Form.Item name="direction" label="Text direction">
            <Select
              options={[
                { value: "ltr", label: "Left to right (LTR)" },
                { value: "rtl", label: "Right to left (RTL)" },
              ]}
            />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>Theme</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Control your site’s look: site title, logo, theme colors (including custom colors for blocks), fonts, and layout.
      </Typography.Paragraph>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 640 }}>
          <Collapse items={collapseItems} defaultActiveKey={["identity", "logo", "colors"]} />
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" loading={saving}>
              Save theme
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
