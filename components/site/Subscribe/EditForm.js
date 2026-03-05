"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, message, Spin } from "antd";

/**
 * Edit form for Subscribe — used in component edit page or page builder drawer.
 * When source="page": data from block.props (pages collection); save updates layout only, not components collection.
 * onDataLoad(data) — called with loaded data so parent can show preview.
 * onSuccess(payload) — called with saved payload after save so parent can update preview.
 */
function SubscribeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onDataLoad }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const normalized = {
        subscribeSubtitle: data?.subscribeSubtitle != null ? String(data.subscribeSubtitle).trim() : "",
        subscribeTitle: data?.subscribeTitle != null ? String(data.subscribeTitle).trim() : "",
        subscribePlaceholder: data?.subscribePlaceholder != null ? String(data.subscribePlaceholder).trim() : "",
        subscribeButtonText: data?.subscribeButtonText != null ? String(data.subscribeButtonText).trim() : "",
        subscribeBgUrl: data?.subscribeBgUrl != null ? String(data.subscribeBgUrl).trim() : "",
      };
      setInitialData(normalized);
      onDataLoad?.(normalized);
      setLoading(false);
      return;
    }
    setInitialData(null);
    fetch("/api/theme/subscribe", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const normalized = {
          subscribeSubtitle: data?.subscribeSubtitle != null ? String(data.subscribeSubtitle).trim() : "",
          subscribeTitle: data?.subscribeTitle != null ? String(data.subscribeTitle).trim() : "",
          subscribePlaceholder: data?.subscribePlaceholder != null ? String(data.subscribePlaceholder).trim() : "",
          subscribeButtonText: data?.subscribeButtonText != null ? String(data.subscribeButtonText).trim() : "",
          subscribeBgUrl: data?.subscribeBgUrl != null ? String(data.subscribeBgUrl).trim() : "",
        };
        setInitialData(normalized);
        onDataLoad?.(normalized);
      })
      .catch(() => message.error("Failed to load Subscribe"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  // Apply DB values to form when initialData is ready (initialValues alone don't reliably update after async load)
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  const handleUpdate = () => {
    return form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        subscribeSubtitle: String(values.subscribeSubtitle ?? "").trim(),
        subscribeTitle: String(values.subscribeTitle ?? "").trim(),
        subscribePlaceholder: String(values.subscribePlaceholder ?? "").trim(),
        subscribeButtonText: String(values.subscribeButtonText ?? "").trim(),
        subscribeBgUrl: String(values.subscribeBgUrl ?? "").trim(),
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

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  // Field names must match ThemeConfig / SUBSCRIBE_KEYS — all saved to and loaded from DB (themeconfigs).
  const subscribeFields = [
    {
      name: "subscribeSubtitle",
      label: "Subtitle",
      placeholder: "Subtitle",
      span: 8,
    },
    {
      name: "subscribePlaceholder",
      label: "Email placeholder",
      placeholder: "Placeholder",
      span: 8,
    },
    { name: "subscribeTitle", label: "Title", placeholder: "Title", span: 8 },
    {
      name: "subscribeButtonText",
      label: "Button text",
      placeholder: "Button text",
      span: 8,
    },
    {
      name: "subscribeBgUrl",
      label: "Background image URL",
      placeholder: "URL",
      span: 8,
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialData}
      key="subscribe-edit-form"
    >
      <Row gutter={[16, 16]}>
        {subscribeFields.map(
          ({ name, label, placeholder, span, ...restField }) => (
            <Col key={name} xs={24} md={span}>
              <Form.Item {...restField} name={name} label={label}>
                <Input placeholder={placeholder} size="large" />
              </Form.Item>
            </Col>
          ),
        )}
      </Row>
    </Form>
  );
}

export default forwardRef(SubscribeEditForm);
