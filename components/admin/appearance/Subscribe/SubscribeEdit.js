"use client";

import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, Select, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/appearance/local/ManageSectionFormFields";
import TitleAndColorsSection from "@/components/admin/appearance/local/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/appearance/local/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/components/admin/appearance/local/manageSectionData";
import { getTitleAndColorsConfigFromMap } from "@/components/admin/appearance/local/titleAndColorsConfig";
import { buildThemeColorOptions } from "@/lib/themeColors";

function normalizeTitleFieldValue(field, value) {
  const type = String(field?.type || "input").trim().toLowerCase();
  if (type === "switch") return value === true;
  const text = value != null ? String(value).trim() : "";
  if (type === "select") {
    if (text) return text;
    return field?.defaultValue != null ? String(field.defaultValue).trim() : "";
  }
  return text;
}

function buildTitleAndColorFormValues(data, titleListItems, colorListItems) {
  const source = data && typeof data === "object" ? data : {};
  const out = {};

  (Array.isArray(titleListItems) ? titleListItems : []).forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;
    out[name] = normalizeTitleFieldValue(item, source[name]);
  });

  (Array.isArray(colorListItems) ? colorListItems : []).forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;
    out[name] = source[name] != null ? String(source[name]).trim() : "";
  });

  return out;
}

function buildTitleAndColorPayload(values, titleListItems, colorListItems) {
  const source = values && typeof values === "object" ? values : {};
  const out = {};

  (Array.isArray(titleListItems) ? titleListItems : []).forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;
    const type = String(item?.type || "input").trim().toLowerCase();
    if (type === "switch") {
      out[name] = source[name] === true;
      return;
    }
    const text = source[name] != null ? String(source[name]).trim() : "";
    if (type === "select") {
      out[name] = text || (item?.defaultValue != null ? String(item.defaultValue).trim() : "");
      return;
    }
    out[name] = text;
  });

  (Array.isArray(colorListItems) ? colorListItems : []).forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;
    out[name] = source[name] != null ? String(source[name]).trim() : "";
  });

  return out;
}

/**
 * Edit form for Subscribe — used in component edit page or page builder drawer.
 * When source="page": data from block.props (pages collection); save updates layout only.
 * Theme colors: same pattern as HomeHero — Select from theme palette.
 */
function SubscribeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onDataLoad, themeColorOptions: themeColorOptionsProp = [], titleAndColorsConfigMap = null }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const titleAndColorsConfig = useMemo(
    () => getTitleAndColorsConfigFromMap("Subscribe", titleAndColorsConfigMap),
    [titleAndColorsConfigMap],
  );
  const titleListItems = useMemo(
    () =>
      Array.isArray(titleAndColorsConfig?.titleListItems)
        ? titleAndColorsConfig.titleListItems
        : [],
    [titleAndColorsConfig],
  );
  const colorListItems = useMemo(
    () =>
      Array.isArray(titleAndColorsConfig?.colorListItems)
        ? titleAndColorsConfig.colorListItems
        : [],
    [titleAndColorsConfig],
  );
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    const normalize = (data) => ({
      subscribeSubtitle: data?.subscribeSubtitle != null ? String(data.subscribeSubtitle).trim() : "",
      subscribeTitle: data?.subscribeTitle != null ? String(data.subscribeTitle).trim() : "",
      subscribePlaceholder: data?.subscribePlaceholder != null ? String(data.subscribePlaceholder).trim() : "",
      subscribeButtonText: data?.subscribeButtonText != null ? String(data.subscribeButtonText).trim() : "",
      subscribeBgDesktop:
        data?.subscribeBgDesktop != null
          ? String(data.subscribeBgDesktop).trim()
          : data?.subscribeBgUrl != null
            ? String(data.subscribeBgUrl).trim()
            : "",
      subscribeBgMobile:
        data?.subscribeBgMobile != null ? String(data.subscribeBgMobile).trim() : "",
      subscribeBgUrl:
        data?.subscribeBgDesktop != null
          ? String(data.subscribeBgDesktop).trim()
          : data?.subscribeBgUrl != null
            ? String(data.subscribeBgUrl).trim()
            : "",
      ...buildTitleAndColorFormValues(data, titleListItems, colorListItems),
      ...getManageSectionInitialValues("subscribe", data),
    });

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const normalized = normalize(data);
      setInitialData(normalized);
      onDataLoad?.(normalized);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            setThemeColorOptions(buildThemeColorOptions(theme));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    setInitialData(null);
    Promise.all([
      fetch("/api/theme/subscribe", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const normalized = normalize(data);
        setInitialData(normalized);
        onDataLoad?.(normalized);
        setThemeColorOptions(buildThemeColorOptions(theme));
      })
      .catch(() => message.error("Failed to load Subscribe"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp, onDataLoad, titleListItems, colorListItems]);

  useEffect(() => {
    if (initialData) form.setFieldsValue(initialData);
  }, [initialData, form]);

  const handleUpdate = () => {
    return form.validateFields().then(() => {
      const values = form.getFieldsValue();
      const payload = {
        subscribeSubtitle: String(values.subscribeSubtitle ?? "").trim(),
        subscribeTitle: String(values.subscribeTitle ?? "").trim(),
        subscribePlaceholder: String(values.subscribePlaceholder ?? "").trim(),
        subscribeButtonText: String(values.subscribeButtonText ?? "").trim(),
        subscribeBgDesktop:
          values.subscribeBgDesktop != null
            ? String(values.subscribeBgDesktop).trim()
            : values.subscribeBgUrl != null
              ? String(values.subscribeBgUrl).trim()
              : "",
        subscribeBgMobile:
          values.subscribeBgMobile != null
            ? String(values.subscribeBgMobile).trim()
            : "",
        subscribeBgUrl:
          values.subscribeBgDesktop != null
            ? String(values.subscribeBgDesktop).trim()
            : values.subscribeBgUrl != null
              ? String(values.subscribeBgUrl).trim()
              : "",
        ...buildTitleAndColorPayload(values, titleListItems, colorListItems),
        ...getManageSectionPayload("subscribe", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.(payload);
        return;
      }
      setSaving(true);
      return fetch("/api/theme/subscribe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d?.error || d));
          return res.json();
        })
        .then((savedTheme) => {
          message.success("Subscribe saved");
          onSuccess?.(savedTheme || payload);
        })
        .catch((err) => {
          message.error(err?.error || "Failed to save Subscribe");
          throw err;
        })
        .finally(() => setSaving(false));
    });
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" initialValues={initialData} key="subscribe-edit-form">
      <Collapse
        defaultActiveKey={[]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="subscribe" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...titleAndColorsConfig} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="subscribePlaceholder" label="Email placeholder">
                    <Input placeholder="e.g. Enter email address" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeButtonText" label="Button text">
                    <Input placeholder="e.g. Subscribe" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeBgDesktop" label="Desktop Background Image">
                    <MediaPickerInput
                      placeholder="/uploads/..."
                      uiVariant="stacked"
                      hintText="Recommended for desktop/tablet"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeBgMobile" label="Mobile Background Image">
                    <MediaPickerInput
                      placeholder="/uploads/..."
                      uiVariant="stacked"
                      hintText="Optional. Desktop image will be used if empty."
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SubscribeEditForm);


