"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Select, Modal, Descriptions, message, Switch, Typography, Tooltip } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

export default function AdminBlogCommentsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewItem, setViewItem] = useState(null);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  const fetchComments = (p = page, st = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (st) params.set("status", st);
    fetch(`/api/admin/blog-comments?${params}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => { setItems(data.items || []); setTotal(data.total || 0); })
      .catch(() => message.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(1, statusFilter); setPage(1); }, [statusFilter]);

  // Load global comments-enabled state from theme config
  useEffect(() => {
    fetch("/api/theme")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (typeof data.blogCommentsEnabled === "boolean") {
          setCommentsEnabled(data.blogCommentsEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleEnabled = async (checked) => {
    setTogglingEnabled(true);
    const prev = commentsEnabled;
    setCommentsEnabled(checked);
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogCommentsEnabled: checked }),
      });
      if (!res.ok) {
        setCommentsEnabled(prev);
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Failed to update");
      } else {
        message.success(checked ? "Comments enabled globally" : "Comments disabled globally");
      }
    } catch {
      setCommentsEnabled(prev);
      message.error("Failed to update");
    } finally {
      setTogglingEnabled(false);
    }
  };

  const handleStatus = async (id, status) => {
    const res = await fetch("/api/admin/blog-comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      message.success(status === "approved" ? "Comment approved" : "Comment rejected");
      fetchComments(page, statusFilter);
    } else { message.error("Failed"); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete comment?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/blog-comments?id=${id}`, { method: "DELETE" });
        if (res.ok) { message.success("Deleted"); fetchComments(page, statusFilter); }
        else { message.error("Failed"); }
      },
    });
  };

  const STATUS_COLORS = { pending: "orange", approved: "green", rejected: "red" };

  return (
    <ThemeAdminCard
      title="Blog Comments"
      extra={
        <Space wrap>
          <Tooltip title={commentsEnabled ? "Disable comments globally on the website" : "Enable comments globally on the website"}>
            <Space size={6}>
              <Typography.Text style={{ fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
                Comments {commentsEnabled ? "enabled" : "disabled"}
              </Typography.Text>
              <Switch
                checked={commentsEnabled}
                loading={togglingEnabled}
                onChange={handleToggleEnabled}
              />
            </Space>
          </Tooltip>
          <Select
            placeholder="All status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || "")}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={items}
        pagination={{
          current: page, total, pageSize: 20,
          onChange: (p) => { setPage(p); fetchComments(p, statusFilter); },
        }}
        columns={[
          { title: "Blog", key: "blog", width: 180, ellipsis: true, render: (_, r) => r.blogId?.title || "—" },
          { title: "Name", dataIndex: "name", key: "name", width: 140 },
          { title: "Comment", dataIndex: "comment", key: "comment", ellipsis: true },
          {
            title: "Status", dataIndex: "status", key: "status", width: 100,
            render: (s) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag>,
          },
          { title: "Date", dataIndex: "createdAt", key: "date", width: 150, render: (d) => formatDateTime(d) },
          {
            title: "Actions", key: "actions", width: 150,
            render: (_, r) => (
              <Space>
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(r)} />
                {r.status === "pending" && (
                  <>
                    <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: "#52c41a" }} onClick={() => handleStatus(r._id, "approved")} />
                    <Button type="link" size="small" icon={<CloseOutlined />} style={{ color: "#ff4d4f" }} onClick={() => handleStatus(r._id, "rejected")} />
                  </>
                )}
                <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r._id)} />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        title="Comment Details"
        width={600}
        footer={viewItem?.status === "pending" ? (
          <Space>
            <Button icon={<CheckOutlined />} style={{ color: "#52c41a", borderColor: "#52c41a" }} onClick={() => { handleStatus(viewItem._id, "approved"); setViewItem(null); }}>
              Approve
            </Button>
            <Button icon={<CloseOutlined />} danger onClick={() => { handleStatus(viewItem._id, "rejected"); setViewItem(null); }}>
              Reject
            </Button>
          </Space>
        ) : null}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Blog">{viewItem.blogId?.title || "—"}</Descriptions.Item>
            <Descriptions.Item label="Name">{viewItem.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewItem.email}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[viewItem.status]}>{viewItem.status?.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Comment">
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{viewItem.comment}</div>
            </Descriptions.Item>
            <Descriptions.Item label="Date">{formatDateTime(viewItem.createdAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
