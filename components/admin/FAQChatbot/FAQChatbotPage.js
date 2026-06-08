"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  ColorPicker,
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
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ThemeAdminCard } from "@/styles/Theme";

const { TextArea } = Input;
const { Text } = Typography;
const TREE_ROOT_KEY = "__root__";

function createNodeId(type) {
  const prefix = type === "answer" ? "a" : "q";
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractMediaIdFromUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const match = value.match(/\/media\/([a-fA-F0-9]{24})/);
  return match ? String(match[1] || "") : "";
}

function isCssColor(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    /^#[0-9a-fA-F]{3,8}$/.test(raw) ||
    /^rgba?\([^)]{3,}\)$/i.test(raw) ||
    /^hsla?\([^)]{3,}\)$/i.test(raw) ||
    /^var\(--[a-zA-Z0-9_-]+\)$/.test(raw) ||
    /^(transparent|inherit|initial|currentColor|unset)$/i.test(raw)
  );
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{3,8}$/.test(String(value || "").trim());
}

function ColorInputField({ value, onChange, placeholder = "#000000" }) {
  const raw = String(value || "").trim();
  const pickerValue = isHexColor(raw) ? raw : undefined;
  return (
    <Space.Compact style={{ width: "100%" }}>
      <ColorPicker
        value={pickerValue}
        onChangeComplete={(color) => onChange?.(color.toHexString())}
      />
      <Input
        value={raw}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
      />
    </Space.Compact>
  );
}

function toFormValues(config) {
  const colors = config?.colors && typeof config.colors === "object" ? config.colors : {};
  return {
    enabled: config?.enabled === true,
    headerTitle: config?.headerTitle || "",
    welcomeMessage: config?.welcomeMessage || "",
    noResultsFoundMessage: config?.noResultsFoundMessage || "",
    avatarUrl: config?.avatar?.url || "",
    avatarMediaId: config?.avatar?.mediaId || "",
    position: config?.position || "bottom-right",
    showTimestamps: config?.uiPreferences?.showTimestamps !== false,
    timestampFormat: config?.uiPreferences?.timestampFormat || "12h",
    timestampLocale: config?.uiPreferences?.timestampLocale || "en-US",
    timestampTimezoneStrategy:
      config?.uiPreferences?.timestampTimezoneStrategy || "client-local",
    fixedTimezone: config?.uiPreferences?.fixedTimezone || "",
    showTypingState: config?.uiPreferences?.showTypingState !== false,
    typingMinMs: Number(config?.uiPreferences?.typingMinMs || 600),
    typingMaxMs: Number(config?.uiPreferences?.typingMaxMs || 2500),
    colorLauncherGradientStart: colors.launcherGradientStart || "#13567a",
    colorLauncherGradientEnd: colors.launcherGradientEnd || "#1d9b78",
    colorHeaderGradientStart: colors.headerGradientStart || "#0f4f74",
    colorHeaderGradientEnd: colors.headerGradientEnd || "#157f67",
    colorUserBubbleBackground: colors.userBubbleBackground || "#125679",
    colorUserBubbleText: colors.userBubbleText || "#ffffff",
    colorBotBubbleBackground: colors.botBubbleBackground || "#ffffff",
    colorBotBubbleText: colors.botBubbleText || "#132430",
    colorChipBackground: colors.chipBackground || "#ffffff",
    colorChipText: colors.chipText || "#1b3a4e",
  };
}

function sortNodesByOrderThenId(a, b) {
  const orderA = Number.isFinite(Number(a?.order)) ? Number(a.order) : 0;
  const orderB = Number.isFinite(Number(b?.order)) ? Number(b.order) : 0;
  if (orderA !== orderB) return orderA - orderB;
  return String(a?.nodeId || "").localeCompare(String(b?.nodeId || ""));
}

function normalizeNodeOrders(nodes) {
  const groups = new Map();
  for (const node of nodes) {
    const parentKey = node.parentNodeId || TREE_ROOT_KEY;
    if (!groups.has(parentKey)) groups.set(parentKey, []);
    groups.get(parentKey).push(node);
  }

  const output = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort(sortNodesByOrderThenId);
    sorted.forEach((item, index) => {
      output.push({
        ...item,
        order: index,
      });
    });
  }
  return output;
}

