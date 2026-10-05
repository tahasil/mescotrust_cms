"use client";

import { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Collapse,
  Typography,
  Divider,
  Row,
  Col,
} from "antd";
import {
  UploadOutlined,
  BgColorsOutlined,
  BulbOutlined,
  LoadingOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";
import {
  FormColor,
  initialFormValues,
  loadThemeSettings,
  saveThemeSettings,
} from "@/components/admin/theme/shared";

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
            border: "3px solid #f0f0f0",
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

export default function AdminThemeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [adminLogoUploading, setAdminLogoUploading] = useState(false);
  const baselineRef = useRef({});

  useEffect(() => {
    loadThemeSettings(form, baselineRef)
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, [form]);

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
      await saveThemeSettings(form, baselineRef, values);
      message.success("Theme saved");
    } catch (err) {
      message.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const adminLogoUrl = Form.useWatch("adminLogoUrl", form);

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
              <Form.Item
                name="adminSiteName"
                label="Admin panel title"
                tooltip="Displayed in the sidebar header. Falls back to Site Title if empty."
              >
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
                <Button
                  icon={
                    adminLogoUploading ? <LoadingOutlined /> : <UploadOutlined />
                  }
                  loading={adminLogoUploading}
                >
                  Upload admin logo
                </Button>
              </Upload>
            </Col>
            <Col xs={24} sm={12}>
              {adminLogoUrl ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  <img
                    src={adminLogoUrl}
                    alt="Admin logo preview"
                    style={{
                      maxHeight: 40,
                      maxWidth: 160,
                      objectFit: "contain",
                      border: "1px solid #f0f0f0",
                      borderRadius: 4,
                      padding: 4,
                    }}
                  />
                  <Button
                    size="small"
                    danger
                    onClick={() => form.setFieldsValue({ adminLogoUrl: "" })}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
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
              <FormColor
                name="adminTextColor"
                label="Text color"
                placeholder="#333333"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminBorderColor"
                label="Border color"
                placeholder="rgba(0,0,0,0.06)"
              />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>
            CTA Button
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminCtaBgColor"
                label="Button background"
                placeholder="#1677ff"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminCtaTextColor"
                label="Button text color"
                placeholder="#ffffff"
              />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>
            CTA Hover
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminCtaHoverBgColor"
                label="Hover background"
                placeholder="Leave empty for auto"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminCtaHoverTextColor"
                label="Hover text color"
                placeholder="Leave empty for auto"
              />
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
          <Divider orientation="left" plain style={{ margin: "0 0 12px" }}>
            Default
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminSidebarBg"
                label="Background"
                placeholder="#ffffff"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminSidebarText"
                label="Text color"
                placeholder="rgba(0,0,0,0.65)"
              />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>
            Hover
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminSidebarHoverBg"
                label="Hover background"
                placeholder="rgba(0,0,0,0.04)"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminSidebarHoverText"
                label="Hover text"
                placeholder="#1677ff"
              />
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "8px 0 12px" }}>
            Active
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminSidebarActiveBg"
                label="Active background"
                placeholder="#e6f4ff"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminSidebarActiveText"
                label="Active text"
                placeholder="#1677ff"
              />
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
              <FormColor
                name="adminLoaderColor"
                label="Loader color"
                placeholder="#1677ff"
              />
            </Col>
            <Col xs={24} sm={12}>
              <FormColor
                name="adminLoaderBgColor"
                label="Overlay background"
                placeholder="rgba(255,255,255,0.5)"
              />
            </Col>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Preview:
            </Typography.Text>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 24,
                marginTop: 8,
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
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
    >
      <ThemeAdminCard
        loading={loading}
        title={
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            Admin Setting
          </span>
        }
        extra={
          <Button type="primary" htmlType="submit" loading={saving}>
            Save
          </Button>
        }
      >
        <Collapse
          items={adminCollapseItems}
          defaultActiveKey={[]}
          destroyInactivePanel={false}
        />
      </ThemeAdminCard>
    </Form>
  );
}
