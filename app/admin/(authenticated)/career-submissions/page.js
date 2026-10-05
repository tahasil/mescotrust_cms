"use client";

import { useEffect, useState } from "react";
import { Button, Descriptions, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { CheckOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "New / Unread", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminCareerSubmissionsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [positionOptions, setPositionOptions] = useState([]);
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
      if (positionFilter && positionFilter !== "all") params.set("position", positionFilter);

      const res = await fetch(`/api/admin/career-submissions?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      setItems(data?.items || []);
      setTotal(data?.total || 0);
      if (Array.isArray(data?.positions)) {
        setPositionOptions(data.positions);
      }
    } catch (err) {
      message.error(err?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, pageSize, statusFilter, positionFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/career-submissions/${id}`, {
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
      title: "Delete Submission",
      content: "Are you sure you want to permanently delete this career application and attached resume?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/career-submissions/${id}`, { method: "DELETE" });
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
        await fetch(`/api/admin/career-submissions/${record._id}`, {
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
      title: "Applied Position",
      dataIndex: "position",
      key: "position",
      render: (val) => <Tag color="blue">{val || "General Application"}</Tag>,
    },
    {
      title: "Experience / City",
      key: "details",
      render: (_, r) => (
        <div style={{ fontSize: 13 }}>
          <div>{r.experience || "Not specified"}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{r.currentCity || "-"}</div>
        </div>
      ),
    },
    {
      title: "Resume / CV",
      key: "resume",
      render: (_, r) => {
        if (!r.resume?.url) return <span style={{ color: "#999" }}>No CV</span>;
        return (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={r.resume.url}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            Download ({r.resume.originalName || "Resume"})
          </Button>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val, r) => {
        const colorMap = {
          new: "orange",
          reviewed: "cyan",
          shortlisted: "green",
          rejected: "red",
          archived: "default",
        };
        return (
          <Select
            size="small"
            value={val || "new"}
            style={{ width: 120 }}
            onChange={(newStatus) => handleStatusChange(r._id, newStatus)}
            options={[
              { label: "New", value: "new" },
              { label: "Reviewed", value: "reviewed" },
              { label: "Shortlisted", value: "shortlisted" },
              { label: "Rejected", value: "rejected" },
              { label: "Archived", value: "archived" },
            ]}
          />
        );
      },
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
        <Space orientation="horizontal" size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openViewModal(r)}
            title="View Details"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(r._id)}
            title="Delete"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ThemeAdminCard
        title="Career & Resume Submissions"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchItems}>
            Refresh
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 20, width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input
              placeholder="Search candidate name, email, phone..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 280 }}
              allowClear
            />
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={STATUS_OPTIONS}
            />
            {positionOptions.length > 0 && (
              <Select
                value={positionFilter}
                onChange={setPositionFilter}
                style={{ width: 200 }}
                options={[
                  { label: "All Positions", value: "all" },
                  ...positionOptions.map((pos) => ({ label: pos, value: pos })),
                ]}
              />
            )}
          </Space>
          <span style={{ fontSize: 13, color: "#666" }}>Total Applicants: {total}</span>
        </Space>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={items}
          loading={adminTableLoading(loading)}
          locale={adminTableLocale(loading)}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </ThemeAdminCard>

      <Modal
        title="Candidate Application Details"
        open={Boolean(viewItem)}
        onCancel={() => setViewItem(null)}
        footer={[
          viewItem?.resume?.url && (
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
          ),
          <Button key="close" onClick={() => setViewItem(null)}>
            Close
          </Button>,
        ]}
        width={720}
      >
        {viewItem && (
          <Descriptions bordered column={1} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Candidate Full Name">
              <strong>{viewItem.fullName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Email Address">
              <a href={`mailto:${viewItem.email}`}>{viewItem.email}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Phone / Mobile">
              <a href={`tel:${viewItem.phone}`}>{viewItem.phone}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Position Applied For">
              <Tag color="blue">{viewItem.position || "General Application"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Highest Qualification">
              {viewItem.qualification || "Not provided"}
            </Descriptions.Item>
            <Descriptions.Item label="Total Experience">
              {viewItem.experience || "Not provided"}
            </Descriptions.Item>
            <Descriptions.Item label="Current City / Location">
              {viewItem.currentCity || "Not provided"}
            </Descriptions.Item>
            <Descriptions.Item label="Cover Letter / Message">
              <div style={{ whiteSpace: "pre-wrap", background: "#f8f9fa", padding: 12, borderRadius: 6 }}>
                {viewItem.coverLetter || "No cover letter provided."}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Resume File">
              {viewItem.resume?.url ? (
                <Space>
                  <span>📎 {viewItem.resume.originalName || "Resume"}</span>
                  <span style={{ color: "#888", fontSize: 12 }}>
                    ({(viewItem.resume.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </Space>
              ) : (
                <span style={{ color: "#999" }}>No file attached</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Application Date">
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Application Status">
              <Select
                value={viewItem.status || "new"}
                style={{ width: 160 }}
                onChange={(newStatus) => handleStatusChange(viewItem._id, newStatus)}
                options={[
                  { label: "New", value: "new" },
                  { label: "Reviewed", value: "reviewed" },
                  { label: "Shortlisted", value: "shortlisted" },
                  { label: "Rejected", value: "rejected" },
                  { label: "Archived", value: "archived" },
                ]}
              />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
