"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Input,
  Select,
  Tag,
  Radio,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { useAdminAuth, useAdminPermission } from "@/components/admin/AdminAuthContext";
import { CONTENT_STATUSES, getContentStatusMeta } from "@/lib/workflow/constants";

const BLOGS_SEARCH_STORAGE_KEY = "admin-blogs-search-query-v1";
const BLOGS_STATUS_STORAGE_KEY = "admin-blogs-status-filter-v1";
const BLOGS_CATEGORY_STORAGE_KEY = "admin-blogs-category-filter-v1";

export default function AdminBlogsPage() {
  const router = useRouter();
  const auth = useAdminAuth();
  const canDeletePermission = useAdminPermission("blogs.delete");
  const canCreatePermission = useAdminPermission("blogs.create");

  const normalizedRole = String(auth?.roleKey || auth?.role || "").trim().toLowerCase();
  const isAdmin = normalizedRole === "admin" || normalizedRole === "super_admin";
  const isAuthor = normalizedRole === "author";
  const currentEmail = String(auth?.email || "").trim().toLowerCase();
  const currentUserId = String(auth?.userId || "").trim();

  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Feedback viewer modal state
  const [feedbackModal, setFeedbackModal] = useState({ open: false, title: "", comments: "", reason: "" });
  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const resolvedSearch = resolveAdminStoredFilter(BLOGS_SEARCH_STORAGE_KEY, urlSearch);
    if (resolvedSearch) {
      setSearchText(resolvedSearch);
    }

    const urlStatus = urlParams.get("status");
    const resolvedStatus = resolveAdminStoredFilter(BLOGS_STATUS_STORAGE_KEY, urlStatus);
    if (resolvedStatus) {
      setFilterStatus(resolvedStatus);
    }

    const urlCat = urlParams.get("category");
    const resolvedCat = resolveAdminStoredFilter(BLOGS_CATEGORY_STORAGE_KEY, urlCat);
    if (resolvedCat) {
      setFilterCategory(resolvedCat);
    }
  }, []);

  const updateUrlParams = (newSearch, newStatus, newCat) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (newSearch) params.set("search", newSearch);
    else { params.delete("search"); params.delete("q"); }
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");
    if (newCat) params.set("category", newCat);
    else params.delete("category");
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(BLOGS_SEARCH_STORAGE_KEY, val);
      else sessionStorage.removeItem(BLOGS_SEARCH_STORAGE_KEY);
      updateUrlParams(val, filterStatus, filterCategory);
    }
  };

  const handleStatusChange = (val) => {
    setFilterStatus(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(BLOGS_STATUS_STORAGE_KEY, val);
      else sessionStorage.removeItem(BLOGS_STATUS_STORAGE_KEY);
      updateUrlParams(searchText, val, filterCategory);
    }
  };

  const handleCategoryChange = (val) => {
    setFilterCategory(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(BLOGS_CATEGORY_STORAGE_KEY, val);
      else sessionStorage.removeItem(BLOGS_CATEGORY_STORAGE_KEY);
      updateUrlParams(searchText, filterStatus, val);
    }
  };

  const fetchBlogs = async () => {
    const res = await fetch("/api/admin/blogs");
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.items || []);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/blog-categories");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBlogs(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  const isRecordOwner = (record) => {
    if (!record) return false;
    const docCreatedBy = String(record.createdBy || "").trim().toLowerCase();
    const docCreatorId = record.creatorId ? String(record.creatorId).trim() : "";
    if (currentEmail && docCreatedBy && currentEmail === docCreatedBy) return true;
    if (currentUserId && docCreatorId && currentUserId === docCreatorId) return true;
    return false;
  };

  const filtered = useMemo(() => {
    let result = list;

    // Scope filter (All, My Content, Pending Review)
    if (scopeFilter === "mine") {
      result = result.filter((p) => isRecordOwner(p));
    } else if (scopeFilter === "pending_review") {
      result = result.filter(
        (p) =>
          p.status === CONTENT_STATUSES.PENDING_REVIEW ||
          p.pendingRevision?.hasPendingRevision,
      );
    }

    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (filterCategory) {
      result = result.filter((p) => (p.category?._id || p.category) === filterCategory);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          p.createdBy?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [list, filterStatus, filterCategory, searchText, scopeFilter, currentEmail, currentUserId]);

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete post?",
      content: `Delete "${record.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/blogs/${record._id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Post deleted");
        fetchBlogs();
      },
    });
  };

  const handleSubmitForReview = async (record) => {
    setActionLoadingId(record._id);
    try {
      const res = await fetch(`/api/admin/blogs/${record._id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_review" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to submit for review");
        return;
      }
      message.success("Post submitted for Admin review!");
      fetchBlogs();
    } catch {
      message.error("Failed to submit for review");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (record) => {
    setActionLoadingId(record._id);
    try {
      const res = await fetch(`/api/admin/blogs/${record._id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to approve post");
        return;
      }
      message.success("Post approved!");
      fetchBlogs();
    } catch {
      message.error("Failed to approve");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublish = async (record) => {
    setActionLoadingId(record._id);
    try {
      const res = await fetch(`/api/admin/blogs/${record._id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to publish post");
        return;
      }
      message.success("Post published live!");
      fetchBlogs();
    } catch {
      message.error("Failed to publish");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePromptRequestChanges = (record) => {
    let inputComments = "";
    Modal.confirm({
      title: `Request Changes on "${record.title}"`,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6, fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
            Please describe the changes required by the author:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Please update the excerpt and check grammar in section 2..."
            onChange={(e) => {
              inputComments = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Request Changes",
      okType: "primary",
      onOk: async () => {
        if (!inputComments.trim()) {
          message.error("Review comments are required");
          return Promise.reject();
        }
        const res = await fetch(`/api/admin/blogs/${record._id}/workflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request_changes", comments: inputComments }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Failed to request changes");
          return;
        }
        message.success("Changes requested from author");
        fetchBlogs();
      },
    });
  };

  const handlePromptReject = (record) => {
    let inputReason = "";
    Modal.confirm({
      title: `Reject "${record.title}"`,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6, fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
            Please state the rejection reason:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Content does not align with editorial guidelines..."
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
        const res = await fetch(`/api/admin/blogs/${record._id}/workflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", reason: inputReason }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Failed to reject post");
          return;
        }
        message.success("Submission rejected");
        fetchBlogs();
      },
    });
  };

  const pendingCount = useMemo(() => {
    return list.filter(
      (p) =>
        p.status === CONTENT_STATUSES.PENDING_REVIEW ||
        p.pendingRevision?.hasPendingRevision,
    ).length;
  }, [list]);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t, record) => (
        <div>
          <span style={{ fontWeight: 500 }}>{t || "-"}</span>
          {record.pendingRevision?.hasPendingRevision && (
            <Tag color="purple" style={{ marginLeft: 8 }}>
              Revision Pending
            </Tag>
          )}
        </div>
      ),
    },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "Category", dataIndex: ["category", "name"], key: "category", render: (cat) => cat || "-" },
    {
      title: "Creator",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (c, record) => {
        const isOwner = isRecordOwner(record);
        return (
          <span>
            {c || "-"}
            {isOwner && (
              <Tag color="blue" style={{ marginLeft: 6 }}>
                You
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => {
        const meta = getContentStatusMeta(s);
        return <Tag color={meta.tagColor}>{meta.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isOwner = isRecordOwner(record);
        const isLockedUnderReview = record.status === CONTENT_STATUSES.PENDING_REVIEW;
        const hasFeedback =
          Boolean(record.reviewComments || record.rejectionReason) &&
          (record.status === CONTENT_STATUSES.CHANGES_REQUESTED || record.status === CONTENT_STATUSES.REJECTED);

        const canAuthorEdit =
          isAuthor && isOwner && !isLockedUnderReview;
        const canAdminEdit = isAdmin;

        const canShowDelete =
          isAdmin ||
          (isAuthor && isOwner && canDeletePermission && record.status !== CONTENT_STATUSES.PUBLISHED);

        return (
          <Space wrap size={4}>
            {/* Author or Admin Edit */}
            {(canAdminEdit || canAuthorEdit) && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => router.push(`/admin/blogs/${record._id}`)}
              >
                {record.status === CONTENT_STATUSES.PUBLISHED && isAuthor ? "Edit Revision" : "Edit"}
              </Button>
            )}

            {/* If author and locked under review */}
            {isAuthor && isOwner && isLockedUnderReview && (
              <Tooltip title="This post is currently under review by Admin and locked for editing">
                <Tag color="orange">Under Review</Tag>
              </Tooltip>
            )}

            {/* Author Submit for review button (when draft, changes_requested, or rejected) */}
            {isAuthor && isOwner && (record.status === CONTENT_STATUSES.DRAFT || record.status === CONTENT_STATUSES.CHANGES_REQUESTED || record.status === CONTENT_STATUSES.REJECTED) && (
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                loading={actionLoadingId === record._id}
                onClick={() => handleSubmitForReview(record)}
                style={{ color: "#fa8c16" }}
              >
                {record.status === CONTENT_STATUSES.CHANGES_REQUESTED ? "Resubmit" : "Submit for Review"}
              </Button>
            )}

            {/* Author view feedback button */}
            {hasFeedback && (
              <Button
                type="link"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() =>
                  setFeedbackModal({
                    open: true,
                    title: `Review Feedback: ${record.title}`,
                    comments: record.reviewComments || "",
                    reason: record.rejectionReason || "",
                  })
                }
              >
                Feedback
              </Button>
            )}

            {/* Admin review controls for Pending Review items */}
            {isAdmin && (record.status === CONTENT_STATUSES.PENDING_REVIEW || record.pendingRevision?.hasPendingRevision) && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={actionLoadingId === record._id}
                  onClick={() => handleApprove(record)}
                  style={{ color: "#13c2c2" }}
                >
                  Approve
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handlePromptRequestChanges(record)}
                  style={{ color: "#fa8c16" }}
                >
                  Request Changes
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handlePromptReject(record)}
                >
                  Reject
                </Button>
              </>
            )}

            {/* Admin Publish button for Approved or Draft posts */}
            {isAdmin && record.status === CONTENT_STATUSES.APPROVED && (
              <Button
                type="link"
                size="small"
                loading={actionLoadingId === record._id}
                onClick={() => handlePublish(record)}
                style={{ color: "#52c41a" }}
              >
                Publish
              </Button>
            )}

            {/* Delete button (Strictly enforced) */}
            {canShowDelete && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                Delete
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <ThemeAdminCard
      title="Blog posts"
      extra={
        <Space wrap>
          {/* Scope selection: All / My Content / Pending Review */}
          <Radio.Group
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="mine">My Content</Radio.Button>
            {isAdmin && (
              <Radio.Button value="pending_review">
                Pending Review {pendingCount > 0 && <Tag color="orange" style={{ marginLeft: 4 }}>{pendingCount}</Tag>}
              </Radio.Button>
            )}
          </Radio.Group>

          <Input
            prefix={<SearchOutlined />}
            placeholder="Search title, slug, creator"
            allowClear
            style={{ width: 220 }}
            value={searchText}
            onChange={handleSearchChange}
          />

          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 150 }}
            value={filterStatus}
            onChange={handleStatusChange}
            options={[
              { value: CONTENT_STATUSES.DRAFT, label: "Draft" },
              { value: CONTENT_STATUSES.PENDING_REVIEW, label: "Pending Review" },
              { value: CONTENT_STATUSES.CHANGES_REQUESTED, label: "Changes Requested" },
              { value: CONTENT_STATUSES.APPROVED, label: "Approved" },
              { value: CONTENT_STATUSES.PUBLISHED, label: "Published" },
              { value: CONTENT_STATUSES.REJECTED, label: "Rejected" },
            ]}
          />

          <Select
            placeholder="Category"
            allowClear
            style={{ width: 160 }}
            value={filterCategory}
            onChange={handleCategoryChange}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
          />

          {canCreatePermission && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/admin/blogs/new")}
            >
              Add post
            </Button>
          )}
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filtered}
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 800 }}
      />

      {/* Review feedback modal */}
      <Modal
        title={feedbackModal.title}
        open={feedbackModal.open}
        onOk={() => setFeedbackModal({ open: false, title: "", comments: "", reason: "" })}
        onCancel={() => setFeedbackModal({ open: false, title: "", comments: "", reason: "" })}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setFeedbackModal({ open: false, title: "", comments: "", reason: "" })}
          >
            Close
          </Button>,
        ]}
      >
        <div style={{ padding: "8px 0" }}>
          {feedbackModal.comments && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ display: "block", marginBottom: 4, color: "#fa8c16" }}>
                Admin Review Comments:
              </strong>
              <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", padding: 12, borderRadius: 6 }}>
                {feedbackModal.comments}
              </div>
            </div>
          )}
          {feedbackModal.reason && (
            <div>
              <strong style={{ display: "block", marginBottom: 4, color: "#ff4d4f" }}>
                Rejection Reason:
              </strong>
              <div style={{ background: "#fff1f0", border: "1px solid #ffccc7", padding: 12, borderRadius: 6 }}>
                {feedbackModal.reason}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </ThemeAdminCard>
  );
}
