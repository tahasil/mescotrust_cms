"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Form,
  Input,
  Space,
  message,
  Spin,
  Switch,
  Row,
  Col,
  Card,
} from "antd";
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

export default function AdminEventNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const isOnline = Form.useWatch("isOnline", form);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    form.setFieldsValue({ status: "draft", isOnline: false });
    setLoading(false);
  }, [form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const startT = (values.startTime || "").toString().trim();
      const endT = (values.endTime || "").toString().trim();
      const timeStr =
        startT && endT ? `${startT} - ${endT}` : startT || endT || "";

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          description: values.description || "",
          content: values.content || "",
          featuredImageDesktop: values.featuredImageDesktop || "",
          featuredImageMobile: values.featuredImageMobile || "",
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          time: timeStr,
          location: values.isOnline ? "" : values.location || "",
          isOnline: !!values.isOnline,
          eventLink: values.eventLink || "",
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
      message.success("Event created");
      router.push(`/admin/events/${data._id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/events" style={{ marginRight: 8 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              aria-label="Back to events"
            />
          </Link>
          <span>Add Event</span>
        </>
      }
      extra={
        <Space size={8} wrap style={{ justifyContent: "flex-end" }}>
          <Space size={8} wrap>
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
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="eventLink" label="Event / registration link">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="startDate" label="Start date">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="endDate" label="End date">
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="startTime" label="Start time">
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="endTime" label="End time">
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="isOnline" label="Online event" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.isOnline !== cur.isOnline}
            >
              {({ getFieldValue }) =>
                getFieldValue("isOnline") ? (
                  <Form.Item label="Location">
                    <Input disabled placeholder="Online event" />
                  </Form.Item>
                ) : (
                  <Form.Item name="location" label="Location">
                    <Input placeholder="Venue or address" />
                  </Form.Item>
                )
              }
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
                <Form.Item name="description" label="Short description">
                  <Input.TextArea
                    rows={3}
                    placeholder="Short description for listings"
                  />
                </Form.Item>
                <Form.Item
                  name="content"
                  label="Description"
                  style={{ marginBottom: 0 }}
                >
                  <RichTextEditor />
                </Form.Item>
              </Col>

              <Col xs={24} xl={12}>
                <Card title="Featured Images" size="small">
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Card title="Desktop Image" size="small">
                        <Form.Item
                          name="featuredImageDesktop"
                          style={{ marginBottom: 0 }}
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
