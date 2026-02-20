"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Form, Input, Select, Card, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function AdminBlogEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [postRes, catRes] = await Promise.all([
          fetch(`/api/admin/blogs/${id}`),
          fetch("/api/admin/blog-categories"),
        ]);
        if (!postRes.ok) {
          if (postRes.status === 404) router.push("/admin/blogs");
          return;
        }
        const postData = await postRes.json();
        setPost(postData);
        if (catRes.ok) setCategories(await catRes.json());
        form.setFieldsValue({
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt,
          status: postData.status,
          category: postData.category?._id || undefined,
          metaTitle: postData.meta?.metaTitle,
          metaDescription: postData.meta?.metaDescription,
        });
      } catch (e) {
        message.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, router]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          category: values.category || null,
          meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      setPost(await res.json());
      message.success("Saved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <>
      <Link href="/admin/blogs">
        <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
          Back to blogs
        </Button>
      </Link>
      <Card title="Edit post">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="excerpt" label="Excerpt">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={12} />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select
              allowClear
              placeholder="Select category"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          </Form.Item>
          <Form.Item name="metaTitle" label="Meta title">
            <Input />
          </Form.Item>
          <Form.Item name="metaDescription" label="Meta description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
