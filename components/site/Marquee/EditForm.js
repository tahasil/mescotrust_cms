"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Row, Col, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

/**
 * Edit form for Marquee — used in page builder drawer or component edit.
 * Exposes update() via ref for drawer header button.
 */
function MarqueeEditForm({ onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const title = theme.marqueeTitle != null ? String(theme.marqueeTitle).trim() : "Our CSR Partners | Awards & Recognition";
        const items = Array.isArray(theme.marqueeItems)
          ? theme.marqueeItems.map((it) => ({
              url: it?.url != null ? String(it.url).trim() : "",
              alt: it?.alt != null ? String(it.alt).trim() : "",
            }))
          : [];
        form.setFieldsValue({ marqueeTitle: title, marqueeItems: items });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, [form]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const title = values.marqueeTitle != null ? String(values.marqueeTitle).trim() : "";
      const rawItems = values.marqueeItems ?? [];
      const items = Array.isArray(rawItems)
        ? rawItems.map((it) => ({
            url: it?.url != null ? String(it.url).trim() : "",
            alt: it?.alt != null ? String(it.alt).trim() : "",
          }))
        : [];
      setSaving(true);
      fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marqueeTitle: title, marqueeItems: items }),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Marquee saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Marquee"))
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
    <>
      <Form form={form} layout="vertical">
        <Form.Item name="marqueeTitle" label="Section title" style={{ marginBottom: 16 }}>
          <Input placeholder="Our CSR Partners | Awards & Recognition" size="large" />
        </Form.Item>
        <Form.List name="marqueeItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={[0, 8]} style={{ marginBottom: 12 }}>
                  <Col span={24}>
                    <Form.Item {...restField} name={[name, "url"]} label="Image URL" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="/images/partner-1.png" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item {...restField} name={[name, "alt"]} label="Alt text">
                      <Input placeholder="Partner" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Col>
                </Row>
              ))}
              <Button type="dashed" onClick={() => add({ url: "", alt: "" })} block icon={<PlusOutlined />} size="small">Add item</Button>
            </>
          )}
        </Form.List>
      </Form>
    </>
  );
}

export default forwardRef(MarqueeEditForm);
