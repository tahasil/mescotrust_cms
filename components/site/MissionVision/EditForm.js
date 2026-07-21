"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Collapse, Form, Input, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/MissionVision";
const PREFIX = "missionVision";
const DEFAULTS = {
  missionVisionVisionTitle: "Vision",
  missionVisionVisionDescription: "To help the underprivileged and marginalised live a better tomorrow through various interventions.",
  missionVisionMissionTitle: "Mission",
  missionVisionMissionDescription: "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.",
};
const COLOR_FIELDS = ["missionVisionCardBgColorKey", "missionVisionCardBorderColorKey", "missionVisionIconColorKey", "missionVisionTitleColorKey", "missionVisionTextColorKey"];
const clean = (value) => value == null ? "" : String(value).trim();

function MissionVisionEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: suppliedColors = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(suppliedColors);
  const fetchedRef = useRef(false);
  const isPageBlock = source === "page";
  const applyValues = (data = {}) => form.setFieldsValue({
    ...DEFAULTS,
    ...Object.fromEntries(Object.keys(DEFAULTS).map((field) => [field, data[field] != null ? clean(data[field]) : DEFAULTS[field]])),
    ...Object.fromEntries(COLOR_FIELDS.map((field) => [field, clean(data[field])])),
    ...getManageSectionInitialValues(PREFIX, data),
  });
  const applyColors = (theme = {}) => {
    const names = [...new Set([
      ...Object.keys(theme.themePalette || {}),
      ...(Array.isArray(theme.colors) ? theme.colors.map((item) => item?.name).filter(Boolean) : []),
    ])].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  };
  useEffect(() => { if (suppliedColors.length) setThemeColorOptions(suppliedColors); }, [suppliedColors]);
  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp || {});
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}).then(applyColors).catch(() => {}).finally(() => setLoading(false));
      } else setLoading(false);
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((r) => r.ok ? r.json() : {}),
      fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}),
    ]).then(([data, theme]) => { applyValues(data); applyColors(theme); })
      .catch(() => message.error("Failed to load Mission & Vision"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);
  const payloadFrom = (values) => ({
    ...Object.fromEntries([...Object.keys(DEFAULTS), ...COLOR_FIELDS].map((field) => [field, clean(values[field])])),
    ...getManageSectionPayload(PREFIX, values),
  });
  const handleUpdate = () => form.validateFields().then(() => {
    const payload = payloadFrom(form.getFieldsValue(true));
    if (isPageBlock && onSaveToPage) { onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return; }
    setSaving(true);
    fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => r.ok ? undefined : r.json().then((data) => Promise.reject(data)))
      .then(() => { message.success("Mission & Vision saved"); onSuccess?.(); })
      .catch((error) => message.error(error?.error || "Failed to save"))
      .finally(() => setSaving(false));
  }).catch(() => {});
  useImperativeHandle(ref, () => ({ update: handleUpdate }));
  if (loading || saving) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  return (
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={["content"]} items={[
        { key: "section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} /> },
        { key: "content", label: "Content", children: <>
          <Form.Item name="missionVisionVisionTitle" label="Vision title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="missionVisionVisionDescription" label="Vision description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="missionVisionMissionTitle" label="Mission title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="missionVisionMissionDescription" label="Mission description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </> },
        { key: "colors", label: "Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("MissionVision")} /> },
      ]} />
    </Form>
  );
}

export default forwardRef(MissionVisionEditForm);
