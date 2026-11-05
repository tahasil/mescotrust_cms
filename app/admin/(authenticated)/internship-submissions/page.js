"use client";

import { useEffect, useState } from "react";
import { Button, Descriptions, Input, Modal, Select, Space, Table, Tag, Tooltip, message } from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import AdminExportDropdown from "@/components/admin/AdminExportDropdown";

const INTERNSHIP_EXPORT_COLUMNS = [
  { key: "submitted_at", label: "Submitted At" },
  { key: "fullName", label: "Candidate Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "roleTitle", label: "Applied Role / Department" },
  { key: "customRole", label: "Specified Role (Other)" },
  { key: "roleCategory", label: "Role Category" },
  { key: "skills", label: "Eligibility & Skills" },
  { key: "workMode", label: "Work Mode" },
  { key: "duration", label: "Duration & Stipend" },
  { key: "startDate", label: "Start Date / Availability" },
  { key: "currentCity", label: "Current City" },
  { key: "status", label: "Status" },
  { key: "resumeName", label: "Resume Filename" },
  { key: "resumeUrl", label: "Resume URL" },
  { key: "statement", label: "Statement of Interest" },
  { key: "sourcePage", label: "Source Page" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "New / Unread", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminInternshipSubmissionsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleOptions, setRoleOptions] = useState([]);
  const [viewItem, setViewItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/internship-submissions?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch internship submissions");
      const data = await res.json();
      setItems(data?.items || []);
      setTotal(data?.total || 0);
      if (Array.isArray(data?.roles)) {
        setRoleOptions(data.roles);
      }
    } catch (err) {
      message.error(err?.message || "Failed to load internship submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, pageSize, statusFilter, roleFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/internship-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, isRead: true }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      message.success("Status updated");
      fetchItems();
      if (viewItem && viewItem._id === id) {
        setViewItem((prev) => ({ ...prev, status: newStatus, isRead: true }));
      }
    } catch (err) {
      message.error(err?.message || "Failed to update");
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Internship Submission",
      content:
        "Are you sure you want to permanently delete this internship application and attached resume?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/internship-submissions/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete");
          message.success("Submission deleted");
          if (viewItem?._id === id) setViewItem(null);
          fetchItems();
        } catch (err) {
          message.error(err?.message || "Failed to delete");
        }
      },
    });
  };

  const openViewModal = async (record) => {
    setViewItem(record);
    if (!record.isRead) {
      try {
        await fetch(`/api/admin/internship-submissions/${record._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        setItems((prev) =>
          prev.map((item) => (item._id === record._id ? { ...item, isRead: true } : item)),
        );
      } catch {
        // silent
      }
    }
  };

  const columns = [
    {
      title: "Candidate",
      key: "candidate",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--theme-black, #2a283e)" }}>
            {r.fullName}
            {!r.isRead && (
              <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>
                NEW
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>{r.email}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{r.phone}</div>
        </div>
      ),
    },
    {
      title: "Applied Role / Department",
      dataIndex: "roleTitle",
      key: "roleTitle",
      render: (val, r) => (
        <Space size={4} wrap>
          <Tag color="blue">{val || "General Internship"}</Tag>
          {r?.roleCategory === "Other" && <Tag color="purple">Other</Tag>}
        </Space>
      ),
    },
    {
      title: "Work Mode / City",
      key: "workMode",
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.workMode || "Not specified"}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{r.currentCity || "-"}</div>
        </div>
      ),
    },
    {
      title: "Duration / Start Date",
      key: "duration",
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.duration || "-"}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{r.startDate ? `From: ${r.startDate}` : "-"}</div>
        </div>
      ),
    },
    {
      title: "Resume / CV",
      key: "resume",
      width: 170,
      render: (_, r) => {
        if (!r.resume?.url) {
          return <span style={{ color: "#aaa", fontSize: 12 }}>No CV</span>;
        }
        const fileName = r.resume.originalName || r.resume.filename || "Resume";
        return (
          <Tooltip title={`Download ${fileName}`} placement="topLeft">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              href={r.resume.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: 0,
                maxWidth: 155,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  maxWidth: 130,
                }}
              >
                {fileName}
              </span>
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val, r) => (
        <Select
          size="small"
          value={val || "new"}
          style={{ width: 120 }}
          onChange={(newVal) => handleStatusChange(r._id, newVal)}
          options={[
            { label: "New", value: "new" },
            { label: "Reviewed", value: "reviewed" },
            { label: "Shortlisted", value: "shortlisted" },
            { label: "Rejected", value: "rejected" },
          ]}
        />
      ),
    },
    {
      title: "Applied On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val) => formatDateTime(val),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            title="View Details"
            onClick={() => openViewModal(r)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            title="Delete"
            onClick={() => handleDelete(r._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 0 24px 0" }}>
      <ThemeAdminCard
        title="Internship Submissions"
        extra={
          <Space>
            <AdminExportDropdown
              exportUrl="/api/admin/internship-submissions/export"
              filters={{
                search,
                status: statusFilter !== "all" ? statusFilter : "",
                roleTitle: roleFilter !== "all" ? roleFilter : "",
              }}
              availableColumns={INTERNSHIP_EXPORT_COLUMNS}
              defaultFilename="internship-submissions-export"
            />
            <Button icon={<ReloadOutlined />} onClick={fetchItems} loading={loading}>
              Refresh
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Input.Search
            placeholder="Search candidate name, email, phone, role, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            style={{ width: 150 }}
            options={STATUS_OPTIONS}
          />
          <Select
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
            style={{ minWidth: 200 }}
            options={[
              { label: "All Roles / Departments", value: "all" },
              ...roleOptions.map((role) => ({ label: role, value: role })),
            ]}
          />
          <div style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
            Total Applicants: <strong>{total}</strong>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="_id"
          loading={adminTableLoading(loading)}
          locale={adminTableLocale("No internship submissions found")}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
          }}
        />
      </ThemeAdminCard>

      {/* Details View Modal */}
      <Modal
        title={
          <Space>
            <span>Internship Application Details</span>
            {viewItem?.roleCategory === "Other" && <Tag color="purple">Other Custom Role</Tag>}
          </Space>
        }
        open={Boolean(viewItem)}
        onCancel={() => setViewItem(null)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setViewItem(null)}>
            Close
          </Button>,
          viewItem?.resume?.url ? (
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              href={viewItem.resume.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Resume
            </Button>
          ) : null,
        ]}
      >
        {viewItem && (
          <Descriptions bordered column={2} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Candidate Name" span={1}>
              <strong>{viewItem.fullName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Select
                size="small"
                value={viewItem.status || "new"}
                style={{ width: 140 }}
                onChange={(newVal) => handleStatusChange(viewItem._id, newVal)}
                options={[
                  { label: "New", value: "new" },
                  { label: "Reviewed", value: "reviewed" },
                  { label: "Shortlisted", value: "shortlisted" },
                  { label: "Rejected", value: "rejected" },
                ]}
              />
            </Descriptions.Item>

            <Descriptions.Item label="Email" span={1}>
              <a href={`mailto:${viewItem.email}`}>{viewItem.email}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Phone" span={1}>
              <a href={`tel:${viewItem.phone}`}>{viewItem.phone}</a>
            </Descriptions.Item>

            <Descriptions.Item label="Applied Role" span={1}>
              <Tag color="blue">{viewItem.roleTitle}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Role Category" span={1}>
              {viewItem.roleCategory === "Other" ? (
                <Tag color="purple">Other (Specified by applicant)</Tag>
              ) : (
                <Tag color="cyan">Active Opening</Tag>
              )}
            </Descriptions.Item>

            {viewItem.customRole && (
              <Descriptions.Item label="Custom Role Specified" span={2}>
                <span style={{ fontWeight: 600, color: "#722ed1" }}>{viewItem.customRole}</span>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Location & Work Mode" span={1}>
              {viewItem.workMode || "Not specified"}
            </Descriptions.Item>
            <Descriptions.Item label="Current City" span={1}>
              {viewItem.currentCity || "Not provided"}
            </Descriptions.Item>

            <Descriptions.Item label="Internship Duration" span={1}>
              {viewItem.duration || "Not specified"}
            </Descriptions.Item>
            <Descriptions.Item label="Start Date / Availability" span={1}>
              {viewItem.startDate || "Immediate / Not specified"}
            </Descriptions.Item>

            <Descriptions.Item label="Eligibility & Skills" span={2}>
              {viewItem.skills || "Not provided"}
            </Descriptions.Item>

            <Descriptions.Item label="Description & Statement of Interest" span={2}>
              <div style={{ whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}>
                {viewItem.statement || "No message provided."}
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Resume Document" span={2}>
              {viewItem.resume?.url ? (
                <Space>
                  <DownloadOutlined />
                  <a href={viewItem.resume.url} target="_blank" rel="noopener noreferrer">
                    {viewItem.resume.originalName || viewItem.resume.filename}
                  </a>
                  {viewItem.resume.size ? (
                    <span style={{ color: "#888", fontSize: 12 }}>
                      ({(viewItem.resume.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  ) : null}
                </Space>
              ) : (
                <span style={{ color: "#aaa" }}>No document attached</span>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Submitted On" span={1}>
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Source Page" span={1}>
              {viewItem.sourcePage || viewItem.source || "/internships"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

