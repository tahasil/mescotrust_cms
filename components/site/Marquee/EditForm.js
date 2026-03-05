"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Row, Col, Card, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

/**
 * Edit form for Marquee — used in page builder drawer or component edit.
 * When source="page": data from block.props (pages collection); save updates layout only, not components collection.
 * Exposes update() via ref for drawer header button.
 */
function MarqueeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const title = data.marqueeTitle != null ? String(data.marqueeTitle).trim() : "";
      const items = Array.isArray(data.marqueeItems)
        ? data.marqueeItems.map((it) => ({
            url: it?.url != null ? String(it.url).trim() : "",
            alt: it?.alt != null ? String(it.alt).trim() : "",
          }))
        : [];
      setInitialData({ marqueeTitle: title, marqueeItems: items });
      setLoading(false);
      return;
    }
    setInitialData(null);
    fetch("/api/theme/marquee", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const title = data.marqueeTitle != null ? String(data.marqueeTitle).trim() : "Our CSR Partners | Awards & Recognition";
        const items = Array.isArray(data.marqueeItems)
          ? data.marqueeItems.map((it) => ({
              url: it?.url != null ? String(it.url).trim() : "",
              alt: it?.alt != null ? String(it.alt).trim() : "",
            }))
          : [];
        setInitialData({ marqueeTitle: title, marqueeItems: items });
      })
      .catch(() => message.error("Failed to load Marquee"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

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
      const payload = { marqueeTitle: title, marqueeItems: items };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/marquee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
