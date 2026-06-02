"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Collapse,
  message,
  Spin,
  Select,
  Switch,
  InputNumber,
  Button,
  Divider,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const API_PATH = "/api/theme/SocialMediaWall";

const PLATFORM_OPTIONS = [
  { label: "X (Twitter)", value: "twitter" },
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
];

const LAYOUT_OPTIONS = [
  { label: "Grid", value: "grid" },
  { label: "Masonry", value: "masonry" },
  { label: "Carousel", value: "carousel" },
];

const DEFAULT_PLATFORMS = [
  { platform: "twitter", profileUrl: "", active: true, order: 1 },
  { platform: "facebook", profileUrl: "", active: true, order: 2 },
  { platform: "instagram", profileUrl: "", active: true, order: 3 },
  { platform: "youtube", profileUrl: "", active: true, order: 4 },
];

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizePlatform(item, index = 0) {
  const platform = safeString(item?.platform || "twitter").toLowerCase();
  const orderValue = Number(item?.order);
  return {
    platform: PLATFORM_OPTIONS.some((option) => option.value === platform)
      ? platform
      : "twitter",
    profileUrl: safeString(item?.profileUrl),
    active: item?.active !== false,
    order:
      Number.isFinite(orderValue) && orderValue > 0
        ? Math.floor(orderValue)
        : index + 1,
  };
}

function normalizePostLimit(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 12;
  return Math.min(60, Math.floor(num));
}

function normalizeSpacing(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 64;
  return Math.min(240, Math.floor(num));
}

function SocialMediaWallEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    const setFormAndColors = (data, theme) => {
      const platforms = Array.isArray(data?.socialMediaWallPlatforms)
        ? data.socialMediaWallPlatforms.map((item, index) => normalizePlatform(item, index))
        : [];

      form.setFieldsValue({
        socialMediaWallEnabled: data?.socialMediaWallEnabled !== false,
        mainTitle: safeString(data?.mainTitle || "Social Media Wall") || "Social Media Wall",
        subTitle: safeString(data?.subTitle),
        socialMediaWallPlatforms:
          platforms.length > 0
            ? platforms
            : DEFAULT_PLATFORMS.map((item, index) => normalizePlatform(item, index)),
        socialMediaWallPostLimit: normalizePostLimit(data?.socialMediaWallPostLimit),
        socialMediaWallLayoutMode: ["grid", "masonry", "carousel"].includes(
          safeString(data?.socialMediaWallLayoutMode).toLowerCase(),
        )
          ? safeString(data?.socialMediaWallLayoutMode).toLowerCase()
          : "masonry",
        socialMediaWallShowPlatformIcon: data?.socialMediaWallShowPlatformIcon !== false,
        socialMediaWallSectionBgColorKey: safeString(
          data?.socialMediaWallSectionBgColorKey,
        ),
        socialMediaWallSectionSpacing: normalizeSpacing(data?.socialMediaWallSectionSpacing),
      });

      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((color) => color?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormAndColors(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => setFormAndColors(data, theme))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data, theme))
      .catch(() => message.error("Failed to load Social Media Wall settings"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const platforms = Array.isArray(values?.socialMediaWallPlatforms)
          ? values.socialMediaWallPlatforms
              .map((item, index) => normalizePlatform(item, index))
              .sort((first, second) => first.order - second.order)
          : [];

        const payload = {
          socialMediaWallEnabled: values?.socialMediaWallEnabled !== false,
          mainTitle: safeString(values?.mainTitle || "Social Media Wall") || "Social Media Wall",
          subTitle: safeString(values?.subTitle),

          socialMediaWallPlatforms: platforms,
          socialMediaWallPostLimit: normalizePostLimit(values?.socialMediaWallPostLimit),
          socialMediaWallLayoutMode: ["grid", "masonry", "carousel"].includes(
            safeString(values?.socialMediaWallLayoutMode).toLowerCase(),
          )
            ? safeString(values?.socialMediaWallLayoutMode).toLowerCase()
            : "masonry",
          socialMediaWallShowPlatformIcon: values?.socialMediaWallShowPlatformIcon !== false,

          socialMediaWallSectionBgColorKey: safeString(
            values?.socialMediaWallSectionBgColorKey,
          ),
          socialMediaWallSectionSpacing: normalizeSpacing(values?.socialMediaWallSectionSpacing),

          // Internal defaults retained to keep frontend behavior stable.
          socialMediaWallTitleEnabled: true,
          socialMediaWallSubTitleEnabled: true,
          socialMediaWallEnableLivePosts: true,
          socialMediaWallOrderMode: "platform-priority",
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

        fetch(API_PATH, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) return res.json().then((data) => Promise.reject(data));
            return null;
          })
          .then(() => {
            message.success("Social Media Wall saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"));
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["general", "platforms", "display"]}
        items={[
          {
            key: "general",
            label: "Section 1: General Settings",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item
                    name="socialMediaWallEnabled"
                    label="Enable Component"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name="mainTitle"
                    label="Section Title"
                    rules={[{ required: true, message: "Section title is required" }]}
                  >
                    <Input placeholder="Social Media Wall" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subTitle" label="Section Subtitle (optional)">
                    <Input placeholder="Follow us on social media" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "platforms",
            label: "Section 2: Social Platforms",
            children: (
              <Form.List name="socialMediaWallPlatforms">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        style={{
                          border: "1px solid #f0f0f0",
                          borderRadius: 10,
                          padding: 14,
                          marginBottom: 12,
                        }}
                      >
                        <Row gutter={[16, 16]}>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              name={[field.name, "platform"]}
                              label="Platform Name"
                              rules={[{ required: true, message: "Platform is required" }]}
                            >
                              <Select options={PLATFORM_OPTIONS} size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={10}>
                            <Form.Item
                              {...field}
                              name={[field.name, "profileUrl"]}
                              label="Profile/Page/Channel URL"
                            >
                              <Input placeholder="https://..." size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              {...field}
                              name={[field.name, "active"]}
                              label="Active"
                              valuePropName="checked"
                            >
                              <Switch />
                            </Form.Item>
                          </Col>
                          <Col span={3}>
                            <Form.Item
                              {...field}
                              name={[field.name, "order"]}
                              label="Display Order"
                            >
                              <InputNumber min={1} max={99} style={{ width: "100%" }} size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={1} style={{ display: "flex", alignItems: "end" }}>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                              aria-label={`Remove platform ${index + 1}`}
                            />
                          </Col>
                        </Row>
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        add({
                          platform: "twitter",
                          profileUrl: "",
                          active: true,
                          order: fields.length + 1,
                        })
                      }
                      block
                    >
                      Add Platform
                    </Button>
                  </>
                )}
              </Form.List>
            ),
          },
          {
            key: "display",
            label: "Section 3: Display Settings",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item name="socialMediaWallPostLimit" label="Number of Posts to Show">
                    <InputNumber min={1} max={60} style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="socialMediaWallLayoutMode" label="Layout Style">
                    <Select options={LAYOUT_OPTIONS} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="socialMediaWallShowPlatformIcon"
                    label="Show Platform Icon"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "styling",
            label: "Section 4: Styling (Optional)",
            children: (
              <>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item name="socialMediaWallSectionBgColorKey" label="Background Color">
                      <Select
                        allowClear
                        options={themeColorOptions}
                        placeholder="Select theme color"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="socialMediaWallSectionSpacing" label="Section Spacing (px)">
                      <InputNumber min={0} max={240} style={{ width: "100%" }} size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider style={{ margin: "4px 0 0" }} />
                <div style={{ marginTop: 10, color: "rgba(0,0,0,0.5)", fontSize: 12 }}>
                  Technical integrations are handled internally and are not shown here.
                </div>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SocialMediaWallEditForm);
