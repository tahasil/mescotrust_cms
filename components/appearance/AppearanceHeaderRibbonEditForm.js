"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Col, Collapse, Form, Input, InputNumber, Row, Select, Spin, Switch, message } from "antd";
import SortableFormList from "@/components/admin/SortableFormList";
import { LINK_TARGET_OPTIONS, normalizeTarget } from "./editorUtils";

function normalizeItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    text: String(item?.text ?? item?.label ?? "").trim(),
    url: String(item?.url ?? item?.href ?? "").trim(),
    target: normalizeTarget(item?.target),
    enabled: item?.enabled !== false,
  }));
}

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
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
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Failed to load Header Ribbon")))
      .then((record) => {
        form.setFieldsValue({
          active: record?.active !== false,
          ribbonAriaLabel: record?.ribbonAriaLabel || "",
          ribbonItems: normalizeItems(record?.ribbonItems),
          ribbonShowNoticeIcon: record?.ribbonShowNoticeIcon !== false,
          ribbonShowLinkArrow: record?.ribbonShowLinkArrow !== false,
          ribbonBackgroundColorKey: record?.ribbonBackgroundColorKey || "Black",
          ribbonTextColorKey: record?.ribbonTextColorKey || "Cream",
          ribbonLinkColorKey: record?.ribbonLinkColorKey || "White",
          ribbonHoverColorKey: record?.ribbonHoverColorKey || "Primary Soft",
          ribbonIconColorKey: record?.ribbonIconColorKey || "Primary Soft",
          ribbonBorderColorKey: record?.ribbonBorderColorKey || "rgba(250, 246, 239, 0.1)",
          ribbonLinkBorderColorKey: record?.ribbonLinkBorderColorKey || "rgba(250, 246, 239, 0.5)",
          ribbonFocusColorKey: record?.ribbonFocusColorKey || "Primary Soft",
          ribbonFontSize: record?.ribbonFontSize ?? 13.5,
          ribbonFontWeight: record?.ribbonFontWeight ?? 550,
          ribbonLineHeight: record?.ribbonLineHeight ?? 1.6,
          ribbonLinkFontWeight: record?.ribbonLinkFontWeight ?? 700,
          ribbonIconSize: record?.ribbonIconSize ?? 16,
          ribbonPaddingY: record?.ribbonPaddingY ?? 9,
          ribbonPaddingX: record?.ribbonPaddingX ?? 24,
          ribbonItemGap: record?.ribbonItemGap ?? 18,
          ribbonNoticeGap: record?.ribbonNoticeGap ?? record?.ribbonInnerGap ?? 8,
          ribbonActionGap: record?.ribbonActionGap ?? record?.ribbonInnerGap ?? 6,
          ribbonHeaderGapDesktop: record?.ribbonHeaderGapDesktop ?? 11.4,
          ribbonHeaderGapMobile: record?.ribbonHeaderGapMobile ?? 9,
          ribbonMobileFontSize: record?.ribbonMobileFontSize ?? 12.5,
          ribbonMobilePaddingY: record?.ribbonMobilePaddingY ?? 8,
          ribbonMobilePaddingX: record?.ribbonMobilePaddingX ?? 16,
          ribbonMobileItemGap: record?.ribbonMobileItemGap ?? 12,
          ribbonHideNoticeIconMobile: record?.ribbonHideNoticeIconMobile !== false,
        });
      })
      .catch((error) => message.error(error?.message || "Failed to load Header Ribbon"))
      .finally(() => setLoading(false));
  }, [dataEndpoint, form]);

  const save = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    const payload = {
      ribbonAriaLabel: String(values.ribbonAriaLabel || "").trim(),
      ribbonItems: normalizeItems(values.ribbonItems),
      ribbonShowNoticeIcon: values.ribbonShowNoticeIcon !== false,
      ribbonShowLinkArrow: values.ribbonShowLinkArrow !== false,
      ribbonBackgroundColorKey: String(values.ribbonBackgroundColorKey || "").trim(),
      ribbonTextColorKey: String(values.ribbonTextColorKey || "").trim(),
      ribbonLinkColorKey: String(values.ribbonLinkColorKey || "").trim(),
      ribbonHoverColorKey: String(values.ribbonHoverColorKey || "").trim(),
      ribbonIconColorKey: String(values.ribbonIconColorKey || "").trim(),
      ribbonBorderColorKey: String(values.ribbonBorderColorKey || "").trim(),
      ribbonLinkBorderColorKey: String(values.ribbonLinkBorderColorKey || "").trim(),
      ribbonFocusColorKey: String(values.ribbonFocusColorKey || "").trim(),
      ribbonFontSize: clamp(values.ribbonFontSize, 10, 24, 13.5),
      ribbonFontWeight: clamp(values.ribbonFontWeight, 300, 900, 550),
      ribbonLineHeight: clamp(values.ribbonLineHeight, 1, 2.4, 1.6),
      ribbonLinkFontWeight: clamp(values.ribbonLinkFontWeight, 300, 900, 700),
      ribbonIconSize: clamp(values.ribbonIconSize, 10, 32, 16),
      ribbonPaddingY: clamp(values.ribbonPaddingY, 0, 30, 9),
      ribbonPaddingX: clamp(values.ribbonPaddingX, 0, 80, 24),
      ribbonItemGap: clamp(values.ribbonItemGap, 0, 60, 18),
      ribbonNoticeGap: clamp(values.ribbonNoticeGap, 0, 30, 8),
      ribbonActionGap: clamp(values.ribbonActionGap, 0, 30, 6),
      ribbonHeaderGapDesktop: clamp(values.ribbonHeaderGapDesktop, 0, 40, 11.4),
      ribbonHeaderGapMobile: clamp(values.ribbonHeaderGapMobile, 0, 40, 9),
      ribbonMobileFontSize: clamp(values.ribbonMobileFontSize, 10, 20, 12.5),
      ribbonMobilePaddingY: clamp(values.ribbonMobilePaddingY, 0, 30, 8),
      ribbonMobilePaddingX: clamp(values.ribbonMobilePaddingX, 0, 60, 16),
      ribbonMobileItemGap: clamp(values.ribbonMobileItemGap, 0, 40, 12),
      ribbonHideNoticeIconMobile: values.ribbonHideNoticeIconMobile !== false,
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

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;

  const colorOptions = [
    { label: "Reference border (10% cream)", value: "rgba(250, 246, 239, 0.1)" },
    { label: "Reference underline (50% cream)", value: "rgba(250, 246, 239, 0.5)" },
    ...themeColorOptions,
  ];
  const colorField = (name, label) => (
    <Form.Item name={name} label={label}>
      <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
    </Form.Item>
  );

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["settings", "items"]}
        items={[
          {
            key: "settings",
            label: "Ribbon Settings",
            children: (
              <>
                <Form.Item name="active" label="Display Header Ribbon" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="ribbonAriaLabel" label="Accessible label"><Input placeholder="Important notice" /></Form.Item>
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="ribbonShowNoticeIcon" label="Show notice icon" valuePropName="checked"><Switch /></Form.Item></Col>
                  <Col span={12}><Form.Item name="ribbonShowLinkArrow" label="Show link arrows" valuePropName="checked"><Switch /></Form.Item></Col>
                </Row>
              </>
            ),
          },
          {
            key: "items",
            label: "Link Text Items",
            children: (
              <Form.List name="ribbonItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Link item"
                    addButtonText="Add link item"
                    defaultAddPayload={{ text: "", url: "", target: "_self", enabled: true }}
                    renderItemContent={(fieldName, rest) => (
                      <>
                        <Form.Item {...rest} name={[fieldName, "text"]} label="Link Text" rules={[{ required: true, message: "Link Text is required" }]}><Input /></Form.Item>
                        <Form.Item {...rest} name={[fieldName, "url"]} label="URL" rules={[{ required: true, message: "URL is required" }]}><Input /></Form.Item>
                        <Form.Item {...rest} name={[fieldName, "target"]} label="Target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                        <Form.Item {...rest} name={[fieldName, "enabled"]} label="Enabled" valuePropName="checked"><Switch /></Form.Item>
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
            children: (
              <>
                {colorField("ribbonBackgroundColorKey", "Background")}
                {colorField("ribbonTextColorKey", "Primary item text")}
                {colorField("ribbonLinkColorKey", "Action link text")}
                {colorField("ribbonHoverColorKey", "Link hover")}
                {colorField("ribbonIconColorKey", "Icons")}
                {colorField("ribbonBorderColorKey", "Bottom border")}
                {colorField("ribbonLinkBorderColorKey", "Link underline")}
                {colorField("ribbonFocusColorKey", "Keyboard focus outline")}
              </>
            ),
          },
          {
            key: "typography-spacing",
            label: "Typography & Spacing",
            children: (
              <Row gutter={16}>
                <Col span={12}><Form.Item name="ribbonFontSize" label="Font size (px)"><InputNumber min={10} max={24} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonFontWeight" label="Text weight"><InputNumber min={300} max={900} step={50} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonLineHeight" label="Line height"><InputNumber min={1} max={2.4} step={0.05} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonLinkFontWeight" label="Link weight"><InputNumber min={300} max={900} step={50} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonIconSize" label="Icon size (px)"><InputNumber min={10} max={32} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonPaddingY" label="Vertical padding (px)"><InputNumber min={0} max={30} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonPaddingX" label="Horizontal padding (px)"><InputNumber min={0} max={80} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonItemGap" label="Item gap (px)"><InputNumber min={0} max={60} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonNoticeGap" label="Notice icon gap (px)"><InputNumber min={0} max={30} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonActionGap" label="Action icon gap (px)"><InputNumber min={0} max={30} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonHeaderGapDesktop" label="Header gap desktop (px)"><InputNumber min={0} max={40} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonHeaderGapMobile" label="Header gap mobile (px)"><InputNumber min={0} max={40} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
              </Row>
            ),
          },
          {
            key: "mobile",
            label: "Mobile Layout",
            children: (
              <Row gutter={16}>
                <Col span={12}><Form.Item name="ribbonMobileFontSize" label="Font size (px)"><InputNumber min={10} max={20} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonMobileItemGap" label="Item gap (px)"><InputNumber min={0} max={40} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonMobilePaddingY" label="Vertical padding (px)"><InputNumber min={0} max={30} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="ribbonMobilePaddingX" label="Horizontal padding (px)"><InputNumber min={0} max={60} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={24}><Form.Item name="ribbonHideNoticeIconMobile" label="Hide notice icon on mobile" valuePropName="checked"><Switch /></Form.Item></Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
});
