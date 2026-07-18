"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const reason = searchParams.get("reason") || "";

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        message.error("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
      <Card title="Admin Login" style={{ width: 360 }}>
        {reason === "role-updated" ? (
          <Alert
            type="info"
            showIcon
            message="Your role or permissions changed"
            description="Please sign in again to continue with your updated access."
            style={{ marginBottom: 16 }}
          />
        ) : null}
        {reason === "account-deactivated" ? (
          <Alert
            type="warning"
            showIcon
            message="Your account is inactive"
            description="Contact an administrator if you need access restored."
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" rules={[{ required: true, message: "Enter your email" }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" type="email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Enter your password" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
