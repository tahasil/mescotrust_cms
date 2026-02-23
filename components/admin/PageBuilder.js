"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Button, Drawer, Form, Input, InputNumber, Switch, Tooltip,
  Collapse, Empty, Badge, Tag, Modal as AntModal, Segmented, ColorPicker, Divider,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, CopyOutlined, EditOutlined,
  SearchOutlined, AppstoreOutlined, FontSizeOutlined,
  PictureOutlined, LayoutOutlined, InteractionOutlined,
  UnorderedListOutlined, HolderOutlined, EyeOutlined, StarOutlined,
  TeamOutlined, ClockCircleOutlined, AlertOutlined, TableOutlined,
  ShareAltOutlined, LineOutlined, DesktopOutlined, TabletOutlined,
  MobileOutlined, CloseOutlined, CheckOutlined,
} from "@ant-design/icons";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select } from "antd";

import RichTextEditor from "@/components/admin/RichTextEditor";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

function generateId() {
  return "block_" + Math.random().toString(36).slice(2, 11);
}

// ─── Component Categories ───────────────────────────────────

const CATEGORY_META = {
  text: { label: "Text", icon: <FontSizeOutlined />, color: "#1890ff" },
  media: { label: "Media", icon: <PictureOutlined />, color: "#52c41a" },
  layout: { label: "Layout", icon: <LayoutOutlined />, color: "#722ed1" },
  content: { label: "Content", icon: <AppstoreOutlined />, color: "#fa8c16" },
  interactive: { label: "Interactive", icon: <InteractionOutlined />, color: "#eb2f96" },
  data: { label: "Data Display", icon: <TableOutlined />, color: "#13c2c2" },
  navigation: { label: "Navigation", icon: <ShareAltOutlined />, color: "#597ef7" },
};

