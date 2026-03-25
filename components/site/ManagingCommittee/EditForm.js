"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Collapse, message, Spin } from "antd";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/ManagingCommittee";
const PREFIX = "managingCommittee";

function applyFormValues(form, data) {
  form.setFieldsValue({
    managingCommitteeMainTitle: data?.managingCommitteeMainTitle ?? "Managing Committee",
    managingCommitteeParagraph: data?.managingCommitteeParagraph ?? "",
    managingCommitteeImageUrl: data?.managingCommitteeImageUrl ?? "/images/good-governance-2.png",
    managingCommitteeImageAlt: data?.managingCommitteeImageAlt ?? "Managing Committee",
    managingCommitteeTitleColorKey: data?.managingCommitteeTitleColorKey ?? "",
    managingCommitteeTextColorKey: data?.managingCommitteeTextColorKey ?? "",
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function ManagingCommitteeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      .catch(() => message.error("Failed to load Managing Committee"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        managingCommitteeMainTitle: values.managingCommitteeMainTitle ?? "",
        managingCommitteeParagraph: values.managingCommitteeParagraph ?? "",
        managingCommitteeImageUrl: values.managingCommitteeImageUrl ?? "",
        managingCommitteeImageAlt: values.managingCommitteeImageAlt ?? "",
        managingCommitteeTitleColorKey: values.managingCommitteeTitleColorKey ?? "",
        managingCommitteeTextColorKey: values.managingCommitteeTextColorKey ?? "",
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
        .then(() => { message.success("Managing Committee saved"); onSuccess?.(); })
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
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ManagingCommittee")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="managingCommitteeParagraph" label="Paragraph">
                  <RichTextEditor placeholder="Enter paragraph text..." />
                </Form.Item>
                <Form.Item name="managingCommitteeImageUrl" label="Image URL">
                  <Input placeholder="/images/good-governance-2.png" size="large" />
                </Form.Item>
                <Form.Item name="managingCommitteeImageAlt" label="Image Alt Text">
                  <Input placeholder="Managing Committee" size="large" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ManagingCommitteeEditForm);
