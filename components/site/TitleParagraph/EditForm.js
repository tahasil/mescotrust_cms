"use client";

import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { getColor } from "@/styles/Theme";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import SortableFormList from "@/components/admin/SortableFormList";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/TitleParagraph";
const PREFIX = "titleParagraph";

function normalizeParagraph(it) {
  return {
    text: typeof it === "string" ? it.trim() : (it?.text != null ? String(it.text).trim() : ""),
  };
}

function applyFormValues(form, data) {
  form.setFieldsValue({
    titleParagraphMainTitle: data?.titleParagraphMainTitle ?? "",
    titleParagraphSubTitle: data?.titleParagraphSubTitle ?? "",
    titleParagraphTitleEnabled: data?.titleParagraphTitleEnabled !== false,
    titleParagraphSubTitleEnabled: data?.titleParagraphSubTitleEnabled ?? false,
    titleParagraphTitleColorKey: data?.titleParagraphTitleColorKey ?? "",
    titleParagraphSubTitleColorKey: data?.titleParagraphSubTitleColorKey ?? "",
    titleParagraphTextColorKey: data?.titleParagraphTextColorKey ?? "",
    titleParagraphContent: data?.titleParagraphContent ?? "",
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function TitleParagraphEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState(null);
  const watchedTextColorKey = Form.useWatch("titleParagraphTextColorKey", form);
  const editorTextColor = useMemo(() => {
    const key = (watchedTextColorKey ?? "").toString().trim();
    return key ? getColor(key) : undefined;
  }, [watchedTextColorKey]);

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
      .catch(() => message.error("Failed to load Title & Paragraph"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        titleParagraphMainTitle: values.titleParagraphMainTitle ?? "",
        titleParagraphSubTitle: values.titleParagraphSubTitle ?? "",
        titleParagraphTitleEnabled: values.titleParagraphTitleEnabled !== false,
        titleParagraphSubTitleEnabled: values.titleParagraphSubTitleEnabled ?? false,
        titleParagraphTitleColorKey: values.titleParagraphTitleColorKey ?? "",
        titleParagraphSubTitleColorKey: values.titleParagraphSubTitleColorKey ?? "",
        titleParagraphTextColorKey: values.titleParagraphTextColorKey ?? "",
        titleParagraphContent: values.titleParagraphContent ?? "",
        ...getManageSectionPayload(PREFIX, values),
      };
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
        .then(() => { message.success("Title & Paragraph saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("TitleParagraph")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Form.Item name="titleParagraphContent">
                <RichTextEditor placeholder="Enter content..." />
              </Form.Item>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(TitleParagraphEditForm);
