"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Collapse, Button, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { renderSchemaField, SECTION_SETTINGS_SCHEMA } from "./schemaFormUtils";

/**
 * Section block edit form – same interface as other EditForms.
 * Renders section settings (background, padding) + inner blocks list with Edit/Remove/Add.
 */
function SectionEditForm(
  {
    source,
    initialData,
    onSaveToPage,
    onSuccess,
    onCancel,
    paletteComponent,
    innerBlocks = [],
    onEditInner,
    onRemoveInner,
    onAddInner,
    fullPalette = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [themeColorOptions, setThemeColorOptions] = useState([]);

  useEffect(() => {
    if (initialData != null) form.setFieldsValue(initialData);
    fetch("/api/theme")
      .then((r) => (r.ok ? r.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const opts = Object.entries(palette)
          .filter(([, v]) => v != null && String(v).trim() !== "")
          .map(([k, v]) => ({ label: k, value: String(v).trim() }));
        if (Array.isArray(theme?.colors))
          theme.colors.forEach((c) => {
            if (c?.name && c.value != null) opts.push({ label: c.name, value: String(c.value) });
          });
        setThemeColorOptions(opts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [form, initialData]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      if (source === "page" && onSaveToPage) {
        onSaveToPage(values);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      onSuccess?.();
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Loading…</div>;
  }

  const sectionSettingsFields = [
    { key: "backgroundColor", type: "color", label: "Background color" },
    { key: "padding", type: "text", label: "Padding (e.g. 2rem 1rem)" },
  ];

  const items = [
    {
      key: "section-settings",
      label: "Section settings",
      children: (
        <>
          {sectionSettingsFields.map((f) => renderSchemaField(f, themeColorOptions))}
        </>
      ),
    },
    {
      key: "section-content",
      label: "Content – add elements inside this section",
      children: (
        <div style={{ marginBottom: 12 }}>
          {(Array.isArray(innerBlocks) ? innerBlocks : []).map((inner, idx) => {
            const comp = fullPalette.find((c) => c.baseComponent === inner.baseComponent);
            const displayName = comp?.displayName || inner.baseComponent;
            return (
              <div
                key={inner.instanceId || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "#fafafa",
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                <span style={{ flex: 1, fontSize: 13 }}>{displayName}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => typeof onEditInner === "function" && onEditInner(idx)}
                >
                  Edit
                </Button>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => typeof onRemoveInner === "function" && onRemoveInner(idx)}
                >
                  Delete
                </Button>
              </div>
            );
          })}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => typeof onAddInner === "function" && onAddInner()}
            style={{ marginTop: 8 }}
          >
            Add element (text, image, icon…)
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Form form={form} layout="vertical">
      <Collapse accordion defaultActiveKey={["section-settings", "section-content"]} items={items} />
    </Form>
  );
}

export default forwardRef(SectionEditForm);
