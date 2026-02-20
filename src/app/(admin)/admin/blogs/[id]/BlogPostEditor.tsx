"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Select, message } from "antd";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categoryId: string | null;
  tags: string[];
  status: string;
};

type Category = { id: string; name: string; slug: string };

export function BlogPostEditor({
  post,
  categories,
}: {
  post: Post;
  categories: Category[];
}) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt ?? "",
      categoryId: post.categoryId,
      status: post.status,
    });
  }, [post, form]);

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          categoryId: values.categoryId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      message.success("Saved");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/admin/blogs">Blogs</Link>
        <span>/</span>
        <h2 className="text-lg font-medium">{post.title}</h2>
      </div>
      <Card className="max-w-2xl">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Content" name="content">
            <Input.TextArea rows={10} />
          </Form.Item>
          <Form.Item label="Excerpt" name="excerpt">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Category" name="categoryId">
            <Select
              allowClear
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select
              options={[
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ]}
            />
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
