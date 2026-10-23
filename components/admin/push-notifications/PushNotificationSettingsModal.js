"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
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
      fetch(`/api/admin/push-notifications/settings?t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.settings) {
            const isBell = data.settings.showBellIcon === true;
            const loaded = {
              ...data.settings,
              showBellIcon: isBell,
            };
            form.setFieldsValue(loaded);
            setPreviewValues(loaded);
          }
        })
        .catch(() => {
          message.error("Failed to load notification settings.");
        })
        .finally(() => setLoading(false));
    }
  }, [open, form]);

  const handleValuesChange = (_, allValues) => {
    setPreviewValues((prev) => ({ ...prev, ...allValues }));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch("/api/admin/push-notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          showBellIcon: values.showBellIcon === true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");

      message.success("Notification settings updated successfully!");
      onClose();
    } catch (err) {
      message.error(err.message || "Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Notification Settings"
      open={open}
      onClose={onClose}
      width={560}
      destroyOnClose
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          data-testid="save-card-settings-btn"
        >
          Save Settings
        </Button>
      }
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
          showBellIcon: true,
        }}
      >
        {/* Show Bell Icon on Frontend toggle - text left, toggle right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "#1f1f1f", fontSize: 14 }}>
              Show Bell Icon on Frontend
            </div>
            <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 2 }}>
              When enabled, a floating bell icon button will appear on the bottom-left, allowing visitors to open the notification prompt anytime. When disabled, only the notification card will be displayed.
            </div>
          </div>
          <Form.Item name="showBellIcon" valuePropName="checked" noStyle>
            <Switch
              disabled={loading}
              loading={loading}
              onChange={(checked) => {
                setPreviewValues((prev) => ({ ...prev, showBellIcon: checked }));
              }}
              data-testid="show-bell-icon-switch"
            />
          </Form.Item>
        </div>

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

        <Divider style={{ margin: "16px 0 12px" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Live Frontend Preview
          </Text>
        </Divider>

        {/* Live Card Preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 0",
            gap: 12,
          }}
        >
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

          {previewValues.showBellIcon !== false && (
            <div style={{ width: 320, display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  position: "relative",
                }}
              >
                🔔
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#e03c33",
                    border: "2px solid #ffffff",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#8c8c8c" }}>
                Floating Bell Button (Click toggles prompt card)
              </span>
            </div>
          )}
        </div>
      </Form>
    </Drawer>
  );
}
