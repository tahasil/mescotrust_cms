"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Collapse, Form, Input, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  buildShortcodeFromSelection,
  normalizeShortcodeText,
  parseShortcodeInput,
} from "@/lib/shortcode";

const API_PATH = "/api/theme/ShortCode";
const PREFIX = "shortCode";
const SHORTCODE_HELP_TEXT = 'Use format: [shortcode="Subscribe"]';

function getLegacySelectedValue(input = {}) {
  const sourceType = normalizeShortcodeText(input?.shortCodeSourceType).toLowerCase();
  if (sourceType === "form") {
    return normalizeShortcodeText(input?.shortCodeSelectedForm).toLowerCase();
  }
  if (sourceType === "slider") {
    return normalizeShortcodeText(input?.shortCodeSelectedSlider);
  }
  if (sourceType === "popup") {
    return normalizeShortcodeText(input?.shortCodeSelectedPopup);
  }
  if (sourceType === "component") {
    return normalizeShortcodeText(input?.shortCodeSelectedComponent);
  }
  return "";
}

function normalizeConfiguredShortcode(input = {}) {
  const raw =
    normalizeShortcodeText(input?.shortcode || input?.shortCode || input?.shortCodeRaw) ||
    buildShortcodeFromSelection("shortcode", getLegacySelectedValue(input));
  const parsed = parseShortcodeInput(raw);
  if (parsed.targetKey) return parsed.normalized;
  return raw;
}

function normalizeInitialValues(data = {}) {
  const input = data && typeof data === "object" ? data : {};
  return {
    mainTitle: input.mainTitle ?? "Section Title",
    subTitle: input.subTitle ?? "Subtitle",
    shortCodeTitleEnabled: input.shortCodeTitleEnabled !== false,
    shortCodeSubTitleEnabled: input.shortCodeSubTitleEnabled !== false,
    shortCodeSubTitleColorKey: input.shortCodeSubTitleColorKey ?? "",
    shortCodeMainTitleColorKey: input.shortCodeMainTitleColorKey ?? "",
    shortCodeCardBgColorKey: input.shortCodeCardBgColorKey ?? "",
    shortCodeCardTextColorKey: input.shortCodeCardTextColorKey ?? "",
    shortCodeCardBorderColorKey: input.shortCodeCardBorderColorKey ?? "",
    shortcode: normalizeConfiguredShortcode(input),
    ...getManageSectionInitialValues(PREFIX, input),
  };
}

/**
 * Edit form for ShortCode - used in component edit drawer.
 * Includes Manage Section and Title & Colors.
 * Content accepts a single shortcode field in [shortcode="ComponentName"] format.
 */
function ShortCodeEditForm(
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
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...custom.map((entry) => entry?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      form.setFieldsValue(normalizeInitialValues(initialDataProp ?? {}));
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue(normalizeInitialValues(data));
      })
      .catch(() => message.error("Failed to load ShortCode"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const parsedShortcode = parseShortcodeInput(values.shortcode);
        const shortcode = parsedShortcode.isValidFormat
          ? parsedShortcode.normalized
          : "";

        if (normalizeShortcodeText(values.shortcode) && !parsedShortcode.isValidFormat) {
          message.error(SHORTCODE_HELP_TEXT);
          return;
        }

        const payload = {
          ...values,
          mainTitle: normalizeShortcodeText(values.mainTitle || "Section Title"),
          subTitle: normalizeShortcodeText(values.subTitle || "Subtitle"),
          shortcode,
          shortCodeTitleEnabled: values.shortCodeTitleEnabled !== false,
          shortCodeSubTitleEnabled: values.shortCodeSubTitleEnabled !== false,
          shortCodeSubTitleColorKey: normalizeShortcodeText(values.shortCodeSubTitleColorKey),
          shortCodeMainTitleColorKey: normalizeShortcodeText(values.shortCodeMainTitleColorKey),
          shortCodeCardBgColorKey: normalizeShortcodeText(values.shortCodeCardBgColorKey),
          shortCodeCardTextColorKey: normalizeShortcodeText(values.shortCodeCardTextColorKey),
          shortCodeCardBorderColorKey: normalizeShortcodeText(values.shortCodeCardBorderColorKey),
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
            if (!res.ok) return res.json().then((data) => Promise.reject(data));
            return null;
          })
          .then(() => {
            message.success("Short Code saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content"]}
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
            label: "Title & Colors",
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
              <Form.Item
                name="shortcode"
                label="Shortcode"
                extra={<span style={{ fontSize: 12 }}>{SHORTCODE_HELP_TEXT}</span>}
                rules={[
                  {
                    validator: (_, value) => {
                      const clean = normalizeShortcodeText(value);
                      if (!clean) return Promise.resolve();
                      const parsed = parseShortcodeInput(clean);
                      if (parsed.isValidFormat) return Promise.resolve();
                      return Promise.reject(new Error(SHORTCODE_HELP_TEXT));
                    },
                  },
                ]}
              >
                <Input placeholder='[shortcode="Subscribe"]' />
              </Form.Item>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ShortCodeEditForm);
