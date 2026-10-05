"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Modal, Descriptions, message } from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import AdminExportDropdown from "@/components/admin/AdminExportDropdown";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";

const CONTACT_EXPORT_COLUMNS = [
  { key: "submitted_at", label: "Submitted At" },
  { key: "status", label: "Status" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "subject", label: "Subject" },
  { key: "message", label: "Message" },
  { key: "page", label: "Page" },
  { key: "source", label: "Source" },
];

export default function AdminContactsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/contacts?submissionType=contact")
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
    Modal.confirm({
      title: "Delete this submission?",
      content: "Are you sure you want to remove this submission?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        const res = await fetch(`/api/admin/contacts/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          throw new Error(data.error || "Delete failed");
        }
        message.success("Deleted");
        fetchList();
      },
    });
  };

  return (
    <ThemeAdminCard
      title="Contact Us submissions"
      extra={
        <Space wrap>
          <AdminExportDropdown
            exportUrl="/api/admin/contacts/export?submissionType=contact"
            filters={{}}
            availableColumns={CONTACT_EXPORT_COLUMNS}
            defaultFilename="contact-submissions"
          />
          <Button icon={<ReloadOutlined />} onClick={fetchList}>
            Refresh
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
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
            <Descriptions.Item label="Phone">{viewItem.payload?.phone || "—"}</Descriptions.Item>
            <Descriptions.Item label="Subject">{viewItem.payload?.subject || "—"}</Descriptions.Item>
            <Descriptions.Item label="Message">{viewItem.payload?.message}</Descriptions.Item>
            <Descriptions.Item label="Page">{viewItem.page || "—"}</Descriptions.Item>
            <Descriptions.Item label="Source">{viewItem.source || "—"}</Descriptions.Item>
            <Descriptions.Item label="Status">{viewItem.isRead ? "Read" : "Unread"}</Descriptions.Item>
            <Descriptions.Item label="Submitted">{formatDateTime(viewItem.createdAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
