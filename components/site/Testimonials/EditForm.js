"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, InputNumber, message, Spin } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const API_PATH = "/api/theme/Testimonials";

function normalizeItem(it) {
  return {
    quote: it?.quote != null ? String(it.quote).trim() : "",
    imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
    name: it?.name != null ? String(it.name).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    rating: Math.min(5, Math.max(0, parseInt(it?.rating, 10) || 0)),
  };
}

/**
 * Edit form for Testimonials — used in component edit drawer.
 * Loads/saves via ${API_PATH} (generic theme [componentId] → Component.defaultProps).
 */
function TestimonialsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const items = Array.isArray(data.testimonialsItems)
        ? data.testimonialsItems.map(normalizeItem)
        : [{ quote: "", imageUrl: "", name: "", title: "", rating: 5 }];
      form.setFieldsValue({ testimonialsTitle: data.testimonialsTitle ?? "Testimonials", testimonialsItems: items });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const items =
          Array.isArray(data?.testimonialsItems) && data.testimonialsItems.length > 0
            ? data.testimonialsItems.map(normalizeItem)
            : [{ quote: "", imageUrl: "", name: "", title: "", rating: 5 }];
        form.setFieldsValue({ testimonialsTitle: data?.testimonialsTitle ?? "Testimonials", testimonialsItems: items });
      })
      .catch(() => message.error("Failed to load Testimonials"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const items = Array.isArray(values.testimonialsItems)
        ? values.testimonialsItems.map(normalizeItem)
        : [];
      const payload = {
        testimonialsTitle: (values.testimonialsTitle ?? "Testimonials").toString().trim() || "Testimonials",
        testimonialsItems: items,
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
          message.success("Testimonials saved");
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
      <Form.Item name="testimonialsTitle" label="Section title">
        <Input placeholder="Testimonials" />
      </Form.Item>
      <Form.List name="testimonialsItems">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <div
                key={key}
                style={{
                  marginBottom: 24,
                  padding: 16,
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  position: "relative",
                }}
              >
                <div style={{ position: "absolute", top: 16, right: 16 }}>
                  <MinusCircleOutlined
                    onClick={() => remove(name)}
                    style={{ color: "#999", fontSize: 18 }}
                  />
                </div>
                <Form.Item
                  {...restField}
                  name={[name, "quote"]}
                  label="Quote"
                  rules={[{ required: true, message: "Quote is required" }]}
                >
                  <Input.TextArea rows={4} placeholder="Testimonial text" />
                </Form.Item>
                <Form.Item {...restField} name={[name, "imageUrl"]} label="Photo URL">
                  <Input placeholder="https://..." />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "name"]}
                  label="Name"
                  rules={[{ required: true, message: "Name is required" }]}
                >
                  <Input placeholder="Full name" />
                </Form.Item>
                <Form.Item {...restField} name={[name, "title"]} label="Title / Role">
                  <Input placeholder="e.g. Customer Contact Specialist" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "rating"]}
                  label="Star rating (1–5)"
                  initialValue={5}
                >
                  <InputNumber min={1} max={5} placeholder="5" style={{ width: "100%" }} />
                </Form.Item>
              </div>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add({ quote: "", imageUrl: "", name: "", title: "", rating: 5 })} block icon={<PlusOutlined />}>
                Add testimonial
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form>
  );
}

export default forwardRef(TestimonialsEditForm);
