"use client";

import Link from "next/link";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  UploadOutlined,
} from "@ant-design/icons";

export default function PopupsTable({
  rows,
  loading,
  updatingId,
  deletingId,
  editEnabled = true,
  toggleEnabled = true,
  publishEnabled = true,
  deleteEnabled = true,
  onToggleStatus,
  onTogglePublish,
  onDelete,
}) {
  const columns = [
    {
      title: "#",
      dataIndex: "order",
      key: "order",
      width: 70,
    },
    {
      title: "Popup",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "Component ID",
      dataIndex: "componentId",
      key: "componentId",
      width: 210,
      render: (value) => <code>{value}</code>,
    },
    {
      title: "Type",
      dataIndex: "isSystem",
      key: "type",
      width: 110,
      render: (isSystem) => (
        <Tag color={isSystem ? "blue" : "gold"}>
          {isSystem ? "System" : "Custom"}
        </Tag>
      ),
    },
    {
      title: "Publish",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === "published" ? "green" : "default"}>
          {status === "published" ? "Published" : "Draft"}
        </Tag>
      ),
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      width: 120,
      render: (enabled) => (
        <Tag color={enabled ? "green" : "default"}>
          {enabled ? "Enabled" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 420,
      render: (_, record) => (
        <Space size="small">
          {editEnabled && (
            <Link
              href={`/admin/popups/edit-${encodeURIComponent(record.componentId)}`}
            >
              <Button type="link" size="small" icon={<EditOutlined />}>
                Edit
              </Button>
            </Link>
          )}
          {publishEnabled && (
            <Button
              type="link"
              size="small"
              icon={<UploadOutlined />}
              loading={updatingId === `${record.componentId}:publish`}
              onClick={() => onTogglePublish(record)}
            >
              {record.status === "published" ? "Unpublish" : "Publish"}
            </Button>
          )}
          {toggleEnabled && (
            <Button
              type="link"
              size="small"
              icon={record.enabled ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={updatingId === `${record.componentId}:enabled`}
              onClick={() => onToggleStatus(record)}
            >
              {record.enabled ? "Disable" : "Enable"}
            </Button>
          )}
          {deleteEnabled && (
            <Popconfirm
              title="Delete popup?"
              description={
                record.isSystem
                  ? "System popups cannot be deleted."
                  : "This will permanently delete this popup."
              }
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, disabled: record.isSystem }}
              onConfirm={() => onDelete(record)}
              disabled={record.isSystem}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.componentId}
                disabled={record.isSystem}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
          {!editEnabled && !toggleEnabled && !publishEnabled && !deleteEnabled ? (
            <span style={{ color: "#999" }}>-</span>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="componentId"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
    />
  );
}
