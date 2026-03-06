"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  Tooltip,
  Collapse,
  Empty,
  Badge,
  Tag,
  Modal as AntModal,
  Segmented,
  ColorPicker,
  Divider,
  message,
  Row,
  Col,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  SearchOutlined,
  AppstoreOutlined,
  FontSizeOutlined,
  PictureOutlined,
  LayoutOutlined,
  InteractionOutlined,
  UnorderedListOutlined,
  HolderOutlined,
  EyeOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  TableOutlined,
  ShareAltOutlined,
  LineOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  CloseOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select } from "antd";

import RichTextEditor from "@/components/admin/RichTextEditor";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import * as SiteComponents from "@/components/site";
import { EDITABLE_SITE_EDIT_FORMS } from "@/components/site";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";
import GenericSchemaEditForm from "@/components/admin/GenericSchemaEditForm";
import SectionEditForm from "@/components/admin/SectionEditForm";
import { BLOCK_ELEMENT_FIELDS } from "@/components/admin/schemaFormUtils";

/** Site components that have full edit flow in page builder. Header/Footer excluded from palette. */
const EDITABLE_SITE_COMPONENTS = SITE_COMPONENT_IDS.filter(
  (id) => id !== "Header" && id !== "Footer",
);

/** All block types that have a dedicated EditForm. Fallback = GenericSchemaEditForm. */
const EDIT_FORMS = {
  ...EDITABLE_SITE_EDIT_FORMS,
  Section: SectionEditForm,
};

function generateId() {
  return "block_" + Math.random().toString(36).slice(2, 11);
}

// ─── Component Categories ───────────────────────────────────

const CATEGORY_META = {
  text: { label: "Text", icon: <FontSizeOutlined />, color: "#1890ff" },
  media: { label: "Media", icon: <PictureOutlined />, color: "#52c41a" },
  layout: { label: "Layout", icon: <LayoutOutlined />, color: "#722ed1" },
  content: { label: "Content", icon: <AppstoreOutlined />, color: "#fa8c16" },
  interactive: {
    label: "Interactive",
    icon: <InteractionOutlined />,
    color: "#eb2f96",
  },
  data: { label: "Data Display", icon: <TableOutlined />, color: "#13c2c2" },
  navigation: {
    label: "Navigation",
    icon: <ShareAltOutlined />,
    color: "#597ef7",
  },
  antd: { label: "Ant Design", icon: <AppstoreOutlined />, color: "#0170fe" },
};

/** Palette + schema from API (GET /api/admin/components). Seed system components via npm run seed. */
const BLOCK_ICON_MAP = {
  Paragraph: <FontSizeOutlined />,
  Heading: <FontSizeOutlined />,
  List: <UnorderedListOutlined />,
  Quote: <FontSizeOutlined />,
  CodeSnippet: <FontSizeOutlined />,
  Image: <PictureOutlined />,
  Gallery: <PictureOutlined />,
  Video: <PictureOutlined />,
  FileDownload: <PictureOutlined />,
  Cover: <LayoutOutlined />,
  Hero: <StarOutlined />,
  Buttons: <LayoutOutlined />,
  Spacer: <LineOutlined />,
  Columns: <LayoutOutlined />,
  Divider: <LineOutlined />,
  CallToAction: <StarOutlined />,
  Card: <AppstoreOutlined />,
  CardGrid: <AppstoreOutlined />,
  FeatureGrid: <AppstoreOutlined />,
  IconBox: <StarOutlined />,
  Testimonial: <TeamOutlined />,
  Team: <TeamOutlined />,
  Embed: <PictureOutlined />,
  Accordion: <UnorderedListOutlined />,
  Tabs: <AppstoreOutlined />,
  Modal: <InteractionOutlined />,
  Stats: <StarOutlined />,
  Pricing: <TableOutlined />,
  Table: <TableOutlined />,
  Timeline: <ClockCircleOutlined />,
  Breadcrumbs: <ShareAltOutlined />,
  Alert: <AlertOutlined />,
  SocialLinks: <ShareAltOutlined />,
  Slider: <PictureOutlined />,
  Header: <LayoutOutlined />,
  Footer: <LayoutOutlined />,
  Section: <LayoutOutlined />,
  AntButton: <InteractionOutlined />,
  AntCard: <AppstoreOutlined />,
  AntInput: <EditOutlined />,
  AntDivider: <LineOutlined />,
  AntAlert: <AlertOutlined />,
  AntTypography: <FontSizeOutlined />,
  AntSpace: <LayoutOutlined />,
};

