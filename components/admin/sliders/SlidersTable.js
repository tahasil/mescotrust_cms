"use client";

import Link from "next/link";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import { DeleteOutlined, EditOutlined, SyncOutlined } from "@ant-design/icons";

export default function SlidersTable({
  rows,
  loading,
  updatingId,
  deletingId,
  editEnabled = true,
  toggleEnabled = true,
  deleteEnabled = false,
  onToggleStatus,
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
      title: "Slider",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "Component ID",
      dataIndex: "componentId",
      key: "componentId",
      width: 170,
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
      title: "Status",
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
      width: 320,
      render: (_, record) => (
        <Space size="small">
          {editEnabled && (
            <Link
              href={`/admin/sliders/edit-${encodeURIComponent(record.componentId)}`}
            >
              <Button type="link" size="small" icon={<EditOutlined />}>
                Edit
              </Button>
            </Link>
          )}
          {toggleEnabled && (
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              loading={updatingId === record.componentId}
              onClick={() => onToggleStatus(record)}
            >
              {record.enabled ? "Disable" : "Enable"}
            </Button>
          )}
          {deleteEnabled && (
            <Popconfirm
              title="Delete slider?"
              description={
                record.isSystem
                  ? "System sliders cannot be deleted."
                  : "This will remove slider files and metadata."
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
          {!editEnabled && !toggleEnabled && !deleteEnabled ? <span style={{ color: "#999" }}>-</span> : null}
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
