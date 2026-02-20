"use client";

import { useState } from "react";
import { Form, Input, Button, message } from "antd";

const { TextArea } = Input;

export default function ContactForm({ page, source }) {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message,
          page: page || "",
          source: source || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to send");
        return;
      }
      message.success("Message sent. We will get back to you soon.");
      document.querySelector("form")?.resetFields();
    } catch (e) {
      message.error("Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form name="contact" onFinish={onFinish} layout="vertical" style={{ maxWidth: 480 }}>
      <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter your name" }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}>
        <Input type="email" />
      </Form.Item>
      <Form.Item name="message" label="Message" rules={[{ required: true, message: "Please enter your message" }]}>
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Send
        </Button>
      </Form.Item>
    </Form>
  );
}
