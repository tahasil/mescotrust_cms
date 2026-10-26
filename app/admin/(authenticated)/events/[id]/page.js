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
  Tag,
  Alert,
  Modal,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { CONTENT_STATUSES, getContentStatusMeta } from "@/lib/workflow/constants";

const { RangePicker } = DatePicker;
const DESKTOP_REQUIRED_WIDTH = 800;
const DESKTOP_REQUIRED_HEIGHT = 400;
const DESKTOP_REQUIRED_TEXT = `${DESKTOP_REQUIRED_WIDTH} \u00D7 ${DESKTOP_REQUIRED_HEIGHT} px`;

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

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateDesktopImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width === DESKTOP_REQUIRED_WIDTH && height === DESKTOP_REQUIRED_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Desktop Image must be exactly ${DESKTOP_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Please use ${DESKTOP_REQUIRED_TEXT}.`,
      ),
    );
  }
}

export default function AdminEventEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const auth = useAdminAuth();

  const normalizedRole = String(auth?.roleKey || auth?.role || "").trim().toLowerCase();
  const isAdmin = normalizedRole === "admin" || normalizedRole === "super_admin";
  const isAuthor = normalizedRole === "author";
  const currentEmail = String(auth?.email || "").trim().toLowerCase();
  const currentUserId = String(auth?.userId || "").trim();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();
  const isOnline = Form.useWatch("isOnline", form);

  const isOwner = () => {
    if (!eventData) return false;
    const docCreatedBy = String(eventData.createdBy || "").trim().toLowerCase();
    const docCreatorId = eventData.creatorId ? String(eventData.creatorId).trim() : "";
    if (currentEmail && docCreatedBy && currentEmail === docCreatedBy) return true;
    if (currentUserId && docCreatorId && currentUserId === docCreatorId) return true;
    return false;
  };

  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 403) {
          message.error("Event not found or access denied");
          router.push("/admin/events");
          return;
        }
        return;
      }
      const data = await res.json();
      setEventData(data);

      const initialSource =
        isAuthor && data.status === CONTENT_STATUSES.PUBLISHED && data.pendingRevision?.hasPendingRevision && data.pendingRevision?.data
          ? data.pendingRevision.data
          : data;

      const tr = parseTimeRangeString(initialSource.time);
      const startDateValue = toDateTimeValue(initialSource.startDate, tr.start);
      const endDateValue = toDateTimeValue(initialSource.endDate, tr.end);

      form.setFieldsValue({
        title: initialSource.title,
        slug: initialSource.slug,
        description: initialSource.description,
        content: initialSource.content,
        featuredImageDesktop: initialSource.featuredImageDesktop,
        featuredImageMobile: initialSource.featuredImageMobile,
        isOnline: initialSource.isOnline,
        featured: initialSource.featured,
        eventLink: initialSource.eventLink,
        location: initialSource.location,
        eventDateRange:
          startDateValue || endDateValue
            ? [startDateValue || undefined, endDateValue || undefined]
            : undefined,
        tags: Array.isArray(initialSource.tags) ? initialSource.tags : [],
        metaTitle: initialSource.meta?.metaTitle,
        metaDescription: initialSource.meta?.metaDescription,
        metaKeywords: initialSource.meta?.metaKeywords,
      });
    } catch {
      message.error("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id, form, router]);

  const onFinish = async (values, submitForReview = false) => {
    setSaving(true);
    try {
      const range = Array.isArray(values.eventDateRange)
        ? values.eventDateRange
        : [];
      const startVal = range[0];
      const endVal = range[1];
      const startDate = toIsoStringOrNull(startVal);
      const endDate = toIsoStringOrNull(endVal);
      const startTimeText = toTimeText(startVal);
      const endTimeText = toTimeText(endVal);
      const time =
        startTimeText && endTimeText
          ? `${startTimeText} - ${endTimeText}`
          : startTimeText || endTimeText || "";

      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          startDate,
          endDate,
          time,
          featuredImageDesktop: values.featuredImageDesktop || "",
          featuredImageMobile: values.featuredImageMobile || "",
          tags: Array.isArray(values.tags) ? values.tags : [],
          meta: {
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            metaKeywords: values.metaKeywords,
          },
          submitForReview: Boolean(submitForReview),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success(data.message || (submitForReview ? "Submitted for Admin review" : "Saved"));
      loadEvent();
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowAction = async (action, comments = "", reason = "") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || `Failed to execute ${action}`);
        return;
      }
      message.success(data.message || "Action completed successfully");
      loadEvent();
    } catch {
      message.error("Workflow action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const promptRequestChanges = () => {
    let inputComments = "";
    Modal.confirm({
      title: "Request Changes on Event",
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6, fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
            Provide comments on what needs modification:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Please update location details and timing..."
            onChange={(e) => {
              inputComments = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Request Changes",
      onOk: async () => {
        if (!inputComments.trim()) {
          message.error("Comments are required");
          return Promise.reject();
        }
        await handleWorkflowAction("request_changes", inputComments);
      },
    });
  };

  const promptReject = () => {
    let inputReason = "";
    Modal.confirm({
      title: "Reject Event",
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6, fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
            Specify the reason for rejection:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Event details are incomplete or not verified..."
            onChange={(e) => {
              inputReason = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Reject",
      okType: "danger",
      onOk: async () => {
        if (!inputReason.trim()) {
          message.error("Rejection reason is required");
          return Promise.reject();
        }
        await handleWorkflowAction("reject", "", inputReason);
      },
    });
  };

  if (loading) return <Spin size="large" />;
  if (!eventData) return null;

  const statusMeta = getContentStatusMeta(eventData.status);
  const isLocked = isAuthor && eventData.status === CONTENT_STATUSES.PENDING_REVIEW;
  const isPublished = eventData.status === CONTENT_STATUSES.PUBLISHED;
  const hasRevision = Boolean(eventData.pendingRevision?.hasPendingRevision);

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
          <span>Edit Event</span>
        </>
      }
      extra={
        <Space size={8} wrap style={{ justifyContent: "flex-end", alignItems: "center" }}>
          <span>Status:</span>
          {isAdmin ? (
            <Select
              value={eventData.status}
              style={{ width: 160 }}
              onChange={(val) => handleWorkflowAction(val === "published" ? "publish" : "unpublish")}
              options={[
                { value: CONTENT_STATUSES.DRAFT, label: "Draft" },
                { value: CONTENT_STATUSES.PENDING_REVIEW, label: "Pending Review" },
                { value: CONTENT_STATUSES.CHANGES_REQUESTED, label: "Changes Requested" },
                { value: CONTENT_STATUSES.APPROVED, label: "Approved" },
                { value: CONTENT_STATUSES.PUBLISHED, label: "Published" },
                { value: CONTENT_STATUSES.REJECTED, label: "Rejected" },
              ]}
            />
          ) : (
            <Tag color={statusMeta.tagColor} style={{ fontSize: 13, padding: "3px 10px" }}>
              {statusMeta.label}
            </Tag>
          )}

          {hasRevision && (
            <Tag color="purple">Revision Pending Review</Tag>
          )}
        </Space>
      }
    >
      {/* Workflow Status Banners */}
      {eventData.status === CONTENT_STATUSES.CHANGES_REQUESTED && eventData.reviewComments && (
        <Alert
          message="Changes Requested by Admin"
          description={eventData.reviewComments}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {eventData.status === CONTENT_STATUSES.REJECTED && eventData.rejectionReason && (
        <Alert
          message="Event Rejected by Admin"
          description={eventData.rejectionReason}
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {isLocked && (
        <Alert
          message="Locked for Review"
          description="This event was submitted for Admin review and cannot be modified until an Admin reviews it."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {isPublished && isAuthor && (
        <Alert
          message="Published Content Protection"
          description="This event is currently live on the public website. Any changes you make will be held as a pending revision for Admin review; the live website will continue showing the published version."
          type="info"
          showIcon
          icon={<GlobalOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        size="large"
        disabled={isLocked}
        onFinish={(values) => onFinish(values, false)}
      >
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
            <SwitchSettingsCard
              title="Event Options"
              items={[
                {
                  name: "featured",
                  label: "Featured Event",
                  tooltip: "Show this event in the Events Slider when it is published.",
                  checkedChildren: "On",
                  unCheckedChildren: "Off",
                },
              ]}
            />
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
          <Col xs={24} sm={12} xl={6}>
            <Form.Item
              name="metaKeywords"
              label="Meta keywords"
              extra="Comma separated. Example: education, charity, youth"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="tags" label="Tags" extra="Press Enter after each tag">
              <Select mode="tags" placeholder="Add tags" tokenSeparators={[","]} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Form.Item name="description" label="Short description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="content" label="Description">
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
                          validateTrigger={["onChange", "onBlur"]}
                          rules={[{ validator: validateDesktopImageDimensions }]}
                          extra="Primary image for social sharing previews."
                        >
                          <MediaPickerInput
                            placeholder="/media/..."
                            uiVariant="stacked"
                            showVariants={false}
                            cropWidth={DESKTOP_REQUIRED_WIDTH}
                            cropHeight={DESKTOP_REQUIRED_HEIGHT}
                            hintText={`Required size: ${DESKTOP_REQUIRED_TEXT}`}
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Mobile Image" size="small">
                        <Form.Item
                          name="featuredImageMobile"
                          extra="Used as social sharing fallback image when desktop image is missing."
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

          {/* Action Footer */}
          <Col span={24}>
            <Form.Item style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Space wrap>
                  {/* Author actions */}
                  {isAuthor && isOwner() && !isLocked && (
                    <>
                      <Button type="default" htmlType="submit" loading={saving}>
                        {isPublished ? "Save Revision Draft" : "Save Draft"}
                      </Button>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={saving}
                        onClick={() => {
                          form.validateFields().then((vals) => onFinish(vals, true));
                        }}
                        style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
                      >
                        {eventData.status === CONTENT_STATUSES.CHANGES_REQUESTED ? "Resubmit for Review" : "Submit for Review"}
                      </Button>
                    </>
                  )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <>
                      <Button type="default" htmlType="submit" loading={saving}>
                        Save Changes
                      </Button>

                      {(eventData.status === CONTENT_STATUSES.PENDING_REVIEW || hasRevision) && (
                        <>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={actionLoading}
                            onClick={() => handleWorkflowAction("approve")}
                            style={{ backgroundColor: "#13c2c2", borderColor: "#13c2c2" }}
                          >
                            Approve
                          </Button>
                          <Button
                            type="default"
                            loading={actionLoading}
                            onClick={promptRequestChanges}
                            style={{ color: "#fa8c16", borderColor: "#fa8c16" }}
                          >
                            Request Changes
                          </Button>
                          <Button
                            type="primary"
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={actionLoading}
                            onClick={promptReject}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {eventData.status === CONTENT_STATUSES.APPROVED && (
                        <Button
                          type="primary"
                          icon={<GlobalOutlined />}
                          loading={actionLoading}
                          onClick={() => handleWorkflowAction("publish")}
                          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                        >
                          Publish Event
                        </Button>
                      )}

                      {isPublished && (
                        <Button
                          type="default"
                          danger
                          loading={actionLoading}
                          onClick={() => handleWorkflowAction("unpublish")}
                        >
                          Unpublish
                        </Button>
                      )}
                    </>
                  )}
                </Space>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </ThemeAdminCard>
  );
}
