"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Space,
  message,
  Modal,
  Checkbox,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  HolderOutlined,
  DownOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAdminPermission } from "@/components/admin/AdminAuthContext";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  PDF_LINK_TARGET_OPTIONS,
  isPdfDocumentUrl,
  normalizePdfTarget,
} from "@/components/site/shared/PdfViewerModal";
import { ThemeAdminCard } from "@/styles/Theme";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";

function generateId() {
  return "mi_" + Math.random().toString(36).slice(2, 11);
}

function getMenuItemTarget(item) {
  if (item?.type === "modal") return "modal";
  if (item?.target === "modal") return "modal";
  if (item?.target === "_blank" || item?.openInNewTab) return "_blank";
  return normalizePdfTarget(
    item?.target,
    "_self",
  );
}

function supportsPdfModal(item) {
  return (
    item?.type === "modal" ||
    (item?.type === "custom_link" && isPdfDocumentUrl(item?.url))
  );
}

function getTargetOptions(item) {
  return supportsPdfModal(item)
    ? PDF_LINK_TARGET_OPTIONS
    : PDF_LINK_TARGET_OPTIONS.filter((option) => option.value !== "modal");
}

// Convert tree (API) to flat list with depth for editing
function treeToFlat(items, depth = 0) {
  if (!items || !Array.isArray(items)) return [];
  const flat = [];
  items.forEach((it, i) => {
    const id = it._id?.toString() || generateId();
    flat.push({
      id,
      label: it.label || "",
      url: it.url || "#",
      order: it.order ?? i,
      openInNewTab: !!it.openInNewTab,
      target: getMenuItemTarget(it),
      type:
        it.type === "page"
          ? "page"
          : it.type === "modal"
            ? "modal"
            : "custom_link",
      pageSlug: it.pageSlug || "",
      depth,
    });
    if (it.children?.length) flat.push(...treeToFlat(it.children, depth + 1));
  });
  return flat;
}

// Convert flat list with depth back to tree for API
function flatToTree(flat) {
  if (!flat.length) return [];
  const out = [];
  const stack = [];
  flat.forEach((it) => {
    const target = it.type === "modal"
      ? "modal"
      : supportsPdfModal(it)
        ? getMenuItemTarget(it)
        : getMenuItemTarget(it) === "_blank"
          ? "_blank"
          : "_self";
    const node = {
      label: it.label,
      url: it.url,
      order: it.order,
      openInNewTab: target === "_blank",
      target,
      type: it.type,
      pageSlug: it.pageSlug || "",
    };
    while (stack.length > it.depth) stack.pop();
    const parent = stack[it.depth - 1];
    if (!parent) {
      out.push(node);
    } else {
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }
    stack[it.depth] = node;
  });
  return out;
}