const CORE_PAGE_BUILDER_COMPONENTS = [
  // ── Text ──
  { _id: "core-Paragraph", name: "Paragraph", displayName: "Paragraph", category: "text", baseComponent: "Paragraph", description: "Rich text paragraph", propsSchema: [{ key: "text", type: "richtext", label: "Text" }, { key: "color", type: "color", label: "Text color" }, { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] }], defaultProps: { text: "<p>Type your paragraph text here...</p>" }, active: true },
  { _id: "core-Heading", name: "Heading", displayName: "Heading", category: "text", baseComponent: "Heading", description: "Section heading (H1-H6)", propsSchema: [{ key: "level", type: "number", label: "Level (1-6)" }, { key: "text", type: "text", label: "Text" }, { key: "style", type: "select", label: "Style", options: ["default", "underline", "accent", "uppercase", "light"] }, { key: "color", type: "color", label: "Text color" }, { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] }], defaultProps: { level: 2, text: "Section Heading", style: "default" }, active: true },
  { _id: "core-List", name: "List", displayName: "List", category: "text", baseComponent: "List", description: "Bulleted or numbered list", propsSchema: [{ key: "items", type: "json", label: "Items (JSON array of strings)" }, { key: "ordered", type: "boolean", label: "Numbered list" }, { key: "color", type: "color", label: "Text color" }], defaultProps: { items: ["Item 1", "Item 2", "Item 3"], ordered: false }, active: true },
  { _id: "core-Quote", name: "Quote", displayName: "Quote", category: "text", baseComponent: "Quote", description: "Blockquote with citation", propsSchema: [{ key: "text", type: "text", label: "Quote text" }, { key: "citation", type: "text", label: "Citation" }, { key: "color", type: "color", label: "Text color" }], defaultProps: { text: "This is a sample quote", citation: "Author" }, active: true },
  { _id: "core-CodeSnippet", name: "CodeSnippet", displayName: "Code Snippet", category: "text", baseComponent: "CodeSnippet", description: "Formatted code block", propsSchema: [{ key: "code", type: "text", label: "Code" }, { key: "language", type: "text", label: "Language" }], defaultProps: { code: "console.log('Hello')", language: "javascript" }, active: true },

  // ── Media ──
  { _id: "core-Image", name: "Image", displayName: "Image", category: "media", baseComponent: "Image", description: "Single image with alt text", propsSchema: [{ key: "src", type: "image", label: "Image URL" }, { key: "alt", type: "text", label: "Alt text" }], defaultProps: { src: "", alt: "" }, active: true },
  { _id: "core-Gallery", name: "Gallery", displayName: "Gallery", category: "media", baseComponent: "Gallery", description: "Image grid gallery", propsSchema: [{ key: "images", type: "json", label: "Images (JSON: [{src, alt}])" }, { key: "columns", type: "number", label: "Columns (1-6)" }, { key: "gap", type: "number", label: "Gap (px)" }], defaultProps: { images: [], columns: 3, gap: 8 }, active: true },
  { _id: "core-Video", name: "Video", displayName: "Video", category: "media", baseComponent: "Video", description: "YouTube/Vimeo/file video", propsSchema: [{ key: "url", type: "url", label: "Video URL" }, { key: "caption", type: "text", label: "Caption" }], defaultProps: { url: "", caption: "" }, active: true },
  { _id: "core-FileDownload", name: "FileDownload", displayName: "File Download", category: "media", baseComponent: "FileDownload", description: "Downloadable file link", propsSchema: [{ key: "url", type: "url", label: "File URL" }, { key: "label", type: "text", label: "Label" }, { key: "description", type: "text", label: "Description" }], defaultProps: { url: "", label: "Download file", description: "" }, active: true },
  { _id: "core-Slider", name: "Slider", displayName: "Slider / Carousel", category: "media", baseComponent: "Slider", description: "Image & content carousel", propsSchema: [{ key: "slides", type: "json", label: "Slides JSON" }, { key: "autoplay", type: "boolean", label: "Autoplay" }, { key: "interval", type: "number", label: "Interval (ms)" }, { key: "showDots", type: "boolean", label: "Show dots" }, { key: "showArrows", type: "boolean", label: "Show arrows" }, { key: "height", type: "number", label: "Height (px)" }], defaultProps: { slides: [{ image: "", heading: "Slide 1", text: "Slide description" }], autoplay: true, interval: 5000, showDots: true, showArrows: true, height: 300 }, active: true },
  { _id: "core-Embed", name: "Embed", displayName: "Embed", category: "media", baseComponent: "Embed", description: "Embed external content", propsSchema: [{ key: "url", type: "url", label: "Embed URL" }, { key: "caption", type: "text", label: "Caption" }], defaultProps: { url: "", caption: "" }, active: true },

  // ── Layout ──
  { _id: "core-Cover", name: "Cover", displayName: "Cover", category: "layout", baseComponent: "Cover", description: "Background image with overlay", propsSchema: [{ key: "src", type: "image", label: "Background image URL" }, { key: "alt", type: "text", label: "Alt text" }, { key: "heading", type: "text", label: "Heading" }, { key: "text", type: "text", label: "Text" }, { key: "overlayColor", type: "text", label: "Overlay color" }, { key: "minHeight", type: "number", label: "Min height (px)" }], defaultProps: { src: "", alt: "", heading: "Cover Heading", text: "Cover description", overlayColor: "rgba(0,0,0,0.45)", minHeight: 200 }, active: true },
  { _id: "core-Hero", name: "Hero", displayName: "Hero Section", category: "layout", baseComponent: "Hero", description: "Full hero with CTA buttons", propsSchema: [{ key: "backgroundImage", type: "image", label: "Background image" }, { key: "backgroundAlt", type: "text", label: "Alt text" }, { key: "heading", type: "text", label: "Heading" }, { key: "subheading", type: "text", label: "Subheading" }, { key: "buttonLabel", type: "text", label: "Primary button" }, { key: "buttonUrl", type: "url", label: "Primary button URL" }, { key: "buttonVariant", type: "select", label: "Button style", options: ["solid", "outline"] }, { key: "secondaryButtonLabel", type: "text", label: "Secondary button" }, { key: "secondaryButtonUrl", type: "url", label: "Secondary URL" }, { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] }, { key: "minHeight", type: "number", label: "Min height (px)" }, { key: "overlayColor", type: "text", label: "Overlay color" }], defaultProps: { backgroundImage: "", heading: "Your headline here", subheading: "Supporting text goes here", buttonLabel: "Get started", buttonUrl: "#", buttonVariant: "solid", align: "center", minHeight: 350, overlayColor: "rgba(0,0,0,0.5)" }, active: true },
  { _id: "core-Buttons", name: "Buttons", displayName: "Buttons", category: "layout", baseComponent: "Buttons", description: "Action buttons row", propsSchema: [{ key: "buttons", type: "json", label: "Buttons JSON" }], defaultProps: { buttons: [{ label: "Primary", url: "#", variant: "solid" }, { label: "Secondary", url: "#", variant: "outline" }] }, active: true },
  { _id: "core-Spacer", name: "Spacer", displayName: "Spacer", category: "layout", baseComponent: "Spacer", description: "Vertical space or divider", propsSchema: [{ key: "height", type: "number", label: "Height (px)" }, { key: "showDivider", type: "boolean", label: "Show divider line" }], defaultProps: { height: 40, showDivider: false }, active: true },
  { _id: "core-Columns", name: "Columns", displayName: "Columns", category: "layout", baseComponent: "Columns", description: "Multi-column layout", propsSchema: [{ key: "columns", type: "number", label: "Columns (1-4)" }, { key: "gap", type: "number", label: "Gap (px)" }, { key: "content", type: "json", label: "Content JSON" }], defaultProps: { columns: 2, gap: 24, content: [{ text: "Column 1" }, { text: "Column 2" }] }, active: true },
  { _id: "core-Divider", name: "Divider", displayName: "Divider", category: "layout", baseComponent: "Divider", description: "Horizontal rule with optional text", propsSchema: [{ key: "style", type: "select", label: "Style", options: ["solid", "dashed", "dotted"] }, { key: "color", type: "text", label: "Color" }, { key: "thickness", type: "number", label: "Thickness (px)" }, { key: "width", type: "text", label: "Width" }, { key: "spacing", type: "number", label: "Spacing (px)" }, { key: "text", type: "text", label: "Center text" }], defaultProps: { style: "solid", color: "#e8e8e8", thickness: 1, width: "100%", spacing: 24, text: "" }, active: true },

  // ── Content ──
  { _id: "core-CallToAction", name: "CallToAction", displayName: "Call to Action", category: "content", baseComponent: "CallToAction", description: "CTA with heading & button", propsSchema: [{ key: "heading", type: "text", label: "Heading" }, { key: "text", type: "text", label: "Text" }, { key: "buttonLabel", type: "text", label: "Button label" }, { key: "buttonUrl", type: "url", label: "Button URL" }, { key: "buttonVariant", type: "select", label: "Button style", options: ["solid", "outline"] }, { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] }, { key: "color", type: "color", label: "Heading color" }, { key: "backgroundColor", type: "color", label: "Background color" }], defaultProps: { heading: "Ready to get started?", text: "Join thousands of users today.", buttonLabel: "Learn more", buttonUrl: "#", buttonVariant: "solid", align: "center" }, active: true },
  { _id: "core-Card", name: "Card", displayName: "Card", category: "content", baseComponent: "Card", description: "Content card with image & link", propsSchema: [{ key: "image", type: "image", label: "Image URL" }, { key: "imageAlt", type: "text", label: "Image alt" }, { key: "title", type: "text", label: "Title" }, { key: "description", type: "text", label: "Description" }, { key: "linkUrl", type: "url", label: "Link URL" }, { key: "linkLabel", type: "text", label: "Link label" }, { key: "variant", type: "select", label: "Style", options: ["default", "bordered", "shadow"] }], defaultProps: { image: "", title: "Card Title", description: "Card description text goes here.", linkUrl: "", linkLabel: "Read more", variant: "shadow" }, active: true },
  { _id: "core-CardGrid", name: "CardGrid", displayName: "Card Grid", category: "content", baseComponent: "CardGrid", description: "Grid of content cards", propsSchema: [{ key: "cards", type: "json", label: "Cards JSON" }, { key: "columns", type: "number", label: "Columns (1-4)" }, { key: "gap", type: "number", label: "Gap (px)" }], defaultProps: { cards: [{ title: "Card 1", description: "Description 1" }, { title: "Card 2", description: "Description 2" }, { title: "Card 3", description: "Description 3" }], columns: 3, gap: 24 }, active: true },
  { _id: "core-FeatureGrid", name: "FeatureGrid", displayName: "Feature Grid", category: "content", baseComponent: "FeatureGrid", description: "Feature boxes with icons", propsSchema: [{ key: "features", type: "json", label: "Features JSON" }, { key: "columns", type: "number", label: "Columns (1-4)" }, { key: "variant", type: "select", label: "Variant", options: ["default", "cards"] }], defaultProps: { features: [{ icon: "star", title: "Feature 1", description: "Description" }, { icon: "heart", title: "Feature 2", description: "Description" }, { icon: "rocket", title: "Feature 3", description: "Description" }], columns: 3, variant: "default" }, active: true },
  { _id: "core-IconBox", name: "IconBox", displayName: "Icon Box", category: "content", baseComponent: "IconBox", description: "Feature box with icon", propsSchema: [{ key: "icon", type: "text", label: "Icon name" }, { key: "title", type: "text", label: "Title" }, { key: "description", type: "text", label: "Description" }, { key: "align", type: "select", label: "Align", options: ["left", "center", "right"] }, { key: "iconSize", type: "number", label: "Icon size (px)" }, { key: "variant", type: "select", label: "Variant", options: ["default", "bordered", "filled"] }], defaultProps: { icon: "star", title: "Feature Title", description: "Description text", align: "center", iconSize: 40, variant: "filled" }, active: true },
  { _id: "core-Testimonial", name: "Testimonial", displayName: "Testimonials", category: "content", baseComponent: "Testimonial", description: "Customer quotes", propsSchema: [{ key: "items", type: "json", label: "Items JSON" }, { key: "columns", type: "number", label: "Columns (1-3)" }], defaultProps: { items: [{ quote: "Amazing product! Highly recommend.", name: "Jane Doe", role: "CEO" }], columns: 1 }, active: true },
  { _id: "core-Team", name: "Team", displayName: "Team Members", category: "content", baseComponent: "Team", description: "Team profile grid", propsSchema: [{ key: "members", type: "json", label: "Members JSON" }, { key: "columns", type: "number", label: "Columns (1-4)" }], defaultProps: { members: [{ name: "Team Member", role: "Position", bio: "Short bio" }], columns: 3 }, active: true },
  { _id: "core-Alert", name: "Alert", displayName: "Alert / Notice", category: "content", baseComponent: "Alert", description: "Info/warning/error banner", propsSchema: [{ key: "type", type: "select", label: "Type", options: ["info", "success", "warning", "error"] }, { key: "title", type: "text", label: "Title" }, { key: "message", type: "text", label: "Message" }], defaultProps: { type: "info", title: "Notice", message: "This is an informational message." }, active: true },

  // ── Interactive ──
  { _id: "core-Accordion", name: "Accordion", displayName: "Accordion / FAQ", category: "interactive", baseComponent: "Accordion", description: "Collapsible sections", propsSchema: [{ key: "items", type: "json", label: "Items JSON" }, { key: "allowMultiple", type: "boolean", label: "Allow multiple open" }], defaultProps: { items: [{ title: "Question 1?", content: "Answer to question 1." }, { title: "Question 2?", content: "Answer to question 2." }], allowMultiple: false }, active: true },
  { _id: "core-Tabs", name: "Tabs", displayName: "Tabs", category: "interactive", baseComponent: "Tabs", description: "Tabbed content panels", propsSchema: [{ key: "tabs", type: "json", label: "Tabs JSON" }, { key: "defaultTab", type: "number", label: "Default tab" }], defaultProps: { tabs: [{ label: "Tab 1", content: "Content for tab 1" }, { label: "Tab 2", content: "Content for tab 2" }], defaultTab: 0 }, active: true },
  { _id: "core-Modal", name: "Modal", displayName: "Modal / Popup", category: "interactive", baseComponent: "Modal", description: "Button that opens popup", propsSchema: [{ key: "triggerLabel", type: "text", label: "Button label" }, { key: "triggerVariant", type: "select", label: "Button style", options: ["solid", "outline"] }, { key: "title", type: "text", label: "Modal title" }, { key: "content", type: "text", label: "Modal content" }, { key: "size", type: "select", label: "Size", options: ["small", "medium", "large"] }], defaultProps: { triggerLabel: "Open Dialog", triggerVariant: "solid", title: "Dialog Title", content: "Dialog content here...", size: "medium" }, active: true },

  // ── Data Display ──
  { _id: "core-Stats", name: "Stats", displayName: "Statistics", category: "data", baseComponent: "Stats", description: "Number stats / counters", propsSchema: [{ key: "items", type: "json", label: "Items JSON" }, { key: "columns", type: "number", label: "Columns (1-6)" }, { key: "background", type: "text", label: "Background color" }], defaultProps: { items: [{ value: "100", label: "Users", suffix: "+" }, { value: "50", label: "Projects" }, { value: "99", label: "Uptime", suffix: "%" }], columns: 3, background: "#f8f9fa" }, active: true },
  { _id: "core-Pricing", name: "Pricing", displayName: "Pricing Table", category: "data", baseComponent: "Pricing", description: "Pricing plan comparison", propsSchema: [{ key: "plans", type: "json", label: "Plans JSON" }, { key: "columns", type: "number", label: "Columns (1-4)" }], defaultProps: { plans: [{ name: "Basic", price: "$9", period: "mo", features: ["Feature 1", "Feature 2"], buttonLabel: "Choose", buttonUrl: "#" }, { name: "Pro", price: "$29", period: "mo", features: ["Feature 1", "Feature 2", "Feature 3"], buttonLabel: "Choose", buttonUrl: "#", highlighted: true, badge: "Popular" }], columns: 2 }, active: true },
  { _id: "core-Table", name: "Table", displayName: "Table", category: "data", baseComponent: "Table", description: "Data table with headers", propsSchema: [{ key: "headers", type: "json", label: "Headers JSON" }, { key: "rows", type: "json", label: "Rows JSON" }, { key: "striped", type: "boolean", label: "Striped rows" }, { key: "bordered", type: "boolean", label: "Bordered" }], defaultProps: { headers: ["Name", "Role", "Status"], rows: [["Alice", "Designer", "Active"], ["Bob", "Developer", "Active"]], striped: true, bordered: true }, active: true },
  { _id: "core-Timeline", name: "Timeline", displayName: "Timeline", category: "data", baseComponent: "Timeline", description: "Chronological steps", propsSchema: [{ key: "items", type: "json", label: "Items JSON" }, { key: "variant", type: "select", label: "Variant", options: ["left", "alternating"] }], defaultProps: { items: [{ date: "2024", title: "Event 1", description: "Description" }, { date: "2025", title: "Event 2", description: "Description" }], variant: "left" }, active: true },

  // ── Navigation ──
  { _id: "core-Breadcrumbs", name: "Breadcrumbs", displayName: "Breadcrumbs", category: "navigation", baseComponent: "Breadcrumbs", description: "Navigation trail", propsSchema: [{ key: "items", type: "json", label: "Items JSON" }, { key: "separator", type: "text", label: "Separator" }], defaultProps: { items: [{ label: "Home", url: "/" }, { label: "Page", url: "#" }], separator: "/" }, active: true },
  { _id: "core-SocialLinks", name: "SocialLinks", displayName: "Social Links", category: "navigation", baseComponent: "SocialLinks", description: "Social media icons", propsSchema: [{ key: "links", type: "json", label: "Links JSON" }, { key: "size", type: "number", label: "Icon size" }, { key: "variant", type: "select", label: "Variant", options: ["filled", "outline", "rounded"] }, { key: "align", type: "select", label: "Align", options: ["left", "center", "right"] }], defaultProps: { links: [{ platform: "facebook", url: "#" }, { platform: "twitter", url: "#" }, { platform: "instagram", url: "#" }], size: 40, variant: "filled", align: "center" }, active: true },
];

