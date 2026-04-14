"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Modal, Descriptions, message } from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminVolunteerFormPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/contacts?submissionType=volunteer")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setList(Array.isArray(data) ? data : data.items || []))
      .catch(() => message.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const markRead = async (id) => {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) return message.error("Failed");
    message.success("Marked as read");
    fetchList();
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this submission?")) return;
    fetch(`/api/admin/contacts/${id}`, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        message.success("Deleted");
        fetchList();
      } else message.error("Delete failed");
    });
  };

  return (
    <ThemeAdminCard title="Volunteer form submissions">
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={list}
        columns={[
          { title: "Name", dataIndex: ["payload", "name"], key: "name" },
          { title: "Email", dataIndex: ["payload", "email"], key: "email" },
          { title: "Phone", dataIndex: ["payload", "phone"], key: "phone" },
          { title: "Message", dataIndex: ["payload", "message"], key: "message", ellipsis: true },
          {
            title: "Read",
            dataIndex: "isRead",
            key: "isRead",
            render: (read, record) =>
              read ? <Tag color="green">Read</Tag> : (
                <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => markRead(record._id)}>
                  Mark read
                </Button>
              ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)} />
                <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)} />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={null}
        title="Submission Details"
        width={600}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{viewItem.payload?.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewItem.payload?.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{viewItem.payload?.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Subject">{viewItem.payload?.subject || "-"}</Descriptions.Item>
            <Descriptions.Item label="Message">{viewItem.payload?.message}</Descriptions.Item>
            <Descriptions.Item label="Page">{viewItem.page || "-"}</Descriptions.Item>
            <Descriptions.Item label="Source">{viewItem.source || "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">{viewItem.isRead ? "Read" : "Unread"}</Descriptions.Item>
            <Descriptions.Item label="Submitted">{formatDateTime(viewItem.createdAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
