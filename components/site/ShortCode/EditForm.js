"use client";

import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Collapse, Form, Input, Select, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/ShortCode";
const PREFIX = "shortCode";
const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];
const DEFAULTS = {
  shortCodeTitleAlign: "left",
  shortCodeTitle: "Section Title",
  shortCodeSubTitle: "",
};

function trimValue(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function trimOptionalValue(value, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}

function normalizeAlign(value, fallback = "left") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function buildThemeColorOptions(theme = {}) {
  const palette =
    theme?.themePalette && typeof theme.themePalette === "object"
      ? theme.themePalette
      : {};
  const names = Object.keys(palette).sort();
  return names.map((name) => ({ label: name, value: name }));
}

function applyFormValues(form, data = {}) {
  const colorConfig = getTitleAndColorsConfig("ShortCode");
  const colorItems = Array.isArray(colorConfig?.colorListItems)
    ? colorConfig.colorListItems
    : [];

  const colorFieldValues = {};
  colorItems.forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    colorFieldValues[fieldName] = trimValue(data[fieldName], "");
  });

  form.setFieldsValue({
    ...getManageSectionInitialValues(PREFIX, data),
    shortCodeTitleAlign: normalizeAlign(
      data?.shortCodeTitleAlign,
      DEFAULTS.shortCodeTitleAlign,
    ),
    shortCodeTitle: trimOptionalValue(
      data?.shortCodeTitle,
      DEFAULTS.shortCodeTitle,
    ),
    shortCodeSubTitle: trimValue(
      data?.shortCodeSubTitle,
      DEFAULTS.shortCodeSubTitle,
    ),
    shortCodeContent: trimValue(data?.shortCodeContent, ""),
    ...colorFieldValues,
  });
}

function ShortCodeEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onCancel,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => setThemeColorOptions(buildThemeColorOptions(theme)))
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyFormValues(form, initialDataProp ?? {});
      setLoading(false);
      return;
    }

    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => applyFormValues(form, data || {}))
      .catch(() => message.error("Failed to load ShortCode component"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          shortCodeTitleAlign: normalizeAlign(
            values?.shortCodeTitleAlign,
            DEFAULTS.shortCodeTitleAlign,
          ),
          shortCodeTitle: trimOptionalValue(
            values?.shortCodeTitle,
            "",
          ),
          shortCodeSubTitle: trimValue(
            values?.shortCodeSubTitle,
            DEFAULTS.shortCodeSubTitle,
          ),
          shortCodeContent: trimValue(values?.shortCodeContent, ""),
        };

        const colorConfig = getTitleAndColorsConfig("ShortCode");
        const colorItems = Array.isArray(colorConfig?.colorListItems)
          ? colorConfig.colorListItems
          : [];
        colorItems.forEach((item) => {
          const fieldName = item?.name;
          if (!fieldName) return;
          payload[fieldName] = trimValue(values[fieldName], "");
        });

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
            return null;
          })
          .then(() => {
            message.success("ShortCode component saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
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
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={[]}
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
            key: "title-colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("ShortCode")}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Form.Item
                  name="shortCodeTitleAlign"
                  label="Align"
                  rules={[{ required: true, message: "Align is required" }]}
                >
                  <Select
                    options={ALIGN_OPTIONS}
                    placeholder="Select align"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="shortCodeTitle"
                  label="Title"
                >
                  <Input placeholder="Section Title" size="large" />
                </Form.Item>

                <Form.Item
                  name="shortCodeSubTitle"
                  label="Sub Title"
                >
                  <Input placeholder="Sub Title" size="large" />
                </Form.Item>

                <Form.Item
                  name="shortCodeContent"
                  label="Short Codes"
                >
                  <Input.TextArea
                    rows={10}
                    placeholder={'[component id="NewsFeedSlider"]\n[form id="form-1"]'}
                  />
                </Form.Item>
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ShortCodeEditForm);
