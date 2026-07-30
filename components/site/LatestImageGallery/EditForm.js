"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { ColorSettingsCard, SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { LATEST_IMAGE_GALLERY_DEFAULT_PROPS } from "./defaults";

const API_PATH = "/api/theme/LatestImageGallery";
const PREFIX = "latestImageGallery";

function getColorOptions(theme) {
  const palette = theme?.themePalette || {};
  const custom = Array.isArray(theme?.colors) ? theme.colors : [];
  const names = [
    ...new Set([
      ...Object.keys(palette),
      ...custom.map((color) => color?.name).filter(Boolean),
    ]),
  ].sort();
  return names.map((name) => ({ label: name, value: name }));
}

function applyFormValues(form, data) {
  const merged = { ...LATEST_IMAGE_GALLERY_DEFAULT_PROPS, ...(data || {}) };
  form.setFieldsValue({
    ...merged,
    ...getManageSectionInitialValues(PREFIX, merged),
  });
}

function LatestImageGalleryEditForm(
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
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then((theme) => setThemeColorOptions(getColorOptions(theme)))
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyFormValues(form, initialDataProp || {});
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => applyFormValues(form, data))
      .catch(() => message.error("Failed to load Latest Image Gallery"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);

  const handleUpdate = useCallback(() => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          ...values,
          latestImageGalleryFirstDirection:
            values.latestImageGalleryFirstDirection === "ltr" ? "ltr" : "rtl",
          latestImageGallerySecondDirection:
            values.latestImageGallerySecondDirection === "rtl" ? "rtl" : "ltr",
          latestImageGallerySpeed: Number(values.latestImageGallerySpeed ?? 42),
          latestImageGalleryImageRadius: Number(values.latestImageGalleryImageRadius ?? 18),
          latestImageGalleryImageGap: Number(values.latestImageGalleryImageGap ?? 24),
          latestImageGalleryRowGap: Number(values.latestImageGalleryRowGap ?? 24),
          latestImageGalleryTitleFontSize: Number(values.latestImageGalleryTitleFontSize ?? 56),
          latestImageGallerySubTitleFontSize: Number(values.latestImageGallerySubTitleFontSize ?? 13),
          ...getManageSectionPayload(PREFIX, values),
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

        setSaving(true);
        fetch(API_PATH, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((data) => Promise.reject(data));
            }
          })
          .then(() => {
            message.success("Latest Image Gallery saved");
            onSuccess?.();
          })
          .catch((error) => message.error(error?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  }, [form, isPageBlock, onSaveToPage, onSuccess]);

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["manage-section", "content", "layout"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
              />
            ),
          },
          {
            key: "content",
            label: "Title, Subtitle & Link",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card size="small" title="Settings">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestImageGalleryFirstDirection" label="First marquee direction">
                        <Select
                          options={[
                            { label: "Right to left", value: "rtl" },
                            { label: "Left to right", value: "ltr" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestImageGallerySecondDirection" label="Second marquee direction">
                        <Select
                          options={[
                            { label: "Left to right", value: "ltr" },
                            { label: "Right to left", value: "rtl" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
                <SwitchSettingsCard
                  items={[
                    { name: "latestImageGallerySubTitleVisible", label: "Show subtitle" },
                    { name: "latestImageGalleryTitleVisible", label: "Show title" },
                    { name: "latestImageGalleryViewAllVisible", label: "Show gallery link" },
                  ]}
                />
                <Card size="small" title="Heading content">
                  <Form.Item name="latestImageGallerySubTitle" label="Subtitle">
                    <Input placeholder="Image Gallery" />
                  </Form.Item>
                  <Form.Item name="latestImageGalleryTitle" label="Title">
                    <Input placeholder="Moments from" />
                  </Form.Item>
                  <Form.Item name="latestImageGalleryHeadingAccent" label="Title accent">
                    <Input placeholder="the field." />
                  </Form.Item>
                </Card>
                <Card size="small" title="Gallery link">
                  <Form.Item name="latestImageGalleryViewAllText" label="Link text">
                    <Input placeholder="View full gallery" />
                  </Form.Item>
                  <Form.Item name="latestImageGalleryViewAllLink" label="Link URL">
                    <Input placeholder="/media/image-gallery" />
                  </Form.Item>
                  <Form.Item name="latestImageGalleryViewAllTarget" label="Open link in">
                    <Select
                      options={[
                        { label: "Same tab", value: "_self" },
                        { label: "New tab", value: "_blank" },
                      ]}
                    />
                  </Form.Item>
                </Card>
              </div>
            ),
          },
          {
            key: "layout",
            label: "Marquee Layout",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SwitchSettingsCard
                  items={[
                    {
                      name: "latestImageGalleryPauseOnHover",
                      label: "Pause marquees on hover",
                    },
                  ]}
                />
                <Card size="small" title="Animation and spacing">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestImageGallerySpeed" label="Loop duration">
                        <InputNumber min={10} max={180} addonAfter="sec" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestImageGalleryImageRadius" label="Image radius">
                        <InputNumber min={0} max={80} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestImageGalleryImageGap" label="Image gap">
                        <InputNumber min={0} max={64} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestImageGalleryRowGap" label="Row gap">
                        <InputNumber min={0} max={80} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </div>
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: (
              <ColorSettingsCard
                options={themeColorOptions}
                items={[
                  { name: "latestImageGallerySubTitleColorKey", label: "Subtitle" },
                  { name: "latestImageGalleryTitleColorKey", label: "Title" },
                  { name: "latestImageGalleryAccentColorKey", label: "Highlighted/Accent Text" },
                  { name: "latestImageGalleryLinkColorKey", label: "Gallery link" },
                ]}
              />
            ),
          },
          {
            key: "typography",
            label: "Typography",
            children: (
              <Card size="small">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="latestImageGalleryTitleFontSize" label="Title size">
                      <InputNumber min={24} max={96} addonAfter="px" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="latestImageGallerySubTitleFontSize" label="Subtitle size">
                      <InputNumber min={10} max={28} addonAfter="px" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(LatestImageGalleryEditForm);