const BLOCK_ICON_MAP = {
  Paragraph: <FontSizeOutlined />, Heading: <FontSizeOutlined />, List: <UnorderedListOutlined />,
  Quote: <FontSizeOutlined />, CodeSnippet: <FontSizeOutlined />, Image: <PictureOutlined />,
  Gallery: <PictureOutlined />, Video: <PictureOutlined />, FileDownload: <PictureOutlined />,
  Cover: <LayoutOutlined />, Hero: <StarOutlined />, Buttons: <LayoutOutlined />,
  Spacer: <LineOutlined />, Columns: <LayoutOutlined />, Divider: <LineOutlined />,
  CallToAction: <StarOutlined />, Card: <AppstoreOutlined />, CardGrid: <AppstoreOutlined />,
  FeatureGrid: <AppstoreOutlined />, IconBox: <StarOutlined />, Testimonial: <TeamOutlined />,
  Team: <TeamOutlined />, Embed: <PictureOutlined />, Accordion: <UnorderedListOutlined />,
  Tabs: <AppstoreOutlined />, Modal: <InteractionOutlined />, Stats: <StarOutlined />,
  Pricing: <TableOutlined />, Table: <TableOutlined />, Timeline: <ClockCircleOutlined />,
  Breadcrumbs: <ShareAltOutlined />, Alert: <AlertOutlined />, SocialLinks: <ShareAltOutlined />,
  Slider: <PictureOutlined />,
};

