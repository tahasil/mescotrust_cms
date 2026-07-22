"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  Collapse,
  Form,
  Input,
  List,
  Select,
  Spin,
  Switch,
  Tooltip,
  message,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { LIST_HEADER_STYLE } from "@/lib/titleAndColorsConfig";
import { LINK_TARGET_OPTIONS, normalizeTarget } from "./editorUtils";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function legacyValues(items) {
  const list = Array.isArray(items) ? items : [];
  return {
    noticeText: text(list[0]?.text ?? list[0]?.label),
    actionText: text(list[1]?.text ?? list[1]?.label),
    actionUrl: text(list[1]?.url ?? list[1]?.href),
    actionTarget: normalizeTarget(list[1]?.target),
    actionEnabled: list[1]?.enabled !== false,
  };
}

const SWITCH_ITEMS = [
  {
    name: "active",
    label: "Display Header Ribbon",
    tooltip: "Show or hide the complete ribbon on the public website.",
  },
  {
    name: "ribbonActionEnabled",
    label: "Display View Notice link",
    tooltip: "Show or hide the linked action beside the notice text.",
  },
  {
    name: "ribbonShowNoticeIcon",
    label: "Show notice icon",
    tooltip: "Show the notice icon on desktop and tablet.",
  },
  {
    name: "ribbonShowLinkArrow",
    label: "Show link arrow",
    tooltip: "Show the arrow after the View Notice link.",
  },
];

const COLOR_ITEMS = [
  { name: "ribbonBackgroundColorKey", label: "Background", tooltip: "Ribbon background color." },
  { name: "ribbonTextColorKey", label: "Notice text", tooltip: "Normal notice text color." },
  { name: "ribbonLinkColorKey", label: "Link text", tooltip: "View Notice link color." },
  { name: "ribbonHoverColorKey", label: "Link hover", tooltip: "View Notice hover color." },
  { name: "ribbonIconColorKey", label: "Icons", tooltip: "Notice and arrow icon color." },
  { name: "ribbonBorderColorKey", label: "Bottom border", tooltip: "Subtle border below the ribbon." },
  { name: "ribbonLinkBorderColorKey", label: "Link underline", tooltip: "View Notice underline color." },
  { name: "ribbonFocusColorKey", label: "Focus outline", tooltip: "Keyboard focus outline color." },
];

function FieldLabel({ label, tooltip }) {
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
        {label} <QuestionCircleOutlined style={{ color: "#999", fontSize: 12 }} />
      </span>
    </Tooltip>
  );
}

