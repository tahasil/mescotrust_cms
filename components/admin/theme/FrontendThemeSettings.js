"use client";

import { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Collapse,
  Typography,
  Switch,
  Divider,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  CodeOutlined,
  BulbOutlined,
  LoadingOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { LOCALE_OPTIONS } from "@/lib/localeOptions";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";
import {
  ColorCodeInput,
  FormColor,
  initialFormValues,
  loadThemeSettings,
  saveThemeSettings,
} from "@/components/admin/theme/shared";

export default function FrontendThemeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const baselineRef = useRef({});

  useEffect(() => {
    loadThemeSettings(form, baselineRef)
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, [form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      await saveThemeSettings(form, baselineRef, {
        ...values,
        googleFonts: baselineRef.current?.googleFonts || [],
      });
      message.success("Theme saved");
    } catch (err) {
      message.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const faviconUrl = Form.useWatch("faviconUrl", form);

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
          <Divider orientation="left" plain style={{ margin: "16px 0 12px" }}>
            Smooth Scroll (Lenis)
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="smoothScrollEnabled"
                label="Enable smooth scroll"
                valuePropName="checked"
                tooltip="Smooth scroll effect using Lenis library"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="smoothScrollDuration"
                label="Duration"
                tooltip="Scroll animation duration (higher = slower, smoother)"
              >
                <InputNumber min={0.5} max={5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="smoothScrollWheelMultiplier"
                label="Wheel speed"
                tooltip="Mouse wheel scroll speed multiplier"
              >
                <InputNumber min={0.1} max={5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="smoothScrollTouchMultiplier"
                label="Touch speed"
                tooltip="Touch/swipe scroll speed multiplier (mobile)"
              >
                <InputNumber min={0.1} max={5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: "16px 0 12px" }}>
            Scroll Animation
          </Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="fadeAnimationEnabled"
                label="Enable scroll animation"
                valuePropName="checked"
                tooltip="Fade-in effect when sections scroll into view"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="fadeAnimationDuration"
                label="Duration (seconds)"
                tooltip="How long the fade-in transition takes"
              >
                <InputNumber min={0.1} max={3} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="fadeAnimationDistance"
                label="Distance (vh)"
                tooltip="How far the section slides up from (in viewport height units)"
              >
                <InputNumber min={0} max={50} step={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="fadeAnimationThreshold"
                label="Trigger threshold"
                tooltip="How much of the section must be visible to trigger (0 = any part, 1 = fully visible)"
              >
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
                          style={{
                            marginBottom: 0,
                            flex: "1 1 100px",
                            minWidth: 0,
                          }}
                          label={null}
                        >
                          <Input placeholder="e.g. accent" />
                        </Form.Item>
                        <Form.Item
                          name={[name, "value"]}
                          style={{
                            marginBottom: 0,
                            flex: "1 1 140px",
                            minWidth: 0,
                          }}
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
            {(fields) => (
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
                        style={{
                          marginBottom: 0,
                          flex: "1 1 100px",
                          minWidth: 0,
                        }}
                        label={null}
                      >
                        <Input placeholder="e.g. primary, headerBg" />
                      </Form.Item>
                      <Form.Item
                        name={[name, "value"]}
                        style={{
                          marginBottom: 0,
                          flex: "1 1 140px",
                          minWidth: 0,
                        }}
                        label={null}
                      >
                        <ColorCodeInput placeholder="#hex or rgba(...)" />
                      </Form.Item>
                    </div>
                  </Col>
                ))}
              </Row>
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
          <Form.Item
            name="pageLoaderEnabled"
            label="Enable page loader"
            valuePropName="checked"
          >
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
          <Form.Item
            name="pageLoaderMinDuration"
            label="Minimum duration (ms)"
            tooltip="Minimum time the loader stays visible to avoid flickering"
          >
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
            destroyInactivePanel={false}
            defaultActiveKey={[]}
            size="small"
            items={[
              {
                key: "global-seo-performance",
                forceRender: true,
                label: "Global SEO & Performance",
                children: (
                  <Row gutter={[16, 0]}>
                    <Col xs={24}>
                      <Form.Item name="defaultMetaTitle" label="Default Meta Title">
                        <Input placeholder="Default title for pages without page-level SEO title" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        name="defaultMetaDescription"
                        label="Default Meta Description"
                      >
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
            <BgColorsOutlined style={{ marginRight: 8 }} />
            Frontend Setting
          </span>
        }
        extra={
          <Button type="primary" htmlType="submit" loading={saving}>
            Save
          </Button>
        }
      >
        <Collapse
          items={websiteCollapseItems}
          defaultActiveKey={[]}
          destroyInactivePanel={false}
        />
      </ThemeAdminCard>
    </Form>
  );
}