// ─── Schema Field Renderer ──────────────────────────────────

function ThemeColorInput({ value, onChange, themeColorOptions }) {
  const options = themeColorOptions || [];
  const matched = options.find((o) => o.value && String(o.value).toLowerCase() === String(value || "").toLowerCase());
  const isCustom = !matched && (value === undefined || value === null || value === "");
  const selectValue = matched ? matched.value : (isCustom ? "__custom__" : "__custom__");
  const showPicker = !matched || selectValue === "__custom__";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.length > 0 && (
        <Select
          value={matched ? matched.value : "__custom__"}
          onChange={(v) => { if (v !== "__custom__") onChange(v); }}
          options={[
            ...options.map((o) => ({ label: o.label, value: o.value })),
            { label: "Custom…", value: "__custom__" },
          ]}
          allowClear={false}
          style={{ width: "100%" }}
        />
      )}
      {showPicker && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ColorPicker
            value={value || undefined}
            onChange={(_, hexStr) => onChange(hexStr)}
            allowClear
            size="small"
          />
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. #333 or inherit"
            style={{ flex: 1 }}
            allowClear
          />
        </div>
      )}
    </div>
  );
}

function renderSchemaField(field, themeColorOptions) {
  const { key, type, label } = field;
  switch (type) {
    case "number":
      return <Form.Item key={key} name={key} label={label}><InputNumber style={{ width: "100%" }} /></Form.Item>;
    case "boolean":
      return <Form.Item key={key} name={key} label={label} valuePropName="checked"><Switch /></Form.Item>;
    case "select":
      return <Form.Item key={key} name={key} label={label}><Select options={(field.options || []).map((o) => ({ value: o, label: o }))} allowClear /></Form.Item>;
    case "color":
      return (
        <Form.Item key={key} name={key} label={label}>
          <ThemeColorInput themeColorOptions={themeColorOptions} />
        </Form.Item>
      );
    case "url":
    case "image":
      return <Form.Item key={key} name={key} label={label}><Input placeholder="https://..." /></Form.Item>;
    case "richtext":
      return <Form.Item key={key} name={key} label={label}><RichTextEditor /></Form.Item>;
    case "json":
      return (
        <Form.Item key={key} name={key} label={label}
          getValueFromEvent={(e) => { if (typeof e === "string") { try { return JSON.parse(e); } catch { return e; } } return e?.target?.value ?? e; }}
          getValueProps={(val) => ({ value: typeof val === "object" ? JSON.stringify(val, null, 2) : (val ?? "") })}
        >
          <Input.TextArea rows={5} style={{ fontFamily: "monospace", fontSize: 12 }} />
        </Form.Item>
      );
    case "text":
    default:
      return <Form.Item key={key} name={key} label={label}>{type === "text" && key === "text" ? <Input.TextArea rows={3} /> : <Input />}</Form.Item>;
  }
}