/** Ant Design UI blocks – shown in Add Block when editing a component (includeAntdBlocks=true). */
const ANT_DESIGN_BLOCKS = [
  {
    _id: "antd-AntButton",
    name: "AntButton",
    displayName: "Button",
    category: "antd",
    baseComponent: "AntButton",
    description: "Ant Design Button",
    propsSchema: [
      { key: "text", type: "text", label: "Text" },
      {
        key: "type",
        type: "select",
        label: "Type",
        options: ["primary", "default", "dashed", "link", "text"],
      },
      {
        key: "size",
        type: "select",
        label: "Size",
        options: ["large", "middle", "small"],
      },
      { key: "danger", type: "boolean", label: "Danger" },
      { key: "disabled", type: "boolean", label: "Disabled" },
    ],
    defaultProps: {
      text: "Button",
      type: "primary",
      size: "middle",
      danger: false,
      disabled: false,
    },
    active: true,
  },
  {
    _id: "antd-AntCard",
    name: "AntCard",
    displayName: "Card",
    category: "antd",
    baseComponent: "AntCard",
    description: "Ant Design Card",
    propsSchema: [
      { key: "title", type: "text", label: "Title" },
      { key: "content", type: "text", label: "Content" },
      { key: "extra", type: "text", label: "Extra" },
    ],
    defaultProps: { title: "", content: "Card content", extra: "" },
    active: true,
  },
  {
    _id: "antd-AntInput",
    name: "AntInput",
    displayName: "Input",
    category: "antd",
    baseComponent: "AntInput",
    description: "Ant Design Input",
    propsSchema: [
      { key: "placeholder", type: "text", label: "Placeholder" },
      { key: "value", type: "text", label: "Default value" },
      {
        key: "size",
        type: "select",
        label: "Size",
        options: ["large", "middle", "small"],
      },
      { key: "disabled", type: "boolean", label: "Disabled" },
    ],
    defaultProps: {
      placeholder: "Placeholder",
      value: "",
      size: "middle",
      disabled: false,
    },
    active: true,
  },
  {
    _id: "antd-AntDivider",
    name: "AntDivider",
    displayName: "Divider",
    category: "antd",
    baseComponent: "AntDivider",
    description: "Ant Design Divider",
    propsSchema: [
      { key: "text", type: "text", label: "Center text" },
      {
        key: "orientation",
        type: "select",
        label: "Orientation",
        options: ["left", "center", "right"],
      },
      {
        key: "type",
        type: "select",
        label: "Type",
        options: ["horizontal", "vertical"],
      },
      { key: "plain", type: "boolean", label: "Plain" },
    ],
    defaultProps: {
      text: "",
      orientation: "center",
      type: "horizontal",
      plain: true,
    },
    active: true,
  },
  {
    _id: "antd-AntAlert",
    name: "AntAlert",
    displayName: "Alert",
    category: "antd",
    baseComponent: "AntAlert",
    description: "Ant Design Alert",
    propsSchema: [
      { key: "message", type: "text", label: "Message" },
      { key: "description", type: "text", label: "Description" },
      {
        key: "type",
        type: "select",
        label: "Type",
        options: ["success", "info", "warning", "error"],
      },
      { key: "showIcon", type: "boolean", label: "Show icon" },
    ],
    defaultProps: {
      message: "Alert message",
      description: "",
      type: "info",
      showIcon: true,
    },
    active: true,
  },
  {
    _id: "antd-AntTypography",
    name: "AntTypography",
    displayName: "Typography",
    category: "antd",
    baseComponent: "AntTypography",
    description: "Ant Design Title / Paragraph",
    propsSchema: [
      {
        key: "variant",
        type: "select",
        label: "Variant",
        options: ["title", "paragraph", "text"],
      },
      { key: "level", type: "number", label: "Title level (1-5)" },
      { key: "title", type: "text", label: "Title text" },
      { key: "paragraph", type: "text", label: "Paragraph text" },
      { key: "text", type: "text", label: "Text" },
    ],
    defaultProps: {
      variant: "title",
      level: 3,
      title: "Title",
      paragraph: "",
      text: "",
    },
    active: true,
  },
  {
    _id: "antd-AntSpace",
    name: "AntSpace",
    displayName: "Space",
    category: "antd",
    baseComponent: "AntSpace",
    description: "Ant Design Space",
    propsSchema: [
      {
        key: "direction",
        type: "select",
        label: "Direction",
        options: ["horizontal", "vertical"],
      },
      {
        key: "size",
        type: "select",
        label: "Size",
        options: ["small", "middle", "large"],
      },
    ],
    defaultProps: { direction: "horizontal", size: "middle" },
    active: true,
  },
];

/** Convert menu API item to header nav item (plain objects only); supports nested children (submenu of submenu). */
function menuItemsToNavItems(menuItems) {
  if (!Array.isArray(menuItems)) return [];
  return menuItems.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const url =
      typeof item.url === "string" && item.url
        ? item.url
        : item.type === "page" && item.pageSlug
          ? `/${String(item.pageSlug)}`
          : "#";
    const childList = Array.isArray(item.children) ? item.children : [];
    const children = menuItemsToNavItems(childList);
    const result = {
      label: String(item.label ?? ""),
      url,
      hasDropdown: children.length > 0,
    };
    if (children.length > 0) result.children = children;
    return result;
  });
}

// ─── Sortable Visual Block ──────────────────────────────────

