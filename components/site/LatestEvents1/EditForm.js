"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, message, Spin } from "antd";

const API_PATH = "/api/theme/LatestEvents1";

/**
 * Edit form for LatestEvents1 — used in component edit drawer (same pattern as HomeHero/Marquee).
 * Loads/saves via ${API_PATH} (components collection).
 */
function LatestEvents1EditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue(data);
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue(data && typeof data === "object" ? data : {});
      })
      .catch(() => message.error("Failed to load LatestEvents1"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(values);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Latest Events saved");
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
      <p style={{ color: "#666" }}>Add configuration fields in EditForm.js. Save uses ${API_PATH}.</p>
    </Form>
  );
}

export default forwardRef(LatestEvents1EditForm);
