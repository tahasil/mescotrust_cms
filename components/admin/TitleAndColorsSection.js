"use client";

import { Form, Input, List, Select, Switch, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { LIST_HEADER_STYLE, normalizeTitleHighlightColorItems } from "@/lib/titleAndColorsConfig";
import { ColorSettingsCard } from "@/components/admin/SettingsCardList";

/**
 * Shared "Title & Colors" UI: same structure for all site components.
 * Renders Main Title list (input/switch rows) + Colors list (theme color dropdowns).
 * Fields are passed per-component via titleListItems and colorListItems.
 */
export default function TitleAndColorsSection({
  form,
  themeColorOptions = [],
  titleListHeader = "Main Title",
  titleListItems = [],
  colorListItems = [],
  supportsTitleHighlight = true,
}) {
  const normalizedColorListItems = supportsTitleHighlight
    ? normalizeTitleHighlightColorItems(colorListItems)
    : colorListItems;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {titleListItems.length > 0 && (
        <List
          header={<span style={LIST_HEADER_STYLE}>{titleListHeader}</span>}
          size="small"
          bordered
          split
          dataSource={titleListItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                item.type === "input" ? (
                  <Form.Item
                    key="input"
                    name={item.name}
                    noStyle
                    style={{ marginBottom: 0, minWidth: 200 }}
                    rules={item.rules}
                  >
                    <Input placeholder={item.placeholder || ""} size="small" style={{ width: "100%", minWidth: 200 }} />
                  </Form.Item>
                ) : item.type === "select" ? (
                  <Form.Item
                    key="select"
                    name={item.name}
                    noStyle
                    style={{ marginBottom: 0 }}
                    rules={item.rules}
                  >
                    <Select
                      size="small"
                      options={Array.isArray(item.options) ? item.options : []}
                      placeholder={item.placeholder || "Select"}
                      style={{ width: item.width || 120 }}
                      allowClear={item.allowClear === true}
                      onChange={(val) => {
                        if (item.key === "titleAlign") {
                          form?.setFieldValue("titleAlign", val);
                          if (item.name && item.name !== "titleAlign") {
                            form?.setFieldValue(item.name, val);
                          }
                        }
                      }}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item key="switch" name={item.name} valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
                    <Switch
                      checkedChildren={item.checkedChildren}
                      unCheckedChildren={item.unCheckedChildren}
                    />
                  </Form.Item>
                ),
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
      {normalizedColorListItems.length > 0 && (
        <ColorSettingsCard
          items={normalizedColorListItems}
          options={themeColorOptions}
        />
      )}
    </div>
  );
}
