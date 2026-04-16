"use client";

import { Form, Input, Select, Switch, Collapse, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";

/**
 * Shared "Manage Section" UI: Fluid Container + Box Container (background, padding, margin).
 * Use in any site component EditForm. Pass prefix (e.g. "testimonials", "homeHero") and form/themeColorOptions.
 */
export default function ManageSectionFields({ prefix, form, themeColorOptions = [] }) {
  const sectionBgType = (Form.useWatch(prefix + "SectionBgType", form) || "default");
  const pageContainerBgType = (Form.useWatch(prefix + "PageContainerBgType", form) || "default");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "8px 0" }}>
        <Tooltip title="Turn off the fade-in scroll animation for this section">
          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
            Disable scroll animation <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
          </span>
        </Tooltip>
        <Form.Item name="_disableFadeAnimation" valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
          <Switch />
        </Form.Item>
      </div>
    <Collapse
      defaultActiveKey={[]}
      size="small"
      items={[
        {
          key: "fullWidth",
          label: "Fluid Container",
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Form.Item
                name={prefix + "SectionBgType"}
                label="Section background"
                tooltip="Default uses the built-in dark background; Image uses a custom URL; Color uses a theme color."
                style={{ marginBottom: 12 }}
              >
                <Select
                  size="large"
                  options={[
                    { label: "Default", value: "default" },
                    { label: "Image", value: "image" },
                    { label: "Color", value: "color" },
                  ]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              {sectionBgType === "image" && (
                <Form.Item
                  name={prefix + "SectionBgImage"}
                  label="Image path / URL"
                  tooltip="Enter the full URL or path to the background image."
                  style={{ marginBottom: 12 }}
                >
                  <MediaPickerInput placeholder="e.g. /media/..." />
                </Form.Item>
              )}
              {sectionBgType === "color" && (
                <Form.Item
                  name={prefix + "SectionBgColorKey"}
                  label="Theme color"
                  tooltip="Select a color from Admin → Theme."
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    size="large"
                    options={themeColorOptions}
                    placeholder="Select theme color"
                    style={{ width: "100%" }}
                    allowClear
                  />
                </Form.Item>
              )}
              <div style={{ paddingTop: 12, borderTop: "1px solid #f0f0f0", marginTop: 4 }}>
                <Form.Item
                  name={prefix + "SectionPadding"}
                  label="Padding (Top, Bottom)"
                  tooltip="Comma-separated values in px, e.g. 40, 60"
                  style={{ marginBottom: 12 }}
                >
                  <Input placeholder="e.g. 40, 60" size="large" allowClear />
                </Form.Item>
                <Form.Item
                  name={prefix + "SectionMargin"}
                  label="Margin (Top, Bottom)"
                  tooltip="Comma-separated values in px, e.g. 20, 40"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="e.g. 20, 40" size="large" allowClear />
                </Form.Item>
              </div>
            </div>
          ),
        },
        {
          key: "pageContainer",
          label: "Box Container",
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Form.Item
                name={prefix + "PageContainerBgType"}
                label="Container Background"
                tooltip="Background for the inner content container. Default is transparent."
                style={{ marginBottom: 12 }}
              >
                <Select
                  size="large"
                  options={[
                    { label: "Default", value: "default" },
                    { label: "Image", value: "image" },
                    { label: "Color", value: "color" },
                  ]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              {pageContainerBgType === "image" && (
                <Form.Item
                  name={prefix + "PageContainerBgImage"}
                  label="Image path / URL"
                  tooltip="Background image for the inner container."
                  style={{ marginBottom: 12 }}
                >
                  <MediaPickerInput placeholder="e.g. /media/..." />
                </Form.Item>
              )}
              {pageContainerBgType === "color" && (
                <Form.Item
                  name={prefix + "PageContainerBgColorKey"}
                  label="Theme color"
                  tooltip="Theme color for the inner container background."
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    size="large"
                    options={themeColorOptions}
                    placeholder="Select theme color"
                    style={{ width: "100%" }}
                    allowClear
                  />
                </Form.Item>
              )}
              <div style={{ paddingTop: 12, borderTop: "1px solid #f0f0f0", marginTop: 4 }}>
                <Form.Item
                  name={prefix + "PageContainerPadding"}
                  label="Padding (Top, Right, Bottom, Left)"
                  tooltip="Comma-separated values in px, e.g. 40, 24, 60, 24"
                  style={{ marginBottom: 12 }}
                >
                  <Input placeholder="e.g. 40, 24, 60, 24" size="large" allowClear />
                </Form.Item>
                <Form.Item
                  name={prefix + "PageContainerMargin"}
                  label="Margin (Top, Bottom)"
                  tooltip="Comma-separated values in px, e.g. 20, 40"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="e.g. 20, 40" size="large" allowClear />
                </Form.Item>
              </div>
            </div>
          ),
        },
      ]}
    />
    </>
  );
}
