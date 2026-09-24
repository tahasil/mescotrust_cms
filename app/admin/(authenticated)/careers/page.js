"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "New", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Rejected", value: "rejected" },
  { label: "Hired", value: "hired" },
];

const STATUS_COLORS = {
  new: "blue",
  reviewed: "orange",
  shortlisted: "purple",
  rejected: "red",
  hired: "green",
};

export default function AdminCareersPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchApplications = useCallback(
    async (currentPage = page, currentSearch = search, currentStatus = statusFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
          search: currentSearch,
          status: currentStatus,
        });
        const res = await fetch(`/api/admin/careers?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setList(data.applications || []);
          setTotal(data.total || 0);
        } else {
          message.error(data.error || "Failed to load applications");
        }
      } catch {
        message.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, search, statusFilter]
  );

  useEffect(() => {
    fetchApplications(page, search, statusFilter);
  }, [fetchApplications, page, search, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/careers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        message.success("Status updated");
        fetchApplications();
      } else {
        message.error("Failed to update status");
      }
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/careers/${encodeURIComponent(selectedApp._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        message.success("Notes saved");
        setDetailsOpen(false);
        fetchApplications();
      } else {
        message.error("Failed to save notes");
      }
    } catch {
      message.error("Failed to save notes");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/careers/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        message.success("Application deleted");
        fetchApplications();
      } else {
        message.error("Failed to delete application");
      }
    } catch {
      message.error("Failed to delete application");
    }
  };

  const columns = [
    {
      title: "Candidate",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.email} • {record.phone}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Position Applied",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          {record.experience ? (
            <Tag color="geekblue" style={{ marginTop: 4 }}>
              Exp: {record.experience}
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: "Resume",
      dataIndex: "resumeUrl",
      key: "resumeUrl",
      width: 120,
      render: (url) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button size="small" icon={<DownloadOutlined />}>
              Resume
            </Button>
          </a>
        ) : (
          <Typography.Text type="secondary">N/A</Typography.Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => (
        <Select
          size="small"
          value={status || "new"}
          style={{ width: 130 }}
          onChange={(val) => handleStatusChange(record._id, val)}
          options={STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => ({
            label: <Tag color={STATUS_COLORS[o.value] || "default"}>{o.label}</Tag>,
            value: o.value,
          }))}
        />
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (val) => formatDateTime(val),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedApp(record);
              setNotes(record.notes || "");
              setDetailsOpen(true);
            }}
            title="View details & notes"
          />
          <Popconfirm
            title="Delete this application?"
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okType="danger"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ThemeAdminCard
        title="Career Applications"
        extra={
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search candidate/position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={STATUS_OPTIONS}
              style={{ width: 140 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchApplications(page, search, statusFilter)}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={list}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (t) => `Total ${t} applications`,
          }}
        />
      </ThemeAdminCard>

      <Modal
        title={selectedApp ? `Application: ${selectedApp.name}` : "Application Details"}
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        onOk={handleSaveNotes}
        okText="Save Notes"
        confirmLoading={updating}
        width={600}
      >
        {selectedApp ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <strong>Position:</strong> {selectedApp.jobTitle}
            </div>
            <div>
              <strong>Email:</strong> {selectedApp.email} | <strong>Phone:</strong> {selectedApp.phone}
            </div>
            {selectedApp.currentOrganization ? (
              <div>
                <strong>Current Organization:</strong> {selectedApp.currentOrganization}
              </div>
            ) : null}
            {selectedApp.experience ? (
              <div>
                <strong>Experience:</strong> {selectedApp.experience}
              </div>
            ) : null}
            {selectedApp.coverLetter ? (
              <div>
                <strong>Cover Letter / Pitch:</strong>
                <div
                  style={{
                    marginTop: 6,
                    padding: 12,
                    background: "#f8f9fa",
                    borderRadius: 6,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedApp.coverLetter}
                </div>
              </div>
            ) : null}
            <div>
              <strong>Internal Notes:</strong>
              <Input.TextArea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add hiring team notes, interview feedback..."
                style={{ marginTop: 6 }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
