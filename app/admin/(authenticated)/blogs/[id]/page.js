"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  Switch,
  message,
  Spin,
  Row,
  Col,
  Card,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminBlogEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const status = Form.useWatch("status", form);

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
        if (catRes.ok) setCategories(await catRes.json());
        form.setFieldsValue({
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt,
          featuredImage: postData.featuredImage,
          featuredImageMobile: postData.featuredImageMobile,
          status: postData.status,
          category: postData.category?._id || undefined,
          tags: Array.isArray(postData.tags) ? postData.tags : [],
          metaTitle: postData.meta?.metaTitle,
          metaDescription: postData.meta?.metaDescription,
          metaKeywords: postData.meta?.metaKeywords,
        });
      } catch {
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
          featuredImage: values.featuredImage || "",
          featuredImageMobile: values.featuredImageMobile || "",
          category: values.category || null,
          tags: Array.isArray(values.tags) ? values.tags : [],
          meta: {
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            metaKeywords: values.metaKeywords,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      message.success("Saved");
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
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              aria-label="Back to blogs"
            />
          </Link>
          <span>Edit Post</span>
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
            <Form.Item
              name="title"
              label="Title 1"
              rules={[{ required: true }]}
              className="mb-0"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              name="slug"
              label="Slug"
              rules={[{ required: true }]}
              className="mb-0"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="category" label="Category" className="mb-0">
              <Select
                allowClear
                placeholder="Select category"
                options={categories.map((c) => ({
                  value: c._id,
                  label: c.name,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              name="tags"
              label="Tags"
              extra="Press Enter after each tag"
              className="mb-0"
            >
              <Select
                mode="tags"
                placeholder="Add tags"
                tokenSeparators={[","]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={12}>
            <Form.Item
              name="metaTitle"
              label="Meta title"
              extra="Used for social sharing title (Facebook, X, LinkedIn, WhatsApp, Telegram, Email)."
              className="mb-0"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={12}>
            <Form.Item
              name="metaDescription"
              label="Meta description"
              extra="Used for social sharing description when available."
              className="mb-0"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={12}>
            <Form.Item
              name="metaKeywords"
              label="Meta keywords"
              extra="Comma separated. Example: education, scholarship, ngo"
              className="mb-0"
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Form.Item
                  name="excerpt"
                  label="Short description"
                  className="mb-0"
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="content" label="Description" className="mb-0">
                  <RichTextEditor />
                </Form.Item>
              </Col>

              <Col xs={24} xl={12}>
                <Card title="Featured Images" size="small">
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Card title="Desktop Image" size="small">
                        <Form.Item
                          name="featuredImage"
                          extra="Primary image for social sharing previews."
                          className="mb-0"
                        >
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
                          extra="Used as social sharing fallback image when desktop image is missing."
                          className="mb-0"
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
                    Save
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
