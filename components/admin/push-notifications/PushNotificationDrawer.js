"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  Popconfirm,
  Typography,
  Card,
  Divider,
} from "antd";
import {
  SendOutlined,
  SaveOutlined,
  NotificationOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";

const { Text } = Typography;

export default function PushNotificationDrawer({
  open,
  onClose,
  initialValues,
  onSubmit,
  loading,
}) {
  const [form] = Form.useForm();
  const [previewValues, setPreviewValues] = useState({});

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          title: initialValues.title || "",
          message: initialValues.message || "",
          type: initialValues.type || "announcement",
          clickUrl: initialValues.clickUrl || "/",
          imageUrl: initialValues.imageUrl || "",
        });
        setPreviewValues(initialValues);
      } else {
        form.resetFields();
        const defaults = {
          title: "",
          message: "",
          type: "announcement",
          clickUrl: "/",
          imageUrl: "",
        };
        form.setFieldsValue(defaults);
        setPreviewValues(defaults);
      }
    }
  }, [open, initialValues, form]);

  const handleValuesChange = (_, allValues) => {
    setPreviewValues({ ...allValues });
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({ ...values, sendImmediately: false });
    } catch {
      /* form validation error */
    }
  };

  const handleSendImmediately = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({ ...values, sendImmediately: true });
    } catch {
      /* form validation error */
    }
  };

  const isEditing = Boolean(initialValues?._id);

  return (
    <Drawer
      title={isEditing ? "Edit Draft Notification" : "Create Push Notification"}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      rootClassName="push-notification-drawer"
      extra={
        <Space>
          <Button onClick={onClose} disabled={loading} data-testid="cancel-drawer-btn">
            Cancel
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            loading={loading}
            data-testid="save-draft-btn"
          >
            Save as Draft
          </Button>
          <Popconfirm
            title="Broadcast Notification Now?"
            description="This will instantly deliver this push notification to all active browser subscribers. Are you sure?"
            onConfirm={handleSendImmediately}
            okText="Send Now"
            okType="danger"
            cancelText="Cancel"
            disabled={loading}
          >
            <Button
              type="primary"
              danger
              icon={<SendOutlined />}
              loading={loading}
              data-testid="send-now-drawer-btn"
            >
              Send Now
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          type: "announcement",
          clickUrl: "/",
        }}
      >
        <Form.Item
          label="Notification Title"
          name="title"
          rules={[
            { required: true, message: "Please enter a notification title" },
            { max: 120, message: "Title cannot exceed 120 characters" },
          ]}
        >
          <Input
            placeholder="e.g. Annual Educational Scholarship Scheme 2026"
            showCount
            maxLength={120}
          />
        </Form.Item>

        <Form.Item
          label="Notification Message"
          name="message"
          rules={[
            { required: true, message: "Please enter a message" },
            { max: 300, message: "Message cannot exceed 300 characters" },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. Applications are now open for Higher Education Aid. Click to view eligibility criteria and apply online."
            showCount
            maxLength={300}
          />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Item
            label="Notification Type"
            name="type"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "announcement", label: "General Announcement" },
                { value: "event", label: "Event" },
                { value: "campaign", label: "Campaign" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Click URL (Destination)"
            name="clickUrl"
            extra="Relative path or full link"
          >
            <Input placeholder="/events/annual-meet" />
          </Form.Item>
        </div>

        <Form.Item
          label="Notification Image / Banner (Optional)"
          name="imageUrl"
          extra="Optional rich preview image displayed inside the browser alert"
        >
          <MediaPickerInput placeholder="/media/... or image URL" />
        </Form.Item>

        <Divider orientation="left">
          <Space>
            <EyeOutlined />
            <span>Live OS Notification Preview</span>
          </Space>
        </Divider>

        {/* Mock OS Push Notification Box */}
        <Card
          size="small"
          style={{
            background: "#f8f9fa",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "#E03C33",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <NotificationOutlined style={{ fontSize: 18 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {previewValues.title || "MESCO Trust Alert Title"}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  just now
                </Text>
              </div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "block",
                  lineHeight: 1.45,
                  marginTop: 3,
                }}
              >
                {previewValues.message ||
                  "Notification message body preview will appear here as you type."}
              </Text>
              {previewValues.clickUrl && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#1890ff",
                    display: "block",
                    marginTop: 4,
                  }}
                >
                  Opens: {previewValues.clickUrl}
                </Text>
              )}
            </div>
          </div>
          {previewValues.imageUrl && (
            <div style={{ marginTop: 10, borderRadius: 6, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewValues.imageUrl}
                alt="Banner preview"
                style={{
                  width: "100%",
                  maxHeight: 140,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}
        </Card>
      </Form>
    </Drawer>
  );
}
