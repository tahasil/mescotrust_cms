"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  message,
  Spin,
  Row,
  Col,
  Card,
  Tag,
  Alert,
  Modal,
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
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { CONTENT_STATUSES, getContentStatusMeta } from "@/lib/workflow/constants";

const DESKTOP_REQUIRED_WIDTH = 1200;
const DESKTOP_REQUIRED_HEIGHT = 1000;
const DESKTOP_REQUIRED_TEXT = `${DESKTOP_REQUIRED_WIDTH} \u00D7 ${DESKTOP_REQUIRED_HEIGHT} px`;

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

export default function AdminBlogEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const auth = useAdminAuth();

  const normalizedRole = String(auth?.roleKey || auth?.role || "").trim().toLowerCase();
  const isAdmin = normalizedRole === "admin" || normalizedRole === "super_admin";
  const isAuthor = normalizedRole === "author";
  const currentEmail = String(auth?.email || "").trim().toLowerCase();
  const currentUserId = String(auth?.userId || "").trim();

  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  const isOwner = () => {
    if (!post) return false;
    const docCreatedBy = String(post.createdBy || "").trim().toLowerCase();
    const docCreatorId = post.creatorId ? String(post.creatorId).trim() : "";
    if (currentEmail && docCreatedBy && currentEmail === docCreatedBy) return true;
    if (currentUserId && docCreatorId && currentUserId === docCreatorId) return true;
    return false;
  };

  const loadPost = async () => {
    try {
      const [postRes, catRes] = await Promise.all([
        fetch(`/api/admin/blogs/${id}`),
        fetch("/api/admin/blog-categories"),
      ]);
      if (!postRes.ok) {
        if (postRes.status === 404 || postRes.status === 403) {
          message.error("Post not found or access denied");
          router.push("/admin/blogs");
          return;
        }
        return;
      }
      const postData = await postRes.json();
      setPost(postData);
      if (catRes.ok) setCategories(await catRes.json());

      // If published with pending revision and user is author, show revision draft values
      const initialSource =
        isAuthor && postData.status === CONTENT_STATUSES.PUBLISHED && postData.pendingRevision?.hasPendingRevision && postData.pendingRevision?.data
          ? postData.pendingRevision.data
          : postData;

      form.setFieldsValue({
        title: initialSource.title,
        slug: initialSource.slug,
        content: initialSource.content,
        excerpt: initialSource.excerpt,
        featuredImage: initialSource.featuredImage,
        featuredImageMobile: initialSource.featuredImageMobile,
        status: postData.status,
        category: initialSource.category?._id || initialSource.category || undefined,
        tags: Array.isArray(initialSource.tags) ? initialSource.tags : [],
        metaTitle: initialSource.meta?.metaTitle,
        metaDescription: initialSource.meta?.metaDescription,
        metaKeywords: initialSource.meta?.metaKeywords,
      });
    } catch {
      message.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadPost();
  }, [id, form, router]);

  const onFinish = async (values, submitForReview = false) => {
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
          submitForReview: Boolean(submitForReview),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success(data.message || (submitForReview ? "Submitted for Admin review" : "Saved"));
      loadPost();
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowAction = async (action, comments = "", reason = "") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs/${id}/workflow`, {
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
      loadPost();
    } catch {
      message.error("Workflow action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const promptRequestChanges = () => {
    let inputComments = "";
    Modal.confirm({
      title: "Request Changes",
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6, fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
            Provide comments on what needs modification:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Please update the excerpt and check spelling in section 2..."
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
      title: "Reject Post",
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6, fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
            Specify the reason for rejection:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Content does not meet editorial guidelines..."
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
  if (!post) return null;

  const statusMeta = getContentStatusMeta(post.status);
  const isLocked = isAuthor && post.status === CONTENT_STATUSES.PENDING_REVIEW;
  const isPublished = post.status === CONTENT_STATUSES.PUBLISHED;
  const hasRevision = Boolean(post.pendingRevision?.hasPendingRevision);

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
        <Space size={8} wrap style={{ justifyContent: "flex-end", alignItems: "center" }}>
          <span>Status:</span>
          {isAdmin ? (
            <Select
              value={post.status}
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
      {post.status === CONTENT_STATUSES.CHANGES_REQUESTED && post.reviewComments && (
        <Alert
          message="Changes Requested by Admin"
          description={post.reviewComments}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {post.status === CONTENT_STATUSES.REJECTED && post.rejectionReason && (
        <Alert
          message="Post Rejected by Admin"
          description={post.rejectionReason}
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {isLocked && (
        <Alert
          message="Locked for Review"
          description="This post was submitted for Admin review and cannot be modified until an Admin reviews it."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {isPublished && isAuthor && (
        <Alert
          message="Published Content Protection"
          description="This post is currently live on the public website. Any changes you make will be held as a pending revision for Admin review; the live website will continue showing the published version."
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
            <Form.Item
              name="title"
              label="Title"
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
                          validateTrigger={["onChange", "onBlur"]}
                          rules={[{ validator: validateDesktopImageDimensions }]}
                          extra="Primary image for social sharing previews."
                          className="mb-0"
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
                        {post.status === CONTENT_STATUSES.CHANGES_REQUESTED ? "Resubmit for Review" : "Submit for Review"}
                      </Button>
                    </>
                  )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <>
                      <Button type="default" htmlType="submit" loading={saving}>
                        Save Changes
                      </Button>

                      {(post.status === CONTENT_STATUSES.PENDING_REVIEW || hasRevision) && (
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

                      {post.status === CONTENT_STATUSES.APPROVED && (
                        <Button
                          type="primary"
                          icon={<GlobalOutlined />}
                          loading={actionLoading}
                          onClick={() => handleWorkflowAction("publish")}
                          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                        >
                          Publish Post
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
