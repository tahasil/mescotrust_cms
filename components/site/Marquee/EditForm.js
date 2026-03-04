"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Row, Col, Card, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

/**
 * Edit form for Marquee — used in page builder drawer or component edit.
 * Exposes update() via ref for drawer header button.
 */
function MarqueeEditForm({ onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    setLoading(true);
    setInitialData(null);
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
        setInitialData({ marqueeTitle: title, marqueeItems: items });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialData}
        key="marquee-edit-form"
      >
        <Form.Item name="marqueeTitle" label="Section title" style={{ marginBottom: 16 }}>
          <Input placeholder="Our CSR Partners | Awards & Recognition" size="large" />
        </Form.Item>
        <Form.List name="marqueeItems">
          {(fields, { add, remove, move }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  title={`Item ${name + 1}`}
                  style={{ marginBottom: 12 }}
                  extra={
                    <>
                      <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={name === 0} onClick={() => move(name, name - 1)} title="Move up" />
                      <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={name === fields.length - 1} onClick={() => move(name, name + 1)} title="Move down" />
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col span={14}>
                      <Form.Item {...restField} name={[name, "url"]} label="Image URL" rules={[{ required: true, message: "Required" }]}>
                        <Input placeholder="/images/partner-1.png" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item {...restField} name={[name, "alt"]} label="Alt text">
                        <Input placeholder="Partner" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
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
