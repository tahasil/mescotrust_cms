"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Select, Switch, Button, Card, message } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";

const POSITION_OPTIONS = [
  { value: "before", label: "Above content (e.g. header)" },
  { value: "after", label: "Below content (e.g. footer)" },
];

export default function AdminComponentNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/site-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: values.componentId?.trim(),
          displayName: values.displayName?.trim() || values.componentId?.trim(),
          global: values.global ?? false,
          position: values.position || "before",
          order: Number(values.order) ?? 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Create failed");
        return;
      }
      message.success("Component created");
      router.push("/admin/components");
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/components">
          <Button type="text" icon={<ArrowLeftOutlined />}>
            Back to components
          </Button>
        </Link>
      </div>
      <Card title="New component" style={{ maxWidth: 480 }}>
        <Form form={form} layout="vertical" initialValues={{ global: false, position: "before", order: 0 }}>
          <Form.Item name="componentId" label="Component ID" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. HeroBanner" />
          </Form.Item>
          <Form.Item name="displayName" label="Display name">
            <Input placeholder="e.g. Hero Banner" />
          </Form.Item>
          <Form.Item name="global" label="Show on all pages (global)" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="position" label="Position (when shown on all pages)">
            <Select options={POSITION_OPTIONS} />
          </Form.Item>
          <Form.Item name="order" label="Order (lower = first)">
            <Input type="number" placeholder="0" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={saving}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
