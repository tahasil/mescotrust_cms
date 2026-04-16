"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Switch,
} from "antd";
import { ThemeAdminCard } from "@/styles/Theme";

const DEFAULTS = {
  compressionMode: "glossy",
  quality: 75,
  enableWebP: true,
  enableAVIF: true,
  enableLazyLoad: true,
  cropMode: "none",
  widths: {
    thumbnail: 240,
    medium: 640,
    large: 1280,
    mobile: 768,
    desktop: 1440,
  },
  avifEffort: 4,
  webpEffort: 4,
  maxUploadMB: 20,
};

export default function AdminMediaSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [form] = Form.useForm();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media/settings");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load settings");
      form.setFieldsValue({ ...DEFAULTS, ...data, widths: { ...DEFAULTS.widths, ...(data.widths || {}) } });
      setForbidden(false);
    } catch (err) {
      message.error(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        widths: { ...DEFAULTS.widths, ...(values.widths || {}) },
      };
      const res = await fetch("/api/admin/media/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setForbidden(true);
        message.error("Admin permission required");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      message.success("Media settings saved");
      form.setFieldsValue({
        ...DEFAULTS,
        ...data,
        widths: { ...DEFAULTS.widths, ...(data.widths || {}) },
      });
    } catch (err) {
      message.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (forbidden) {
    return (
      <ThemeAdminCard title="Media Settings">
        <Alert
          type="warning"
          message="Admin permission required to update media settings."
          showIcon
        />
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title="Media Settings"
      extra={
        <Space>
          <Button onClick={loadSettings} disabled={loading || saving}>Refresh</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            Save settings
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={DEFAULTS}
        onFinish={onFinish}
        disabled={loading}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="compressionMode" label="Compression mode">
              <Select
                options={[
                  { value: "lossless", label: "Lossless" },
                  { value: "glossy", label: "Glossy" },
                  { value: "lossy", label: "Lossy" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="quality" label="Quality (40-100)">
              <InputNumber min={40} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="maxUploadMB" label="Max upload size (MB)">
              <InputNumber min={1} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="enableWebP" label="Enable WebP" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="enableAVIF" label="Enable AVIF" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="enableLazyLoad" label="Enable Lazy Load" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="cropMode" label="Resize mode">
              <Select
                options={[
                  { value: "none", label: "Inside (no crop)" },
                  { value: "cover", label: "Cover (crop)" },
                  { value: "contain", label: "Contain" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="webpEffort" label="WebP effort (0-6)">
              <InputNumber min={0} max={6} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="avifEffort" label="AVIF effort (0-9)">
              <InputNumber min={0} max={9} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name={["widths", "thumbnail"]} label="Thumbnail width">
              <InputNumber min={64} max={2048} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={["widths", "medium"]} label="Medium width">
              <InputNumber min={128} max={2560} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={["widths", "large"]} label="Large width">
              <InputNumber min={256} max={3840} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name={["widths", "mobile"]} label="Mobile width">
              <InputNumber min={320} max={2048} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={["widths", "desktop"]} label="Desktop width">
              <InputNumber min={640} max={5120} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </ThemeAdminCard>
  );
}
