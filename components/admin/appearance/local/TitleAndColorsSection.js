"use client";

import { Form, Input, List, Select, Switch, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { LIST_HEADER_STYLE } from "@/components/admin/appearance/local/titleAndColorsConfig";

const DEFAULT_ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

function getMainTitleAlignFieldName(mainTitleFieldName) {
  const name = String(mainTitleFieldName || "").trim();
  if (!name) return "titleAlign";
  if (name.toLowerCase() === "maintitle") return "titleAlign";
  return `${name}Align`;
}

function withAutoMainTitleAlign(items = []) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return list;

  const existingNames = new Set(
    list.map((item) => String(item?.name || "").trim()).filter(Boolean),
  );
  const nextItems = [];

  list.forEach((item) => {
    nextItems.push(item);
    if (item?.key !== "mainTitle" || item?.type !== "input") return;

    const alignFieldName = getMainTitleAlignFieldName(item?.name);
    if (existingNames.has(alignFieldName)) return;

    nextItems.push({
      key: `${item.key}Align`,
      type: "select",
      name: alignFieldName,
      label: "Align",
      tooltip: "Alignment for the main title",
      placeholder: "Select align",
      options: DEFAULT_ALIGN_OPTIONS,
      defaultValue: "center",
    });
    existingNames.add(alignFieldName);
  });

  return nextItems;
}

function ColorKeySelect({ name, options = [], value, onChange }) {
  const current = String(value ?? "").trim();
  const normalizedValue = current ? value : undefined;
  const opts = Array.isArray(options) ? options : [];
  const exists = current
    ? opts.some(
        (o) =>
          String(o?.value || "").trim().toLowerCase() === current.toLowerCase(),
      )
    : true;
  const mergedOptions = current && !exists
    ? [{ label: current, value: current }, ...opts]
    : opts;

  return (
    <Select
      size="small"
      value={normalizedValue}
      onChange={onChange}
      options={mergedOptions}
      placeholder="From appearance colors"
      style={{ width: 120 }}
      allowClear
    />
  );
}

/**
 * Shared "Colors" UI: same structure for all site components.
 * Renders Main Title list (input/switch rows) + Colors list (theme color dropdowns).
 * Fields are passed per-component via titleListItems and colorListItems.
 */
export default function TitleAndColorsSection({
  form,
  themeColorOptions = [],
  titleListHeader = "Main Title",
  titleListItems = [],
  colorListItems = [],
}) {
  const normalizedTitleListItems = withAutoMainTitleAlign(titleListItems);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {normalizedTitleListItems.length > 0 && (
        <List
          header={<span style={LIST_HEADER_STYLE}>{titleListHeader}</span>}
          size="small"
          bordered
          split
          dataSource={normalizedTitleListItems}
          renderItem={(item) => {
            let action = null;
            if (item.type === "input") {
              action = (
                <Form.Item
                  key="input"
                  name={item.name}
                  noStyle
                  style={{ marginBottom: 0, minWidth: 200 }}
                  rules={item.rules}
                >
                  <Input
                    placeholder={item.placeholder || ""}
                    size="small"
                    style={{ width: "100%", minWidth: 200 }}
                  />
                </Form.Item>
              );
            } else if (item.type === "select") {
              action = (
                <Form.Item
                  key="select"
                  name={item.name}
                  noStyle
                  style={{ marginBottom: 0, minWidth: 200 }}
                  rules={item.rules}
                >
                  <Select
                    size="small"
                    style={{ width: "100%", minWidth: 200 }}
                    options={
                      Array.isArray(item.options) && item.options.length > 0
                        ? item.options
                        : DEFAULT_ALIGN_OPTIONS
                    }
                    placeholder={item.placeholder || "Select align"}
                  />
                </Form.Item>
              );
            } else if (item.type === "switch") {
              action = (
                <Form.Item
                  key="switch"
                  name={item.name}
                  valuePropName="checked"
                  noStyle
                  style={{ marginBottom: 0 }}
                >
                  <Switch />
                </Form.Item>
              );
            }
            return (
              <List.Item actions={action ? [action] : []}>
                <Tooltip title={item.tooltip}>
                  <span
                    style={{
                      fontSize: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    {item.label}{" "}
                    <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                  </span>
                </Tooltip>
              </List.Item>
            );
          }}
        />
      )}
      {colorListItems.length > 0 && (
        <List
          header={<span style={LIST_HEADER_STYLE}>Colors</span>}
          size="small"
          bordered
          split
          dataSource={colorListItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Form.Item key="select" name={item.name} noStyle style={{ marginBottom: 0 }}>
                  <ColorKeySelect name={item.name} options={themeColorOptions} />
                </Form.Item>,
              ]}
            >
              <Tooltip title={item.tooltip}>
                <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                  {item.label} <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                </span>
              </Tooltip>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}


