"use client";

import {
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  ColorPicker,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";

/** Theme color dropdown + optional custom color picker. */
export function ThemeColorInput({ value, onChange, themeColorOptions }) {
  const options = themeColorOptions || [];
  const matched = options.find(
    (o) =>
      o.value &&
      String(o.value).toLowerCase() === String(value || "").toLowerCase(),
  );
  const isCustom =
    !matched && (value === undefined || value === null || value === "");
  const showPicker = !matched || (matched && matched.value === "__custom__");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.length > 0 && (
        <Select
          value={matched ? matched.value : "__custom__"}
          onChange={(v) => v !== "__custom__" && onChange(v)}
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

function ChildrenPreserver() {
  return null;
}

function shouldUseResponsiveImageField(field = {}) {
  const key = String(field?.key || "").toLowerCase();
  const label = String(field?.label || "").toLowerCase();
  const haystack = `${key} ${label}`;
  if (!haystack) return false;
  if (!/(image|bg|background|banner|cover|hero|photo|thumbnail)/.test(haystack)) {
    return false;
  }
  if (/(icon|logo|pdf|file|document)/.test(haystack)) {
    return false;
  }
  return true;
}

export function ArrayEditor({ field, themeColorOptions }) {
  const { key, label, itemSchema = [], itemLabel = "Item" } = field;
  const defaultItem = itemSchema.reduce(
    (acc, f) => ({
      ...acc,
      [f.key]: f.default ?? (f.type === "boolean" ? false : ""),
    }),
    {},
  );

  return (
    <Form.Item label={label}>
      <Form.List name={key}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key: listKey, name }) => (
              <div
                key={listKey}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: "#fafafa",
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                    {itemLabel} #{name + 1}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {itemSchema.map((subField) => {
                    if (subField.type === "children") {
                      return (
                        <Form.Item
                          key={subField.key}
                          name={[name, "children"]}
                          noStyle
                          initialValue={[]}
                          preserve
                        >
                          <ChildrenPreserver />
                        </Form.Item>
                      );
                    }
                    if (
                      subField.type === "image" &&
                      shouldUseResponsiveImageField(subField)
                    ) {
                      return (
                        <div key={subField.key} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          <Form.Item
                            name={[name, subField.key]}
                            label={`${subField.label || "Image"} (Desktop)`}
                            style={{ marginBottom: 8 }}
                          >
                            <MediaPickerInput
                              placeholder="https://..."
                              uiVariant="stacked"
                              hintText="Recommended for desktop/tablet"
                            />
                          </Form.Item>
                          <Form.Item
                            name={[name, `${subField.key}Mobile`]}
                            label={`${subField.label || "Image"} (Mobile)`}
                            style={{ marginBottom: 8 }}
                          >
                            <MediaPickerInput
                              placeholder="https://..."
                              uiVariant="stacked"
                              hintText="Optional. Desktop image will be used if empty."
                            />
                          </Form.Item>
                        </div>
                      );
                    }
                    return (
                      <Form.Item
                        key={subField.key}
                        name={[name, subField.key]}
                        label={subField.label}
                        style={{ marginBottom: 8 }}
                        valuePropName={
                          subField.type === "boolean" ? "checked" : undefined
                        }
                      >
                        {subField.type === "number" ? (
                          <InputNumber style={{ width: "100%" }} />
                        ) : null}
                        {subField.type === "boolean" ? <Switch /> : null}
                        {subField.type === "select" ? (
                          <Select
                            options={(subField.options || []).map((o) =>
                              typeof o === "object" && o && "value" in o
                                ? { value: o.value, label: o.label }
                                : { value: o, label: o },
                            )}
                            allowClear
                            style={{ width: "100%" }}
                          />
                        ) : null}
                        {subField.type === "color" ? (
                          <ThemeColorInput
                            themeColorOptions={themeColorOptions}
                          />
                        ) : null}
                        {(subField.type === "url" ||
                          subField.type === "text") &&
                        subField.type !== "richtext" ? (
                          <Input
                            placeholder={
                              subField.type === "url" ? "https://..." : ""
                            }
                          />
                        ) : null}
                        {subField.type === "image" ? (
                          <MediaPickerInput placeholder="https://..." />
                        ) : null}
                      </Form.Item>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => add(defaultItem)}
              block
              icon={<PlusOutlined />}
              style={{ marginTop: 4 }}
            >
              Add {itemLabel}
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
}

/** Render a single schema field (used by component EditForms and PageBuilder). */
export function renderSchemaField(field, themeColorOptions) {
  const { key, type, label } = field;
  if (type === "json" && field.itemSchema?.length > 0) {
    return (
      <ArrayEditor
        key={key}
        field={field}
        themeColorOptions={themeColorOptions}
      />
    );
  }
  switch (type) {
    case "number":
      return (
        <Form.Item key={key} name={key} label={label}>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    case "boolean":
      return (
        <Form.Item key={key} name={key} label={label} valuePropName="checked">
          <Switch />
        </Form.Item>
      );
    case "select":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Select
            options={(field.options || []).map((o) =>
              typeof o === "object" && o && "value" in o
                ? { value: o.value, label: o.label }
                : { value: o, label: o },
            )}
            allowClear
          />
        </Form.Item>
      );
    case "color":
      return (
        <Form.Item key={key} name={key} label={label}>
          <ThemeColorInput themeColorOptions={themeColorOptions} />
        </Form.Item>
      );
    case "themeColorOnly":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Select
            options={themeColorOptions || []}
            placeholder="Select theme color"
            allowClear
            style={{ width: "100%" }}
          />
        </Form.Item>
      );
    case "image":
      if (shouldUseResponsiveImageField(field)) {
        return (
          <>
            <Form.Item key={`${key}-desktop`} name={key} label={`${label || "Image"} (Desktop)`}>
              <MediaPickerInput
                placeholder="https://..."
                uiVariant="stacked"
                hintText="Recommended for desktop/tablet"
              />
            </Form.Item>
            <Form.Item
              key={`${key}-mobile`}
              name={`${key}Mobile`}
              label={`${label || "Image"} (Mobile)`}
            >
              <MediaPickerInput
                placeholder="https://..."
                uiVariant="stacked"
                hintText="Optional. Desktop image will be used if empty."
              />
            </Form.Item>
          </>
        );
      }
      return (
        <Form.Item key={key} name={key} label={label}>
          <MediaPickerInput placeholder="https://..." />
        </Form.Item>
      );
    case "url":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Input placeholder="https://..." />
        </Form.Item>
      );
    case "richtext":
      return (
        <Form.Item key={key} name={key} label={label}>
          <RichTextEditor />
        </Form.Item>
      );
    case "json":
      return (
        <Form.Item
          key={key}
          name={key}
          label={label}
          getValueFromEvent={(e) => {
            if (typeof e === "string") {
              try {
                return JSON.parse(e);
              } catch {
                return e;
              }
            }
            return e?.target?.value ?? e;
          }}
          getValueProps={(val) => ({
            value:
              typeof val === "object"
                ? JSON.stringify(val, null, 2)
                : (val ?? ""),
          })}
        >
          <Input.TextArea
            rows={5}
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
        </Form.Item>
      );
    case "text":
    default:
      return (
        <Form.Item key={key} name={key} label={label}>
          {type === "text" && key === "text" ? (
            <Input.TextArea rows={3} />
          ) : (
            <Input />
          )}
        </Form.Item>
      );
  }
}

/** Section-level styles (container, bg, padding, border, shadow) – used by generic and section edit forms. */
export const SECTION_SETTINGS_SCHEMA = [
  { key: "_containerType", type: "select", label: "Container", options: [{ value: "container", label: "Container (max-width)" }, { value: "container-fluid", label: "Container fluid (full width)" }] },
  { key: "_sectionBg", type: "color", label: "Background" },
  { key: "_sectionPadding", type: "text", label: "Padding (e.g. 2rem 1rem)" },
  { key: "_sectionBorderSize", type: "text", label: "Border size", default: "0px 0px 0px 0px" },
  { key: "_sectionBorderStyle", type: "select", label: "Border type", options: [{ value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }, { value: "dotted", label: "Dotted" }, { value: "none", label: "None" }] },
  { key: "_sectionBorderColor", type: "color", label: "Border color" },
  { key: "_sectionShadow", type: "text", label: "Shadow (e.g. 0 2px 8px rgba(0,0,0,0.08))" },
];

/** Which props belong to which clickable element (click element → edit in drawer). */
export const BLOCK_ELEMENT_FIELDS = {
  Hero: {
    heading: { label: "Heading", fields: ["heading"] },
    subheading: { label: "Subheading", fields: ["subheading"] },
    primaryButton: { label: "Primary button", fields: ["buttonLabel", "buttonUrl", "buttonVariant"] },
    secondaryButton: { label: "Secondary button", fields: ["secondaryButtonLabel", "secondaryButtonUrl"] },
    background: { label: "Background image", fields: ["backgroundImage", "backgroundAlt"] },
  },
  CallToAction: {
    heading: { label: "Heading", fields: ["heading"] },
    text: { label: "Text", fields: ["text"] },
    button: { label: "Button", fields: ["buttonLabel", "buttonUrl", "buttonVariant"] },
  },
  Paragraph: { content: { label: "Text", fields: ["text", "color", "align"] } },
  Heading: { content: { label: "Heading", fields: ["level", "text", "style", "color", "align"] } },
};

/** Enrichment for list-like JSON fields (itemSchema) per baseComponent. */
export const SCHEMA_ENRICHMENT = {
  Header: {
    navItems: {
      itemLabel: "Nav item",
      itemSchema: [
        { key: "label", type: "text", label: "Label" },
        { key: "url", type: "url", label: "URL" },
        { key: "hasDropdown", type: "boolean", label: "Has dropdown", default: false },
        { key: "children", type: "children", label: "", default: [] },
      ],
    },
    actionButtons: {
      itemLabel: "Button",
      itemSchema: [
        { key: "label", type: "text", label: "Label" },
        { key: "url", type: "url", label: "URL" },
        { key: "image", type: "image", label: "Icon image (upload in Media, paste URL)" },
        { key: "imagePosition", type: "select", label: "Icon placement", options: [{ value: "left", label: "Left of text" }, { value: "right", label: "Right of text" }] },
        { key: "imageHeight", type: "number", label: "Icon height (px)" },
        { key: "fontSize", type: "number", label: "Font size (px)" },
        { key: "fontWeight", type: "select", label: "Font weight", options: [{ value: "400", label: "400 (Normal)" }, { value: "500", label: "500 (Medium)" }, { value: "600", label: "600 (Semi-bold)" }, { value: "700", label: "700 (Bold)" }] },
        { key: "letterSpacing", type: "text", label: "Letter spacing" },
        { key: "textTransform", type: "select", label: "Text transform", options: [{ value: "none", label: "None" }, { value: "uppercase", label: "Uppercase" }, { value: "lowercase", label: "Lowercase" }, { value: "capitalize", label: "Capitalize" }] },
        { key: "background", type: "color", label: "Background color" },
        { key: "color", type: "color", label: "Text color" },
        { key: "borderColor", type: "color", label: "Border color" },
        { key: "borderRadius", type: "number", label: "Border radius (px)" },
        { key: "paddingY", type: "number", label: "Padding top/bottom (px)" },
        { key: "paddingX", type: "number", label: "Padding left/right (px)" },
        { key: "boxShadow", type: "text", label: "Box shadow (CSS)" },
      ],
    },
  },
  Buttons: {
    buttons: {
      itemLabel: "Button",
      itemSchema: [
        { key: "label", type: "text", label: "Label" },
        { key: "url", type: "url", label: "URL" },
        { key: "variant", type: "select", label: "Style", options: [{ value: "solid", label: "Solid" }, { value: "outline", label: "Outline" }] },
      ],
    },
  },
  CardGrid: {
    cards: {
      itemLabel: "Card",
      itemSchema: [
        { key: "title", type: "text", label: "Title" },
        { key: "description", type: "text", label: "Description" },
      ],
    },
  },
  Slider: {
    slides: {
      itemLabel: "Slide",
      itemSchema: [
        { key: "image", type: "image", label: "Image URL" },
        { key: "heading", type: "text", label: "Heading" },
        { key: "text", type: "text", label: "Text" },
      ],
    },
  },
};

/** Enrich schema with itemSchema for list fields. */
export function enrichSchema(baseComponent, schema) {
  if (!Array.isArray(schema)) return schema;
  const enrichment = SCHEMA_ENRICHMENT[baseComponent];
  if (!enrichment) return schema;
  return schema.map((f) => ({ ...f, ...(enrichment[f.key] || {}) }));
}
