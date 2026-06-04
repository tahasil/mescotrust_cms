"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  ReloadOutlined,
  UpOutlined,
} from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

const { TextArea } = Input;

function normalizeFormData(raw = {}) {
  return {
    ...raw,
    faqs: Array.isArray(raw?.faqs) ? raw.faqs : [],
    quickActions: Array.isArray(raw?.quickActions) ? raw.quickActions : [],
    visibilityBehavior: {
      ...(raw?.visibilityBehavior || {}),
      includeRoutes: Array.isArray(raw?.visibilityBehavior?.includeRoutes)
        ? raw.visibilityBehavior.includeRoutes
        : [],
    },
    emailNotifications: {
      ...(raw?.emailNotifications || {}),
      recipients: Array.isArray(raw?.emailNotifications?.recipients)
        ? raw.emailNotifications.recipients
        : [],
    },
    ai: {
      ...(raw?.ai || {}),
      apiKey: "",
    },
  };
}

function isLikelyImageReference(value) {
  const raw = String(value || "").trim();
  if (!raw) return true;
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(raw) || raw.startsWith("/media/");
}

export default function AIChatbotSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [aiKeyDirty, setAiKeyDirty] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState("");

  const aiEnabled = Form.useWatch(["ai", "enabled"], form);
  const escalationEnabled = Form.useWatch(["escalation", "enabled"], form);
  const notificationEnabled = Form.useWatch(
    ["emailNotifications", "enabled"],
    form,
  );
  const autoOpenEnabled = Form.useWatch(
    ["visibilityBehavior", "autoOpenEnabled"],
    form,
  );

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-chatbot", { cache: "no-store" });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load AI chatbot settings");
      form.setFieldsValue(normalizeFormData(data));
      setForbidden(false);
      setAiKeyDirty(false);
      setHasApiKey(Boolean(data?.ai?.hasApiKey));
      setMaskedApiKey(String(data?.ai?.apiKeyMasked || ""));
    } catch (err) {
      message.error(err?.message || "Failed to load AI chatbot settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async (values) => {
    setSaving(true);
    try {
      const payload = normalizeFormData(values);
      if (!aiKeyDirty) {
        if (payload?.ai) {
          delete payload.ai.apiKey;
        }
      } else {
        payload.ai.apiKey = String(payload?.ai?.apiKey || "").trim();
      }

      const res = await fetch("/api/admin/ai-chatbot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setForbidden(true);
        message.error("Admin permission required");
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Failed to save AI chatbot settings");

      form.setFieldsValue(normalizeFormData(data));
      setAiKeyDirty(false);
      setHasApiKey(Boolean(data?.ai?.hasApiKey));
      setMaskedApiKey(String(data?.ai?.apiKeyMasked || ""));

      const stamp = String(Date.now());
      window.localStorage.setItem("chatbot_config_updated_at", stamp);
      window.dispatchEvent(
        new CustomEvent("chatbot-config-updated", { detail: { at: stamp } }),
      );

      message.success("AI chatbot settings saved");
    } catch (err) {
      message.error(err?.message || "Failed to save AI chatbot settings");
    } finally {
      setSaving(false);
    }
  };

  const sectionItems = useMemo(
    () => [
      {
        key: "general",
        label: "General",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="enabled"
                label="Enable chatbot"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                name="name"
                label="Chatbot name"
                rules={[{ required: true, min: 2, max: 60 }]}
              >
                <Input placeholder="Mesco Assistant" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="welcomeMessage"
                label="Welcome message"
                rules={[{ required: true, min: 10, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                name="avatarUrl"
                label="Avatar image"
                rules={[
                  {
                    validator: (_, value) =>
                      isLikelyImageReference(value)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "Avatar must be an image URL/reference (png, jpg, jpeg, webp, gif, svg)",
                            ),
                          ),
                  },
                ]}
              >
                <MediaPickerInput
                  placeholder="/media/..."
                  showVariants={false}
                  hintText="Use image assets only."
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="position" label="Widget position">
                <Select
                  options={[
                    { value: "bottom-right", label: "Bottom Right" },
                    { value: "bottom-left", label: "Bottom Left" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        ),
      },
      {
        key: "appearance",
        label: "Appearance",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "launcherBgColor"]} label="Launcher background">
                <Input placeholder="#1677ff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "launcherIconColor"]} label="Launcher icon color">
                <Input placeholder="#ffffff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "panelBgColor"]} label="Panel background">
                <Input placeholder="#ffffff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "panelTextColor"]} label="Panel text color">
                <Input placeholder="#111827" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "userBubbleBgColor"]} label="User bubble background">
                <Input placeholder="#1677ff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "userBubbleTextColor"]} label="User bubble text">
                <Input placeholder="#ffffff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "botBubbleBgColor"]} label="Bot bubble background">
                <Input placeholder="#f3f4f6" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "botBubbleTextColor"]} label="Bot bubble text">
                <Input placeholder="#111827" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "buttonBgColor"]} label="Button background">
                <Input placeholder="#1677ff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["appearance", "buttonTextColor"]} label="Button text">
                <Input placeholder="#ffffff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["appearance", "borderRadius"]} label="Border radius">
                <InputNumber min={0} max={32} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        ),
      },
      {
        key: "messages-prompts",
        label: "Messages & Prompts",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "fallbackMessage"]}
                label="Fallback message"
                rules={[{ required: true, min: 5, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "timeoutMessage"]}
                label="Timeout message"
                rules={[{ required: true, min: 5, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "errorMessage"]}
                label="Error message"
                rules={[{ required: true, min: 5, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "escalationPromptMessage"]}
                label="Escalation prompt message"
                rules={[{ required: true, min: 5, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "escalationSuccessMessage"]}
                label="Escalation success message"
                rules={[{ required: true, min: 5, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "escalationErrorMessage"]}
                label="Escalation error message"
                rules={[{ required: true, min: 5, max: 500 }]}
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["messages", "launcherLabel"]}
                label="Launcher label"
                rules={[{ required: true, min: 1, max: 30 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["messages", "inputPlaceholder"]}
                label="Input placeholder"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["messages", "sendButtonLabel"]}
                label="Send button label"
                rules={[{ required: true, min: 2, max: 30 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["messages", "typingLabel"]}
                label="Typing label"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "shareDetailsLabel"]}
                label="Share details label"
                rules={[{ required: true, min: 2, max: 40 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "escalationInlineNamePlaceholder"]}
                label="Escalation name placeholder"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "escalationInlineEmailPlaceholder"]}
                label="Escalation email placeholder"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "escalationInlineMessagePlaceholder"]}
                label="Escalation message placeholder"
                rules={[{ required: true, min: 2, max: 160 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "openButtonAriaLabel"]}
                label="Open button ARIA label"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["messages", "closeButtonAriaLabel"]}
                label="Close button ARIA label"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["prompts", "systemPrompt"]}
                label="System prompt"
                rules={[{ required: true, min: 10, max: 2000 }]}
              >
                <TextArea rows={5} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["prompts", "assistantStylePrompt"]}
                label="Assistant style prompt"
                rules={[{ required: true, min: 5, max: 1200 }]}
              >
                <TextArea rows={5} />
              </Form.Item>
            </Col>
          </Row>
        ),
      },
      {
        key: "faqs",
        label: "FAQs",
        children: (
          <Form.List name="faqs">
            {(fields, { add, remove, move }) => (
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`FAQ ${index + 1}`}
                    extra={
                      <Space>
                        <Button
                          type="text"
                          icon={<UpOutlined />}
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        />
                        <Button
                          type="text"
                          icon={<DownOutlined />}
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                        />
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={16}>
                        <Form.Item
                          name={[field.name, "question"]}
                          label="Question"
                          rules={[{ required: true, min: 2, max: 240 }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "enabled"]}
                          label="Enabled"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          name={[field.name, "answer"]}
                          label="Answer"
                          rules={[{ required: true, min: 2, max: 1000 }]}
                        >
                          <TextArea rows={3} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <Form.Item
                          name={[field.name, "intents"]}
                          label="Intent phrases"
                          tooltip="Optional phrases used for FAQ matching."
                        >
                          <Select mode="tags" tokenSeparators={[","]} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name={[field.name, "order"]} label="Order">
                          <InputNumber min={1} max={9999} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      question: "",
                      answer: "",
                      intents: [],
                      enabled: true,
                      order: fields.length + 1,
                    })
                  }
                >
                  Add FAQ
                </Button>
              </Space>
            )}
          </Form.List>
        ),
      },
      {
        key: "quick-actions",
        label: "Quick Actions",
        children: (
          <Form.List name="quickActions">
            {(fields, { add, remove, move }) => (
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Action ${index + 1}`}
                    extra={
                      <Space>
                        <Button
                          type="text"
                          icon={<UpOutlined />}
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        />
                        <Button
                          type="text"
                          icon={<DownOutlined />}
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                        />
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "label"]}
                          label="Label"
                          rules={[{ required: true, min: 1, max: 40 }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name={[field.name, "actionType"]} label="Action type">
                          <Select
                            options={[
                              { value: "message", label: "Message" },
                              { value: "route", label: "Route" },
                              { value: "url", label: "URL" },
                              { value: "contact", label: "Contact" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "enabled"]}
                          label="Enabled"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={18}>
                        <Form.Item
                          name={[field.name, "value"]}
                          label="Value"
                          rules={[{ required: false, max: 300 }]}
                        >
                          <Input placeholder="/contact or Ask a question" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, "order"]} label="Order">
                          <InputNumber min={1} max={9999} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      label: "",
                      actionType: "message",
                      value: "",
                      enabled: true,
                      order: fields.length + 1,
                    })
                  }
                >
                  Add Quick Action
                </Button>
              </Space>
            )}
          </Form.List>
        ),
      },
      {
        key: "escalation-notifications",
        label: "Escalation & Notifications",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name={["escalation", "enabled"]}
                label="Enable escalation"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["escalation", "mode"]} label="Escalation mode">
                <Select
                  disabled={!escalationEnabled}
                  options={[
                    { value: "redirect_contact", label: "Redirect Contact" },
                    { value: "inline_capture", label: "Inline Capture" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["escalation", "ctaLabel"]}
                label="CTA label"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input disabled={!escalationEnabled} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["escalation", "contactRoute"]}
                label="Contact route"
                rules={[{ required: true, pattern: /^\//, message: "Route must start with /" }]}
              >
                <Input disabled={!escalationEnabled} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Typography.Text strong>Email notifications</Typography.Text>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["emailNotifications", "enabled"]}
                label="Enable email notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                name={["emailNotifications", "subjectPrefix"]}
                label="Subject prefix"
                rules={[{ required: true, min: 1, max: 80 }]}
              >
                <Input disabled={!notificationEnabled} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.List name={["emailNotifications", "recipients"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    {fields.map((field) => (
                      <Space key={field.key} style={{ width: "100%" }}>
                        <Form.Item
                          style={{ flex: 1, marginBottom: 0 }}
                          name={field.name}
                          rules={[
                            { required: notificationEnabled, message: "Email is required" },
                            { type: "email", message: "Invalid email address" },
                          ]}
                        >
                          <Input placeholder="recipient@example.com" disabled={!notificationEnabled} />
                        </Form.Item>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                          disabled={!notificationEnabled}
                        />
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add("")}
                      disabled={!notificationEnabled}
                    >
                      Add recipient
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Col>
          </Row>
        ),
      },
      {
        key: "visibility-behavior",
        label: "Visibility & Behavior",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name={["visibilityBehavior", "enabledOnDesktop"]}
                label="Enable on desktop"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["visibilityBehavior", "enabledOnMobile"]}
                label="Enable on mobile"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["visibilityBehavior", "defaultState"]} label="Default state">
                <Select
                  options={[
                    { value: "minimized", label: "Minimized" },
                    { value: "open", label: "Open" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["visibilityBehavior", "autoOpenEnabled"]}
                label="Auto-open enabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["visibilityBehavior", "autoOpenDelayMs"]}
                label="Auto-open delay (ms)"
              >
                <InputNumber
                  min={0}
                  max={15000}
                  disabled={!autoOpenEnabled}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["visibilityBehavior", "autoOpenOncePerSession"]}
                label="Auto-open once per session"
                valuePropName="checked"
              >
                <Switch disabled={!autoOpenEnabled} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Typography.Text type="secondary">
                Include routes (exact paths). Leave empty to allow all routes.
              </Typography.Text>
            </Col>
            <Col xs={24}>
              <Form.List name={["visibilityBehavior", "includeRoutes"]}>
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    {fields.map((field) => (
                      <Space key={field.key} style={{ width: "100%" }}>
                        <Form.Item
                          style={{ flex: 1, marginBottom: 0 }}
                          name={field.name}
                          rules={[
                            { required: false },
                            {
                              pattern: /^\//,
                              message: "Route must start with /",
                            },
                          ]}
                        >
                          <Input placeholder="/contact" />
                        </Form.Item>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add("")}>
                      Add route
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Col>
          </Row>
        ),
      },
      {
        key: "ai-provider",
        label: "AI Provider",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name={["ai", "enabled"]}
                label="Enable AI fallback"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["ai", "provider"]} label="Provider">
                <Select
                  disabled={!aiEnabled}
                  options={[
                    { value: "disabled", label: "Disabled" },
                    { value: "openai", label: "OpenAI" },
                    { value: "openai_compatible", label: "OpenAI Compatible" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["ai", "model"]}
                label="Model"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input disabled={!aiEnabled} placeholder="gpt-4o-mini" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["ai", "baseUrl"]} label="Base URL">
                <Input disabled={!aiEnabled} placeholder="https://api.openai.com/v1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={["ai", "apiKey"]} label="API key">
                <Input.Password
                  disabled={!aiEnabled}
                  placeholder={hasApiKey ? "Leave empty to keep existing key" : "Enter API key"}
                  onChange={() => setAiKeyDirty(true)}
                />
              </Form.Item>
              {hasApiKey ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Stored key: <Tag>{maskedApiKey || "configured"}</Tag>
                </Typography.Text>
              ) : null}
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["ai", "temperature"]} label="Temperature">
                <InputNumber min={0} max={2} step={0.1} disabled={!aiEnabled} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["ai", "maxTokens"]} label="Max tokens">
                <InputNumber min={64} max={2048} disabled={!aiEnabled} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={["ai", "timeoutMs"]} label="Timeout (ms)">
                <InputNumber min={1000} max={20000} disabled={!aiEnabled} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        ),
      },
    ],
    [aiEnabled, escalationEnabled, notificationEnabled, autoOpenEnabled, hasApiKey, maskedApiKey],
  );

  if (forbidden) {
    return (
      <ThemeAdminCard title="AI Chatbot">
        <Alert
          type="warning"
          showIcon
          message="Admin permission required to manage AI chatbot settings."
        />
      </ThemeAdminCard>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={loading}
      onFinish={saveSettings}
      initialValues={{}}
    >
      <ThemeAdminCard
        title="AI Chatbot"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSettings}
              disabled={loading || saving}
            >
              Refresh
            </Button>
            <Button type="primary" onClick={() => form.submit()} loading={saving}>
              Save settings
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Configure chatbot behavior, FAQs, prompts, escalation, AI provider, and visibility.
          All settings are saved in CMS database and reflected on the public widget dynamically.
        </Typography.Paragraph>
        <Collapse items={sectionItems} defaultActiveKey={["general"]} />
      </ThemeAdminCard>
    </Form>
  );
}
