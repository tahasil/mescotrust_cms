"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Table, Button, Space, Tag, Modal, Descriptions, message } from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";

function toTitleCaseFromSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function decodeRouteParam(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const plusNormalized = raw.replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusNormalized);
  } catch {
    return plusNormalized;
  }
}

export default function FormSubmissionsPage() {
  const params = useParams();
  const rawFormIdentifier = String(params?.formKey || "").trim();
  const formIdentifier = decodeRouteParam(rawFormIdentifier);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [formName, setFormName] = useState(toTitleCaseFromSlug(formIdentifier));

  const cardTitle = useMemo(
    () => formName || toTitleCaseFromSlug(formIdentifier),
    [formIdentifier, formName],
  );

  const fetchList = () => {
    if (!formIdentifier) return;
    setLoading(true);
    fetch(`/api/admin/form-submissions?form=${encodeURIComponent(formIdentifier)}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        setList(items);
        setFormName(
          String(data?.form?.name || "").trim() || toTitleCaseFromSlug(formIdentifier),
        );
      })
      .catch(() => message.error("Failed to load submissions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [formIdentifier]);

  const markRead = async (submissionId) => {
    const res = await fetch(`/api/admin/form-submissions/${encodeURIComponent(submissionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) return message.error("Failed");
    message.success("Marked as read");
    fetchList();
  };

  const handleDelete = (submissionId) => {
    if (!confirm("Delete this submission?")) return;
    fetch(`/api/admin/form-submissions/${encodeURIComponent(submissionId)}`, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        message.success("Deleted");
        fetchList();
      } else message.error("Delete failed");
    });
  };

  const renderPayloadValue = (value) => {
    if (value == null || value === "") return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <ThemeAdminCard title={cardTitle}>
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={list}
        columns={[
          { title: "Name", dataIndex: ["payload", "name"], key: "name", render: (v) => v || "—" },
          { title: "Email", dataIndex: ["payload", "email"], key: "email", render: (v) => v || "—" },
          { title: "Phone", dataIndex: ["payload", "phone"], key: "phone", render: (v) => v || "—" },
          { title: "Type", dataIndex: ["payload", "profileType"], key: "profileType", render: (v) => v || "—" },
          { title: "Message", dataIndex: ["payload", "message"], key: "message", ellipsis: true, render: (v) => v || "—" },
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
        width={680}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            {Object.entries(viewItem.payload || {}).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {renderPayloadValue(value)}
              </Descriptions.Item>
            ))}
            <Descriptions.Item label="Page">{viewItem.page || "—"}</Descriptions.Item>
            <Descriptions.Item label="Source">{viewItem.source || "—"}</Descriptions.Item>
            <Descriptions.Item label="Status">{viewItem.isRead ? "Read" : "Unread"}</Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {formatDateTime(viewItem.submittedAt || viewItem.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
