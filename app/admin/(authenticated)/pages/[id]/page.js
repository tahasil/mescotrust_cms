"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Form, Input, Select, Card, Space, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import PageBuilder from "@/components/admin/PageBuilder";

export default function AdminPageEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [page, setPage] = useState(null);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/pages/${id}`);
        if (!res.ok) {
          if (res.status === 404) router.push("/admin/pages");
          return;
        }
        const data = await res.json();
        setPage(data);
        setLayout(Array.isArray(data.layout) ? data.layout : []);
        form.setFieldsValue({
          title: data.title,
          slug: data.slug,
          status: data.status,
          locale: data.locale || "en",
          metaTitle: data.meta?.metaTitle,
          metaDescription: data.meta?.metaDescription,
        });
      } catch (e) {
        message.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, router]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          slug: values.slug,
          status: values.status,
          locale: values.locale || "en",
          layout,
          meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      const updated = await res.json();
      setPage(updated);
      setLayout(Array.isArray(updated.layout) ? updated.layout : []);
      message.success("Saved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <>
      <Link href="/admin/pages">
        <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
          Back to pages
        </Button>
      </Link>
      <Card title="Edit page">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          </Form.Item>
          <Form.Item name="locale" label="Locale" extra="Language code (e.g. en, ar, he)">
            <Input placeholder="en" />
          </Form.Item>
          <Form.Item name="metaTitle" label="Meta title">
            <Input />
          </Form.Item>
          <Form.Item name="metaDescription" label="Meta description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save
              </Button>
              <Button href={`/preview/${id}?type=page`} target="_blank">
                Preview draft
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <PageBuilder layout={layout} onChange={setLayout} />

      {layout?.length > 0 && (
        <Card title="Preview" style={{ marginTop: 16 }}>
          <ComponentRenderer layout={layout} />
        </Card>
      )}
    </>
  );
}
