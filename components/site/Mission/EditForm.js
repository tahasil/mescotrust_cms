"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Mission";
const PREFIX = "mission";

const CONTENT_FIELDS = [
  "missionSubTitle", "missionTitle", "missionImage",
  "missionCardRadius", "missionCardPadding",
  "missionSubTitleColorKey", "missionMainTitleColorKey",
];

function applyFormValues(form, data) {
  form.setFieldsValue({
    missionSubTitle: data?.missionSubTitle ?? "Mission",
    missionTitle: data?.missionTitle ?? "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education & health.",
    missionImage: data?.missionImage ?? "/images/mission.png",
    missionCardRadius: data?.missionCardRadius ?? 40,
    missionCardPadding: data?.missionCardPadding ?? 40,
    missionSubTitleColorKey: data?.missionSubTitleColorKey ?? "",
    missionMainTitleColorKey: data?.missionMainTitleColorKey ?? "",
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function MissionEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyFormValues(form, initialDataProp ?? {});
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        applyFormValues(form, data);
      })
      .catch(() => message.error("Failed to load Mission"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {};
      CONTENT_FIELDS.forEach((k) => {
        payload[k] = values[k] != null ? String(values[k]).trim() : "";
      });
      Object.assign(payload, getManageSectionPayload(PREFIX, values));

      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Mission saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "content", "card-settings"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Mission")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="missionSubTitle" label="Subtitle" rules={[{ required: true }]}>
                  <Input placeholder="Mission" size="large" />
                </Form.Item>
                <Form.Item name="missionTitle" label="Main title" rules={[{ required: true }]}>
                  <Input.TextArea placeholder="Mission description" rows={3} size="large" />
                </Form.Item>
                <Form.Item name="missionImage" label="Image URL">
                  <MediaPickerInput placeholder="/images/mission.png" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "card-settings",
            label: "Card Settings",
            children: (
              <>
                <Form.Item name="missionCardRadius" label="Border radius (px)">
                  <InputNumber placeholder="40" min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="missionCardPadding" label="Padding (px)">
                  <InputNumber placeholder="40" min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(MissionEditForm);