export default forwardRef(function AppearanceHeaderRibbonEditForm(
  { dataEndpoint, themeColorOptions = [], onSuccess },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(dataEndpoint, { cache: "no-store" })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Failed to load Header Ribbon")),
      )
      .then((record) => {
        const legacy = legacyValues(record?.ribbonItems);
        form.setFieldsValue({
          active: record?.active !== false,
          ribbonAriaLabel: record?.ribbonAriaLabel || "",
          ribbonNoticeText: record?.ribbonNoticeText || legacy.noticeText,
          ribbonActionText: record?.ribbonActionText || legacy.actionText,
          ribbonActionUrl: record?.ribbonActionUrl || legacy.actionUrl,
          ribbonActionTarget: normalizeTarget(
            record?.ribbonActionTarget || legacy.actionTarget,
          ),
          ribbonActionEnabled:
            record?.ribbonActionEnabled == null
              ? legacy.actionEnabled
              : record.ribbonActionEnabled !== false,
          ribbonShowNoticeIcon: record?.ribbonShowNoticeIcon !== false,
          ribbonShowLinkArrow: record?.ribbonShowLinkArrow !== false,
          ribbonBackgroundColorKey: record?.ribbonBackgroundColorKey || "Black",
          ribbonTextColorKey: record?.ribbonTextColorKey || "Cream",
          ribbonLinkColorKey: record?.ribbonLinkColorKey || "White",
          ribbonHoverColorKey: record?.ribbonHoverColorKey || "Primary Soft",
          ribbonIconColorKey: record?.ribbonIconColorKey || "Primary Soft",
          ribbonBorderColorKey:
            record?.ribbonBorderColorKey || "rgba(250, 246, 239, 0.1)",
          ribbonLinkBorderColorKey:
            record?.ribbonLinkBorderColorKey || "rgba(250, 246, 239, 0.5)",
          ribbonFocusColorKey: record?.ribbonFocusColorKey || "Primary Soft",
        });
      })
      .catch((error) =>
        message.error(error?.message || "Failed to load Header Ribbon"),
      )
      .finally(() => setLoading(false));
  }, [dataEndpoint, form]);

  const save = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    const payload = {
      ribbonAriaLabel: text(values.ribbonAriaLabel),
      ribbonNoticeText: text(values.ribbonNoticeText),
      ribbonActionText: text(values.ribbonActionText),
      ribbonActionUrl: text(values.ribbonActionUrl),
      ribbonActionTarget: normalizeTarget(values.ribbonActionTarget),
      ribbonActionEnabled: values.ribbonActionEnabled !== false,
      ribbonShowNoticeIcon: values.ribbonShowNoticeIcon !== false,
      ribbonShowLinkArrow: values.ribbonShowLinkArrow !== false,
      ribbonBackgroundColorKey: text(values.ribbonBackgroundColorKey),
      ribbonTextColorKey: text(values.ribbonTextColorKey),
      ribbonLinkColorKey: text(values.ribbonLinkColorKey),
      ribbonHoverColorKey: text(values.ribbonHoverColorKey),
      ribbonIconColorKey: text(values.ribbonIconColorKey),
      ribbonBorderColorKey: text(values.ribbonBorderColorKey),
      ribbonLinkBorderColorKey: text(values.ribbonLinkBorderColorKey),
      ribbonFocusColorKey: text(values.ribbonFocusColorKey),
    };

    setSaving(true);
    try {
      const response = await fetch(dataEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: values.active !== false,
          defaultProps: payload,
          replaceDefaultProps: true,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save Header Ribbon");
      }
      message.success("Header Ribbon saved");
      await onSuccess?.();
    } catch (error) {
      if (error?.errorFields) throw error;
      message.error(error?.message || "Failed to save Header Ribbon");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: save }));

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  const colorOptions = [
    { label: "Reference border (10% cream)", value: "rgba(250, 246, 239, 0.1)" },
    { label: "Reference underline (50% cream)", value: "rgba(250, 246, 239, 0.5)" },
    ...themeColorOptions,
  ].filter(
    (option, index, options) =>
      options.findIndex((candidate) => candidate.value === option.value) === index,
  );

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["settings", "content", "colors"]}
        items={[
          {
            key: "settings",
            label: "Ribbon Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <List
                  header={<span style={LIST_HEADER_STYLE}>Behaviour</span>}
                  size="small"
                  bordered
                  split
                  dataSource={SWITCH_ITEMS}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item
                          key="switch"
                          name={item.name}
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch />
                        </Form.Item>,
                      ]}
                    >
                      <FieldLabel label={item.label} tooltip={item.tooltip} />
                    </List.Item>
                  )}
                />
                <Form.Item name="ribbonAriaLabel" label="Accessible label">
                  <Input placeholder="Important notice" />
                </Form.Item>
              </div>
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item
                  name="ribbonNoticeText"
                  label="Notice Text"
                  rules={[{ required: true, message: "Notice Text is required" }]}
                  tooltip="Normal text only; this notice is not a hyperlink."
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="ribbonActionText"
                  label="Link Text"
                  rules={[{ required: true, message: "Link Text is required" }]}
                >
                  <Input placeholder="View Notice" />
                </Form.Item>
                <Form.Item
                  name="ribbonActionUrl"
                  label="URL"
                  rules={[{ required: true, message: "URL is required" }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="ribbonActionTarget" label="Target">
                  <Select options={LINK_TARGET_OPTIONS} />
                </Form.Item>
              </>
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={colorOptions}
                colorListItems={COLOR_ITEMS}
              />
            ),
          },
        ]}
      />
    </Form>
  );
});
