"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button, Card, message } from "antd";

type Theme = {
  id: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  borderRadius: string | null;
};

export default function AdminThemePage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("/api/admin/theme", { credentials: "include" })
      .then((r) => r.json())
      .then((t: Theme) => {
        form.setFieldsValue({
          primaryColor: t.primaryColor ?? "",
          secondaryColor: t.secondaryColor ?? "",
          headingFont: t.headingFont ?? "",
          bodyFont: t.bodyFont ?? "",
          borderRadius: t.borderRadius ?? "",
        });
      })
      .catch(() => message.error("Failed to load theme"));
  }, [form]);

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save");
      message.success("Theme saved");
    } catch {
      message.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Theme</h2>
      <Card className="max-w-xl">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Primary color" name="primaryColor">
            <Input type="color" style={{ height: 32 }} />
          </Form.Item>
          <Form.Item label="Secondary color" name="secondaryColor">
            <Input type="color" style={{ height: 32 }} />
          </Form.Item>
          <Form.Item label="Heading font" name="headingFont">
            <Input placeholder="e.g. Inter, sans-serif" />
          </Form.Item>
          <Form.Item label="Body font" name="bodyFont">
            <Input placeholder="e.g. Inter, sans-serif" />
          </Form.Item>
          <Form.Item label="Border radius" name="borderRadius">
            <Input placeholder="e.g. 0.5rem" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
