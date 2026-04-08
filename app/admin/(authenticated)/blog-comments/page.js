"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Select, Modal, message } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

export default function AdminBlogCommentsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

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
            title: "Actions", key: "actions", width: 120,
            render: (_, r) => (
              <Space>
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
    </ThemeAdminCard>
  );
}
