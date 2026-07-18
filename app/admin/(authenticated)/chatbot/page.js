"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Collapse,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
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
  CheckOutlined,
  AppstoreAddOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { ThemeColorInput } from "@/components/admin/schemaFormUtils";
import { ThemeAdminCard } from "@/styles/Theme";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { LIST_HEADER_STYLE } from "@/lib/titleAndColorsConfig";

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
const ROOT_PARENT_VALUE = "__ROOT__";
const SETTINGS_COLLAPSE_STYLE = {
  border: "1px solid #e8e8e8",
  borderRadius: 10,
  overflow: "hidden",
};
const SETTINGS_SECTION_BOX_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
const SETTINGS_CARD_STYLE = {
  border: "1px solid #e8e8e8",
  borderRadius: 10,
  background: "#fff",
  overflow: "hidden",
};
const SETTINGS_CARD_HEADER_STYLE = {
  ...LIST_HEADER_STYLE,
  display: "block",
  padding: "10px 12px",
  borderBottom: "1px solid #f0f0f0",
};
const SETTINGS_CARD_BODY_STYLE = {
  padding: 10,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const SETTINGS_ROW_LABEL_STYLE = {
  fontSize: 14,
  color: "rgba(0,0,0,0.75)",
};

export default function AdminChatbotPage() {
  const [loading, setLoading] = useState(true);
  const [savingFaq, setSavingFaq] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [faqItems, setFaqItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [isAdminRole, setIsAdminRole] = useState(true);
  const [answerEditorValue, setAnswerEditorValue] = useState("");
  const [faqForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const hasAutoSelectedInitialNode = useRef(false);

  const faqById = useMemo(() => {
    const map = new Map();
    faqItems.forEach((item) => {
      map.set(String(item._id), item);
    });
    return map;
  }, [faqItems]);

  const treeData = useMemo(() => buildTree(faqItems), [faqItems]);
  const faqPathLabelById = useMemo(() => {
    const byId = new Map();
    faqItems.forEach((item) => {
      byId.set(String(item._id), item);
    });
    const out = new Map();
    faqItems.forEach((item) => {
      const chain = [String(item.question || "").trim()];
      let cursor = item.parentId ? String(item.parentId) : null;
      let guard = 0;
      while (cursor && guard < 25) {
        const parent = byId.get(cursor);
        if (!parent) break;
        chain.unshift(String(parent.question || "").trim());
        cursor = parent.parentId ? String(parent.parentId) : null;
        guard += 1;
      }
      out.set(String(item._id), chain.filter(Boolean).join(" / "));
    });
    return out;
  }, [faqItems]);

  const loadFaqs = useCallback(async () => {
    const res = await fetch("/api/admin/chatbot/faqs?includeInactive=true&page=1&limit=5000", {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(extractApiError(data, "Failed to load FAQs"));
    }
    const items = Array.isArray(data?.data?.items) ? data.data.items : [];
    setFaqItems(items);
    if (
      !hasAutoSelectedInitialNode.current &&
      !selectedId &&
      items.length > 0 &&
      mode !== "create"
    ) {
      setSelectedId(String(items[0]._id));
      hasAutoSelectedInitialNode.current = true;
    }
  }, [mode, selectedId]);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/chatbot/settings", { cache: "no-store" });
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

  const loadThemeColorOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/theme", { cache: "no-store" });
      const theme = await res.json().catch(() => ({}));
      if (!res.ok || !theme || typeof theme !== "object") {
        setThemeColorOptions([]);
        return;
      }
      const palette = theme.themePalette || {};
      const customColors = Array.isArray(theme.colors) ? theme.colors : [];
      const options = [];
      Object.entries(palette).forEach(([name, value]) => {
        const nextValue = String(value || "").trim();
        if (!nextValue) return;
        options.push({ label: name, value: nextValue });
      });
      customColors.forEach((item) => {
        if (!item?.name || item?.value == null) return;
        const nextValue = String(item.value).trim();
        if (!nextValue) return;
        options.push({ label: String(item.name), value: nextValue });
      });
      const seen = new Set();
      const deduped = options.filter((item) => {
        const key = String(item.value || "").toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setThemeColorOptions(deduped);
    } catch {
      setThemeColorOptions([]);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadFaqs(), loadSettings(), loadSessionRole()]);
        await loadThemeColorOptions();
      } catch (err) {
        if (!ignore) message.error(err.message || "Failed to load chatbot module");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [loadFaqs, loadSettings, loadSessionRole, loadThemeColorOptions]);

  useEffect(() => {
    if (!selectedId) return;
    const node = faqById.get(String(selectedId));
    if (!node) return;
    const nextAnswerHtml = String(node.answerHtml || "");
    setMode("edit");
    faqForm.setFieldsValue({
      question: node.question || "",
      answerHtml: nextAnswerHtml,
      keywords: Array.isArray(node.keywords) ? node.keywords : [],
      tags: Array.isArray(node.tags) ? node.tags : [],
      synonyms: Array.isArray(node.synonyms) ? node.synonyms : [],
      showNeedMoreInfo: Boolean(node.showNeedMoreInfo),
      status: node.status || "active",
      sortOrder: Number(node.sortOrder || 0),
      parentId: node.parentId ? String(node.parentId) : ROOT_PARENT_VALUE,
    });
    setAnswerEditorValue(nextAnswerHtml);
  }, [faqById, faqForm, selectedId]);

  const parentOptions = useMemo(() => {
    const descendants = selectedId ? collectDescendantIds(faqItems, selectedId) : new Set();
    const options = faqItems
      .filter((item) => String(item._id) !== String(selectedId || "") && !descendants.has(String(item._id)))
      .sort((a, b) =>
        String(faqPathLabelById.get(String(a._id)) || a.question || "").localeCompare(
          String(faqPathLabelById.get(String(b._id)) || b.question || ""),
        ),
      )
      .map((item) => ({
        label: faqPathLabelById.get(String(item._id)) || item.question,
        value: String(item._id),
      }));
    return [{ label: "Root question (New)", value: ROOT_PARENT_VALUE }, ...options];
  }, [faqItems, faqPathLabelById, selectedId]);

  const startCreate = (parentId = null) => {
    setMode("create");
    setSelectedId(null);
    faqForm.resetFields();
    setAnswerEditorValue("");
    faqForm.setFieldsValue({
      question: "",
      answerHtml: "",
      keywords: [],
      tags: [],
      synonyms: [],
      showNeedMoreInfo: false,
      status: "active",
      sortOrder: 0,
      parentId: parentId ? String(parentId) : ROOT_PARENT_VALUE,
    });
  };

  const onFaqSubmit = async () => {
    try {
      const values = await faqForm.validateFields();
      const payload = {
        ...values,
        question: String(values.question || "").trim(),
        answerHtml: String(values.answerHtml ?? answerEditorValue ?? "").trim(),
        keywords: Array.isArray(values.keywords) ? values.keywords : [],
        tags: Array.isArray(values.tags) ? values.tags : [],
        synonyms: Array.isArray(values.synonyms) ? values.synonyms : [],
        parentId: values.parentId && values.parentId !== ROOT_PARENT_VALUE ? values.parentId : null,
      };

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
      setAnswerEditorValue(String(data?.data?.answerHtml || payload.answerHtml || ""));
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
      const validatedValues = await settingsForm.validateFields();
      const allValues = settingsForm.getFieldsValue(true);
      const values = { ...allValues, ...validatedValues };

      const rawSearchFieldKeys = values.searchEnabledFieldKeys;
      let enabledFieldKeys = Array.isArray(rawSearchFieldKeys)
        ? rawSearchFieldKeys.map((key) => String(key || "").trim()).filter(Boolean)
        : [];
      if (enabledFieldKeys.length === 0) {
        enabledFieldKeys = SEARCH_FIELD_OPTIONS.map((item) => item.value);
      }
      const searchEnabledFields = SEARCH_FIELD_OPTIONS.reduce((acc, item) => {
        acc[item.value] = enabledFieldKeys.includes(item.value);
        return acc;
      }, {});

      const payload = {
        ...values,
        themeColor: values.linkAccentColor || values.themeColor || "",
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
      if (typeof window !== "undefined") {
        const stamp = String(Date.now());
        window.localStorage.setItem("chatbotSettingsUpdatedAt", stamp);
        window.dispatchEvent(
          new CustomEvent("chatbot-settings-updated", { detail: { at: stamp } }),
        );
      }
      setSettingsOpen(false);
      message.success("Chatbot settings saved");
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const renderSettingsSwitchList = (items, headerLabel = "Options") => (
    <List
      header={<span style={LIST_HEADER_STYLE}>{headerLabel}</span>}
      size="small"
      style={SETTINGS_CARD_STYLE}
      bordered
      split
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Form.Item key={item.name} name={item.name} valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>,
          ]}
        >
          <span style={SETTINGS_ROW_LABEL_STYLE}>{item.label}</span>
        </List.Item>
      )}
    />
  );

  const renderSettingsCard = (title, children) => (
    <div style={SETTINGS_CARD_STYLE}>
      {title ? <span style={SETTINGS_CARD_HEADER_STYLE}>{title}</span> : null}
      <div style={SETTINGS_CARD_BODY_STYLE}>{children}</div>
    </div>
  );

  return (
    <>
      <ThemeAdminCard
        loading={loading}
        title="Chatbot"
        extra={
          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={() => startCreate(null)}>
              Add Question
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
                  defaultExpandAll={false}
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
                border: `1px solid ${mode === "create" ? "#91caff" : "#f0f0f0"}`,
                borderRadius: 12,
                minHeight: 520,
                padding: 16,
                background: mode === "create" ? "#f8fbff" : "#fff",
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
                  {mode === "create" ? "Add Question" : "Edit Question"}
                </Typography.Title>
                <Tag color={mode === "create" ? "processing" : "default"}>
                  {mode === "create" ? "ADD MODE" : "EDIT MODE"}
                </Tag>
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

              <Alert
                type={mode === "create" ? "info" : "success"}
                showIcon
                style={{ marginBottom: 12 }}
                message={
                  mode === "create"
                    ? "You are adding a new question. Fill details and click Create."
                    : "You are editing an existing question. Update details and click Update."
                }
              />

              <Form form={faqForm} layout="vertical">
                <Row gutter={12}>
                  <Col xs={24}>
                    <Form.Item
                      name="question"
                      label="Question Title"
                      rules={[{ required: true, message: "Question title is required" }]}
                    >
                      <Input placeholder="Enter question title" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="parentId" label="Parent Question">
                      <Select options={parentOptions} />
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

                <Form.Item
                  name="showNeedMoreInfo"
                  label='Show "Need more info?" for this question'
                  valuePropName="checked"
                >
                  <Switch />
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
                    value={answerEditorValue}
                    onChange={(value) => {
                      setAnswerEditorValue(String(value || ""));
                      faqForm.setFieldValue("answerHtml", value);
                    }}
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
                    {mode === "create" ? "Create" : "Update"}
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
        onClose={() => setSettingsOpen(false)}
        destroyOnClose={false}
        extra={
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={savingSettings}
            onClick={onSettingsSubmit}
          >
            Update
          </Button>
        }
      >
        <Form layout="vertical" form={settingsForm} size="middle" className="chatbot-settings-form">
          <Collapse
            defaultActiveKey={["general", "appearance"]}
            style={SETTINGS_COLLAPSE_STYLE}
            items={[
              {
                key: "general",
                label: "General",
                children: (
                  <div style={SETTINGS_SECTION_BOX_STYLE}>
                    {renderSettingsSwitchList([{ name: "enabled", label: "Enable chatbot" }], "Status")}
                    {renderSettingsCard(
                      "General Settings",
                      <>
                        <Form.Item name="position" label="Position">
                          <Select
                            options={[
                              { label: "Left", value: "left" },
                              { label: "Right", value: "right" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="fontSize" label="Font Size">
                          <InputNumber min={12} max={22} style={{ width: "100%" }} />
                        </Form.Item>
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
                      </>,
                    )}
                  </div>
                ),
              },
              {
                key: "appearance",
                label: "Appearance",
                children: (
                  <div style={SETTINGS_SECTION_BOX_STYLE}>
                    {renderSettingsCard(
                      "Layout",
                      <>
                        <Form.Item name="width" label="Chat Width (Desktop)">
                          <InputNumber min={320} max={640} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="height" label="Chat Height (Desktop)">
                          <InputNumber min={420} max={900} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="borderRadius" label="Border Radius">
                          <InputNumber min={0} max={28} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="contentPadding" label="Content Padding">
                          <InputNumber min={8} max={28} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="footerPadding" label="Footer Padding">
                          <InputNumber min={8} max={24} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="elementGap" label="Element Gap">
                          <InputNumber min={4} max={20} style={{ width: "100%" }} />
                        </Form.Item>
                      </>,
                    )}
                    {renderSettingsCard(
                      "Color Theme",
                      <>
                        <Form.Item name="headerColor" label="Header Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="chatBackgroundColor" label="Chat Background">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="borderColor" label="Border Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="linkAccentColor" label="Link/Button Accent Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                      </>,
                    )}
                    {renderSettingsCard(
                      "Message Bubbles",
                      <>
                        <Form.Item name="botMessageBubbleColor" label="Bot Bubble Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="botMessageTextColor" label="Bot Text Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="userMessageBubbleColor" label="User Bubble Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="userMessageTextColor" label="User Text Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item name="quickOptionButtonColor" label="Quick Option Button Color">
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                        <Form.Item
                          name="quickOptionButtonTextColor"
                          label="Quick Option Button Text Color"
                        >
                          <ThemeColorInput themeColorOptions={themeColorOptions} />
                        </Form.Item>
                      </>,
                    )}
                    {renderSettingsCard(
                      "Shadows",
                      <>
                        <Form.Item name="launcherShadow" label="Launcher Shadow">
                          <Input placeholder="e.g. 0 10px 26px rgba(0,0,0,0.25)" />
                        </Form.Item>
                        <Form.Item name="windowShadow" label="Window Shadow">
                          <Input placeholder="e.g. 0 14px 38px rgba(0,0,0,0.22)" />
                        </Form.Item>
                        <Form.Item name="bubbleShadow" label="Message Bubble Shadow">
                          <Input placeholder="e.g. 0 3px 10px rgba(0,0,0,0.08)" />
                        </Form.Item>
                        <Form.Item name="chipShadow" label="Chip/Button Shadow">
                          <Input placeholder="e.g. 0 3px 10px rgba(0,0,0,0.08)" />
                        </Form.Item>
                      </>,
                    )}
                  </div>
                ),
              },
              {
                key: "features",
                label: "Features",
                children: (
                  <div style={SETTINGS_SECTION_BOX_STYLE}>
                    {renderSettingsSwitchList(
                      [
                        { name: "enableSearch", label: "Enable Search" },
                        { name: "enableBreadcrumb", label: "Enable Breadcrumb" },
                        { name: "enableHomeButton", label: "Enable Home" },
                        { name: "enableBackButton", label: "Enable Back" },
                        { name: "enableRelatedQuestions", label: "Enable Related Questions" },
                        { name: "enableTypingAnimation", label: "Enable Typing Animation" },
                        { name: "enableContactBlock", label: "Enable Contact Block" },
                      ],
                      "Toggle Features",
                    )}
                  </div>
                ),
              },
              {
                key: "search",
                label: "Search",
                children: (
                  <div style={SETTINGS_SECTION_BOX_STYLE}>
                    {renderSettingsCard(
                      "Search Settings",
                      <>
                        <Form.Item name="minSearchChars" label="Minimum Search Characters">
                          <InputNumber min={1} max={10} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="maxSearchResults" label="Maximum Search Results">
                          <InputNumber min={1} max={30} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="searchEnabledFieldKeys" label="Search Enabled Fields">
                          <Select mode="multiple" options={SEARCH_FIELD_OPTIONS} />
                        </Form.Item>
                      </>,
                    )}
                  </div>
                ),
              },
              {
                key: "welcome",
                label: "Welcome Screen",
                children: (
                  <div style={SETTINGS_SECTION_BOX_STYLE}>
                    {renderSettingsCard(
                      "Welcome Content",
                      <>
                        <Form.Item name="welcomeBannerMediaId" label="Banner Image (Optional)">
                          <MediaPickerInput placeholder="/media/..." />
                        </Form.Item>
                        <Form.Item name="featuredQuestionIds" label="Featured Questions">
                          <Select
                            mode="multiple"
                            options={faqItems.map((item) => ({
                              label: faqPathLabelById.get(String(item._id)) || item.question,
                              value: String(item._id),
                            }))}
                          />
                        </Form.Item>
                        <Form.Item name="popularQuestionIds" label="Popular Questions">
                          <Select
                            mode="multiple"
                            options={faqItems.map((item) => ({
                              label: faqPathLabelById.get(String(item._id)) || item.question,
                              value: String(item._id),
                            }))}
                          />
                        </Form.Item>
                      </>,
                    )}
                  </div>
                ),
              },
              {
                key: "contact-actions",
                label: "Contact Actions",
                children: (
                  <div style={SETTINGS_SECTION_BOX_STYLE}>
                    <Form.List name="contactActions">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field, index) => (
                            <div key={field.key}>
                              {renderSettingsCard(
                                `Action ${index + 1}`,
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      paddingBottom: 8,
                                      marginBottom: 8,
                                      borderBottom: "1px solid #f0f0f0",
                                    }}
                                  >
                                    <span style={SETTINGS_ROW_LABEL_STYLE}>Enable action</span>
                                    <Form.Item
                                      {...field}
                                      name={[field.name, "enabled"]}
                                      valuePropName="checked"
                                      noStyle
                                    >
                                      <Switch />
                                    </Form.Item>
                                  </div>
                                  <Form.Item
                                    {...field}
                                    name={[field.name, "label"]}
                                    label="Label"
                                    rules={[{ required: true, message: "Label is required" }]}
                                  >
                                    <Input />
                                  </Form.Item>
                                  <Form.Item
                                    {...field}
                                    name={[field.name, "url"]}
                                    label="URL"
                                    rules={[{ required: true, message: "URL is required" }]}
                                  >
                                    <Input />
                                  </Form.Item>
                                  <Form.Item {...field} name={[field.name, "id"]} label="ID">
                                    <Input placeholder={`action-${index + 1}`} />
                                  </Form.Item>
                                  <Form.Item {...field} name={[field.name, "actionType"]} label="Type">
                                    <Select options={CONTACT_ACTION_TYPE_OPTIONS} />
                                  </Form.Item>
                                  <Form.Item {...field} name={[field.name, "icon"]} label="Icon">
                                    <Input placeholder="phone/mail/link" />
                                  </Form.Item>
                                  <Form.Item {...field} name={[field.name, "target"]} label="Target">
                                    <Select
                                      options={[
                                        { label: "Same Tab", value: "_self" },
                                        { label: "New Tab", value: "_blank" },
                                      ]}
                                    />
                                  </Form.Item>
                                  <Form.Item {...field} name={[field.name, "sortOrder"]} label="Sort Order">
                                    <InputNumber min={0} style={{ width: "100%" }} />
                                  </Form.Item>
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(field.name)}
                                  >
                                    Remove Action
                                  </Button>
                                </>,
                              )}
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
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>
      <style jsx global>{`
        .chatbot-settings-form .ant-form-item {
          margin-bottom: 10px;
        }

        .chatbot-settings-form .ant-form-item-label {
          padding-bottom: 4px;
        }

        .chatbot-settings-form .ant-list-item {
          padding-top: 8px;
          padding-bottom: 8px;
        }

        .chatbot-settings-form .ant-select-selector,
        .chatbot-settings-form .ant-input,
        .chatbot-settings-form .ant-input-number,
        .chatbot-settings-form .ant-picker {
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}
