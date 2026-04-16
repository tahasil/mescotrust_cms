"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Form, Input, Select, Space, message, Spin, Switch, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

function toDateInput(v) {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function parseTimeRangeString(s) {
  const raw = (s || "").toString().trim();
  if (!raw) return { start: "", end: "" };
  const parts = raw.split(/–|-|to/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: raw, end: "" };
}

export default function AdminEventEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/events/${id}`);
        if (!res.ok) {
          if (res.status === 404) router.push("/admin/events");
          return;
        }
        const data = await res.json();
        const tr = parseTimeRangeString(data.time);
        form.setFieldsValue({
          title: data.title,
          slug: data.slug,
          description: data.description,
          content: data.content,
          featuredImageDesktop: data.featuredImageDesktop,
          featuredImageMobile: data.featuredImageMobile,
          startDate: toDateInput(data.startDate),
          endDate: toDateInput(data.endDate),
          startTime: tr.start,
          endTime: tr.end,
          location: data.location,
          isOnline: !!data.isOnline,
          eventLink: data.eventLink,
          status: data.status,
          metaTitle: data.meta?.metaTitle,
          metaDescription: data.meta?.metaDescription,
        });
      } catch {
        message.error("Failed to load event");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form, router]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const startT = (values.startTime || "").toString().trim();
      const endT = (values.endTime || "").toString().trim();
      const timeStr = startT && endT ? `${startT} - ${endT}` : (startT || endT || "");
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
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
          meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
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
          <Link href="/admin/events" style={{ marginRight: 8 }}>
            <Button icon={<ArrowLeftOutlined />} type="text" aria-label="Back to events">
              Back
            </Button>
          </Link>
          <span>Edit event</span>
        </>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item name="isOnline" label="Online event" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="status" label="Status" initialValue="draft">
              <Select
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="startDate" label="Start date">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="endDate" label="End date">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="eventLink" label="Event / registration link">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="startTime" label="Start time">
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="endTime" label="End time">
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isOnline !== cur.isOnline}>
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

          <Col span={24}>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Short description for listings" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="featuredImageDesktop"
              label="Featured image URL (Desktop)"
              extra="Paste a URL or path from the media library"
            >
              <MediaPickerInput placeholder="/media/..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="featuredImageMobile"
              label="Featured image URL (Mobile)"
              extra="Optional. If empty, the desktop image is used on small screens."
            >
              <MediaPickerInput placeholder="/media/..." />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="content" label="Content">
              <RichTextEditor />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="metaTitle" label="Meta title">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="metaDescription" label="Meta description">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save
                </Button>
                <Button href={`/preview/${id}?type=event`} target="_blank">
                  Preview draft
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </ThemeAdminCard>
  );
}