function toNodePayload(nodes) {
  return nodes.map((node) => ({
    nodeId: String(node.nodeId || "").trim(),
    parentNodeId: node.parentNodeId || null,
    type: node.type === "answer" ? "answer" : "question",
    questionText: String(node.questionText || "").trim(),
    answerText: String(node.answerText || "").trim(),
    order: Number(node.order) || 0,
    isActive: node.isActive !== false,
  }));
}

function collectSubtreeNodeIds(nodes, rootNodeId) {
  const queue = [rootNodeId];
  const deleted = new Set();
  const childrenByParent = new Map();
  for (const node of nodes) {
    const key = node.parentNodeId || TREE_ROOT_KEY;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(node);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || deleted.has(current)) continue;
    deleted.add(current);
    const children = childrenByParent.get(current) || [];
    for (const child of children) {
      queue.push(child.nodeId);
    }
  }
  return deleted;
}

function getSiblingNodes(nodes, parentNodeId, excludeNodeId = "") {
  return nodes
    .filter(
      (node) =>
        (node.parentNodeId || null) === (parentNodeId || null) &&
        node.nodeId !== excludeNodeId,
    )
    .sort(sortNodesByOrderThenId);
}

function moveNodeInHierarchy(nodes, draggedNodeId, nextParentNodeId, insertIndex) {
  const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));
  const draggedNode = nodeMap.get(draggedNodeId);
  if (!draggedNode) return nodes;

  const groups = new Map();
  const pushToGroup = (node) => {
    const key = node.parentNodeId || TREE_ROOT_KEY;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...node });
  };

  for (const node of nodes) {
    if (node.nodeId === draggedNodeId) continue;
    pushToGroup(node);
  }

  const targetKey = nextParentNodeId || TREE_ROOT_KEY;
  if (!groups.has(targetKey)) groups.set(targetKey, []);
  const targetGroup = groups.get(targetKey);
  const boundedInsertIndex = Math.max(0, Math.min(Number(insertIndex) || 0, targetGroup.length));
  targetGroup.splice(boundedInsertIndex, 0, {
    ...draggedNode,
    parentNodeId: nextParentNodeId || null,
  });

  const output = [];
  for (const group of groups.values()) {
    group.forEach((item, index) => {
      output.push({
        ...item,
        order: index,
      });
    });
  }
  return normalizeNodeOrders(output);
}

function buildTreeData(nodes, { onAddQuestion, onAddAnswer, onEdit, onDelete }) {
  const childrenByParent = new Map();
  for (const node of nodes) {
    const key = node.parentNodeId || TREE_ROOT_KEY;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(node);
  }

  const getChildren = (parentNodeId) => {
    const key = parentNodeId || TREE_ROOT_KEY;
    const children = [...(childrenByParent.get(key) || [])].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.nodeId).localeCompare(String(b.nodeId));
    });
    return children.map((node) => {
      const label = node.type === "question" ? node.questionText : node.answerText;
      const truncated = label?.length > 90 ? `${label.slice(0, 90)}...` : label;
      return {
        key: node.nodeId,
        title: (
          <Row
            gutter={8}
            align="middle"
            justify="space-between"
            style={{ width: "100%" }}
            wrap={false}
          >
            <Col flex="auto" style={{ minWidth: 0 }}>
              <Space size={8}>
                <Tag color={node.type === "question" ? "blue" : "green"}>
                  {node.type}
                </Tag>
                <Text ellipsis style={{ maxWidth: "100%" }}>
                  {truncated || "(Empty)"}
                </Text>
              </Space>
            </Col>
            <Col>
              <Space size={4}>
                {node.type === "question" ? (
                  <>
                    <Button
                      size="small"
                      type="text"
                      title="Add child question"
                      icon={<PlusOutlined />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onAddQuestion(node);
                      }}
                    />
                    <Button
                      size="small"
                      type="text"
                      title="Add answer"
                      icon={<PlusOutlined />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onAddAnswer(node);
                      }}
                    />
                  </>
                ) : null}
                <Button
                  size="small"
                  type="text"
                  title={node.type === "question" ? "Edit question" : "Edit answer"}
                  icon={<EditOutlined />}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onEdit(node);
                  }}
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  title={node.type === "question" ? "Delete question" : "Delete answer"}
                  icon={<DeleteOutlined />}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete(node);
                  }}
                />
              </Space>
            </Col>
          </Row>
        ),
        children: getChildren(node.nodeId),
      };
    });
  };

  return getChildren(null);
}

