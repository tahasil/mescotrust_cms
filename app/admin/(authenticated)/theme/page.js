"use client";

import { useState, useEffect } from "react";
import { Card, Form, Input, Select, Button, message } from "antd";

export default function AdminThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          fontFamily: data.fontFamily || "system-ui, sans-serif",
          primaryColor: data.primaryColor || "#1890ff",
          direction: data.direction || "ltr",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, [form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      message.success("Theme saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 style={{ marginBottom: 16 }}>Theme</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Global design settings. Applied on the public site via <code>GET /api/theme</code>. Phase 3: fonts, RTL, colors.
      </p>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 400 }}>
          <Form.Item name="fontFamily" label="Font family">
            <Input placeholder="system-ui, sans-serif" />
          </Form.Item>
          <Form.Item name="primaryColor" label="Primary color">
            <Input placeholder="#1890ff" />
          </Form.Item>
          <Form.Item name="direction" label="Direction">
            <Select options={[{ value: "ltr", label: "LTR" }, { value: "rtl", label: "RTL" }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save theme
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
