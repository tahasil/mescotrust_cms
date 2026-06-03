"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  DatePicker,
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
import dayjs from "dayjs";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

const { RangePicker } = DatePicker;

function toDateTimeValue(v, fallbackTime = "") {
  if (!v) return undefined;
  const base = dayjs(v);
  if (!base.isValid()) return undefined;

  const match = fallbackTime
    .toString()
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return base;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return base;
  }

  return base.hour(hours).minute(minutes).second(0).millisecond(0);
}

function parseTimeRangeString(s) {
  const raw = (s || "").toString().trim();
  if (!raw) return { start: "", end: "" };
  const parts = raw
    .split(/\u2013|-|to/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: raw, end: "" };
}

function toIsoStringOrNull(dateVal) {
  if (!dateVal || !dayjs.isDayjs(dateVal) || !dateVal.isValid()) return null;
  return dateVal.toDate().toISOString();
}

function toTimeText(dateVal) {
  if (!dateVal || !dayjs.isDayjs(dateVal) || !dateVal.isValid()) return "";
  return dateVal.format("HH:mm");
}

export default function AdminEventEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const isOnline = Form.useWatch("isOnline", form);
  const status = Form.useWatch("status", form);

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
        const startDateValue = toDateTimeValue(data.startDate, tr.start);
        const endDateValue = toDateTimeValue(data.endDate, tr.end);
        form.setFieldsValue({
          title: data.title,
          slug: data.slug,
          description: data.description,
          content: data.content,
          featuredImageDesktop: data.featuredImageDesktop,
          featuredImageMobile: data.featuredImageMobile,
          eventDateRange:
            startDateValue || endDateValue
              ? [startDateValue || null, endDateValue || null]
              : undefined,
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
      const [startDateValue, endDateValue] = Array.isArray(values.eventDateRange)
        ? values.eventDateRange
        : [];
      const startT = toTimeText(startDateValue);
      const endT = toTimeText(endDateValue);
      const timeStr =
        startT && endT ? `${startT} - ${endT}` : startT || endT || "";
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          description: values.description || "",
          content: values.content || "",
          featuredImageDesktop: values.featuredImageDesktop || "",
          featuredImageMobile: values.featuredImageMobile || "",
          startDate: toIsoStringOrNull(startDateValue),
          endDate: toIsoStringOrNull(endDateValue),
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
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              aria-label="Back to events"
            />
          </Link>
          <span>Edit event</span>
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
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="eventLink" label="Event / registration link">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="location" label="Location">
              <Input
                disabled={isOnline}
                placeholder={isOnline ? "Online event" : "Venue or address"}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={12}>
            <Form.Item name="eventDateRange" label="Event date & time range">
              <RangePicker
                showTime={{ format: "HH:mm" }}
                format="DD-MM-YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder={["Start date & time", "End date & time"]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              name="isOnline"
              label="Online event"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              name="metaTitle"
              label="Meta title"
              extra="Used for social sharing title (Facebook, X, LinkedIn, WhatsApp, Telegram, Email)."
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={12}>
            <Form.Item
              name="metaDescription"
              label="Meta description"
              extra="Used for social sharing description when available."
            >
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
                            hintText="Recommended: 1200x600"
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