function SortableVisualBlock({
  block,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
  onElementClick,
  paletteComponents = [],
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.instanceId });

  const comp = paletteComponents.find(
    (c) => c.baseComponent === block.baseComponent,
  );
  const catKey = comp?.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={() => onSelect(index)}
        style={{
          position: "relative",
          border: isSelected
            ? `2px solid ${catMeta.color}`
            : "2px solid transparent",
          borderRadius: 6,
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: isSelected
            ? `0 0 0 3px ${catMeta.color}22`
            : isDragging
              ? "0 8px 24px rgba(0,0,0,0.15)"
              : "none",
        }}
        onMouseEnter={(e) => {
          if (!isSelected)
            e.currentTarget.style.border = `2px dashed ${catMeta.color}88`;
        }}
        onMouseLeave={(e) => {
          if (!isSelected)
            e.currentTarget.style.border = "2px solid transparent";
        }}
      >
        {/* Block label bar – inside block so not clipped when at top of canvas */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 12,
            display: isSelected || isDragging ? "flex" : "none",
            alignItems: "center",
            gap: 4,
            background: catMeta.color,
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            zIndex: 10,
            whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <span
            {...listeners}
            style={{
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              marginRight: 2,
            }}
          >
            <HolderOutlined style={{ fontSize: 12 }} />
          </span>
          {comp?.displayName || block.baseComponent}
        </div>

        {/* Floating toolbar – inside block so always visible (not clipped above) */}
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              display: "flex",
              gap: 1,
              background: "#fff",
              border: `1px solid ${catMeta.color}`,
              borderRadius: 4,
              padding: "2px 4px",
              zIndex: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            <Tooltip title="Edit properties">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(index);
                }}
              />
            </Tooltip>
            <Tooltip title="Duplicate">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(index);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
              />
            </Tooltip>
          </div>
        )}

        {/* Live rendered block – allow pointer events when selected so user can click individual elements */}
        <div
          style={{ pointerEvents: isSelected ? "auto" : "none", minHeight: 20 }}
        >
          <ComponentRenderer
            layout={[{ ...block, order: 0 }]}
            onElementClick={
              isSelected && onElementClick
                ? (instanceId, elementKey) =>
                    onElementClick(instanceId, elementKey)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Add Block Button (with drop zone for drag-from-palette) ────────────────────────

function AddBlockButton({ onClick, dropIndex, isOver }) {
  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: `insert-${dropIndex}`,
  });
  const over = isOver !== undefined ? isOver : isOverDroppable;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "8px 0",
        position: "relative",
        minHeight: 32,
        borderRadius: 6,
        background: over ? "rgba(24, 144, 255, 0.08)" : "transparent",
        border: over ? "2px dashed #1890ff" : "2px dashed transparent",
        transition: "background 0.15s, border 0.15s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          background: "#e8e8e8",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
      <Tooltip title="Add component here or drag from palette">
        <Button
          type="default"
          size="small"
          shape="circle"
          icon={<PlusOutlined style={{ fontSize: 12 }} />}
          onClick={onClick}
          style={{
            zIndex: 1,
            width: 24,
            height: 24,
            minWidth: 24,
            background: over ? "#e6f4ff" : "#fff",
            border: over ? "1px solid #1890ff" : "1px solid #d9d9d9",
            opacity: over ? 1 : 0.5,
            transition: "opacity 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!over) {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.borderColor = "#1890ff";
            }
          }}
          onMouseLeave={(e) => {
            if (!over) {
              e.currentTarget.style.opacity = "0.5";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }
          }}
        />
      </Tooltip>
    </div>
  );
}

// ─── Component Palette Item (draggable onto canvas) ─────────────────────────────────

