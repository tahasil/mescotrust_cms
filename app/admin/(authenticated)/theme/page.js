"use client";

import { useState, useEffect } from "react";
import { Card, Form, Input, InputNumber, Select, Button, Space, Tag, Upload, message, Divider } from "antd";
import { PlusOutlined, CloseOutlined, UploadOutlined, DeleteOutlined } from "@ant-design/icons";

const POPULAR_GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Raleway", "Nunito", "Playfair Display", "Merriweather", "Source Sans Pro",
  "PT Sans", "Noto Sans", "Noto Sans Arabic", "Cairo", "Tajawal",
  "Ubuntu", "Oswald", "Rubik", "Work Sans", "Fira Sans",
];

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
        form.setFieldsValue({
          fontFamily: data.fontFamily || "system-ui, sans-serif",
          fontSize: data.fontSize || 16,
          headingFontFamily: data.headingFontFamily || "",
          headingFontSize: data.headingFontSize || 0,
          lineHeight: data.lineHeight ?? 1.6,
          letterSpacing: data.letterSpacing ?? 0,
          fontWeight: data.fontWeight || 400,
          headingFontWeight: data.headingFontWeight || 700,
          primaryColor: data.primaryColor || "#1890ff",
          secondaryColor: data.secondaryColor || "#722ed1",
          backgroundColor: data.backgroundColor || "#ffffff",
          textColor: data.textColor || "#333333",
          linkColor: data.linkColor || "",
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

  return (
    <>
      <h1 style={{ marginBottom: 16 }}>Theme</h1>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
          <Divider orientation="left">Typography</Divider>

          <Form.Item name="fontFamily" label="Body font family">
            <Input placeholder="system-ui, sans-serif" />
          </Form.Item>
          <Form.Item name="headingFontFamily" label="Heading font family (optional, falls back to body)">
            <Input placeholder="Leave empty to use body font" />
          </Form.Item>
          <Form.Item name="fontSize" label="Base font size (px)">
            <InputNumber min={10} max={24} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="headingFontSize" label="Heading base font size (px, 0 = browser default)" extra="Applied to h1–h6; browsers scale each level proportionally">
            <InputNumber min={0} max={72} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="lineHeight" label="Line height" extra="Unitless multiplier (e.g. 1.6)">
            <InputNumber min={1} max={3} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="letterSpacing" label="Letter spacing (px)">
            <InputNumber min={-2} max={10} step={0.5} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="fontWeight" label="Body font weight">
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
          <Form.Item name="headingFontWeight" label="Heading font weight">
            <Select
              style={{ width: "100%" }}
              options={[
                { value: 400, label: "400 — Regular" },
                { value: 500, label: "500 — Medium" },
                { value: 600, label: "600 — Semi-bold" },
                { value: 700, label: "700 — Bold" },
                { value: 800, label: "800 — Extra-bold" },
                { value: 900, label: "900 — Black" },
              ]}
            />
          </Form.Item>

          <Divider orientation="left">Google Fonts</Divider>

          <div style={{ marginBottom: 16 }}>
            {googleFonts.length === 0 && <p style={{ color: "#999" }}>No Google Fonts imported.</p>}
            <Space wrap>
              {googleFonts.map((f) => (
                <Tag key={f.family} closable onClose={() => handleRemoveFont(f.family)}>
                  {f.family}
                </Tag>
              ))}
            </Space>
          </div>
          <Space style={{ marginBottom: 16 }}>
            <Select
              showSearch
              style={{ width: 220 }}
              placeholder="Select Google Font"
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

          <Divider orientation="left">Custom Font Upload</Divider>

          <Upload
            beforeUpload={() => false}
            onChange={handleFontUpload}
            showUploadList={false}
            accept=".woff2,.woff,.ttf"
          >
            <Button icon={<UploadOutlined />} loading={fontUploading} style={{ marginBottom: 12 }}>
              Upload font file (.woff2 / .woff / .ttf)
            </Button>
          </Upload>

          {uploadedFonts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {uploadedFonts.map((f) => (
                <Tag key={f.filename} closable onClose={() => handleDeleteFont(f.filename)}>
                  {f.filename}
                </Tag>
              ))}
            </div>
          )}

          <Form.Item name="customFontUrl" label="Active custom font" extra="Select an uploaded font or paste an external URL">
            <Select
              allowClear
              placeholder="Choose uploaded font or enter URL"
              showSearch
              options={[
                ...uploadedFonts.map((f) => ({ value: f.url, label: f.filename })),
              ]}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: "4px 8px", borderTop: "1px solid #eee" }}>
                    <Input
                      size="small"
                      placeholder="Or paste external URL"
                      onPressEnter={(e) => {
                        const val = e.target.value.trim();
                        if (val) form.setFieldValue("customFontUrl", val);
                      }}
                    />
                  </div>
                </>
              )}
            />
          </Form.Item>

          <Divider orientation="left">Colors</Divider>

          <Form.Item name="primaryColor" label="Primary color">
            <Input placeholder="#1890ff" />
          </Form.Item>
          <Form.Item name="secondaryColor" label="Secondary color">
            <Input placeholder="#722ed1" />
          </Form.Item>
          <Form.Item name="backgroundColor" label="Background color">
            <Input placeholder="#ffffff" />
          </Form.Item>
          <Form.Item name="textColor" label="Text color">
            <Input placeholder="#333333" />
          </Form.Item>
          <Form.Item name="linkColor" label="Link color (optional, falls back to primary)">
            <Input placeholder="Leave empty to use primary" />
          </Form.Item>

          <Divider orientation="left">Layout</Divider>

          <Form.Item name="layoutWidth" label="Max layout width (px)">
            <InputNumber min={600} max={1920} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="defaultLocale" label="Default locale" extra="Sets the lang attribute on the HTML document (e.g. en, ar, he)">
            <Input placeholder="en" />
          </Form.Item>
          <Form.Item name="direction" label="Direction">
            <Select options={[{ value: "ltr", label: "LTR (left-to-right)" }, { value: "rtl", label: "RTL (right-to-left)" }]} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save theme
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
