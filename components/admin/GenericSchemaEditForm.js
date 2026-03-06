"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Collapse, message } from "antd";
import {
  renderSchemaField,
  enrichSchema,
  SECTION_SETTINGS_SCHEMA,
  BLOCK_ELEMENT_FIELDS,
} from "./schemaFormUtils";

/**
 * Generic schema-driven edit form – same interface as site component EditForms.
 * Used for any block that has propsSchema (Paragraph, Hero, Buttons, etc.).
 * source="page" → save via onSaveToPage (pages/layout). No API.
 */
function GenericSchemaEditForm(
  {
    source,
    initialData,
    onSaveToPage,
    onSuccess,
    onCancel,
    paletteComponent = null,
    elementKey = null,
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const baseComponent = paletteComponent?.baseComponent ?? "";

  useEffect(() => {
    setLoading(true);
    if (initialData != null) {
      form.setFieldsValue(initialData);
    }
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

  const raw = Array.isArray(paletteComponent?.propsSchema) ? paletteComponent.propsSchema : [];
  if (raw.length === 0 && !elementKey) {
    return (
      <Form form={form} layout="vertical">
        <Form.Item name="text" label="Content">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Collapse
          accordion
          defaultActiveKey={[]}
          items={[
            {
              key: "section-settings",
              label: "Section Settings",
              children: SECTION_SETTINGS_SCHEMA.map((f) => renderSchemaField(f, themeColorOptions)),
            },
          ]}
        />
      </Form>
    );
  }

  let schema = enrichSchema(baseComponent, raw);
  if (elementKey && BLOCK_ELEMENT_FIELDS[baseComponent]?.[elementKey]?.fields) {
    const keys = BLOCK_ELEMENT_FIELDS[baseComponent][elementKey].fields;
    const byKey = Object.fromEntries(schema.map((f) => [f.key, f]));
    schema = keys.map((k) => byKey[k]).filter(Boolean);
  }

  const renderField = (field) => renderSchemaField(field, themeColorOptions);

  const items = [
    ...(schema.length > 0
      ? [
          {
            key: "props",
            label: elementKey ? BLOCK_ELEMENT_FIELDS[baseComponent]?.[elementKey]?.label ?? elementKey : "Content",
            children: <>{schema.map((f) => renderField(f))}</>,
          },
        ]
      : []),
    {
      key: "section-settings",
      label: "Section Settings",
      children: <>{SECTION_SETTINGS_SCHEMA.map((f) => renderField(f))}</>,
    },
  ];

  return (
    <Form form={form} layout="vertical">
      <Collapse accordion defaultActiveKey={[]} items={items} />
    </Form>
  );
}

export default forwardRef(GenericSchemaEditForm);
