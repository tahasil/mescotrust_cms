"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Input, Select, Space, Switch, message, Spin, Row, Col, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminBlogNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const status = Form.useWatch("status", form);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/blog-categories");
        if (res.ok) setCategories(await res.json());
      } finally {
        form.setFieldsValue({ status: "draft" });
        setLoading(false);
      }
    })();
  }, [form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          featuredImage: values.featuredImage || "",
          featuredImageMobile: values.featuredImageMobile || "",
          category: values.category || null,
          tags: Array.isArray(values.tags) ? values.tags : [],
          meta: {
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Create failed");
        return;
      }
      message.success("Post created");
      router.push(`/admin/blogs/${data._id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/blogs" style={{ marginRight: 8 }}>
            <Button icon={<ArrowLeftOutlined />} type="text" aria-label="Back to blogs" />
          </Link>
          <span>Add post</span>
        </>
      }
      extra={
        <Space size={8} wrap style={{ justifyContent: "flex-end" }}>
          <span>Status</span>
          <Switch
            checked={status === "published"}
            checkedChildren="Published"
            unCheckedChildren="Draft"
            onChange={(checked) =>
              form.setFieldValue("status", checked ? "published" : "draft")
            }
          />
        </Space>
      }
    >
      <Form form={form} layout="vertical" size="large" onFinish={onFinish}>
        <Row gutter={[16, 16]}>
          <Form.Item name="status" hidden initialValue="draft">
            <Input />
          </Form.Item>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input
                placeholder="Post title"
                onChange={(e) => {
                  form.setFieldValue("slug", slugify(e.target.value));
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              name="slug"
              label="Slug"
              rules={[{ required: true }]}
              extra="Auto-generated from title."
            >
              <Input placeholder="post-slug" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="category" label="Category">
              <Select
                allowClear
                placeholder="Select category"
                options={categories.map((c) => ({ value: c._id, label: c.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="tags" label="Tags" extra="Press Enter after each tag">
              <Select mode="tags" placeholder="Add tags" tokenSeparators={[","]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={12}>
            <Form.Item name="metaTitle" label="Meta title">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={12}>
            <Form.Item name="metaDescription" label="Meta description">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Form.Item name="excerpt" label="Short description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="content" label="Description" style={{ marginBottom: 0 }}>
                  <RichTextEditor />
                </Form.Item>
              </Col>

              <Col xs={24} xl={12}>
                <Card title="Featured Images" size="small">
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Card title="Desktop Image" size="small">
                        <Form.Item name="featuredImage" style={{ marginBottom: 0 }}>
                          <MediaPickerInput
                            placeholder="/media/..."
                            uiVariant="stacked"
                            showVariants={false}
                            hintText="Recommended: 1200x600"
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Mobile Image" size="small">
                        <Form.Item
                          name="featuredImageMobile"
                          style={{ marginBottom: 0 }}
                        >
                          <MediaPickerInput
                            placeholder="/media/..."
                            uiVariant="stacked"
                            showVariants={false}
                            hintText="Optional for mobile"
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Col>

          <Col span={24}>
            <Form.Item style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Space wrap>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Create
                  </Button>
                </Space>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </ThemeAdminCard>
  );
}