const SECTION_SETTINGS_SCHEMA = [
  { key: "_containerType", type: "select", label: "Container type", options: ["container", "container-fluid"] },
  { key: "_sectionBg", type: "color", label: "Section background" },
  { key: "_sectionPadding", type: "text", label: "Section padding (e.g. 2rem 0)" },
];

// ─── Sortable Visual Block ──────────────────────────────────

function SortableVisualBlock({ block, index, isSelected, onSelect, onEdit, onDuplicate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.instanceId });

  const comp = CORE_PAGE_BUILDER_COMPONENTS.find((c) => c.baseComponent === block.baseComponent);
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
          border: isSelected ? `2px solid ${catMeta.color}` : "2px solid transparent",
          borderRadius: 6,
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: isSelected ? `0 0 0 3px ${catMeta.color}22` : isDragging ? "0 8px 24px rgba(0,0,0,0.15)" : "none",
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.border = `2px dashed ${catMeta.color}88`; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.border = "2px solid transparent"; }}
      >
        {/* Block label bar */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: 12,
            transform: "translateY(-100%)",
            display: isSelected || isDragging ? "flex" : "none",
            alignItems: "center",
            gap: 4,
            background: catMeta.color,
            color: "#fff",
            padding: "2px 10px",
            borderRadius: "4px 4px 0 0",
            fontSize: 11,
            fontWeight: 500,
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
          <span {...listeners} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: 2 }}>
            <HolderOutlined style={{ fontSize: 12 }} />
          </span>
          {comp?.displayName || block.baseComponent}
        </div>

        {/* Floating toolbar */}
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: -1,
              right: 12,
              transform: "translateY(-100%)",
              display: "flex",
              gap: 1,
              background: "#fff",
              border: `1px solid ${catMeta.color}`,
              borderBottom: "none",
              borderRadius: "4px 4px 0 0",
              padding: "1px 2px",
              zIndex: 10,
            }}
          >
            <Tooltip title="Edit properties">
              <Button type="text" size="small" icon={<EditOutlined style={{ fontSize: 13 }} />} onClick={(e) => { e.stopPropagation(); onEdit(index); }} />
            </Tooltip>
            <Tooltip title="Duplicate">
              <Button type="text" size="small" icon={<CopyOutlined style={{ fontSize: 13 }} />} onClick={(e) => { e.stopPropagation(); onDuplicate(index); }} />
            </Tooltip>
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 13 }} />} onClick={(e) => { e.stopPropagation(); onRemove(index); }} />
            </Tooltip>
          </div>
        )}

        {/* Live rendered block */}
        <div style={{ pointerEvents: "none", minHeight: 20 }}>
          <ComponentRenderer layout={[{ ...block, order: 0 }]} />
        </div>
      </div>
    </div>
  );
}

