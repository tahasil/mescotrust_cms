"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/SectionIntro";
const PREFIX = "sectionIntro";

/**
 * Edit form for SectionIntro — used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function SectionIntroEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? "Section Title",
        subTitle: data.subTitle ?? "Subtitle",
        titleColorKey: data.titleColorKey ?? "",
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
        sectionIntroParagraph: data?.sectionIntroParagraph != null ? String(data.sectionIntroParagraph) : "",
      });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          mainTitle: (data && data.mainTitle) ?? "Section Title",
          subTitle: (data && data.subTitle) ?? "Subtitle",
          titleColorKey: (data && data.titleColorKey) ?? "",
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
          sectionIntroParagraph: data?.sectionIntroParagraph != null ? String(data.sectionIntroParagraph) : "",
        });
      })
      .catch(() => message.error("Failed to load SectionIntro"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        sectionIntroParagraph: values.sectionIntroParagraph != null ? String(values.sectionIntroParagraph).trim() : "",
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
          message.success("Section Intro saved");
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("SectionIntro")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="sectionIntroParagraph" label="Paragraph / Description">
                  <Input.TextArea rows={4} placeholder="Enter paragraph/description text" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SectionIntroEditForm);
