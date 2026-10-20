"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Collapse, Form, Input, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/LeaveusamessageModal";
const PREFIX = "leaveusamessageModal";

function LeaveusamessageModalEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: suppliedColors = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(suppliedColors);
  const fetchedRef = useRef(false);
  const isPageBlock = source === "page";

  const applyValues = (data = {}) => {
    form.setFieldsValue({
      mainTitle: data.mainTitle ?? "Leave us a *message*",
      subTitle: data.subTitle ?? "Get In Touch",
      triggerButtonText: data.triggerButtonText ?? "Leave a Message",
      titleColorKey: data.titleColorKey ?? "",
      subTitleColorKey: data.subTitleColorKey ?? "",
      titleHighlightColorKey: data.titleHighlightColorKey ?? "",
      buttonBgColorKey: data.buttonBgColorKey ?? "",
      buttonTextColorKey: data.buttonTextColorKey ?? "",
      ...getManageSectionInitialValues(PREFIX, data, "center"),
    });
  };

  const applyColors = (theme = {}) => {
    const palette = theme.themePalette || {};
    const custom = Array.isArray(theme.colors) ? theme.colors : [];
    const names = [
      ...new Set([
        ...Object.keys(palette),
        ...custom.map((item) => item?.name).filter(Boolean),
      ]),
    ].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  };

  useEffect(() => {
    if (suppliedColors.length) setThemeColorOptions(suppliedColors);
  }, [suppliedColors]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp || {});
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : {}))
          .then(applyColors)
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([data, theme]) => {
        applyValues(data);
        applyColors(theme);
      })
      .catch(() => message.error("Failed to load Leave a Message Modal"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);

  const payloadFrom = (values) => ({
    mainTitle: String(values.mainTitle || "").trim(),
    subTitle: String(values.subTitle || "").trim(),
    triggerButtonText: String(values.triggerButtonText || "").trim(),
    titleColorKey: String(values.titleColorKey || "").trim(),
    subTitleColorKey: String(values.subTitleColorKey || "").trim(),
    titleHighlightColorKey: String(values.titleHighlightColorKey || "").trim(),
    buttonBgColorKey: String(values.buttonBgColorKey || "").trim(),
    buttonTextColorKey: String(values.buttonTextColorKey || "").trim(),
    ...getManageSectionPayload(PREFIX, values),
  });

  const handleUpdate = () =>
    form
      .validateFields()
      .then(() => {
        const payload = payloadFrom(form.getFieldsValue(true));
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
          .then((r) => (r.ok ? undefined : r.json().then((d) => Promise.reject(d))))
          .then(() => {
            message.success("Saved successfully");
            onSuccess?.();
          })
          .catch((error) => message.error(error?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading || saving) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "section",
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
            key: "titles",
            label: "Titles & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("LeaveusamessageModal")}
              />
            ),
          },
          {
            key: "content",
            label: "Button & Action",
            children: (
              <Form.Item name="triggerButtonText" label="Trigger Button Text">
                <Input placeholder="Leave a Message" />
              </Form.Item>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(LeaveusamessageModalEditForm);
