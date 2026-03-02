"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Input,
  Switch,
  Button,
  Card,
  message,
  Divider,
  Row,
  Col,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";

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
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            aria-label="New component"
          >
            Back
          </Button>
        </Link>
      </div>
      <Divider />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ global: false, position: "before", order: 0 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="componentId"
              label="Component ID"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. HeroBanner" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="displayName" label="Display name">
              <Input placeholder="e.g. Hero Banner" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="global"
              label="Show on all pages (global)"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={saving}
          >
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
