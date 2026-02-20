"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, message } from "antd";
import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";

export default function AdminContactsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/contacts")
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
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
    <>
      <h1 style={{ marginBottom: 16 }}>Contact submissions</h1>
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={list}
        columns={[
          { title: "Name", dataIndex: ["payload", "name"], key: "name" },
          { title: "Email", dataIndex: ["payload", "email"], key: "email" },
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
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>
                Delete
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
