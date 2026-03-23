"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/AnimationsText";
const PREFIX = "animationsText";

function normalizeParagraph(p) {
  if (typeof p === "string") return { text: p.trim() };
  return { text: p?.text != null ? String(p.text).trim() : "" };
}

/**
 * Edit form for AnimationsText — used in component edit drawer.
 * Title & Colors: font settings + text colors.
 * Content: paragraphs list (repeater).
 */
function AnimationsTextEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  function applyFormValues(data) {
    const rawParagraphs = data?.animationsTextParagraphs;
    const paragraphs =
      Array.isArray(rawParagraphs) && rawParagraphs.length > 0
        ? rawParagraphs.map(normalizeParagraph)
        : [normalizeParagraph("")];
    form.setFieldsValue({
      animationsTextFontSize: data?.animationsTextFontSize != null ? Number(data.animationsTextFontSize) : 20,
      animationsTextLineHeight: data?.animationsTextLineHeight != null ? Number(data.animationsTextLineHeight) : 34,
      animationsTextFontWeight: data?.animationsTextFontWeight != null ? Number(data.animationsTextFontWeight) : 500,
      animationsTextOpacity: data?.animationsTextOpacity != null ? Number(data.animationsTextOpacity) : 1,
      animationsTextLightColorKey: data?.animationsTextLightColorKey != null ? String(data.animationsTextLightColorKey).trim() : "",
      animationsTextDarkColorKey: data?.animationsTextDarkColorKey != null ? String(data.animationsTextDarkColorKey).trim() : "",
      animationsTextParagraphs: paragraphs,
      ...getManageSectionInitialValues(PREFIX, data),
    });
  }

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(data);
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
        applyFormValues(data);
      })
      .catch(() => message.error("Failed to load Animations Text"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.animationsTextParagraphs ?? [];
      const paragraphs = Array.isArray(rawItems) ? rawItems.map(normalizeParagraph) : [];
      const payload = {
        animationsTextFontSize: values.animationsTextFontSize != null ? Number(values.animationsTextFontSize) : 20,
        animationsTextLineHeight: values.animationsTextLineHeight != null ? Number(values.animationsTextLineHeight) : 34,
        animationsTextFontWeight: values.animationsTextFontWeight != null ? Number(values.animationsTextFontWeight) : 500,
        animationsTextOpacity: values.animationsTextOpacity != null ? Number(values.animationsTextOpacity) : 1,
        animationsTextLightColorKey: values.animationsTextLightColorKey != null ? String(values.animationsTextLightColorKey).trim() : "",
        animationsTextDarkColorKey: values.animationsTextDarkColorKey != null ? String(values.animationsTextDarkColorKey).trim() : "",
        animationsTextParagraphs: paragraphs,
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
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Animations Text saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("AnimationsText")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Form.List name="animationsTextParagraphs">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Paragraph"
                    addButtonText="Add paragraph"
                    defaultAddPayload={normalizeParagraph("")}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "text"]}
                            label="Paragraph text"
                            rules={[{ required: true, message: "Text is required" }]}
                          >
                            <Input.TextArea rows={4} placeholder="Enter paragraph text..." size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(AnimationsTextEditForm);