function ComponentPaletteItem({ comp, onAdd, index }) {
  const icon = BLOCK_ICON_MAP[comp.baseComponent] || <AppstoreOutlined />;
  const catKey = comp.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;
  const id = `palette-${comp._id}-${index ?? 0}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "palette", comp },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onAdd(comp)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        cursor: isDragging ? "grabbing" : "grab",
        borderRadius: 8,
        transition: "background 0.15s, box-shadow 0.15s",
        border: "1px solid transparent",
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f5f5f5";
        e.currentTarget.style.border = "1px solid #e8e8e8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.border = "1px solid transparent";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: catMeta.color + "15",
          color: catMeta.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
          {comp.displayName || comp.baseComponent}
        </div>
        {comp.description && (
          <div
            style={{
              fontSize: 11,
              color: "#999",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {comp.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty canvas drop zone (for drag-from-palette) ─────────

function EmptyCanvasDropZone({ onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: "insert-0" });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: "60px 24px",
        textAlign: "center",
        borderRadius: 8,
        border: isOver ? "2px dashed #1890ff" : "2px dashed #e8e8e8",
        background: isOver ? "rgba(24, 144, 255, 0.04)" : "transparent",
        transition: "border 0.15s, background 0.15s",
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: "#999" }}>
            Drag components here or click <strong>Add Component</strong> to
            start
          </span>
        }
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add your first component
        </Button>
      </Empty>
    </div>
  );
}

// ─── Layers panel (layer list for selection & actions) ────────

function LayersPanel({
  sorted,
  selectedIndex,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onClose,
  paletteComponents = [],
}) {
  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid #e8e8e8",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "12px 12px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>
          Layers
        </span>
        {onClose && (
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {sorted.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#999",
              fontSize: 12,
            }}
          >
            No blocks yet. Add a block to see layers.
          </div>
        ) : (
          sorted.map((block, index) => {
            const comp = paletteComponents.find(
              (c) => c.baseComponent === block.baseComponent,
            );
            const catKey = comp?.category || "content";
            const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;
            const isSelected = selectedIndex === index;
            return (
              <div
                key={block.instanceId}
                onClick={() => onSelect(index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  margin: "2px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: isSelected ? catMeta.color + "18" : "transparent",
                  borderLeft: isSelected
                    ? `3px solid ${catMeta.color}`
                    : "3px solid transparent",
                }}
              >
                <span style={{ color: "#999", fontSize: 12 }}>
                  {index + 1}.
                </span>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: catMeta.color + "25",
                    color: catMeta.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  {BLOCK_ICON_MAP[block.baseComponent] || <AppstoreOutlined />}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {comp?.displayName || block.baseComponent}
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Move up">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => onMoveUp(index)}
                    />
                  </Tooltip>
                  <Tooltip title="Move down">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === sorted.length - 1}
                      onClick={() => onMoveDown(index)}
                    />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => onEdit(index)}
                    />
                  </Tooltip>
                  <Tooltip title="Duplicate">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => onDuplicate(index)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onRemove(index)}
                    />
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Responsive Preview Widths ──────────────────────────────

const PREVIEW_WIDTHS = {
  desktop: "100%",
  tablet: 768,
  mobile: 375,
};

// ═══════════════════════════════════════════════════════════
// Main PageBuilder Component
// ═══════════════════════════════════════════════════════════

export default function PageBuilder({
  layout = [],
  onChange,
  showLayers = true,
  includeAntdBlocks = false,
  componentBase = null,
}) {
  /** Palette loads all reusable components from DB (system + custom) via API. */
  const [components, setComponents] = useState([]);
  /** Site components from /admin/components – shown in Add Component drawer. */
  const [siteComponentsList, setSiteComponentsList] = useState([]);
  const [theme, setTheme] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  const showLayersPanel = showLayers && layersPanelOpen;
  const [addToSectionBlockIndex, setAddToSectionBlockIndex] = useState(null);
  const [editingInnerBlock, setEditingInnerBlock] = useState(null);
  const [editingElement, setEditingElement] = useState(null);
  const [form] = Form.useForm();
  const [adminMenusList, setAdminMenusList] = useState([]);
  /** Last nav items loaded from selected menu – used at save so all children are persisted (form may not keep them). */
  const lastLoadedNavItemsRef = useRef(null);
  const canvasRef = useRef(null);
  const siteEditFormRef = useRef(null);

  const themeColorOptions = useMemo(() => {
    const out = [];
    const structured = [
      ["Primary", theme?.primaryColor],
      ["Secondary", theme?.secondaryColor],
      ["Body Background", theme?.bodyBackground],
      ["Section Background", theme?.sectionBackground],
      ["Card Background", theme?.cardBackground],
      ["Header Background", theme?.headerBackground],
      ["Footer Background", theme?.footerBackground],
      ["Heading", theme?.headingColor],
      ["Paragraph", theme?.paragraphColor],
      ["Link", theme?.linkColor],
      ["Hover", theme?.hoverColor],
      ["Muted Text", theme?.mutedTextColor],
      ["Border", theme?.borderColor],
      ["Button", theme?.buttonBackground],
    ];
    structured.forEach(([label, value]) => {
      if (value) out.push({ label, value });
    });
    (theme?.colors || [])
      .filter((c) => c?.name && c?.value)
      .forEach((c) => out.push({ label: c.name, value: c.value }));
    return out;
  }, [theme]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetch("/api/admin/components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const mapped = (list || []).map((c) => ({
          _id: c._id,
          name: c.name,
          displayName: c.displayName || c.name,
          baseComponent: c.baseComponent,
          category: (c.category || "content").toLowerCase(),
          description: c.description || "",
          propsSchema: c.propsSchema || [],
          defaultProps: c.defaultProps || {},
          active: c.active !== false,
        }));
        const withAntd = includeAntdBlocks
          ? [...mapped, ...ANT_DESIGN_BLOCKS]
          : mapped;
        setComponents(withAntd);
      })
      .catch(() => setComponents([]));
  }, [includeAntdBlocks]);

  /** Single source for palette + schema: DB components + optional Ant Design blocks. */
  const fullPalette = useMemo(
    () =>
      includeAntdBlocks ? [...components, ...ANT_DESIGN_BLOCKS] : components,
    [components, includeAntdBlocks],
  );

  useEffect(() => {
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTheme(data))
      .catch(() => setTheme(null));
  }, []);

  /** Load site components for Add Component drawer (from /admin/components). */
  useEffect(() => {
    if (!addDrawerOpen) return;
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setSiteComponentsList(Array.isArray(list) ? list : []))
      .catch(() => setSiteComponentsList([]));
  }, [addDrawerOpen]);

  const blocks = Array.isArray(layout) ? [...layout] : [];
  const sorted = blocks
    .map((b, i) => ({ ...b, _index: i }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const triggerChange = useCallback(
    (newLayout) => {
      const withOrder = newLayout.map(({ _index, ...b }, i) => ({
        ...b,
        order: i,
      }));
      onChange(withOrder);
    },
    [onChange],
  );

  /** Header/Footer blocks are not auto-added here. */

  const categorizedComponents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? components.filter(
          (c) =>
            (c.displayName || c.baseComponent).toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q) ||
            (c.category || "").toLowerCase().includes(q),
        )
      : components;
    const groups = {};
    filtered.forEach((comp) => {
      const cat = comp.category || "content";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(comp);
    });
    return groups;
  }, [components, searchQuery]);

  /** Site components for Add Component drawer: enabled only, exclude global=true ("Show on all pages"). Global components are rendered automatically on every page via layout (getLayoutData → globalBefore/globalAfter → PublicShell), so they are not added per-page in PageBuilder. */
  const filteredSiteComponents = useMemo(() => {
    const forPalette = siteComponentsList.filter(
      (c) => c.enabled !== false && c.global !== true,
    );
    const q = searchQuery.toLowerCase().trim();
    if (!q) return forPalette;
    return forPalette.filter(
      (c) =>
        (c.displayName || c.componentId || "").toLowerCase().includes(q) ||
        (c.componentId || "").toLowerCase().includes(q),
    );
  }, [siteComponentsList, searchQuery]);

  /** Add a block from the palette (core/DB component or site component). */
  const handleAdd = (comp) => {
    const newBlock = {
      instanceId: generateId(),
      componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
      baseComponent: comp.baseComponent,
      props: { ...(comp.defaultProps || {}) },
      order: 0,
    };

    if (addToSectionBlockIndex !== null) {
      const sectionBlock = sorted[addToSectionBlockIndex];
      if (sectionBlock?.baseComponent === "Section") {
        const innerLayout = Array.isArray(sectionBlock.props?.layout)
          ? [...sectionBlock.props.layout]
          : [];
        innerLayout.push({ ...newBlock, order: innerLayout.length });
        const updated = blocks.map((b) =>
          b.instanceId === sectionBlock.instanceId
            ? { ...b, props: { ...b.props, layout: innerLayout } }
            : b,
        );
        triggerChange(updated);
      }
      setAddToSectionBlockIndex(null);
      setAddDrawerOpen(false);
      setSearchQuery("");
      return;
    }

    let newLayout;
    if (insertAtIndex !== null && insertAtIndex >= 0) {
      const arr = [...sorted];
      arr.splice(insertAtIndex, 0, newBlock);
      newLayout = arr;
    } else {
      newLayout = [...sorted, newBlock];
    }
    triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
    setAddDrawerOpen(false);
    setSearchQuery("");
    setInsertAtIndex(null);
    setSelectedIndex(insertAtIndex !== null ? insertAtIndex : sorted.length);
  };

  const handleRemove = (index) => {
    AntModal.confirm({
      title: "Delete block?",
      content: `Remove this ${sorted[index]?.baseComponent || "block"}?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const newLayout = sorted.filter((_, i) => i !== index);
        triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
        setSelectedIndex(null);
      },
    });
  };

  const handleDuplicate = (index) => {
    const block = sorted[index];
    let props = { ...(block.props || {}) };
    if (block.baseComponent === "Section" && Array.isArray(props.layout)) {
      props = {
        ...props,
        layout: props.layout.map((b) => ({
          ...b,
          instanceId: generateId(),
          order: 0,
        })),
      };
    }
    const clone = {
      instanceId: generateId(),
      componentId: block.componentId,
      baseComponent: block.baseComponent,
      props,
      order: 0,
    };
    const arr = [...sorted];
    arr.splice(index + 1, 0, clone);
    triggerChange(arr.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index + 1);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setEditingInnerBlock(null);
    setEditingElement(null);
    const block = sorted[index];
    setDrawerOpen(true);
  };

  const openEditElement = (blockIndex, elementKey) => {
    const block = sorted[blockIndex];
    const elementMeta =
      BLOCK_ELEMENT_FIELDS[block?.baseComponent]?.[elementKey];
    if (!block || !elementMeta) return;
    setEditingIndex(blockIndex);
    setEditingInnerBlock(null);
    setEditingElement({ blockIndex, elementKey });
    setDrawerOpen(true);
  };

  const openEditInner = (sectionIndex, innerIndex) => {
    setEditingInnerBlock({ sectionIndex, innerIndex });
  };

  const handleEditSave = () => {
    form.validateFields().then(() => {
      let values = form.getFieldsValue(true);
      if (
        editingInnerBlock === null &&
        editingElement === null &&
        sorted[editingIndex]?.baseComponent === "Header" &&
        Array.isArray(values?.navItems)
      ) {
        const loaded = lastLoadedNavItemsRef.current;
        const formItems = values.navItems;
        const mergedNavItems =
          Array.isArray(loaded) && loaded.length === formItems.length
            ? formItems.map((item, i) => ({
                label: item?.label ?? loaded[i]?.label ?? "",
                url: item?.url ?? loaded[i]?.url ?? "#",
                hasDropdown:
                  item?.hasDropdown ?? loaded[i]?.hasDropdown ?? false,
                children: Array.isArray(loaded[i]?.children)
                  ? loaded[i].children
                  : Array.isArray(item?.children)
                    ? item.children
                    : [],
              }))
            : formItems.map((item) => {
                let children = item?.children;
                if (typeof children === "string") {
                  try {
                    children = JSON.parse(children);
                  } catch {
                    children = [];
                  }
                }
                if (!Array.isArray(children)) children = [];
                return { ...item, children };
              });
        values = { ...values, navItems: mergedNavItems };
      }
      if (editingInnerBlock !== null) {
        const { sectionIndex, innerIndex } = editingInnerBlock;
        const sectionBlock = sorted[sectionIndex];
        const innerLayout = Array.isArray(sectionBlock?.props?.layout)
          ? [...sectionBlock.props.layout]
          : [];
        if (innerLayout[innerIndex]) {
          innerLayout[innerIndex] = {
            ...innerLayout[innerIndex],
            props: values,
          };
          const updated = blocks.map((b) =>
            b.instanceId === sectionBlock.instanceId
              ? { ...b, props: { ...b.props, layout: innerLayout } }
              : b,
          );
          triggerChange(updated);
        }
        setEditingInnerBlock(null);
      } else if (editingElement !== null) {
        const { blockIndex, elementKey } = editingElement;
        const block = sorted[blockIndex];
        const elementMeta =
          BLOCK_ELEMENT_FIELDS[block?.baseComponent]?.[elementKey];
        const keys = elementMeta?.fields ?? [];
        const patch = {};
        keys.forEach((k) => {
          if (values[k] !== undefined) patch[k] = values[k];
        });
        const newProps = { ...(block.props || {}), ...patch };
        const newLayout = blocks.map((b) =>
          b.instanceId === block.instanceId ? { ...b, props: newProps } : b,
        );
        triggerChange(newLayout);
        setEditingElement(null);
      } else {
        const block = sorted[editingIndex];
        const newProps =
          block.baseComponent === "Section"
            ? { ...block.props, ...values, layout: block.props?.layout ?? [] }
            : { ...(block.props || {}), ...values };
        const newLayout = blocks.map((b) =>
          b.instanceId === block.instanceId ? { ...b, props: newProps } : b,
        );
        triggerChange(newLayout);
      }
      setDrawerOpen(false);
      setEditingIndex(null);
    });
  };

  const handleRemoveInner = (sectionIndex, innerIndex) => {
    const sectionBlock = sorted[sectionIndex];
    const innerLayout = Array.isArray(sectionBlock?.props?.layout)
      ? [...sectionBlock.props.layout]
      : [];
    innerLayout.splice(innerIndex, 1);
    const updated = blocks.map((b) =>
      b.instanceId === sectionBlock.instanceId
        ? { ...b, props: { ...b.props, layout: innerLayout } }
        : b,
    );
    triggerChange(updated);
    setEditingInnerBlock(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Drag from palette onto canvas drop zone
    const paletteData = active.data?.current;
    if (
      paletteData?.type === "palette" &&
      typeof over.id === "string" &&
      String(over.id).startsWith("insert-")
    ) {
      const comp = paletteData.comp;
      const dropIndex =
        parseInt(String(over.id).replace("insert-", ""), 10) || 0;
      const newBlock = {
        instanceId: generateId(),
        componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
        baseComponent: comp.baseComponent,
        props: { ...(comp.defaultProps || {}) },
        order: 0,
      };
      const arr = [...sorted];
      arr.splice(dropIndex, 0, newBlock);
      triggerChange(arr.map((b, i) => ({ ...b, order: i })));
      setSelectedIndex(dropIndex);
      setAddDrawerOpen(false);
      return;
    }

    // Reorder existing blocks
    if (active.id === over.id) return;
    const oldIndex = sorted.findIndex((b) => b.instanceId === active.id);
    const newIndex = sorted.findIndex((b) => b.instanceId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sorted, oldIndex, newIndex);
      triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
      if (selectedIndex === oldIndex) setSelectedIndex(newIndex);
    }
  };

  const openAddAt = (index) => {
    setInsertAtIndex(index);
    setAddDrawerOpen(true);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const reordered = arrayMove(sorted, index, index - 1);
    triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index - 1);
  };

  const handleMoveDown = (index) => {
    if (index >= sorted.length - 1) return;
    const reordered = arrayMove(sorted, index, index + 1);
    triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index + 1);
  };

  const editingBlock = editingIndex !== null ? sorted[editingIndex] : null;
  const pw = PREVIEW_WIDTHS[previewMode];

  const loadMenuIntoNavItems = useCallback(
    (menuName) => {
      if (!menuName || typeof menuName !== "string") return;
      const name = String(menuName).trim();
      if (!name) return;
      fetch(`/api/admin/menus/${encodeURIComponent(name)}`)
        .then((res) => {
          if (!res.ok)
            throw new Error(
              res.status === 404
                ? "Menu not found"
                : `Failed to load menu (${res.status})`,
            );
          return res.json();
        })
        .then((menu) => {
          if (!menu || typeof menu !== "object")
            throw new Error("Invalid menu response");
          const items = Array.isArray(menu.items) ? menu.items : [];
          const navItems = menuItemsToNavItems(items);
          form.setFieldValue("navItems", navItems);
          form.setFieldValue("menuName", name);
          lastLoadedNavItemsRef.current = JSON.parse(JSON.stringify(navItems));
          message.success(
            `Loaded "${name}" (${navItems.length} item${navItems.length !== 1 ? "s" : ""}). Click Apply to save.`,
          );
        })
        .catch((err) => {
          message.error(err?.message || "Could not load menu");
        });
    },
    [form],
  );

  useEffect(() => {
    if (!drawerOpen) return;
    fetch("/api/admin/menus")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) =>
        setAdminMenusList(Array.isArray(list) ? list : []),
      )
      .catch(() => setAdminMenusList([]));
  }, [drawerOpen]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            minHeight: 400,
          }}
        >
          {/* ── Toolbar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              background: "#fafafa",
              borderRadius: "8px 8px 0 0",
              border: "1px solid #e8e8e8",
              borderBottom: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <EyeOutlined style={{ fontSize: 16, color: "#1890ff" }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
                Visual Editor
              </span>
              {sorted.length > 0 && (
                <Badge
                  count={sorted.length}
                  style={{ backgroundColor: "#1890ff" }}
                />
              )}
              {showLayers && (
                <Button
                  type={showLayersPanel ? "primary" : "default"}
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={() => setLayersPanelOpen((v) => !v)}
                >
                  Layers
                </Button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Segmented
                size="small"
                value={previewMode}
                onChange={setPreviewMode}
                options={[
                  { value: "desktop", icon: <DesktopOutlined /> },
                  { value: "tablet", icon: <TabletOutlined /> },
                  { value: "mobile", icon: <MobileOutlined /> },
                ]}
              />
              {componentBase !== "Header" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setInsertAtIndex(null);
                    setAddDrawerOpen(true);
                  }}
                  size="middle"
                >
                  Add Component
                </Button>
              )}
            </div>
          </div>

          {/* ── Layers panel + Canvas ── */}
          <div
            style={{
              display: "flex",
              flex: 1,
              minHeight: 300,
              border: "1px solid #e8e8e8",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              overflow: "hidden",
            }}
          >
            {showLayersPanel && (
              <LayersPanel
                sorted={sorted}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onRemove={handleRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onClose={() => setLayersPanelOpen(false)}
                paletteComponents={fullPalette}
              />
            )}
            <div
              ref={canvasRef}
              onClick={(e) => {
                if (
                  e.target === e.currentTarget ||
                  e.target === canvasRef.current?.firstChild
                )
                  setSelectedIndex(null);
              }}
              style={{
                flex: 1,
                background: previewMode === "desktop" ? "#fff" : "#f0f0f0",
                padding: previewMode === "desktop" ? 0 : "16px",
                minWidth: 0,
                transition: "background 0.2s",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  maxWidth: typeof pw === "number" ? pw : "none",
                  margin: "0 auto",
                  background: "#fff",
                  minHeight: 300,
                  boxShadow:
                    previewMode !== "desktop"
                      ? "0 2px 12px rgba(0,0,0,0.08)"
                      : "none",
                  borderRadius: previewMode !== "desktop" ? 8 : 0,
                  overflow: "hidden",
                  transition: "max-width 0.3s",
                }}
              >
                {sorted.length === 0 ? (
                  <EmptyCanvasDropZone
                    onAdd={() => {
                      setInsertAtIndex(null);
                      setAddDrawerOpen(true);
                    }}
                  />
                ) : (
                  <SortableContext
                    items={sorted.map((b) => b.instanceId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ padding: "8px 0" }}>
                      {sorted.map((block, index) => (
                        <div key={block.instanceId}>
                          {componentBase !== "Header" && (
                            <AddBlockButton
                              onClick={() => openAddAt(index)}
                              dropIndex={index}
                            />
                          )}
                          <SortableVisualBlock
                            block={block}
                            index={index}
                            isSelected={selectedIndex === index}
                            onSelect={setSelectedIndex}
                            onEdit={openEdit}
                            onDuplicate={handleDuplicate}
                            onRemove={handleRemove}
                            onElementClick={(instanceId, elementKey) => {
                              const idx = sorted.findIndex(
                                (b) => b.instanceId === instanceId,
                              );
                              if (idx !== -1) openEditElement(idx, elementKey);
                            }}
                            paletteComponents={fullPalette}
                          />
                        </div>
                      ))}
                      {componentBase !== "Header" && (
                        <AddBlockButton
                          onClick={() => openAddAt(sorted.length)}
                          dropIndex={sorted.length}
                        />
                      )}
                    </div>
                  </SortableContext>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Component Palette Drawer ── */}
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AppstoreOutlined style={{ color: "#1890ff" }} />
              <span>
                {addToSectionBlockIndex !== null
                  ? "Add element to section"
                  : "Add Component"}
              </span>
            </div>
          }
          open={addDrawerOpen}
          onClose={() => {
            setAddDrawerOpen(false);
            setSearchQuery("");
            setInsertAtIndex(null);
            setAddToSectionBlockIndex(null);
          }}
          width={400}
          styles={{ body: { padding: "0 16px 16px" } }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <Input
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
              size="large"
            />
          </div>
          {filteredSiteComponents.length === 0 ? (
            <Empty
              description={
                siteComponentsList.length === 0
                  ? "No components yet. Add components under Admin → Components."
                  : "No components match your search"
              }
              style={{ marginTop: 40 }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 12,
              }}
            >
              {filteredSiteComponents.map((item) => {
                const comp = {
                  _id: item.componentId,
                  baseComponent: item.componentId,
                  displayName: item.displayName || item.componentId,
                  defaultProps: {},
                };
                return (
                  <ComponentPaletteItem
                    key={item.componentId}
                    comp={comp}
                    onAdd={handleAdd}
                    index={item.componentId}
                  />
                );
              })}
            </div>
          )}
        </Drawer>

        {/* ── Edit Block Drawer ── */}
        <Drawer
          title={
            editingElement !== null && editingBlock ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {BLOCK_ICON_MAP[editingBlock.baseComponent] || <EditOutlined />}
                <span>
                  Edit{" "}
                  {BLOCK_ELEMENT_FIELDS[editingBlock.baseComponent]?.[
                    editingElement.elementKey
                  ]?.label ?? editingElement.elementKey}
                </span>
              </div>
            ) : editingInnerBlock !== null && editingBlock ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {BLOCK_ICON_MAP[
                  sorted[editingInnerBlock.sectionIndex]?.props?.layout?.[
                    editingInnerBlock.innerIndex
                  ]?.baseComponent
                ] || <EditOutlined />}
                <span>Edit element</span>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setEditingInnerBlock(null)}
                >
                  ← Back to section
                </Button>
              </div>
            ) : editingBlock ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {BLOCK_ICON_MAP[editingBlock.baseComponent] || <EditOutlined />}
                <span>
                  {EDIT_FORMS[editingBlock?.baseComponent]
                    ? editingBlock.baseComponent
                    : fullPalette.find(
                        (c) => c.baseComponent === editingBlock?.baseComponent,
                      )?.displayName || editingBlock?.baseComponent}
                </span>
              </div>
            ) : (
              "Edit block"
            )
          }
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingIndex(null);
            setEditingInnerBlock(null);
            setEditingElement(null);
          }}
          width={520}
          extra={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {editingElement !== null && (
                <Button onClick={() => setEditingElement(null)}>
                  ← Whole block
                </Button>
              )}
              {editingInnerBlock !== null && (
                <Button onClick={() => setEditingInnerBlock(null)}>
                  ← Back
                </Button>
              )}
              {(editingBlock || editingInnerBlock) && (
                <>
                  <span style={{ flex: 1, minWidth: 8 }} />
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => siteEditFormRef.current?.update?.()}
                  >
                    Update
                  </Button>
                </>
              )}
            </div>
          }
        >
          {(() => {
            if (!editingBlock && !editingInnerBlock) return null;
            const sectionBlock =
              editingInnerBlock != null
                ? sorted[editingInnerBlock.sectionIndex]
                : null;
            const innerBlock =
              sectionBlock?.props?.layout?.[editingInnerBlock?.innerIndex];
            const effectiveBlock = editingInnerBlock
              ? innerBlock
              : editingBlock;
            const effectiveBase =
              effectiveBlock?.baseComponent ?? editingBlock?.baseComponent;
            const effectivePaletteComponent = fullPalette.find(
              (c) => c.baseComponent === effectiveBase,
            );
            let effectiveOnSaveToPage = (payload) => {
              if (editingIndex == null) return;
              const block = sorted[editingIndex];
              if (!block) return;
              const newProps = { ...(block.props || {}), ...payload };
              triggerChange(
                blocks.map((b) =>
                  b.instanceId === block.instanceId
                    ? { ...b, props: newProps }
                    : b,
                ),
              );
            };
            if (editingInnerBlock != null) {
              effectiveOnSaveToPage = (payload) => {
                const section = sorted[editingInnerBlock.sectionIndex];
                const layout = [...(section?.props?.layout ?? [])];
                if (layout[editingInnerBlock.innerIndex]) {
                  layout[editingInnerBlock.innerIndex] = {
                    ...layout[editingInnerBlock.innerIndex],
                    props: payload,
                  };
                  triggerChange(
                    blocks.map((b) =>
                      b.instanceId === section.instanceId
                        ? { ...b, props: { ...b.props, layout } }
                        : b,
                    ),
                  );
                }
                setEditingInnerBlock(null);
              };
            } else if (editingElement != null) {
              effectiveOnSaveToPage = (payload) => {
                const block = sorted[editingElement.blockIndex];
                const meta =
                  BLOCK_ELEMENT_FIELDS[block?.baseComponent]?.[
                    editingElement.elementKey
                  ];
                const keys = meta?.fields ?? [];
                const patch = {};
                keys.forEach((k) => {
                  if (payload[k] !== undefined) patch[k] = payload[k];
                });
                const newProps = { ...(block?.props || {}), ...patch };
                triggerChange(
                  blocks.map((b) =>
                    b.instanceId === block.instanceId
                      ? { ...b, props: newProps }
                      : b,
                  ),
                );
                setEditingElement(null);
              };
            }
            const EditFormComp =
              EDIT_FORMS[effectiveBase] || GenericSchemaEditForm;
            const commonProps = {
              ref: siteEditFormRef,
              source: "page",
              initialData: effectiveBlock?.props,
              onSaveToPage: effectiveOnSaveToPage,
              onSuccess: () => {
                setDrawerOpen(false);
                setEditingIndex(null);
                setEditingInnerBlock(null);
                setEditingElement(null);
                if (componentBase)
                  fetch("/api/theme")
                    .then((r) => (r.ok ? r.json() : null))
                    .then(setTheme);
              },
              onCancel: () => {
                setDrawerOpen(false);
                setEditingIndex(null);
                setEditingInnerBlock(null);
                setEditingElement(null);
              },
              paletteComponent: effectivePaletteComponent,
            };
            if (editingElement)
              commonProps.elementKey = editingElement.elementKey;
            if (
              effectiveBase === "Section" &&
              editingBlock &&
              !editingInnerBlock
            ) {
              return (
                <SectionEditForm
                  {...commonProps}
                  innerBlocks={editingBlock?.props?.layout ?? []}
                  onEditInner={(idx) => openEditInner(editingIndex, idx)}
                  onRemoveInner={(idx) =>
                    handleRemoveInner(editingIndex, idx)
                  }
                  onAddInner={() => {
                    setAddToSectionBlockIndex(editingIndex);
                    setDrawerOpen(false);
                    setAddDrawerOpen(true);
                  }}
                  fullPalette={fullPalette}
                />
              );
            }
            return <EditFormComp {...commonProps} />;
          })()}
        </Drawer>
      </>
    </DndContext>
  );
}
