"use client";

import { useState } from "react";
import { Form, Input, Button, Card, Radio, Switch, message } from "antd";
import { useRouter } from "next/navigation";

export default function AdminNewPagePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: {
    title: string;
    slug?: string;
    status: string;
    isHomePage: boolean;
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: values.title,
          slug: values.slug || undefined,
          status: values.status,
          isHomePage: values.isHomePage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create");
      message.success("Page created");
      router.push(`/admin/pages/${data.id}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">New page</h2>
      <Card className="max-w-xl">
        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: "draft", isHomePage: false }}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true }]}
          >
            <Input placeholder="Page title" />
          </Form.Item>
          <Form.Item label="Slug" name="slug">
            <Input placeholder="url-slug (optional, derived from title)" />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Radio.Group>
              <Radio value="draft">Draft</Radio>
              <Radio value="published">Published</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Set as home page" name="isHomePage" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
