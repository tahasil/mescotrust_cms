"use client";

import { Form, List, Select, Switch, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { LIST_HEADER_STYLE } from "@/lib/titleAndColorsConfig";

export function SettingsCardLabel({ label, tooltip }) {
  return (
    <Tooltip title={tooltip}>
      <span
        style={{
          color: "rgba(0,0,0,0.65)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 14,
        }}
      >
        {label}
        {tooltip ? (
          <QuestionCircleOutlined style={{ color: "#999", fontSize: 12 }} />
        ) : null}
      </span>
    </Tooltip>
  );
}

export default function SettingsCardList({
  title,
  items = [],
  renderAction,
  className,
}) {
  return (
    <List
      className={className}
      header={<span style={LIST_HEADER_STYLE}>{title}</span>}
      size="small"
      bordered
      split
      dataSource={items}
      renderItem={(item) => (
        <List.Item actions={[renderAction(item)]}>
          <SettingsCardLabel label={item.label} tooltip={item.tooltip} />
        </List.Item>
      )}
    />
  );
}

export function SwitchSettingsCard({ title = "Behaviour", items = [] }) {
  return (
    <SettingsCardList
      title={title}
      items={items}
      renderAction={(item) => (
        <Form.Item
          key={`switch-${String(item.name)}`}
          name={item.name}
          valuePropName="checked"
          noStyle
        >
          <Switch
            checkedChildren={item.checkedChildren}
            unCheckedChildren={item.unCheckedChildren}
            onChange={item.onChange}
          />
        </Form.Item>
      )}
    />
  );
}

export function ColorSettingsCard({
  title = "Colors",
  items = [],
  options = [],
}) {
  return (
    <SettingsCardList
      title={title}
      items={items}
      renderAction={(item) => (
        <Form.Item key={`color-${String(item.name)}`} name={item.name} noStyle>
          <Select
            size="small"
            options={options}
            placeholder="From theme (default)"
            style={{ width: 120 }}
            allowClear
          />
        </Form.Item>
      )}
    />
  );
}
