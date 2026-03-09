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
  Space,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminComponentNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // System-generated ID from display name: no spaces, alphanumeric
  const deriveComponentId = (displayName) => {
    if (!displayName || typeof displayName !== "string") return "";
    let base = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    if (!/^[a-zA-Z]/.test(base) && base.length) base = "C" + base;
    return base;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/site-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: values.displayName?.trim(),
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
      const cid = data.componentId;
      message.success(
        `Component created. Add code in components/site/${cid}.js — then use it on any page via Add Component.`,
        6,
      );
      router.push(`/admin/components/${encodeURIComponent(cid)}/edit`);
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeAdminCard
      title={
        <Space>
          <Link href="/admin/components">
            <Button
              type="primary"
              size="small"
              icon={<ArrowLeftOutlined />}
              aria-label="New component"
            />
          </Link>
          <div className="title">New Component</div>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          global: false,
          position: "before",
          order: 0,
          _derivedId: "",
        }}
        onValuesChange={(_, all) =>
          form.setFieldValue("_derivedId", deriveComponentId(all.displayName))
        }
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="displayName"
              label="Display name"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Hero Banner" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="_derivedId"
              label="Component ID"
              tooltip="Generated from display name (no spaces). Cannot be edited."
            >
              <Input disabled placeholder="Generated from display name" />
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
    </ThemeAdminCard>
  );
}
