"use client";

import { Modal, Descriptions, Tag, Typography, Row, Col, Card, Statistic, Progress, Button, Divider } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { formatDate } from "@/lib/formatDate";

const { Text } = Typography;

export default function PushNotificationDetailsModal({
  open,
  onClose,
  notification,
}) {
  if (!notification) return null;

  const stats = notification.stats || {};
  const total = stats.totalSubscribers || 0;
  const success = stats.successfulSends || 0;
  const failed = stats.failedSends || 0;
  const expired = stats.expiredCleaned || 0;

  const rate = total > 0 ? Math.round((success / total) * 100) : 100;

  const getTypeTag = (type) => {
    switch (type) {
      case "event":
        return <Tag color="purple">Event</Tag>;
      case "campaign":
        return <Tag color="green">Campaign</Tag>;
      default:
        return <Tag color="blue">General Announcement</Tag>;
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "sent":
        return <Tag color="success">Sent</Tag>;
      case "sending":
        return <Tag color="processing">Sending...</Tag>;
      case "failed":
        return <Tag color="error">Failed</Tag>;
      default:
        return <Tag>Draft</Tag>;
    }
  };

  return (
    <Modal
      title="Notification Delivery & Details"
      open={open}
      onOk={onClose}
      onCancel={onClose}
      width={680}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {/* Metrics Row */}
      {notification.status === "sent" && (
        <div style={{ marginBottom: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card size="small" bordered style={{ textAlign: "center" }}>
                <Statistic
                  title="Targeted"
                  value={total}
                  prefix={<SendOutlined style={{ color: "#1890ff" }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered style={{ textAlign: "center" }}>
                <Statistic
                  title="Delivered"
                  value={success}
                  valueStyle={{ color: "#52c41a" }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered style={{ textAlign: "center" }}>
                <Statistic
                  title="Pruned Expired"
                  value={expired}
                  valueStyle={{ color: "#fa8c16" }}
                  prefix={<DeleteOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered style={{ textAlign: "center" }}>
                <Statistic
                  title="Failed"
                  value={failed}
                  valueStyle={{ color: "#ff4d4f" }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 14, padding: "0 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Text strong style={{ fontSize: 13 }}>
                Delivery Handoff Rate
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {rate}% ({success}/{total})
              </Text>
            </div>
            <Progress
              percent={rate}
              status={rate >= 80 ? "success" : "normal"}
              strokeColor={rate >= 80 ? "#52c41a" : "#1890ff"}
            />
          </div>
          <Divider style={{ margin: "16px 0" }} />
        </div>
      )}

      {/* Descriptions */}
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Title">
          <Text strong>{notification.title}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Message">
          {notification.message}
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          {getTypeTag(notification.type)}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {getStatusTag(notification.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Click URL">
          <a
            href={notification.clickUrl || "/"}
            target="_blank"
            rel="noopener noreferrer"
          >
            {notification.clickUrl || "/"}
          </a>
        </Descriptions.Item>
        {notification.sentAt && (
          <Descriptions.Item label="Sent At">
            {formatDate(notification.sentAt)}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Created At">
          {formatDate(notification.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {notification.createdBy || "Admin"}
        </Descriptions.Item>
        {notification.imageUrl && (
          <Descriptions.Item label="Banner Image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={notification.imageUrl}
              alt="Notification banner"
              style={{
                maxWidth: "100%",
                maxHeight: 180,
                borderRadius: 6,
                marginTop: 4,
              }}
            />
          </Descriptions.Item>
        )}
        {notification.errorMessage && (
          <Descriptions.Item label="Error Log">
            <Text type="danger">{notification.errorMessage}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
}
