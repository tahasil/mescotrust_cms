"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, message, Spin } from "antd";

/**
 * Edit form for Subscribe — single source for load/save. Used in component edit page or drawer.
 * All Subscribe data is loaded and saved only from here. Exposes update() via ref.
 * onDataLoad(data) — called with loaded data so parent can show preview.
 * onSuccess(payload) — called with saved payload after save so parent can update preview.
 */
function SubscribeEditForm({ onSuccess, onDataLoad }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    setLoading(true);
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
  }, []);

  // Apply DB values to form when initialData is ready (initialValues alone don't reliably update after async load)
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  const handleUpdate = () => {
    console.log("[Subscribe] Save clicked — data flow:");
    return form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        subscribeSubtitle: String(values.subscribeSubtitle ?? "").trim(),
        subscribeTitle: String(values.subscribeTitle ?? "").trim(),
        subscribePlaceholder: String(values.subscribePlaceholder ?? "").trim(),
        subscribeButtonText: String(values.subscribeButtonText ?? "").trim(),
        subscribeBgUrl: String(values.subscribeBgUrl ?? "").trim(),
      };
      console.log("[Subscribe 1] Form → payload (sending to API)", payload);
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
          if (savedTheme && (savedTheme.subscribeSubtitle !== undefined || savedTheme.subscribeTitle !== undefined)) {
            console.log("[Subscribe] API returned saved theme (subscribe fields):", {
              subscribeSubtitle: savedTheme.subscribeSubtitle,
              subscribeTitle: savedTheme.subscribeTitle,
            });
          }
          console.log("[Subscribe 2] API responded OK — data saved to DB. Check server terminal for API → DB logs.");
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
