"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Select,
  Spin,
  message,
} from "antd";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import SortableFormList from "@/components/admin/SortableFormList";
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

function normalizeRibbonItems(record) {
  if (Array.isArray(record?.ribbonItems) && record.ribbonItems.length > 0) {
    if (
      record.ribbonItems.length === 2 &&
      !record.ribbonItems[0]?.noticeText &&
      (record.ribbonItems[0]?.text || record.ribbonItems[0]?.label) &&
      (record.ribbonItems[1]?.url || record.ribbonItems[1]?.href)
    ) {
      const legacy = legacyValues(record.ribbonItems);
      return [
        {
          noticeText: legacy.noticeText,
          actionText: legacy.actionText,
          actionUrl: legacy.actionUrl,
          actionTarget: normalizeTarget(legacy.actionTarget),
        },
      ];
    }
    return record.ribbonItems.map((item, idx) => ({
      noticeText: text(item?.noticeText ?? item?.text ?? item?.label),
      actionText: text(
        item?.actionText ??
          item?.linkText ??
          (idx === 0 ? record?.ribbonActionText : "View Notice"),
      ),
      actionUrl: text(
        item?.actionUrl ??
          item?.url ??
          item?.href ??
          (idx === 0 ? record?.ribbonActionUrl : ""),
      ),
      actionTarget: normalizeTarget(
        item?.actionTarget ??
          item?.target ??
          (idx === 0 ? record?.ribbonActionTarget : "_self"),
      ),
    }));
  }

  const legacy = legacyValues(record?.ribbonItems);
  const noticeText = text(record?.ribbonNoticeText) || legacy.noticeText;
  const actionText =
    text(record?.ribbonActionText) || legacy.actionText || "View Notice";
  const actionUrl =
    text(record?.ribbonActionUrl) || legacy.actionUrl || "/get-involved/notices";
  const actionTarget = normalizeTarget(
    record?.ribbonActionTarget || legacy.actionTarget,
  );

  if (noticeText || actionUrl) {
    return [
      {
        noticeText,
        actionText,
        actionUrl,
        actionTarget,
      },
    ];
  }

  return [
    {
      noticeText:
        "Notice: List of Selected Students — School Scholarship 2026-27",
      actionText: "View Notice",
      actionUrl: "/get-involved/notices",
      actionTarget: "_self",
    },
  ];
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

const DIRECTION_OPTIONS = [
  { label: "Left to Right", value: "ltr" },
  { label: "Right to Left", value: "rtl" },
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

export default forwardRef(function AppearanceHeaderRibbonEditForm(
  { dataEndpoint, themeColorOptions = [], onSuccess, onValuesChange },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");

  useEffect(() => {
    fetch(dataEndpoint, { cache: "no-store" })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Failed to load Header Ribbon")),
      )
      .then((record) => {
        const items = normalizeRibbonItems(record);
        form.setFieldsValue({
          active: record?.active !== false,
          ribbonDirection:
            String(record?.ribbonDirection || "rtl").toLowerCase() === "ltr"
              ? "ltr"
              : "rtl",
          ribbonSpeed:
            record?.ribbonSpeed != null && Number(record?.ribbonSpeed) > 0
              ? Number(record?.ribbonSpeed)
              : 45,
          ribbonAriaLabel: record?.ribbonAriaLabel || "",
          ribbonItems: items,
          ribbonNoticeText: items[0]?.noticeText || "",
          ribbonActionText: items[0]?.actionText || "",
          ribbonActionUrl: items[0]?.actionUrl || "",
          ribbonActionTarget: items[0]?.actionTarget || "_self",
          ribbonActionEnabled:
            record?.ribbonActionEnabled == null
              ? true
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
    const rawItems = values.ribbonItems ?? [];
    const items = Array.isArray(rawItems)
      ? rawItems
          .map((item) => ({
            noticeText: text(item?.noticeText),
            actionText: text(item?.actionText),
            actionUrl: text(item?.actionUrl),
            actionTarget: normalizeTarget(item?.actionTarget),
          }))
          .filter(
            (item) =>
              item.noticeText || item.actionText || item.actionUrl,
          )
      : [];

    const firstItem = items[0] || {
      noticeText: "",
      actionText: "",
      actionUrl: "",
      actionTarget: "_self",
    };

    const payload = {
      ribbonItems: items,
      ribbonDirection: values.ribbonDirection === "ltr" ? "ltr" : "rtl",
      ribbonSpeed:
        values.ribbonSpeed != null && Number(values.ribbonSpeed) > 0
          ? Number(values.ribbonSpeed)
          : 45,
      ribbonNoticeText: firstItem.noticeText,
      ribbonActionText: firstItem.actionText,
      ribbonActionUrl: firstItem.actionUrl,
      ribbonActionTarget: firstItem.actionTarget,
      ribbonAriaLabel: text(values.ribbonAriaLabel),
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
    <Form
      preserve={true}
      form={form}
      layout="vertical"
      disabled={saving}
      onValuesChange={(_, allValues) => onValuesChange?.(allValues)}
    >
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "settings",
            label: "Ribbon Settings",
            forceRender: true,
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SwitchSettingsCard items={SWITCH_ITEMS} />
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      name="ribbonDirection"
                      label="Scrolling Direction"
                      tooltip="Direction for the marquee scrolling effect when multiple items exist."
                    >
                      <Select options={DIRECTION_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="ribbonSpeed"
                      label="Marquee Speed"
                      tooltip="Scrolling speed in pixels per second (e.g. 45)."
                    >
                      <InputNumber
                        min={5}
                        max={300}
                        step={5}
                        style={{ width: "100%" }}
                        placeholder="45"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="ribbonAriaLabel" label="Accessible label">
                  <Input placeholder="Important notice" />
                </Form.Item>
              </div>
            ),
          },
          {
            key: "content",
            label: "Content",
            forceRender: true,
            children: (
              <Form.List name="ribbonItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Notice"
                    addButtonText="Add item"
                    defaultAddPayload={{
                      noticeText: "",
                      actionText: "View Notice",
                      actionUrl: "",
                      actionTarget: "_self",
                    }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    resolveItemTitle={(name) => {
                      const item = form.getFieldValue(["ribbonItems", name]);
                      const notice = String(item?.noticeText || "").trim();
                      if (notice) {
                        return notice.length > 32
                          ? `${notice.slice(0, 32)}...`
                          : notice;
                      }
                      return `Notice ${name + 1}`;
                    }}
                    renderItemContent={(fieldName, restField) => (
                      <>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "noticeText"]}
                          label="Notice Text"
                          rules={[
                            {
                              required: true,
                              message: "Notice Text is required",
                            },
                          ]}
                          tooltip="Normal text only; this notice is not a hyperlink."
                        >
                          <Input placeholder="Notice: List of Selected Students — School Scholarship 2026-27" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "actionText"]}
                          label="Link Text"
                          rules={[
                            {
                              required: true,
                              message: "Link Text is required",
                            },
                          ]}
                        >
                          <Input placeholder="View Notice" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "actionUrl"]}
                          label="URL"
                          rules={[{ required: true, message: "URL is required" }]}
                        >
                          <Input placeholder="/get-involved/notices" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[fieldName, "actionTarget"]}
                          label="Target"
                        >
                          <Select options={LINK_TARGET_OPTIONS} />
                        </Form.Item>
                      </>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "colors",
            label: "Colors",
            forceRender: true,
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
