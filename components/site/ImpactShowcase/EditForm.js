"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/ImpactShowcase";
const PREFIX = "impactShowcase";

/**
 * Edit form for ImpactShowcase — used in component edit drawer.
 * Title & Colors: titles, button text/links/icons, button colors (bg + text for both buttons).
 * Content: only images (left + right).
 */
function ImpactShowcaseEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  function applyFormValues(data) {
    form.setFieldsValue({
      impactShowcaseLeftImage: data?.impactShowcaseLeftImage != null ? String(data.impactShowcaseLeftImage).trim() : "/images/about-mesco-1.png",
      impactShowcaseRightImage: data?.impactShowcaseRightImage != null ? String(data.impactShowcaseRightImage).trim() : "/images/about-mesco-2.png",
      impactShowcaseButton1Text: data?.impactShowcaseButton1Text != null ? String(data.impactShowcaseButton1Text).trim() : "Contact Us",
      impactShowcaseButton1Link: data?.impactShowcaseButton1Link != null ? String(data.impactShowcaseButton1Link).trim() : "/",
      impactShowcaseButton1IconUrl: data?.impactShowcaseButton1IconUrl != null ? String(data.impactShowcaseButton1IconUrl).trim() : "",
      impactShowcaseButton2Text: data?.impactShowcaseButton2Text != null ? String(data.impactShowcaseButton2Text).trim() : "Volunteer",
      impactShowcaseButton2Link: data?.impactShowcaseButton2Link != null ? String(data.impactShowcaseButton2Link).trim() : "/",
      impactShowcaseButton2IconUrl: data?.impactShowcaseButton2IconUrl != null ? String(data.impactShowcaseButton2IconUrl).trim() : "/images/volunteer-icon.svg",
      impactShowcaseButton1BgColorKey: data?.impactShowcaseButton1BgColorKey != null ? String(data.impactShowcaseButton1BgColorKey).trim() : "",
      impactShowcaseButton1TextColorKey: data?.impactShowcaseButton1TextColorKey != null ? String(data.impactShowcaseButton1TextColorKey).trim() : "",
      impactShowcaseButton2BgColorKey: data?.impactShowcaseButton2BgColorKey != null ? String(data.impactShowcaseButton2BgColorKey).trim() : "",
      impactShowcaseButton2TextColorKey: data?.impactShowcaseButton2TextColorKey != null ? String(data.impactShowcaseButton2TextColorKey).trim() : "",
      ...getManageSectionInitialValues(PREFIX, data),
    });
  }

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
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
      .then(([data, theme]) => {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        applyFormValues(data);
      })
      .catch(() => message.error("Failed to load ImpactShowcase"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        impactShowcaseLeftImage: values.impactShowcaseLeftImage != null ? String(values.impactShowcaseLeftImage).trim() : "",
        impactShowcaseRightImage: values.impactShowcaseRightImage != null ? String(values.impactShowcaseRightImage).trim() : "",
        impactShowcaseButton1Text: values.impactShowcaseButton1Text != null ? String(values.impactShowcaseButton1Text).trim() : "",
        impactShowcaseButton1Link: values.impactShowcaseButton1Link != null ? String(values.impactShowcaseButton1Link).trim() : "/",
        impactShowcaseButton1IconUrl: values.impactShowcaseButton1IconUrl != null ? String(values.impactShowcaseButton1IconUrl).trim() : "",
        impactShowcaseButton2Text: values.impactShowcaseButton2Text != null ? String(values.impactShowcaseButton2Text).trim() : "",
        impactShowcaseButton2Link: values.impactShowcaseButton2Link != null ? String(values.impactShowcaseButton2Link).trim() : "/",
        impactShowcaseButton2IconUrl: values.impactShowcaseButton2IconUrl != null ? String(values.impactShowcaseButton2IconUrl).trim() : "",
        impactShowcaseButton1BgColorKey: values.impactShowcaseButton1BgColorKey != null ? String(values.impactShowcaseButton1BgColorKey).trim() : "",
        impactShowcaseButton1TextColorKey: values.impactShowcaseButton1TextColorKey != null ? String(values.impactShowcaseButton1TextColorKey).trim() : "",
        impactShowcaseButton2BgColorKey: values.impactShowcaseButton2BgColorKey != null ? String(values.impactShowcaseButton2BgColorKey).trim() : "",
        impactShowcaseButton2TextColorKey: values.impactShowcaseButton2TextColorKey != null ? String(values.impactShowcaseButton2TextColorKey).trim() : "",
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
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Impact Showcase saved");
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
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ImpactShowcase")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="impactShowcaseLeftImage" label="Left Image URL">
                  <MediaPickerInput placeholder="/images/about-mesco-1.png" />
                </Form.Item>
                <Form.Item name="impactShowcaseRightImage" label="Right Image URL">
                  <MediaPickerInput placeholder="/images/about-mesco-2.png" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ImpactShowcaseEditForm);
