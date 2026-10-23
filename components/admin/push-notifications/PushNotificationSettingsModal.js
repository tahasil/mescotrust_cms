"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Switch,
  Space,
  message,
  Typography,
  Card,
  Divider,
} from "antd";
import { SettingOutlined, SaveOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function PushNotificationSettingsModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewValues, setPreviewValues] = useState({});

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/admin/push-notifications/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.settings) {
            form.setFieldsValue(data.settings);
            setPreviewValues(data.settings);
          }
        })
        .catch(() => {
          message.error("Failed to load card settings.");
        })
        .finally(() => setLoading(false));
    }
  }, [open, form]);

  const handleValuesChange = (_, allValues) => {
    setPreviewValues({ ...allValues });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/push-notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");

      message.success("Frontend notification card settings updated successfully!");
      onClose();
    } catch (err) {
      message.error(err.message || "Failed to save card settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined style={{ color: "#E03C33" }} />
          <span>Frontend Notification Card Settings</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={640}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          data-testid="save-card-settings-btn"
        >
          Save Settings
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          cardTitle: "Notifications",
          cardDescription:
            "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events.",
          enableButtonText: "Enable Alerts",
          dismissButtonText: "Not Now",
          enabled: true,
        }}
      >
        <Form.Item
          label="Card Title"
          name="cardTitle"
          rules={[{ required: true, message: "Please enter card title" }]}
        >
          <Input placeholder="e.g. Notifications" maxLength={80} />
        </Form.Item>

        <Form.Item
          label="Card Body Content (Description)"
          name="cardDescription"
          rules={[{ required: true, message: "Please enter card body content" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. Stay connected with MESCO Trust! Enable notifications to receive timely updates..."
            maxLength={300}
            showCount
          />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Item
            label="Enable Button Label"
            name="enableButtonText"
            rules={[{ required: true, message: "Please enter button text" }]}
          >
            <Input placeholder="e.g. Enable Alerts" maxLength={40} />
          </Form.Item>

          <Form.Item
            label="Dismiss Button Label"
            name="dismissButtonText"
            rules={[{ required: true, message: "Please enter button text" }]}
          >
            <Input placeholder="e.g. Not Now" maxLength={40} />
          </Form.Item>
        </div>

        <Form.Item
          label="Show Card on Frontend"
          name="enabled"
          valuePropName="checked"
          extra="When disabled, the notification opt-in prompt will not be shown to visitors on the frontend."
        >
          <Switch />
        </Form.Item>

        <Divider style={{ margin: "16px 0 12px" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Live Frontend Preview
          </Text>
        </Divider>

        {/* Live Card Preview */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <div
            style={{
              width: 320,
              background: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "rgba(224, 60, 51, 0.1)",
                    color: "#E03C33",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  🔔
                </span>
                <div>
                  <strong style={{ fontSize: 14, display: "block" }}>
                    {previewValues.cardTitle || "Notifications"}
                  </strong>
                  <span style={{ fontSize: 11, color: "#888888" }}>Status: Not Subscribed</span>
                </div>
              </div>
              <span style={{ color: "#999999", fontSize: 16 }}>&times;</span>
            </div>
            <p style={{ fontSize: 12, color: "#555555", margin: "0 0 14px", lineHeight: 1.45 }}>
              {previewValues.cardDescription ||
                "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events."}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid #d9d9d9",
                  background: "#ffffff",
                  cursor: "default",
                }}
              >
                {previewValues.dismissButtonText || "Not Now"}
              </button>
              <button
                type="button"
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  borderRadius: 6,
                  border: "none",
                  background: "#E03C33",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "default",
                }}
              >
                {previewValues.enableButtonText || "Enable Alerts"}
              </button>
            </div>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