function saveNodeDeleteAction({
  node,
  nodes,
  selectedNodeId,
  setNodes,
  setNodeCount,
  setTreeDirty,
  setSelectedNodeId,
}) {
  const idsToDelete =
    node.type === "question"
      ? collectSubtreeNodeIds(nodes, node.nodeId)
      : new Set([node.nodeId]);
  const next = normalizeNodeOrders(nodes.filter((item) => !idsToDelete.has(item.nodeId)));
  setNodes(next);
  setNodeCount(next.length);
  setTreeDirty(true);
  if (selectedNodeId && idsToDelete.has(selectedNodeId)) {
    setSelectedNodeId(next[0]?.nodeId || "");
  }
}

export default function FAQChatbotPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [savingTree, setSavingTree] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [nodeModalForm] = Form.useForm();
  const [treeVersion, setTreeVersion] = useState(1);
  const [nodeCount, setNodeCount] = useState(0);
  const [indexStatus, setIndexStatus] = useState(null);
  const [searchMetricsStatus, setSearchMetricsStatus] = useState(null);
  const [lastRebuildSummary, setLastRebuildSummary] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [treeDirty, setTreeDirty] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [nodeModalState, setNodeModalState] = useState({
    open: false,
    mode: "create",
    nodeType: "question",
    nodeId: "",
    parentNodeId: null,
  });

  const syncFromServer = useCallback(
    (data, { syncSettingsForm = true } = {}) => {
      if (syncSettingsForm) {
        form.setFieldsValue(toFormValues(data?.config || {}));
      }
      setIndexStatus(data?.config?.searchIndexStatus || null);
      setSearchMetricsStatus(data?.config?.searchMetricsStatus || null);
      setTreeVersion(Number(data?.config?.treeVersion || 1));
      const nextNodes = Array.isArray(data?.nodes) ? normalizeNodeOrders(data.nodes) : [];
      setNodes(nextNodes);
      setNodeCount(nextNodes.length);
      setTreeDirty(false);

      const parentIds = new Set(nextNodes.map((item) => item.parentNodeId).filter(Boolean));
      setExpandedKeys(nextNodes.filter((node) => parentIds.has(node.nodeId)).map((node) => node.nodeId));
      if (nextNodes.length === 0) {
        setSelectedNodeId("");
      } else if (!nextNodes.some((item) => item.nodeId === selectedNodeId)) {
        setSelectedNodeId(nextNodes[0].nodeId);
      }
    },
    [form, selectedNodeId],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/faq-chatbot", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Failed to load FAQ chatbot settings");
        return;
      }
      syncFromServer(data);
      setSettingsDirty(false);
    } catch {
      message.error("Failed to load FAQ chatbot settings");
    } finally {
      setLoading(false);
    }
  }, [syncFromServer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedNode = useMemo(
    () => nodes.find((item) => item.nodeId === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  const openNodeModal = useCallback((state, text = "") => {
    setNodeModalState(state);
    nodeModalForm.setFieldsValue({ text });
  }, [nodeModalForm]);

  const treeData = useMemo(
    () =>
      buildTreeData(nodes, {
        onAddQuestion: (parentNode) =>
          openNodeModal(
            {
              open: true,
              mode: "create",
              nodeType: "question",
              nodeId: "",
              parentNodeId: parentNode?.nodeId || null,
            },
            "",
          ),
        onAddAnswer: (parentNode) =>
          openNodeModal(
            {
              open: true,
              mode: "create",
              nodeType: "answer",
              nodeId: "",
              parentNodeId: parentNode?.nodeId || null,
            },
            "",
          ),
        onEdit: (node) =>
          openNodeModal(
            {
              open: true,
              mode: "edit",
              nodeType: node.type,
              nodeId: node.nodeId,
              parentNodeId: node.parentNodeId || null,
            },
            node.type === "question" ? node.questionText : node.answerText,
          ),
        onDelete: (node) => {
          Modal.confirm({
            title:
              node.type === "question"
                ? "Delete question and all descendants?"
                : "Delete answer?",
            content:
              node.type === "question"
                ? "This will remove the selected question, all nested questions, and all answers under it."
                : "This will remove only the selected answer.",
            okText: "Delete",
            cancelText: "Cancel",
            okButtonProps: { danger: true },
            onOk: () => {
              saveNodeDeleteAction({
                node,
                nodes,
                selectedNodeId,
                setNodes,
                setNodeCount,
                setTreeDirty,
                setSelectedNodeId,
              });
            },
          });
        },
      }),
    [nodes, openNodeModal, selectedNodeId],
  );

  const openCreateRootQuestion = () => {
    openNodeModal(
      {
        open: true,
        mode: "create",
        nodeType: "question",
        nodeId: "",
        parentNodeId: null,
      },
      "",
    );
  };

  const handleNodeModalCancel = () => {
    setNodeModalState((prev) => ({ ...prev, open: false }));
    nodeModalForm.resetFields();
  };

  const handleNodeModalSubmit = async () => {
    try {
      const values = await nodeModalForm.validateFields();
      const textValue = String(values?.text || "").trim();
      if (!textValue) return;

      if (nodeModalState.mode === "edit") {
        setNodes((prev) =>
          normalizeNodeOrders(
            prev.map((item) => {
              if (item.nodeId !== nodeModalState.nodeId) return item;
              if (item.type === "question") {
                return { ...item, questionText: textValue };
              }
              return { ...item, answerText: textValue };
            }),
          ),
        );
        setTreeDirty(true);
        handleNodeModalCancel();
        return;
      }

      const newNodeType = nodeModalState.nodeType === "answer" ? "answer" : "question";
      const parentNodeId = nodeModalState.parentNodeId || null;
      setNodes((prev) => {
        const siblingCount = prev.filter(
          (item) => (item.parentNodeId || null) === parentNodeId,
        ).length;
        const newNode = {
          nodeId: createNodeId(newNodeType),
          parentNodeId,
          rootNodeId: "",
          type: newNodeType,
          questionText: newNodeType === "question" ? textValue : "",
          answerText: newNodeType === "answer" ? textValue : "",
          depth: 0,
          order: siblingCount,
          pathNodeIds: [],
          pathText: "",
          isActive: true,
        };
        const next = normalizeNodeOrders([...prev, newNode]);
        setNodeCount(next.length);
        setSelectedNodeId(newNode.nodeId);
        setTreeDirty(true);
        return next;
      });
      handleNodeModalCancel();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to save node");
    }
  };

  const expandAll = () => {
    const parentIds = new Set(nodes.map((item) => item.parentNodeId).filter(Boolean));
    setExpandedKeys(nodes.filter((node) => parentIds.has(node.nodeId)).map((node) => node.nodeId));
  };

  const handleTreeDrop = useCallback(
    (info) => {
      const draggedNodeId = String(info?.dragNode?.key || "");
      const targetNodeId = String(info?.node?.key || "");
      if (!draggedNodeId || !targetNodeId || draggedNodeId === targetNodeId) return;

      const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));
      const draggedNode = nodeMap.get(draggedNodeId);
      const targetNode = nodeMap.get(targetNodeId);
      if (!draggedNode || !targetNode) return;

      let nextParentNodeId = null;
      let insertIndex = 0;

      if (info?.dropToGap) {
        nextParentNodeId = targetNode.parentNodeId || null;
        const siblings = getSiblingNodes(nodes, nextParentNodeId, draggedNodeId);
        const targetIndex = siblings.findIndex((item) => item.nodeId === targetNodeId);
        if (targetIndex < 0) return;

        const posParts = String(info?.node?.pos || "").split("-");
        const targetPos = Number(posParts[posParts.length - 1]) || 0;
        const relativeDropPosition = Number(info?.dropPosition) - targetPos;
        insertIndex = relativeDropPosition > 0 ? targetIndex + 1 : targetIndex;
      } else {
        nextParentNodeId = targetNodeId;
        const children = getSiblingNodes(nodes, nextParentNodeId, draggedNodeId);
        insertIndex = children.length;
      }

      if (!nextParentNodeId && draggedNode.type !== "question") {
        message.warning("Only question nodes can be placed at root level.");
        return;
      }
      if (nextParentNodeId) {
        const parentNode = nodeMap.get(nextParentNodeId);
        if (!parentNode || parentNode.type !== "question") {
          message.warning("Nodes can only be nested under question nodes.");
          return;
        }
      }

      const subtreeNodeIds = collectSubtreeNodeIds(nodes, draggedNodeId);
      if (nextParentNodeId && subtreeNodeIds.has(nextParentNodeId)) {
        message.warning("Cannot move a node into its own descendant branch.");
        return;
      }

      const nextNodes = moveNodeInHierarchy(
        nodes,
        draggedNodeId,
        nextParentNodeId,
        insertIndex,
      );
      setNodes(nextNodes);
      setNodeCount(nextNodes.length);
      setTreeDirty(true);
      if (nextParentNodeId) {
        setExpandedKeys((prev) => Array.from(new Set([...prev, nextParentNodeId])));
      }
    },
    [nodes],
  );

  const handleSaveTree = async () => {
    if (!treeDirty) {
      message.info("No FAQ tree changes to save");
      return;
    }
    try {
      setSavingTree(true);
      const res = await fetch("/api/admin/faq-chatbot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeVersion,
          nodes: toNodePayload(nodes),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          message.error("Version conflict. Reloaded latest data.");
          await loadData();
          return;
        }
        message.error(data?.error || "Failed to save FAQ tree");
        return;
      }
      syncFromServer(data, { syncSettingsForm: !settingsDirty });
      message.success("FAQ tree saved");
    } catch {
      message.error("Failed to save FAQ tree");
    } finally {
      setSavingTree(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      setSavingSettings(true);

      const avatarUrl = String(values.avatarUrl || "").trim();
      const avatarMediaId =
        String(values.avatarMediaId || "").trim() || extractMediaIdFromUrl(avatarUrl);
      const payload = {
        treeVersion,
        config: {
          enabled: values.enabled,
          headerTitle: String(values.headerTitle || "").trim(),
          welcomeMessage: String(values.welcomeMessage || "").trim(),
          noResultsFoundMessage: String(values.noResultsFoundMessage || "").trim(),
          position: values.position,
          avatar: {
            mediaId: avatarMediaId,
            url: avatarUrl,
          },
          colors: {
            launcherGradientStart: String(values.colorLauncherGradientStart || "").trim(),
            launcherGradientEnd: String(values.colorLauncherGradientEnd || "").trim(),
            headerGradientStart: String(values.colorHeaderGradientStart || "").trim(),
            headerGradientEnd: String(values.colorHeaderGradientEnd || "").trim(),
            userBubbleBackground: String(values.colorUserBubbleBackground || "").trim(),
            userBubbleText: String(values.colorUserBubbleText || "").trim(),
            botBubbleBackground: String(values.colorBotBubbleBackground || "").trim(),
            botBubbleText: String(values.colorBotBubbleText || "").trim(),
            chipBackground: String(values.colorChipBackground || "").trim(),
            chipText: String(values.colorChipText || "").trim(),
          },
          uiPreferences: {
            showTimestamps: values.showTimestamps,
            timestampFormat: values.timestampFormat,
            timestampLocale: values.timestampLocale,
            timestampTimezoneStrategy: values.timestampTimezoneStrategy,
            fixedTimezone: values.fixedTimezone,
            showTypingState: values.showTypingState,
            typingMinMs: Number(values.typingMinMs),
            typingMaxMs: Number(values.typingMaxMs),
          },
        },
      };

      const res = await fetch("/api/admin/faq-chatbot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          message.error("Version conflict. Reloaded latest data.");
          await loadData();
          return;
        }
        message.error(data?.error || "Failed to save settings");
        return;
      }
      syncFromServer(data, { syncSettingsForm: true });
      setSettingsDirty(false);
      message.success("Chatbot settings saved");
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to save chatbot settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const res = await fetch("/api/admin/faq-chatbot/rebuild-search-index", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Failed to rebuild search index");
        return;
      }
      setLastRebuildSummary(data);
      setIndexStatus(data?.config?.searchIndexStatus || null);
      setSearchMetricsStatus(data?.config?.searchMetricsStatus || null);
      message.success("Search index rebuild completed");
    } catch {
      message.error("Failed to rebuild search index");
    } finally {
      setRebuilding(false);
    }
  };

  const colorRules = [
    { required: true, message: "Color is required" },
    {
      validator: async (_rule, value) => {
        if (isCssColor(value)) return;
        throw new Error("Use a valid CSS color (hex/rgb/hsl/var)");
      },
    },
  ];

  return (
    <>
      <ThemeAdminCard
        title="FAQ Chatbot"
        extra={
          <Space>
            <Button onClick={loadData} icon={<ReloadOutlined />}>
              Reload
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
              Chatbot Settings
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingTree}
              onClick={handleSaveTree}
            >
              Save FAQ Tree
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type={treeDirty ? "warning" : "info"}
            showIcon
            message={
              treeDirty
                ? "FAQ tree has unsaved changes. Click Save FAQ Tree to persist."
                : "Manage question and answer hierarchy from the tree."
            }
          />

          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Text strong>Current Tree Version: </Text>
              <Text>{treeVersion}</Text>
            </Col>
            <Col xs={24} md={8}>
              <Text strong>Total FAQ Nodes: </Text>
              <Text>{nodeCount}</Text>
            </Col>
            <Col xs={24} md={8}>
              <Text type={settingsDirty ? "warning" : "secondary"}>
                {settingsDirty
                  ? "Settings drawer has unsaved changes."
                  : "Settings are up to date."}
              </Text>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={15}>
              <ThemeAdminCard
                title="FAQ Tree"
                extra={
                  <Space>
                    <Button size="small" onClick={() => setExpandedKeys([])}>
                      Collapse All
                    </Button>
                    <Button size="small" onClick={expandAll}>
                      Expand All
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={openCreateRootQuestion}
                    >
                      Add Root Question
                    </Button>
                  </Space>
                }
              >
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Drag and drop nodes to reorder or move them across question branches.
                </Text>
                {treeData.length > 0 ? (
                  <Tree
                    blockNode
                    showLine
                    draggable={{ icon: false }}
                    allowDrop={({ dropNode, dropToGap }) => {
                      const dropNodeId = String(dropNode?.key || "");
                      const node = nodes.find((item) => item.nodeId === dropNodeId);
                      if (!node) return false;
                      return dropToGap || node.type === "question";
                    }}
                    treeData={treeData}
                    selectedKeys={selectedNodeId ? [selectedNodeId] : []}
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys)}
                    onDrop={handleTreeDrop}
                    onSelect={(keys) => setSelectedNodeId(String(keys?.[0] || ""))}
                  />
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    message="No FAQ nodes yet."
                    description="Start by adding a root question."
                  />
                )}
              </ThemeAdminCard>
            </Col>
            <Col xs={24} xl={9}>
              <ThemeAdminCard title="Selected Node Actions">
                {selectedNode ? (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space>
                      <Tag color={selectedNode.type === "question" ? "blue" : "green"}>
                        {selectedNode.type}
                      </Tag>
                      <Text code>{selectedNode.nodeId}</Text>
                    </Space>
                    <Text>
                      {selectedNode.type === "question"
                        ? selectedNode.questionText
                        : selectedNode.answerText}
                    </Text>
                    <Space wrap>
                      {selectedNode.type === "question" ? (
                        <>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              openNodeModal(
                                {
                                  open: true,
                                  mode: "create",
                                  nodeType: "question",
                                  nodeId: "",
                                  parentNodeId: selectedNode.nodeId,
                                },
                                "",
                              )
                            }
                          >
                            Add Question
                          </Button>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              openNodeModal(
                                {
                                  open: true,
                                  mode: "create",
                                  nodeType: "answer",
                                  nodeId: "",
                                  parentNodeId: selectedNode.nodeId,
                                },
                                "",
                              )
                            }
                          >
                            Add Answer
                          </Button>
                        </>
                      ) : null}
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() =>
                          openNodeModal(
                            {
                              open: true,
                              mode: "edit",
                              nodeType: selectedNode.type,
                              nodeId: selectedNode.nodeId,
                              parentNodeId: selectedNode.parentNodeId || null,
                            },
                            selectedNode.type === "question"
                              ? selectedNode.questionText
                              : selectedNode.answerText,
                          )
                        }
                      >
                        {selectedNode.type === "question" ? "Edit Question" : "Edit Answer"}
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          Modal.confirm({
                            title:
                              selectedNode.type === "question"
                                ? "Delete question and descendants?"
                                : "Delete answer?",
                            content:
                              selectedNode.type === "question"
                                ? "All nested questions and answers will be deleted."
                                : "This will delete only this answer.",
                            okText: "Delete",
                            cancelText: "Cancel",
                            okButtonProps: { danger: true },
                            onOk: () => {
                              saveNodeDeleteAction({
                                node: selectedNode,
                                nodes,
                                selectedNodeId,
                                setNodes,
                                setNodeCount,
                                setTreeDirty,
                                setSelectedNodeId,
                              });
                            },
                          });
                        }}
                      >
                        {selectedNode.type === "question" ? "Delete Question" : "Delete Answer"}
                      </Button>
                    </Space>
                  </Space>
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    message="No node selected"
                    description="Select a node from the tree to edit or delete."
                  />
                )}
              </ThemeAdminCard>
            </Col>
          </Row>
        </Space>
      </ThemeAdminCard>

      <Drawer
        title="FAQ Chatbot Settings"
        placement="right"
        width={520}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        extra={
          <Space>
            <Button
              icon={<ToolOutlined />}
              loading={rebuilding}
              onClick={handleRebuild}
            >
              Rebuild Index
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingSettings}
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Alert
            type={settingsDirty ? "warning" : "info"}
            showIcon
            message={
              settingsDirty
                ? "Settings have unsaved changes."
                : "Settings are saved and active."
            }
          />

          {lastRebuildSummary ? (
            <Alert
              type="success"
              showIcon
              message={`Last rebuild: scanned ${lastRebuildSummary.scannedNodes || 0} nodes, indexed ${lastRebuildSummary.indexedRows || 0} rows in ${lastRebuildSummary.durationMs || 0} ms.`}
            />
          ) : null}
          {indexStatus?.lastRebuildAt ? (
            <Alert
              type={indexStatus.lastError ? "warning" : "info"}
              showIcon
              message={
                indexStatus.lastError
                  ? `Search index status: ${indexStatus.lastError}`
                  : `Search index status: ${indexStatus.lastRebuildSource || "manual"} rebuild at ${new Date(indexStatus.lastRebuildAt).toLocaleString()}`
              }
              description={`Tree v${indexStatus.lastTreeVersion || treeVersion}, scanned ${indexStatus.lastScannedNodes || 0}, indexed ${indexStatus.lastIndexedRows || 0}, skipped ${indexStatus.lastSkippedRows || 0}, duration ${indexStatus.lastDurationMs || 0} ms, auto-repairs ${indexStatus.autoRepairCount || 0}.`}
            />
          ) : null}
          {Number(searchMetricsStatus?.totalQueries || 0) > 0 ? (
            <Alert
              type="info"
              showIcon
              message={`Search metrics: ${searchMetricsStatus.totalQueries || 0} queries, ${searchMetricsStatus.noResultQueries || 0} no-result queries, avg latency ${searchMetricsStatus.averageLatencyMs || 0} ms.`}
              description={`Indexed path ${searchMetricsStatus.indexedQueryCount || 0}, fallback path ${searchMetricsStatus.fallbackQueryCount || 0}, last query "${searchMetricsStatus.lastQuery || "-"}" at ${searchMetricsStatus.lastQueryAt ? new Date(searchMetricsStatus.lastQueryAt).toLocaleString() : "-"} (${searchMetricsStatus.lastLatencyMs || 0} ms, ${searchMetricsStatus.lastResultCount || 0} results, source ${searchMetricsStatus.lastSource || "none"}).`}
            />
          ) : null}

          <Form
            form={form}
            layout="vertical"
            onValuesChange={() => setSettingsDirty(true)}
          >
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="enabled"
                  label="Enable Chatbot"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="position" label="Widget Position">
                  <Select
                    options={[
                      { value: "bottom-right", label: "Bottom Right" },
                      { value: "bottom-left", label: "Bottom Left" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="headerTitle"
              label="Header Title"
              rules={[{ required: true, message: "Header title is required" }]}
            >
              <Input maxLength={120} placeholder="FAQ Assistant" />
            </Form.Item>

            <Form.Item name="avatarUrl" label="Avatar / Logo">
              <MediaPickerInput placeholder="/media/..." uiVariant="stacked" />
            </Form.Item>
            <Form.Item name="avatarMediaId" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="welcomeMessage"
              label="Welcome Message"
              rules={[{ required: true, message: "Welcome message is required" }]}
            >
              <TextArea rows={3} maxLength={2000} />
            </Form.Item>

            <Form.Item
              name="noResultsFoundMessage"
              label="No Results Found Message"
              rules={[
                { required: true, message: "No results message is required" },
                { min: 10, message: "Minimum 10 characters" },
                { max: 300, message: "Maximum 300 characters" },
              ]}
            >
              <TextArea rows={2} maxLength={300} />
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="showTimestamps"
                  label="Show Timestamps"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="timestampFormat" label="Timestamp Format">
                  <Select
                    options={[
                      { value: "12h", label: "12h" },
                      { value: "24h", label: "24h" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="timestampLocale" label="Timestamp Locale">
                  <Input maxLength={40} placeholder="en-US" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="timestampTimezoneStrategy" label="Timezone Strategy">
                  <Select
                    options={[
                      { value: "client-local", label: "Client Local" },
                      { value: "fixed-timezone", label: "Fixed Timezone" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              shouldUpdate={(prev, next) =>
                prev.timestampTimezoneStrategy !== next.timestampTimezoneStrategy
              }
              noStyle
            >
              {({ getFieldValue }) =>
                getFieldValue("timestampTimezoneStrategy") === "fixed-timezone" ? (
                  <Form.Item
                    name="fixedTimezone"
                    label="Fixed Timezone (IANA)"
                    rules={[{ required: true, message: "Fixed timezone is required" }]}
                  >
                    <Input placeholder="Asia/Kolkata" maxLength={80} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="showTypingState"
                  label="Show Typing State"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="typingMinMs"
                  label="Typing Min (ms)"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber min={0} max={15000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="typingMaxMs"
                  label="Typing Max (ms)"
                  dependencies={["typingMinMs"]}
                  rules={[
                    { required: true, message: "Required" },
                    ({ getFieldValue }) => ({
                      validator(_rule, value) {
                        const min = Number(getFieldValue("typingMinMs"));
                        const max = Number(value);
                        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
                          return Promise.reject(new Error("Max must be greater than or equal to Min"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber min={0} max={30000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Color Management
            </Text>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorLauncherGradientStart"
                  label="Launcher Gradient Start"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#13567a" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorLauncherGradientEnd"
                  label="Launcher Gradient End"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#1d9b78" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorHeaderGradientStart"
                  label="Header Gradient Start"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#0f4f74" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorHeaderGradientEnd"
                  label="Header Gradient End"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#157f67" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorUserBubbleBackground"
                  label="User Bubble Background"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#125679" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorUserBubbleText"
                  label="User Bubble Text"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#ffffff" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorBotBubbleBackground"
                  label="Bot Bubble Background"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#ffffff" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorBotBubbleText"
                  label="Bot Bubble Text"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#132430" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorChipBackground"
                  label="Option Chip Background"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#ffffff" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="colorChipText"
                  label="Option Chip Text"
                  rules={colorRules}
                >
                  <ColorInputField placeholder="#1b3a4e" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Space>
      </Drawer>

      <Modal
        title={
          nodeModalState.mode === "edit"
            ? nodeModalState.nodeType === "question"
              ? "Edit Question"
              : "Edit Answer"
            : nodeModalState.nodeType === "question"
              ? "Add Question"
              : "Add Answer"
        }
        open={nodeModalState.open}
        onCancel={handleNodeModalCancel}
        onOk={handleNodeModalSubmit}
        okText={nodeModalState.mode === "edit" ? "Update" : "Create"}
        destroyOnClose
      >
        <Form form={nodeModalForm} layout="vertical">
          <Form.Item
            name="text"
            label={nodeModalState.nodeType === "question" ? "Question Text" : "Answer Text"}
            rules={[
              { required: true, message: "Text is required" },
              { min: 2, message: "Minimum 2 characters" },
            ]}
          >
            <TextArea rows={4} maxLength={nodeModalState.nodeType === "question" ? 2000 : 4000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
