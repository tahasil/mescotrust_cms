"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tree,
  Typography,
  message,
} from "antd";
import {
  AppstoreAddOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";

function sanitizeSlug(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function reorderArray(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function buildTree(items, parentId = null) {
  return items
    .filter((item) => {
      const p = item.parentId ? String(item.parentId) : null;
      return p === (parentId ? String(parentId) : null);
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((item) => ({
      key: String(item._id),
      title: (
        <Space size={6}>
          <span>{item.question}</span>
          {item.status === "inactive" ? <Tag color="default">inactive</Tag> : null}
        </Space>
      ),
      children: buildTree(items, item._id),
    }));
}

function collectDescendantIds(list, id) {
  const out = new Set();
  const queue = [String(id)];
  while (queue.length > 0) {
    const current = queue.shift();
    list.forEach((item) => {
      const parent = item.parentId ? String(item.parentId) : null;
      if (parent === current) {
        const childId = String(item._id);
        if (!out.has(childId)) {
          out.add(childId);
          queue.push(childId);
        }
      }
    });
  }
  return out;
}

function extractApiError(payload, fallback = "Request failed") {
  if (!payload) return fallback;
  if (payload.error?.message) return payload.error.message;
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;
  return fallback;
}

const SEARCH_FIELD_OPTIONS = [
  { label: "Title", value: "title" },
  { label: "Answer", value: "answer" },
  { label: "Keywords", value: "keywords" },
  { label: "Tags", value: "tags" },
  { label: "Synonyms", value: "synonyms" },
];

const CONTACT_ACTION_TYPE_OPTIONS = [
  { label: "Call", value: "call" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Email", value: "email" },
  { label: "Contact Page", value: "contact" },
  { label: "Donation Page", value: "donation" },
  { label: "Custom", value: "custom" },
];

export default function AdminChatbotPage() {
  const [loading, setLoading] = useState(true);
  const [savingFaq, setSavingFaq] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [faqItems, setFaqItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAdminRole, setIsAdminRole] = useState(true);
  const [faqForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const answerHtml = Form.useWatch("answerHtml", faqForm);

  const faqById = useMemo(() => {
    const map = new Map();
    faqItems.forEach((item) => {
      map.set(String(item._id), item);
    });
    return map;
  }, [faqItems]);

  const treeData = useMemo(() => buildTree(faqItems), [faqItems]);

  const loadFaqs = useCallback(async () => {
    const res = await fetch("/api/admin/chatbot/faqs?includeInactive=true&page=1&limit=5000");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(extractApiError(data, "Failed to load FAQs"));
    }
    const items = Array.isArray(data?.data?.items) ? data.data.items : [];
    setFaqItems(items);
    if (!selectedId && items.length > 0) {
      setSelectedId(String(items[0]._id));
    }
  }, [selectedId]);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/chatbot/settings");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(extractApiError(data, "Failed to load settings"));
    }
    const settings = data.data || {};
    const searchEnabledFields = settings.searchEnabledFields || {};
    const searchEnabledFieldKeys = Object.keys(searchEnabledFields).filter(
      (key) => Boolean(searchEnabledFields[key]),
    );
    settingsForm.setFieldsValue({
      ...settings,
      searchEnabledFieldKeys,
      contactActions: Array.isArray(settings.contactActions) ? settings.contactActions : [],
    });
  }, [settingsForm]);

  const loadSessionRole = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json().catch(() => ({}));
      const role = String(data?.user?.role || "");
      setIsAdminRole(role === "Admin");
    } catch {
      setIsAdminRole(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadFaqs(), loadSettings(), loadSessionRole()]);
      } catch (err) {
        if (!ignore) message.error(err.message || "Failed to load chatbot module");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [loadFaqs, loadSettings, loadSessionRole]);

  useEffect(() => {
    if (!selectedId) return;
    const node = faqById.get(String(selectedId));
    if (!node) return;
    setMode("edit");
    faqForm.setFieldsValue({
      question: node.question || "",
      slug: node.slug || "",
      answerHtml: node.answerHtml || "",
      keywords: Array.isArray(node.keywords) ? node.keywords : [],
      tags: Array.isArray(node.tags) ? node.tags : [],
      synonyms: Array.isArray(node.synonyms) ? node.synonyms : [],
      icon: node.icon || "",
      status: node.status || "active",
      sortOrder: Number(node.sortOrder || 0),
      parentId: node.parentId ? String(node.parentId) : null,
    });
  }, [faqById, faqForm, selectedId]);

  const parentOptions = useMemo(() => {
    const descendants = selectedId ? collectDescendantIds(faqItems, selectedId) : new Set();
    return faqItems
      .filter((item) => String(item._id) !== String(selectedId || "") && !descendants.has(String(item._id)))
      .sort((a, b) => String(a.question || "").localeCompare(String(b.question || "")))
      .map((item) => ({
        label: item.question,
        value: String(item._id),
      }));
  }, [faqItems, selectedId]);

  const startCreate = (parentId = null) => {
    setMode("create");
    setSelectedId(null);
    faqForm.resetFields();
    faqForm.setFieldsValue({
      question: "",
      slug: "",
      answerHtml: "",
      keywords: [],
      tags: [],
      synonyms: [],
      icon: "",
      status: "active",
      sortOrder: 0,
      parentId,
    });
  };

  const onFaqSubmit = async () => {
    try {
      const values = await faqForm.validateFields();
      const payload = {
        ...values,
        question: String(values.question || "").trim(),
        slug: String(values.slug || "").trim(),
        answerHtml: String(values.answerHtml || "").trim(),
        keywords: Array.isArray(values.keywords) ? values.keywords : [],
        tags: Array.isArray(values.tags) ? values.tags : [],
        synonyms: Array.isArray(values.synonyms) ? values.synonyms : [],
        parentId: values.parentId || null,
      };
      if (!payload.slug) delete payload.slug;

      setSavingFaq(true);
      const endpoint =
        mode === "edit" && selectedId
          ? `/api/admin/chatbot/faqs/${selectedId}`
          : "/api/admin/chatbot/faqs";
      const method = mode === "edit" && selectedId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(extractApiError(data, "Failed to save FAQ"));
      }
      const savedId = String(data?.data?._id || "");
      await loadFaqs();
      if (savedId) setSelectedId(savedId);
      setMode("edit");
      message.success(mode === "edit" ? "Question updated" : "Question created");
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message || "Failed to save");
    } finally {
      setSavingFaq(false);
    }
  };

  const onDuplicate = async (includeChildren) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/chatbot/faqs/${selectedId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeChildren }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(extractApiError(data, "Failed to duplicate"));
      }
      await loadFaqs();
      if (data?.data?.root?._id) setSelectedId(String(data.data.root._id));
      message.success("Question duplicated");
    } catch (err) {
      message.error(err.message || "Duplicate failed");
    }
  };

  const onDelete = async () => {
    if (!selectedId) return;
    let deleteMode = "block";
    Modal.confirm({
      title: "Delete question",
      width: 520,
      content: (
        <Form
          layout="vertical"
          initialValues={{ mode: "block" }}
          onValuesChange={(changed) => {
            if (changed.mode) deleteMode = changed.mode;
          }}
        >
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Choose delete mode carefully"
          />
          <Form.Item name="mode" label="Delete mode">
            <Select
              options={[
                { value: "block", label: "Block delete if children exist" },
                { value: "cascade", label: "Delete entire subtree" },
                { value: "reparent", label: "Move children to parent, then delete node" },
              ]}
            />
          </Form.Item>
        </Form>
      ),
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/chatbot/faqs/${selectedId}?mode=${deleteMode}`, {
            method: "DELETE",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.success) {
            throw new Error(extractApiError(data, "Delete failed"));
          }
          setSelectedId(null);
          await loadFaqs();
          faqForm.resetFields();
          message.success("Question deleted");
        } catch (err) {
          message.error(err.message || "Delete failed");
          throw err;
        }
      },
    });
  };

  const onStatusToggle = async (checked) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/chatbot/faqs/${selectedId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: checked ? "active" : "inactive" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(extractApiError(data, "Status update failed"));
      }
      await loadFaqs();
      message.success("Status updated");
    } catch (err) {
      message.error(err.message || "Status update failed");
    }
  };

  const onDrop = async (info) => {
    if (!info?.dropToGap) {
      message.info("Drop between sibling questions to reorder");
      return;
    }
    const dragId = String(info.dragNode.key);
    const dropId = String(info.node.key);
    const dragNode = faqById.get(dragId);
    const dropNode = faqById.get(dropId);
    if (!dragNode || !dropNode) return;
    const dragParent = dragNode.parentId ? String(dragNode.parentId) : null;
    const dropParent = dropNode.parentId ? String(dropNode.parentId) : null;
    if (dragParent !== dropParent) {
      message.warning("Only sibling reorder is allowed by drag and drop");
      return;
    }

    const siblings = faqItems
      .filter((item) => {
        const p = item.parentId ? String(item.parentId) : null;
        return p === dragParent;
      })
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

    const fromIndex = siblings.findIndex((item) => String(item._id) === dragId);
    const dropIndexRaw = siblings.findIndex((item) => String(item._id) === dropId);
    if (fromIndex < 0 || dropIndexRaw < 0) return;

    const dropPos = info.dropPosition - Number(info.node.pos.split("-").pop());
    let toIndex = dropIndexRaw;
    if (dropPos > 0) toIndex += 1;
    if (fromIndex < toIndex) toIndex -= 1;
    if (fromIndex === toIndex) return;

    const reordered = reorderArray(siblings, fromIndex, toIndex).map((item) => String(item._id));

    try {
      const res = await fetch("/api/admin/chatbot/faqs/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: dragParent, orderedIds: reordered }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(extractApiError(data, "Reorder failed"));
      }
      await loadFaqs();
      message.success("Order updated");
    } catch (err) {
      message.error(err.message || "Reorder failed");
    }
  };

  const onSettingsSubmit = async () => {
    try {
      const values = await settingsForm.validateFields();
      const enabledFieldKeys = Array.isArray(values.searchEnabledFieldKeys)
        ? values.searchEnabledFieldKeys
        : [];
      const searchEnabledFields = SEARCH_FIELD_OPTIONS.reduce((acc, item) => {
        acc[item.value] = enabledFieldKeys.includes(item.value);
        return acc;
      }, {});

      const payload = {
        ...values,
        searchEnabledFields,
        contactActions: (values.contactActions || []).map((action, index) => ({
          ...action,
          id: String(action?.id || `action-${index + 1}`).trim() || `action-${index + 1}`,
          sortOrder: Number(action?.sortOrder ?? index),
        })),
      };
      delete payload.searchEnabledFieldKeys;

      setSavingSettings(true);
      const res = await fetch("/api/admin/chatbot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(extractApiError(data, "Failed to save settings"));
      }
      await loadSettings();
      setSettingsOpen(false);
      message.success("Chatbot settings saved");
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <>
      <ThemeAdminCard
        loading={loading}
        title="Chatbot"
        extra={
          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={() => startCreate(null)}>
              Add Root Question
            </Button>
            <Button
              icon={<AppstoreAddOutlined />}
              disabled={!selectedId}
              onClick={() => startCreate(selectedId)}
            >
              Add Child Question
            </Button>
            <Button
              icon={<SettingOutlined />}
              type="primary"
              onClick={() => setSettingsOpen(true)}
              disabled={!isAdminRole}
            >
              Settings
            </Button>
          </Space>
        }
      >
        {!isAdminRole ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="You can manage FAQ tree as Editor. Chatbot settings are Admin-only."
          />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={9}>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                minHeight: 520,
                padding: 12,
              }}
            >
              <Typography.Text strong>FAQ Tree</Typography.Text>
              <div style={{ marginTop: 10 }}>
                <Tree
                  draggable
                  blockNode
                  defaultExpandAll
                  selectedKeys={selectedId ? [String(selectedId)] : []}
                  onSelect={(keys) => {
                    const id = keys?.[0] ? String(keys[0]) : null;
                    setSelectedId(id);
                    if (id) setMode("edit");
                  }}
                  onDrop={onDrop}
                  treeData={treeData}
                />
              </div>
            </div>
          </Col>
          <Col xs={24} lg={15}>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                minHeight: 520,
                padding: 16,
              }}
            >
              <Space
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {mode === "create" ? "Create Question" : "Edit Question"}
                </Typography.Title>
                <Space>
                  {mode === "edit" && selectedId ? (
                    <Switch
                      checked={(faqById.get(String(selectedId))?.status || "active") === "active"}
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                      onChange={onStatusToggle}
                    />
                  ) : null}
                  <Button
                    icon={<CopyOutlined />}
                    disabled={!selectedId || mode === "create"}
                    onClick={() => onDuplicate(false)}
                  >
                    Duplicate
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    disabled={!selectedId || mode === "create"}
                    onClick={() => onDuplicate(true)}
                  >
                    Duplicate + Children
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!selectedId || mode === "create" || !isAdminRole}
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                </Space>
              </Space>

              <Form form={faqForm} layout="vertical">
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="question"
                      label="Question Title"
                      rules={[{ required: true, message: "Question title is required" }]}
                    >
                      <Input
                        placeholder="Enter question title"
                        onChange={(e) => {
                          if (mode === "create") {
                            const slug = sanitizeSlug(e.target.value);
                            faqForm.setFieldValue("slug", slug);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="slug"
                      label="Slug"
                      rules={[{ required: true, message: "Slug is required" }]}
                    >
                      <Input placeholder="question-slug" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="parentId" label="Parent Question">
                      <Select
                        allowClear
                        placeholder="Root question"
                        options={parentOptions}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="status" label="Status">
                      <Select
                        options={[
                          { label: "Active", value: "active" },
                          { label: "Inactive", value: "inactive" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="sortOrder" label="Sort Order">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="icon" label="Icon">
                  <Input placeholder="icon name or URL" />
                </Form.Item>

                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item name="keywords" label="Keywords">
                      <Select mode="tags" placeholder="Add keywords" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="tags" label="Search Tags">
                      <Select mode="tags" placeholder="Add tags" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="synonyms" label="Synonyms">
                      <Select mode="tags" placeholder="Add synonyms" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="answerHtml" hidden>
                  <Input.TextArea />
                </Form.Item>
                <Form.Item label="Answer (Rich Text)">
                  <RichTextEditor
                    value={answerHtml}
                    onChange={(value) => faqForm.setFieldValue("answerHtml", value)}
                    placeholder="Write predefined answer"
                    minHeight={220}
                  />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={savingFaq}
                    onClick={onFaqSubmit}
                  >
                    {mode === "create" ? "Create Question" : "Save Changes"}
                  </Button>
                  <Button onClick={() => (selectedId ? setMode("edit") : startCreate(null))}>
                    Reset
                  </Button>
                </Space>
              </Form>
            </div>
          </Col>
        </Row>
      </ThemeAdminCard>

      <Drawer
        title="Chatbot Settings"
        open={settingsOpen}
        width={620}
        onClose={() => setSettingsOpen(false)}
        destroyOnClose={false}
        extra={
          <Space>
            <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button type="primary" loading={savingSettings} onClick={onSettingsSubmit}>
              Save
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={settingsForm}>
          <Typography.Title level={5}>General</Typography.Title>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item name="enabled" label="Enable Chatbot" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="position" label="Position">
                <Select
                  options={[
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="fontSize" label="Font Size">
                <InputNumber min={12} max={22} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="botName" label="Bot Name">
            <Input />
          </Form.Item>
          <Form.Item name="welcomeMessage" label="Welcome Message">
            <Input />
          </Form.Item>
          <Form.Item name="welcomeSubtitle" label="Welcome Subtitle">
            <Input />
          </Form.Item>
          <Form.Item name="avatarMediaId" label="Avatar">
            <MediaPickerInput placeholder="/media/..." />
          </Form.Item>

          <Typography.Title level={5}>Appearance</Typography.Title>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="borderRadius" label="Border Radius">
                <InputNumber min={0} max={28} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Alert
                type="info"
                showIcon
                message="Chat width and height are now automatic for responsive screens."
              />
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="headerColor" label="Header Color">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="chatBackgroundColor" label="Chat Background">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="botMessageBubbleColor" label="Bot Bubble Color">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="botMessageTextColor" label="Bot Text Color">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="userMessageBubbleColor" label="User Bubble Color">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="userMessageTextColor" label="User Text Color">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="quickOptionButtonColor" label="Quick Option Button Color">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="quickOptionButtonTextColor"
                label="Quick Option Button Text Color"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="linkAccentColor" label="Link/Button Accent Color">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="borderColor" label="Border Color">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>Features</Typography.Title>
          <Row gutter={12}>
            <Col xs={12} md={8}>
              <Form.Item name="enableSearch" label="Enable Search" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="enableBreadcrumb" label="Enable Breadcrumb" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="enableHomeButton" label="Enable Home" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="enableBackButton" label="Enable Back" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="enableRelatedQuestions"
                label="Enable Related Questions"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="enableTypingAnimation"
                label="Enable Typing Animation"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="enableContactBlock"
                label="Enable Contact Block"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>Search</Typography.Title>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="minSearchChars" label="Minimum Search Characters">
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="maxSearchResults" label="Maximum Search Results">
                <InputNumber min={1} max={30} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="searchEnabledFieldKeys" label="Search Enabled Fields">
            <Select mode="multiple" options={SEARCH_FIELD_OPTIONS} />
          </Form.Item>

          <Typography.Title level={5}>Welcome Screen</Typography.Title>
          <Form.Item name="welcomeBannerMediaId" label="Banner Image (Optional)">
            <MediaPickerInput placeholder="/media/..." />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="featuredQuestionIds" label="Featured Questions">
                <Select
                  mode="multiple"
                  options={faqItems.map((item) => ({
                    label: item.question,
                    value: String(item._id),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="popularQuestionIds" label="Popular Questions">
                <Select
                  mode="multiple"
                  options={faqItems.map((item) => ({
                    label: item.question,
                    value: String(item._id),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>Contact Actions</Typography.Title>
          <Form.List name="contactActions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <Row gutter={12}>
                      <Col xs={24} md={10}>
                        <Form.Item
                          {...field}
                          name={[field.name, "label"]}
                          label="Label"
                          rules={[{ required: true, message: "Label is required" }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={14}>
                        <Form.Item
                          {...field}
                          name={[field.name, "url"]}
                          label="URL"
                          rules={[{ required: true, message: "URL is required" }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} md={8}>
                        <Form.Item {...field} name={[field.name, "id"]} label="ID">
                          <Input placeholder={`action-${index + 1}`} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item {...field} name={[field.name, "actionType"]} label="Type">
                          <Select options={CONTACT_ACTION_TYPE_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item {...field} name={[field.name, "icon"]} label="Icon">
                          <Input placeholder="phone/mail/link" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} md={8}>
                        <Form.Item {...field} name={[field.name, "target"]} label="Target">
                          <Select
                            options={[
                              { label: "Same Tab", value: "_self" },
                              { label: "New Tab", value: "_blank" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item {...field} name={[field.name, "sortOrder"]} label="Sort Order">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, "enabled"]}
                          label="Enabled"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      Remove Action
                    </Button>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      id: "",
                      actionType: "custom",
                      label: "",
                      url: "",
                      icon: "",
                      target: "_self",
                      enabled: true,
                      sortOrder: 0,
                    })
                  }
                  icon={<PlusOutlined />}
                >
                  Add Contact Action
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </>
  );
}