function SortableMenuItem({
  item,
  pages,
  expanded,
  bulkSelected,
  onToggleExpand,
  onToggleBulkSelect,
  onUpdate,
  onRemove,
  onPromote,
  onDemote,
  depth,
  canDemote,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isSub = depth > 0;
  const indentPx = depth * 24;

  return (
    <div ref={setNodeRef} style={style} className="menu-structure-item-wrapper">
      <div
        className="menu-structure-item"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          marginBottom: 4,
          marginLeft: indentPx,
        }}
      >
        <span
          {...listeners}
          style={{ cursor: "grab", marginRight: 8, color: "#999" }}
        >
          <HolderOutlined />
        </span>
        <Checkbox
          checked={bulkSelected}
          onChange={(e) => onToggleBulkSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          style={{ marginRight: 8 }}
        />
        <span style={{ flex: 1, fontWeight: 500 }}>
          {item.label || "(No label)"}
          {isSub && (
            <span style={{ color: "#888", fontWeight: 400, marginLeft: 6 }}>
              {depth === 1 ? "sub item" : `sub item (level ${depth + 1})`}
            </span>
          )}
        </span>
        <span style={{ color: "#666", fontSize: 12, marginRight: 8 }}>
          {item.type === "page"
            ? "Page"
            : item.type === "modal"
              ? "Modal"
              : "Custom Link"}
        </span>
        <Button
          type="text"
          size="small"
          icon={
            <DownOutlined
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            />
          }
          onClick={() => onToggleExpand()}
        />
      </div>
      {expanded && (
        <div
          style={{
            marginLeft: indentPx,
            marginBottom: 8,
            padding: 12,
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Form.Item label="Navigation Label" style={{ marginBottom: 8 }}>
              <Input
                value={item.label}
                onChange={(e) => onUpdate({ ...item, label: e.target.value })}
                placeholder="Label"
              />
            </Form.Item>
            <Form.Item label="Type" style={{ marginBottom: 8 }}>
              <Select
                style={{ width: "100%" }}
                value={item.type}
                onChange={(v) => {
                  if (v === "modal") {
                    onUpdate({
                      ...item,
                      type: v,
                      url: isPdfDocumentUrl(item.url) ? item.url : "",
                      pageSlug: "",
                      target: "modal",
                      openInNewTab: false,
                    });
                    return;
                  }
                  if (v === "page") {
                    onUpdate({
                      ...item,
                      type: v,
                      url: "",
                      target: item.target === "_blank" ? "_blank" : "_self",
                      openInNewTab: item.target === "_blank",
                    });
                    return;
                  }
                  onUpdate({
                    ...item,
                    type: v,
                    pageSlug: "",
                    target: item.target === "_blank" ? "_blank" : "_self",
                    openInNewTab: item.target === "_blank",
                  });
                }}
                options={[
                  { value: "custom_link", label: "Custom Link" },
                  { value: "page", label: "Page" },
                  { value: "modal", label: "Modal" },
                ]}
              />
            </Form.Item>
            {item.type === "page" ? (
              <Form.Item label="Page" style={{ marginBottom: 8 }}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select a page"
                  value={item.pageSlug || undefined}
                  onChange={(slug) => {
                    const p = pages.find((x) => x.slug === slug);
                    onUpdate({
                      ...item,
                      pageSlug: slug,
                      url: p ? `/${slug}` : `/${slug}`,
                      label: p?.title || item.label,
                    });
                  }}
                  showSearch
                  optionFilterProp="label"
                  options={pages.map((p) => ({
                    value: p.slug,
                    label: `${p.title} (/${p.slug})`,
                  }))}
                />
              </Form.Item>
            ) : item.type === "modal" ? (
              <Form.Item label="PDF Link / Document" style={{ marginBottom: 8 }}>
                <MediaPickerInput
                  value={item.url}
                  onChange={(url) =>
                    onUpdate({
                      ...item,
                      url: String(url || "").trim(),
                      target: "modal",
                      openInNewTab: false,
                    })
                  }
                  mediaType="document"
                  showVariants={false}
                  uiVariant="stacked"
                  placeholder="/uploads/document.pdf or https://example.com/document.pdf"
                  hintText="Select/upload a PDF from Media or enter an external PDF URL."
                />
              </Form.Item>
            ) : (
              <Form.Item label="URL" style={{ marginBottom: 8 }}>
                <Input
                  value={item.url}
                  onChange={(e) => {
                    const url = e.target.value;
                    const keepModal = item.target !== "modal" || isPdfDocumentUrl(url);
                    onUpdate({
                      ...item,
                      url,
                      ...(keepModal
                        ? {}
                        : { target: "_self", openInNewTab: false }),
                    });
                  }}
                  placeholder="https:// or /path"
                />
              </Form.Item>
            )}
            <Form.Item label="Target" style={{ marginBottom: 0 }}>
              <Space wrap>
                <Select
                  value={getMenuItemTarget(item)}
                  onChange={(value) =>
                    onUpdate({
                      ...item,
                      target: value,
                      openInNewTab: value === "_blank",
                    })
                  }
                  style={{ minWidth: 180 }}
                  options={
                    item.type === "modal"
                      ? [{ value: "modal", label: "Modal" }]
                      : getTargetOptions(item)
                  }
                  disabled={item.type === "modal"}
                />
                {depth > 0 && onPromote && (
                  <Button
                    type="default"
                    size="small"
                    onClick={() => onPromote(item)}
                    title="Move one level up (same level as parent)"
                  >
                    Move up level
                  </Button>
                )}
                {canDemote && onDemote && (
                  <Button
                    type="default"
                    size="small"
                    onClick={() => onDemote(item)}
                    title="Make sub-item of the item above"
                  >
                    Indent
                  </Button>
                )}
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => onRemove(item)}
                >
                  Remove
                </Button>
              </Space>
            </Form.Item>
          </Space>
        </div>
      )}
    </div>
  );
}

export default function AdminMenusPage() {
  const canDeleteMenu = useAdminPermission("menus.delete");
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(null);
  const [menuName, setMenuName] = useState("");
  const [flatItems, setFlatItems] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [pages, setPages] = useState([]);
  const [structureView, setStructureView] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMenus = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/menus")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMenus)
      .catch(() => message.error("Failed to load menus"))
      .finally(() => setLoading(false));
  }, []);

  const fetchPages = useCallback(() => {
    fetch("/api/admin/pages?limit=200&fields=title,slug,status&includeTotal=0")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setPages(data.items || []))
      .catch(() => setPages([]));
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleEdit = (record) => {
    setEditingName(record.name);
    setMenuName(record.name);
    setFlatItems(
      treeToFlat(record.items || []).map((it) => ({
        ...it,
        id: it.id || generateId(),
      })),
    );
    setExpandedIds(new Set());
    setBulkSelectedIds(new Set());
    setStructureView(true);
    fetchPages();
  };

  const handleCreate = () => {
    setEditingName(null);
    setMenuName("Primary menu");
    setFlatItems([]);
    setExpandedIds(new Set());
    setBulkSelectedIds(new Set());
    setStructureView(true);
    fetchPages();
  };

  const handleBack = () => {
    setStructureView(false);
    setEditingName(null);
    fetchMenus();
  };

  const updateItem = (id, next) => {
    setFlatItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...next } : it)),
    );
  };

  const removeItem = (item) => {
    setFlatItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx < 0) return prev;
      const depth = item.depth;
      const next = [];
      for (let i = 0; i < prev.length; i++) {
        if (i === idx) {
          while (i + 1 < prev.length && prev[i + 1].depth > depth) i++;
          continue;
        }
        next.push(prev[i]);
      }
      return next;
    });
  };

  const promoteItem = (item) => {
    if (item.depth <= 0) return;
    setFlatItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, depth: i.depth - 1 } : i)),
    );
    message.success(
      `"${item.label || "Item"}" is now one level up (sibling of parent).`,
    );
  };

  const demoteItem = (item) => {
    const idx = flatItems.findIndex((i) => i.id === item.id);
    if (idx <= 0) return;
    const itemAbove = flatItems[idx - 1];
    const newDepth = itemAbove.depth + 1;
    setFlatItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, depth: newDepth } : i)),
    );
    message.success(
      `"${item.label || "Item"}" is now a sub-item of "${itemAbove.label || "above"}".`,
    );
  };

  const addTopLevelItem = () => {
    const newItem = {
      id: generateId(),
      label: "New item",
      url: "#",
      order: flatItems.length,
      openInNewTab: false,
      target: "_self",
      type: "custom_link",
      pageSlug: "",
      depth: 0,
    };
    setFlatItems((prev) => [...prev, newItem]);
    setExpandedIds((s) => new Set([...s, newItem.id]));
  };

  const handleSaveMenuStructure = async () => {
    const name = (menuName || "").trim();
    if (!name) {
      message.error("Menu name is required");
      return;
    }
    const invalidModalItem = flatItems.find(
      (item) => item.type === "modal" && !isPdfDocumentUrl(item.url),
    );
    if (invalidModalItem) {
      message.error(
        `Select or enter a valid PDF document for "${invalidModalItem.label || "Modal item"}".`,
      );
      setExpandedIds((current) => new Set([...current, invalidModalItem.id]));
      return;
    }
    const tree = flatToTree(flatItems.map((it, i) => ({ ...it, order: i })));
    setSaving(true);
    try {
      const isRename = editingName && name !== editingName;
      if (isRename) {
        const createRes = await fetch("/api/admin/menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, items: tree }),
        });
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          message.error(data.error || "Save failed");
          setSaving(false);
          return;
        }
        const createData = await createRes.json().catch(() => ({}));
        const delRes = await fetch(
          `/api/admin/menus/${encodeURIComponent(editingName)}`,
          { method: "DELETE" },
        );
        if (!delRes.ok) {
          message.error("Renamed but could not remove old menu");
        }
        message.success(`Menu saved as "${name}"`);
        if (Array.isArray(createData._slugConflicts)) {
          createData._slugConflicts.forEach((c) => message.warning(c, 6));
        }
      } else {
        const url = editingName
          ? `/api/admin/menus/${encodeURIComponent(editingName)}`
          : "/api/admin/menus";
        const method = editingName ? "PUT" : "POST";
        const body = editingName ? { items: tree } : { name, items: tree };
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Save failed");
          setSaving(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        message.success("Menu saved");
        if (Array.isArray(data._slugConflicts)) {
          data._slugConflicts.forEach((c) => message.warning(c, 6));
        }
      }
      setStructureView(false);
      setEditingName(null);
      fetchMenus();
    } catch (e) {
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkRemove = () => {
    if (!bulkSelectedIds.size) {
      message.info("Select items first");
      return;
    }
    setFlatItems((prev) => prev.filter((it) => !bulkSelectedIds.has(it.id)));
    setBulkSelectedIds(new Set());
    message.success("Removed selected items");
  };

  const handleDeleteConfirm = (record) => {
    Modal.confirm({
      title: "Delete menu?",
      content: `Delete menu "${record.name}"? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(
          `/api/admin/menus/${encodeURIComponent(record.name)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Menu deleted");
        fetchMenus();
      },
    });
  };

  const handleCopy = async (record) => {
    try {
      const res = await fetch(`/api/admin/menus/${encodeURIComponent(record.name)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Failed to load menu");
        return;
      }
      const menu = await res.json();
      const items = Array.isArray(menu.items) ? JSON.parse(JSON.stringify(menu.items)) : [];
      let copyName = `${record.name} (copy)`;
      let n = 1;
      while (menus.some((m) => m.name === copyName)) {
        n += 1;
        copyName = `${record.name} (copy ${n})`;
      }
      const createRes = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: copyName, items }),
      });
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        message.error(data.error || "Copy failed");
        return;
      }
      message.success(`Menu copied as "${copyName}"`);
      fetchMenus();
    } catch (e) {
      message.error(e.message || "Copy failed");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const normalizeDepths = (items) => {
    return items.map((it, i) => {
      if (it.depth <= 0) return it;
      const hasParent = items
        .slice(0, i)
        .some((prev) => prev.depth === it.depth - 1);
      return hasParent ? it : { ...it, depth: 0 };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFlatItems((prev) => {
      const from = prev.findIndex((i) => i.id === active.id);
      const to = prev.findIndex((i) => i.id === over.id);
      if (from < 0 || to < 0) return prev;
      const item = prev[from];
      const reordered = arrayMove(prev, from, to);
      const itemAbove = to > 0 ? reordered[to - 1] : null;
      const newDepth = itemAbove ? itemAbove.depth : 0;
      const updated = reordered.map((it) =>
        it.id === item.id ? { ...it, depth: newDepth } : it,
      );
      return normalizeDepths(updated);
    });
  };

  if (structureView) {
    return (
      <ThemeAdminCard
        title="Menu structure"
        extra={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} aria-label="Back to menus" />
        }
      >
        <div style={{ maxWidth: 720 }}>
        <Form.Item label="Menu Name" style={{ marginBottom: 8 }}>
          <Input
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="e.g. Primary menu"
            style={{ maxWidth: 320 }}
          />
        </Form.Item>
        <p style={{ color: "#666", marginBottom: 8 }}>
          Use <strong>Add Menu</strong> to add items.{" "}
          <strong>Drag and drop</strong> to reorder; dropping below an item
          makes it the same level (sibling). Use <strong>Indent</strong> to make
          an item a sub-menu of the one above; use{" "}
          <strong>Move up level</strong> to bring it back. For a 3rd-level menu
          (e.g. under &quot;Institute&quot;), place the item directly below its
          parent and click <strong>Indent</strong> once. Deeper levels show more
          indent and &quot;level 3&quot; etc. Click the arrow to edit label,
          URL, etc.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <Checkbox
            checked={
              flatItems.length > 0 && bulkSelectedIds.size === flatItems.length
            }
            indeterminate={
              bulkSelectedIds.size > 0 &&
              bulkSelectedIds.size < flatItems.length
            }
            onChange={(e) =>
              setBulkSelectedIds(
                e.target.checked
                  ? new Set(flatItems.map((i) => i.id))
                  : new Set(),
              )
            }
          >
            Bulk Select
          </Checkbox>
          {bulkSelectedIds.size > 0 && (
            <Button type="text" danger size="small" onClick={handleBulkRemove}>
              Remove selected
            </Button>
          )}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={flatItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {flatItems.map((item) => (
              <SortableMenuItem
                key={item.id}
                item={item}
                pages={pages}
                depth={item.depth}
                expanded={expandedIds.has(item.id)}
                bulkSelected={bulkSelectedIds.has(item.id)}
                onToggleExpand={() =>
                  setExpandedIds((s) =>
                    s.has(item.id)
                      ? new Set([...s].filter((x) => x !== item.id))
                      : new Set([...s, item.id]),
                  )
                }
                onToggleBulkSelect={(checked) =>
                  setBulkSelectedIds((s) =>
                    checked
                      ? new Set([...s, item.id])
                      : new Set([...s].filter((x) => x !== item.id)),
                  )
                }
                onUpdate={(updated) => updateItem(item.id, updated)}
                onRemove={() => removeItem(item)}
                onPromote={promoteItem}
                onDemote={demoteItem}
                canDemote={flatItems.findIndex((i) => i.id === item.id) > 0}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div style={{ marginTop: 16 }}>
          <Button
            type="dashed"
            onClick={addTopLevelItem}
            icon={<PlusOutlined />}
            block
          >
            Add Menu
          </Button>
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <Button
            type="primary"
            onClick={handleSaveMenuStructure}
            loading={saving}
          >
            Save menu
          </Button>
          <Button onClick={handleBack}>Cancel</Button>
        </div>
      </div>
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title="Menus"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add menu
        </Button>
      }
    >
      <p style={{ color: "#666", marginBottom: 16 }}>
        Manage navigation menus (e.g. header, footer). Edit a menu to use the
        visual menu structure. Public API:{" "}
        <code>GET /api/public/menus?name=header</code>
      </p>
      <Table
        rowKey="name"
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
        dataSource={menus}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          {
            title: "Items",
            dataIndex: "items",
            key: "items",
            render: (items) =>
              (Array.isArray(items) ? countItems(items) : 0) + " items",
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  Edit
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(record)}
                >
                  Copy
                </Button>
                {canDeleteMenu ? (
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteConfirm(record)}
                  >
                    Delete
                  </Button>
                ) : null}
              </Space>
            ),
          },
        ]}
      />
    </ThemeAdminCard>
  );
}

function countItems(items) {
  if (!items?.length) return 0;
  return (
    items.length + items.reduce((sum, it) => sum + countItems(it.children), 0)
  );
}