// ─── Add Block Button between blocks ────────────────────────

function AddBlockButton({ onClick }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "4px 0",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#e8e8e8", transform: "translateY(-50%)" }} />
      <Tooltip title="Add block here">
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
            background: "#fff",
            border: "1px solid #d9d9d9",
            opacity: 0.5,
            transition: "opacity 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "#1890ff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.borderColor = "#d9d9d9"; }}
        />
      </Tooltip>
    </div>
  );
}

// ─── Component Palette Item ─────────────────────────────────

function ComponentPaletteItem({ comp, onAdd }) {
  const icon = BLOCK_ICON_MAP[comp.baseComponent] || <AppstoreOutlined />;
  const catKey = comp.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;

  return (
    <div
      onClick={() => onAdd(comp)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", cursor: "pointer", borderRadius: 8,
        transition: "background 0.15s", border: "1px solid transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.border = "1px solid #e8e8e8"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.border = "1px solid transparent"; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        background: catMeta.color + "15", color: catMeta.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{comp.displayName || comp.baseComponent}</div>
        {comp.description && <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.description}</div>}
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

export default function PageBuilder({ layout = [], onChange }) {
  const [components, setComponents] = useState(CORE_PAGE_BUILDER_COMPONENTS);
  const [theme, setTheme] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [form] = Form.useForm();
  const canvasRef = useRef(null);

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
    structured.forEach(([label, value]) => { if (value) out.push({ label, value }); });
    (theme?.colors || []).filter((c) => c?.name && c?.value).forEach((c) => out.push({ label: c.name, value: c.value }));
    return out;
  }, [theme]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetch("/api/admin/components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const active = (list || []).filter((c) => c.active);
        if (active.length > 0) {
          const merged = [...CORE_PAGE_BUILDER_COMPONENTS];
          active.forEach((apiComp) => {
            if (!merged.find((c) => c.baseComponent === apiComp.baseComponent)) {
              merged.push({ ...apiComp, category: apiComp.category || "content", description: apiComp.description || "" });
            }
          });
          setComponents(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTheme(data))
      .catch(() => setTheme(null));
  }, []);

  const blocks = Array.isArray(layout) ? [...layout] : [];
  const sorted = blocks.map((b, i) => ({ ...b, _index: i })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const triggerChange = useCallback((newLayout) => {
    const withOrder = newLayout.map(({ _index, ...b }, i) => ({ ...b, order: i }));
    onChange(withOrder);
  }, [onChange]);

  const categorizedComponents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? components.filter((c) =>
          (c.displayName || c.baseComponent).toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          (c.category || "").toLowerCase().includes(q)
        )
      : components;
    const groups = {};
    filtered.forEach((comp) => { const cat = comp.category || "content"; if (!groups[cat]) groups[cat] = []; groups[cat].push(comp); });
    return groups;
  }, [components, searchQuery]);

  const handleAdd = (comp) => {
    const newBlock = {
      instanceId: generateId(),
      componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
      baseComponent: comp.baseComponent,
      props: { ...(comp.defaultProps || {}) },
      order: 0,
    };
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
      okText: "Delete", okType: "danger",
      onOk: () => {
        const newLayout = sorted.filter((_, i) => i !== index);
        triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
        setSelectedIndex(null);
      },
    });
  };

  const handleDuplicate = (index) => {
    const block = sorted[index];
    const clone = {
      instanceId: generateId(),
      componentId: block.componentId,
      baseComponent: block.baseComponent,
      props: { ...(block.props || {}) },
      order: 0,
    };
    const arr = [...sorted];
    arr.splice(index + 1, 0, clone);
    triggerChange(arr.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index + 1);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    const block = sorted[index];
    form.resetFields();
    form.setFieldsValue(block.props || {});
    setDrawerOpen(true);
  };

  const handleEditSave = () => {
    form.validateFields().then((values) => {
      const block = sorted[editingIndex];
      const newLayout = blocks.map((b) =>
        b.instanceId === block.instanceId ? { ...b, props: values } : b
      );
      triggerChange(newLayout);
      setDrawerOpen(false);
      setEditingIndex(null);
    });
  };

  const getPropsFields = (baseComponent) => {
    const comp = components.find((c) => c.baseComponent === baseComponent);
    if (comp?.propsSchema?.length > 0) return comp.propsSchema.map((f) => renderSchemaField(f, themeColorOptions));
    const core = CORE_PAGE_BUILDER_COMPONENTS.find((c) => c.baseComponent === baseComponent);
    if (core?.propsSchema?.length > 0) return core.propsSchema.map((f) => renderSchemaField(f, themeColorOptions));
    return <Form.Item name="text" label="Content"><Input.TextArea rows={2} /></Form.Item>;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
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

  const editingBlock = editingIndex !== null ? sorted[editingIndex] : null;
  const pw = PREVIEW_WIDTHS[previewMode];

  return (
    <div style={{ marginTop: 16 }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", background: "#fafafa", borderRadius: "8px 8px 0 0",
        border: "1px solid #e8e8e8", borderBottom: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EyeOutlined style={{ fontSize: 16, color: "#1890ff" }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>Visual Editor</span>
          {sorted.length > 0 && <Badge count={sorted.length} style={{ backgroundColor: "#1890ff" }} />}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setInsertAtIndex(null); setAddDrawerOpen(true); }} size="middle">
            Add Block
          </Button>
        </div>
      </div>

      {/* ── Visual Canvas ── */}
      <div
        ref={canvasRef}
        onClick={(e) => { if (e.target === e.currentTarget || e.target === canvasRef.current?.firstChild) setSelectedIndex(null); }}
        style={{
          border: "1px solid #e8e8e8",
          borderRadius: "0 0 8px 8px",
          background: previewMode === "desktop" ? "#fff" : "#f0f0f0",
          padding: previewMode === "desktop" ? 0 : "16px",
          minHeight: 300,
          transition: "background 0.2s",
        }}
      >
        <div style={{
          maxWidth: typeof pw === "number" ? pw : "none",
          margin: "0 auto",
          background: "#fff",
          minHeight: 300,
          boxShadow: previewMode !== "desktop" ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
          borderRadius: previewMode !== "desktop" ? 8 : 0,
          overflow: "hidden",
          transition: "max-width 0.3s",
        }}>
          {sorted.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: "#999" }}>Click <strong>Add Block</strong> to start building your page visually</span>}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setInsertAtIndex(null); setAddDrawerOpen(true); }}>
                  Add your first block
                </Button>
              </Empty>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sorted.map((b) => b.instanceId)} strategy={verticalListSortingStrategy}>
                <div style={{ padding: "8px 0" }}>
                  {sorted.map((block, index) => (
                    <div key={block.instanceId}>
                      <AddBlockButton onClick={() => openAddAt(index)} />
                      <SortableVisualBlock
                        block={block}
                        index={index}
                        isSelected={selectedIndex === index}
                        onSelect={setSelectedIndex}
                        onEdit={openEdit}
                        onDuplicate={handleDuplicate}
                        onRemove={handleRemove}
                      />
                    </div>
                  ))}
                  <AddBlockButton onClick={() => openAddAt(sorted.length)} />
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* ── Component Palette Drawer ── */}
      <Drawer
        title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><AppstoreOutlined style={{ color: "#1890ff" }} /><span>Add Block</span></div>}
        open={addDrawerOpen}
        onClose={() => { setAddDrawerOpen(false); setSearchQuery(""); setInsertAtIndex(null); }}
        width={400}
        styles={{ body: { padding: "0 16px 16px" } }}
      >
        <div style={{ position: "sticky", top: 0, zIndex: 1, background: "#fff", paddingTop: 16, paddingBottom: 8 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
            size="large"
          />
        </div>
        {Object.keys(categorizedComponents).length === 0 ? (
          <Empty description="No blocks match your search" style={{ marginTop: 40 }} />
        ) : (
          <Collapse
            defaultActiveKey={Object.keys(CATEGORY_META)}
            ghost
            style={{ marginTop: 8 }}
            items={Object.entries(categorizedComponents).map(([catKey, comps]) => {
              const catMeta = CATEGORY_META[catKey] || { label: catKey, icon: <AppstoreOutlined />, color: "#666" };
              return {
                key: catKey,
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: catMeta.color }}>{catMeta.icon}</span>
                    <span style={{ fontWeight: 500 }}>{catMeta.label}</span>
                    <Tag style={{ marginLeft: "auto", borderRadius: 10 }}>{comps.length}</Tag>
                  </div>
                ),
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {comps.map((comp) => <ComponentPaletteItem key={comp._id} comp={comp} onAdd={handleAdd} />)}
                  </div>
                ),
              };
            })}
          />
        )}
      </Drawer>

      {/* ── Edit Block Drawer ── */}
      <Drawer
        title={
          editingBlock ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {BLOCK_ICON_MAP[editingBlock.baseComponent] || <EditOutlined />}
              <span>Edit {CORE_PAGE_BUILDER_COMPONENTS.find((c) => c.baseComponent === editingBlock?.baseComponent)?.displayName || editingBlock?.baseComponent}</span>
            </div>
          ) : "Edit block"
        }
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingIndex(null); }}
        width={480}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => { setDrawerOpen(false); setEditingIndex(null); }} icon={<CloseOutlined />}>Cancel</Button>
            <Button type="primary" onClick={handleEditSave} icon={<CheckOutlined />}>Apply</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          {editingBlock && getPropsFields(editingBlock.baseComponent)}

          {editingBlock && (
            <>
              <Divider orientation="left" style={{ fontSize: 13 }}>Section Settings</Divider>
              {SECTION_SETTINGS_SCHEMA.map((f) => renderSchemaField(f, themeColorOptions))}
            </>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
