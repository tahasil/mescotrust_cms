"use client";

import { Form, Input, Select, Switch, Collapse, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { normalizeSectionId } from "@/lib/manageSectionFields";

const REQUIRED_SECTION_BG_WIDTH = 1440;
const REQUIRED_SECTION_BG_HEIGHT = 620;
const REQUIRED_SECTION_BG_TEXT =
  `${REQUIRED_SECTION_BG_WIDTH} \u00D7 ${REQUIRED_SECTION_BG_HEIGHT} px`;

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateDefaultSectionBackgroundImage(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width === REQUIRED_SECTION_BG_WIDTH && height === REQUIRED_SECTION_BG_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Background must be exactly ${REQUIRED_SECTION_BG_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate background size. Please select an image of ${REQUIRED_SECTION_BG_TEXT}.`,
      ),
    );
  }
}

/**
 * Shared "Manage Section" UI: Fluid Container + Box Container (background, padding, margin).
 * Use in any site component EditForm. Pass prefix (e.g. "testimonials", "homeHero") and form/themeColorOptions.
 */
export default function ManageSectionFields({
  prefix,
  form,
  themeColorOptions = [],
  sectionBgImageFieldLabel = "Background",
  sectionBgImageHintText = `Required size: ${REQUIRED_SECTION_BG_TEXT}`,
  sectionBgImageRules,
  sectionBgImageValidateTrigger,
}) {
  const sectionBgType = (Form.useWatch(prefix + "SectionBgType", form) || "default");
  const pageContainerBgType = (Form.useWatch(prefix + "PageContainerBgType", form) || "default");
  const resolvedSectionBgImageRules =
    Array.isArray(sectionBgImageRules) && sectionBgImageRules.length > 0
      ? sectionBgImageRules
      : [{ validator: validateDefaultSectionBackgroundImage }];
  const resolvedSectionBgImageValidateTrigger =
    sectionBgImageValidateTrigger || ["onChange", "onBlur"];

  return (
    <>
      <Form.Item
        name={prefix + "SectionId"}
        label="Section ID"
        tooltip="Unique anchor name for linking directly to this section. Use it in a button URL as #our-works on the same page or /page#our-works from another page."
        normalize={normalizeSectionId}
        rules={[
          {
            validator: (_, value) => {
              const sectionId = normalizeSectionId(value);
              if (!sectionId || /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(sectionId)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Use only letters, numbers, hyphens, or underscores."),
              );
            },
          },
        ]}
        extra="Enter without #. Keep this ID unique on the page."
        style={{ marginBottom: 12 }}
      >
        <Input placeholder="e.g. our-works" size="large" allowClear />
      </Form.Item>
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
                  label={sectionBgImageFieldLabel}
                  tooltip="Enter the full URL or path to the background image."
                  validateTrigger={resolvedSectionBgImageValidateTrigger}
                  rules={resolvedSectionBgImageRules}
                  extra={
                    sectionBgImageHintText ? (
                      <span
                        style={{
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: "rgba(0,0,0,0.45)",
                        }}
                      >
                        {sectionBgImageHintText}
                      </span>
                    ) : undefined
                  }
                  style={{ marginBottom: 12 }}
                >
                  <MediaPickerInput
                    placeholder="e.g. /media/..."
                  />
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
