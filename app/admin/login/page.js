"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Form, Input, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import styles from "./page.module.css";

const DEFAULT_THEME = {
  adminLogoUrl: "/uploads/1772597551416_logo.webp",
  adminTextColor: "#282a3e",
  adminBorderColor: "rgba(42, 40, 62, 0.14)",
  adminCtaBgColor: "#2a283e",
  adminCtaTextColor: "#ffffff",
  adminCtaHoverBgColor: "",
  adminCtaHoverTextColor: "",
};

const DEFAULT_LOGIN_IMAGE = "/uploads/1773056632193_slider-1.webp";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const reason = searchParams.get("reason") || "";

  useEffect(() => {
    let active = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data || typeof data !== "object") return;
        setTheme((current) => ({
          ...current,
          ...Object.fromEntries(
            Object.keys(DEFAULT_THEME)
              .filter((key) => data[key] !== undefined && data[key] !== "")
              .map((key) => [key, data[key]]),
          ),
        }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

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

  const pageStyle = {
    "--login-text": theme.adminTextColor,
    "--login-border": theme.adminBorderColor,
    "--login-button": theme.adminCtaBgColor,
    "--login-button-text": theme.adminCtaTextColor,
    "--login-button-hover":
      theme.adminCtaHoverBgColor || theme.adminCtaBgColor,
    "--login-button-hover-text":
      theme.adminCtaHoverTextColor || theme.adminCtaTextColor,
  };

  return (
    <main className={styles.page} style={pageStyle}>
      <section className={styles.loginShell}>
        <div
          className={styles.visualPanel}
          aria-hidden="true"
          style={{ backgroundImage: `url(${JSON.stringify(DEFAULT_LOGIN_IMAGE)})` }}
        />

        <div className={styles.formPanel}>
          <div className={styles.formWrap}>
            {theme.adminLogoUrl ? (
              <div className={styles.logoArea}>
                <div
                  className={styles.logo}
                  role="img"
                  aria-label="Admin logo"
                  style={{ backgroundImage: `url(${JSON.stringify(theme.adminLogoUrl)})` }}
                />
              </div>
            ) : null}

            <div className={styles.headingBlock}>
              <p>Please enter your details to sign in to your account</p>
            </div>

            {reason === "role-updated" ? (
              <Alert
                type="info"
                showIcon
                message="Your role or permissions changed"
                description="Please sign in again to continue with your updated access."
                className={styles.alert}
              />
            ) : null}
            {reason === "account-deactivated" ? (
              <Alert
                type="warning"
                showIcon
                message="Your account is inactive"
                description="Contact an administrator if you need access restored."
                className={styles.alert}
              />
            ) : null}

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              className={styles.form}
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: "Enter your email" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Enter your password" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Form.Item className={styles.submitItem}>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>

        <div className={styles.decorativeRings} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
