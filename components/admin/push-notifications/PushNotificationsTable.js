"use client";

import { Table, Tag, Button, Space, Popconfirm, Tooltip, Typography } from "antd";
import {
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { formatDate } from "@/lib/formatDate";
import { adminTableLocale } from "@/components/admin/loading/AdminLoading";

const { Text } = Typography;

export default function PushNotificationsTable({
  items,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onSendNow,
  onViewDetails,
  onCloneAsDraft,
  sendingId,
  deletingId,
}) {
  const getTypeTag = (type) => {
    switch (type) {
      case "event":
        return <Tag color="purple">Event</Tag>;
      case "campaign":
        return <Tag color="green">Campaign</Tag>;
      default:
        return <Tag color="blue">Announcement</Tag>;
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "sent":
        return <Tag color="success">Sent</Tag>;
      case "sending":
        return (
          <Tag icon={<ReloadOutlined spin />} color="processing">
            Sending
          </Tag>
        );
      case "failed":
        return <Tag color="error">Failed</Tag>;
      default:
        return <Tag>Draft</Tag>;
    }
  };

  const columns = [
    {
      title: "Notification",
      key: "notification",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {record.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={record.imageUrl}
              alt="Thumbnail"
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                objectFit: "cover",
                border: "1px solid #e8e8e8",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 14, display: "block" }}>
              {record.title}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: "block",
                maxWidth: 360,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record.message}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type) => getTypeTag(type),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Delivery Stats",
      key: "stats",
      width: 160,
      render: (_, record) => {
        if (record.status !== "sent") {
          return <Text type="secondary">—</Text>;
        }
        const s = record.stats || {};
        const success = s.successfulSends || 0;
        const totalSubs = s.totalSubscribers || 0;
        const percent = totalSubs > 0 ? Math.round((success / totalSubs) * 100) : 100;

        return (
          <Tooltip
            title={`Delivered: ${success} | Failed: ${s.failedSends || 0} | Expired Pruned: ${
              s.expiredCleaned || 0
            }`}
          >
            <div>
              <Text strong style={{ color: percent >= 80 ? "#389e0d" : "#1890ff" }}>
                {success} / {totalSubs}
              </Text>{" "}
              <Text type="secondary" style={{ fontSize: 11 }}>
                ({percent}%)
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Sent / Created",
      key: "date",
      width: 150,
      render: (_, record) => (
        <span style={{ fontSize: 13 }}>
          {formatDate(record.sentAt || record.createdAt)}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      align: "right",
      render: (_, record) => {
        const isDraft = record.status === "draft";
        const isSending = record.status === "sending" || sendingId === record._id;
        const isDeleting = deletingId === record._id;

        if (isDraft) {
          return (
            <Space size="small">
              <Popconfirm
                title="Send notification now?"
                description="This will instantly broadcast this notification to all active subscribers."
                onConfirm={() => onSendNow(record)}
                okText="Send"
                okType="danger"
                cancelText="Cancel"
                disabled={isSending}
              >
                <Button
                  type="primary"
                  size="small"
                  danger
                  icon={<SendOutlined />}
                  loading={isSending}
                  data-testid="table-send-btn"
                >
                  Send
                </Button>
              </Popconfirm>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                disabled={isSending}
                data-testid="table-edit-btn"
              />
              <Popconfirm
                title="Delete draft notification?"
                onConfirm={() => onDelete(record)}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                  data-testid="table-delete-btn"
                />
              </Popconfirm>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
              data-testid="table-details-btn"
            >
              Details
            </Button>
            <Tooltip title="Clone as new draft">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onCloneAsDraft(record)}
                data-testid="table-clone-btn"
              />
            </Tooltip>
            {record.status === "failed" && (
              <Popconfirm
                title="Retry sending notification?"
                onConfirm={() => onSendNow(record)}
                okText="Retry"
                okType="danger"
              >
                <Button
                  size="small"
                  danger
                  icon={<ReloadOutlined />}
                  loading={isSending}
                  data-testid="table-retry-btn"
                >
                  Retry
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Delete notification record?"
              description="Remove this notification from the list?"
              onConfirm={() => onDelete(record)}
              okText="Delete"
              okType="danger"
              cancelText="Cancel"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
                data-testid="table-delete-btn"
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="_id"
      columns={columns}
      dataSource={items}
      loading={loading}
      locale={adminTableLocale}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        onChange: onPageChange,
        showTotal: (t) => `Total ${t} notifications`,
      }}
    />
  );
}
