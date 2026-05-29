"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse, Select } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

const API_PATH = "/api/theme/CallToActionBanner";
const PREFIX = "callToActionBanner";
const DEFAULT_MAIN_TITLE = "If you would like to get involved, we will be happy to help.";
const DEFAULT_SUB_TITLE = "";
const DEFAULT_BUTTON_TEXT = "Apply Now";

function normalizeCtaButtonTarget(value) {
  return normalizeLinkTarget(value, "_self");
}
function getTitleColorsConfig() {
  return {
    ...getTitleAndColorsConfig("CallToActionBanner"),
    titleListItems: [],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for banner title" },
      { name: "subTitleColorKey", label: "Sub title color", tooltip: "Theme color for subtitle" },
      { name: "ctaButtonBgColorKey", label: "Apply button background", tooltip: "Theme color for Apply button background" },
      { name: "ctaButtonTextColorKey", label: "Apply button text", tooltip: "Theme color for Apply button text" },
      { name: "ctaButtonHoverBgColorKey", label: "Apply button hover background", tooltip: "Theme color for Apply button hover background" },
      { name: "ctaButtonHoverTextColorKey", label: "Apply button hover text", tooltip: "Theme color for Apply button hover text" },
      { name: "ctaButtonBorderColorKey", label: "Apply button border", tooltip: "Theme color for Apply button border" },
    ],
  };
}

/**
 * Edit form for CallToActionBanner — used in component edit drawer.
 * Includes Manage Section (background/padding) and Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function CallToActionBannerEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette =
          theme?.themePalette && typeof theme.themePalette === "object"
            ? theme.themePalette
            : {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? DEFAULT_MAIN_TITLE,
        subTitle: data.subTitle ?? DEFAULT_SUB_TITLE,
        titleAlign: data.titleAlign ?? "left",
        ctaButtonText: data.ctaButtonText ?? DEFAULT_BUTTON_TEXT,
        ctaButtonLink: ensureMailto(data.ctaButtonLink ?? "#"),
        ctaButtonTarget: normalizeCtaButtonTarget(
          data.ctaButtonTarget ?? data.ctaButtonNewTab,
        ),
        ctaRightImage: data.ctaRightImage ?? "",
        ctaRightImageMobile: data.ctaRightImageMobile ?? "",
        ctaRightImageAlt: data.ctaRightImageAlt ?? "CTA image",
        titleColorKey: data.titleColorKey ?? "",
        subTitleColorKey: data.subTitleColorKey ?? "",
        ctaButtonBgColorKey: data.ctaButtonBgColorKey ?? "",
        ctaButtonTextColorKey: data.ctaButtonTextColorKey ?? "",
        ctaButtonHoverBgColorKey: data.ctaButtonHoverBgColorKey ?? "",
        ctaButtonHoverTextColorKey: data.ctaButtonHoverTextColorKey ?? "",
        ctaButtonBorderColorKey: data.ctaButtonBorderColorKey ?? "",
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
      });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          mainTitle: (data && data.mainTitle) ?? DEFAULT_MAIN_TITLE,
          subTitle: (data && data.subTitle) ?? DEFAULT_SUB_TITLE,
          titleAlign: (data && data.titleAlign) ?? "left",
          ctaButtonText: (data && data.ctaButtonText) ?? DEFAULT_BUTTON_TEXT,
          ctaButtonLink: ensureMailto((data && data.ctaButtonLink) ?? "#"),
          ctaButtonTarget: normalizeCtaButtonTarget(
            data?.ctaButtonTarget ?? data?.ctaButtonNewTab,
          ),
          ctaRightImage: (data && data.ctaRightImage) ?? "",
          ctaRightImageMobile: (data && data.ctaRightImageMobile) ?? "",
          ctaRightImageAlt: (data && data.ctaRightImageAlt) ?? "CTA image",
          titleColorKey: (data && data.titleColorKey) ?? "",
          subTitleColorKey: (data && data.subTitleColorKey) ?? "",
          ctaButtonBgColorKey: (data && data.ctaButtonBgColorKey) ?? "",
          ctaButtonTextColorKey: (data && data.ctaButtonTextColorKey) ?? "",
          ctaButtonHoverBgColorKey:
            (data && data.ctaButtonHoverBgColorKey) ?? "",
          ctaButtonHoverTextColorKey:
            (data && data.ctaButtonHoverTextColorKey) ?? "",
          ctaButtonBorderColorKey: (data && data.ctaButtonBorderColorKey) ?? "",
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
        });
      })
      .catch(() => message.error("Failed to load CallToActionBanner"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        ctaButtonTarget: normalizeCtaButtonTarget(values?.ctaButtonTarget),
        ctaButtonLink: ensureMailto(values?.ctaButtonLink ?? "#"),
        ctaButtonNewTab: normalizeCtaButtonTarget(values?.ctaButtonTarget) === "_blank",
        ctaShowRightImage: true,
        ...getManageSectionPayload(PREFIX, values),
      };
      delete payload.ctaRightImageWidth;
      delete payload.ctaButtonBorderRadius;
      delete payload.ctaButtonFontSize;
      delete payload.ctaButtonPaddingX;
      delete payload.ctaButtonPaddingY;
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
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Call To Action Banner saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
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
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleColorsConfig()} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="subTitle" label="Subtitle">
                  <Input placeholder="Subtitle" />
                </Form.Item>
                <Form.Item name="mainTitle" label="Main title">
                  <Input placeholder={DEFAULT_MAIN_TITLE} />
                </Form.Item>
                <Form.Item name="titleAlign" label="Align">
                  <Select
                    options={[
                      { label: "Left", value: "left" },
                      { label: "Center", value: "center" },
                      { label: "Right", value: "right" },
                    ]}
                    placeholder="Select align"
                  />
                </Form.Item>
                <Form.Item name="ctaButtonText" label="Apply button text">
                  <Input placeholder={DEFAULT_BUTTON_TEXT} />
                </Form.Item>
                <Form.Item name="ctaButtonLink" label="Apply button link">
                  <Input placeholder="e.g. /contact-us" />
                </Form.Item>
                <Form.Item name="ctaButtonTarget" label="Target">
                  <Select
                    size="large"
                    options={[
                      { label: "Same tab (_self)", value: "_self" },
                      { label: "New tab (_blank)", value: "_blank" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="ctaRightImage"
                  label="Desktop Image"
                  tooltip="Recommended transparent PNG/SVG."
                >
                  <MediaPickerInput
                    placeholder="Select desktop image"
                    hintText="Recommended Size: 420 x 420 px"
                  />
                </Form.Item>
                <Form.Item
                  name="ctaRightImageMobile"
                  label="Mobile Image"
                  tooltip="Optional mobile-specific image."
                >
                  <MediaPickerInput
                    placeholder="Select mobile image"
                    hintText="Recommended Size: 240 x 240 px"
                  />
                </Form.Item>
                <Form.Item name="ctaRightImageAlt" label="Image Alt Text">
                  <Input placeholder="CTA image" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(CallToActionBannerEditForm);
