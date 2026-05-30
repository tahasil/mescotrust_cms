"use client";

import { useState } from "react";
import { Col, Form, Input, Row, Select, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import styled, { createGlobalStyle } from "styled-components";
import { ThemeButton, getColor } from "@/styles/Theme";

const FORM_KEY = "form-1";
const DEFAULT_SUCCESS_MESSAGE = "Form submitted successfully.";

const GeneratedFormButton = styled(ThemeButton)`
  && {
    background: var(--generated-form-btn-bg) !important;
    color: var(--generated-form-btn-text) !important;
  }

  &&:hover,
  &&:active,
  &&:focus {
    background: var(--generated-form-btn-hover-bg) !important;
    color: var(--generated-form-btn-hover-text) !important;
  }
`;

function isDirectCssColor(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return (
    raw.startsWith("#") ||
    raw.startsWith("rgb(") ||
    raw.startsWith("rgba(") ||
    raw.startsWith("hsl(") ||
    raw.startsWith("hsla(") ||
    raw.startsWith("linear-gradient(") ||
    raw.startsWith("radial-gradient(") ||
    raw.startsWith("conic-gradient(") ||
    raw.startsWith("var(")
  );
}

function resolveThemeColorValue(rawValue, fallbackKey = "") {
  const value = String(rawValue || "").trim();
  if (!value) return fallbackKey ? getColor(fallbackKey) : "";
  if (isDirectCssColor(value)) return value;
  return getColor(value) || value;
}

const GeneratedWorkFormGlobalStyle = createGlobalStyle`
  .generated-work-form input.ant-input {
    height: 56px !important;
    min-height: 56px !important;
    line-height: 56px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-radius: 999px !important;
  }

  .generated-work-form .ant-select-single {
    height: 56px !important;
  }
  .generated-work-form .ant-select-single .ant-select-selector {
    height: 56px !important;
    min-height: 56px !important;
    border-radius: 999px !important;
    border-color: #e5e7eb !important;
    background: #ffffff !important;
    display: flex;
    align-items: center;
    box-shadow: none !important;
    padding: 0 44px 0 14px !important;
  }
  .generated-work-form .ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
    padding-right: 40px !important;
  }
  .generated-work-form .ant-select-single .ant-select-selector .ant-select-selection-wrap {
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
  }
  .generated-work-form .ant-select-selection-placeholder,
  .generated-work-form .ant-select-selection-item {
    color: #111827 !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    font-size: 16px;
  }
  .generated-work-form .ant-select-arrow {
    color: #334155 !important;
    font-size: 16px !important;
    inset-inline-end: 16px !important;
    right: 16px !important;
    inset-block-start: 50% !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    height: auto !important;
    display: flex !important;
    align-items: center !important;
  }
  .generated-work-form .generated-work-form__chevron {
    transition: transform 0.2s ease;
    display: block;
    line-height: 1;
  }
  .generated-work-form .ant-select-open .generated-work-form__chevron {
    transform: rotate(180deg);
  }
  .generated-work-form .ant-form-item-with-help {
    margin-bottom: 30px !important;
  }
  .generated-work-form .ant-form-item-explain {
    position: relative;
    z-index: 2;
    min-height: 20px;
  }
  .generated-work-form .ant-form-item-explain-error {
    line-height: 20px !important;
    margin-top: 4px !important;
  }
  .generated-work-form-select-dropdown {
    border-radius: 22px !important;
    border: 1px solid #e6ebf0 !important;
    box-shadow: 0 12px 28px rgba(15, 47, 58, 0.12) !important;
    overflow: hidden !important;
    padding: 8px 0 !important;
  }
  .generated-work-form-select-dropdown .ant-select-item {
    min-height: 52px !important;
    border-radius: 0 !important;
    display: flex !important;
    align-items: center !important;
    padding: 12px 28px !important;
    font-size: 16px;
    color: #1e293b !important;
  }
  .generated-work-form-select-dropdown
    .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background: #f8fafc !important;
  }
  .generated-work-form-select-dropdown
    .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background: transparent !important;
    font-weight: 500 !important;
  }
`;

export default function Form1Preview({
  ui = {},
  successMessage = DEFAULT_SUCCESS_MESSAGE,
  previewOnly = false,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const styles = {
    labelColor:
      resolveThemeColorValue(ui?.labelColorKey, "") ||
      resolveThemeColorValue(ui?.labelColor, "") ||
      "#334155",
    buttonBg:
      resolveThemeColorValue(ui?.buttonBgColorKey, "") ||
      resolveThemeColorValue(ui?.buttonBg, "secondary") ||
      "#cf372f",
    buttonTextColor:
      resolveThemeColorValue(ui?.buttonTextColorKey, "") ||
      resolveThemeColorValue(ui?.buttonTextColor, "primary") ||
      "#ffffff",
    buttonHoverBg:
      resolveThemeColorValue(ui?.buttonHoverBgColorKey, "") ||
      resolveThemeColorValue(ui?.buttonHoverBg, "white") ||
      "#ffffff",
    buttonHoverTextColor:
      resolveThemeColorValue(ui?.buttonHoverTextColorKey, "") ||
      resolveThemeColorValue(ui?.buttonHoverTextColor, "primary") ||
      "#cf372f",
    buttonRadius: Number(ui?.buttonRadius ?? 24),
  };

  const commonControlStyle = {
    background: "#ffffff",
    borderColor: "#e5e7eb",
    color: "#111827",
    borderRadius: 999,
    height: 56,
    minHeight: 56,
    lineHeight: "56px",
    paddingBlock: 0,
    paddingInline: 14,
    boxShadow: "none",
  };

  const textAreaStyle = {
    background: "#ffffff",
    borderColor: "#e5e7eb",
    color: "#111827",
    borderRadius: 22,
    padding: "12px 14px",
    boxShadow: "none",
  };

  const buttonBgValue = String(styles.buttonBg || "").trim();
  const isGradientButton = /gradient\(/i.test(buttonBgValue);
  const buttonVars = {
    "--generated-form-btn-bg": styles.buttonBg,
    "--generated-form-btn-text": styles.buttonTextColor,
    "--generated-form-btn-hover-bg": styles.buttonHoverBg,
    "--generated-form-btn-hover-text": styles.buttonHoverTextColor,
  };
  const buttonStyle = {
    display: "block",
    margin: "8px auto 0",
    borderRadius: `${Math.max(0, styles.buttonRadius)}px`,
    minWidth: 120,
    minHeight: 44,
    fontWeight: 700,
    boxShadow: "0 3px 10px rgba(247, 183, 51, 0.45)",
    borderColor: isGradientButton ? "transparent" : buttonBgValue,
    background: isGradientButton ? undefined : buttonBgValue,
    backgroundImage: isGradientButton ? buttonBgValue : undefined,
    cursor: previewOnly ? "not-allowed" : "pointer",
  };

  const handleFinish = async (values) => {
    if (previewOnly) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/public/forms/${encodeURIComponent(FORM_KEY)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: values,
            source: "generated-form",
            page: typeof window !== "undefined" ? window.location.pathname : "",
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Submission failed");
        return;
      }
      message.success(
        data?.message || successMessage || DEFAULT_SUCCESS_MESSAGE,
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("new-form-submission"));
      }
      form.resetFields();
    } catch {
      message.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Form
        form={form}
        className="generated-work-form"
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="name"
              // label={<span style={{ color: styles.labelColor }}>Name</span>}
              rules={[{ required: true, message: "Name is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Name*" style={commonControlStyle} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="phone"
              // label={<span style={{ color: styles.labelColor }}>Phone</span>}
              rules={[{ required: true, message: "Phone is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Phone*" style={commonControlStyle} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="email"
              // label={<span style={{ color: styles.labelColor }}>Email</span>}
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter valid email" },
              ]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Email*" style={commonControlStyle} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="profileType"
              // label={<span style={{ color: styles.labelColor }}>Type</span>}
              rules={[{ required: true, message: "Type is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                placeholder="Individual / Organization"
                style={{ width: "100%" }}
                suffixIcon={
                  <DownOutlined className="generated-work-form__chevron" />
                }
                dropdownClassName="generated-work-form-select-dropdown"
                popupClassName="generated-work-form-select-dropdown"
                options={[
                  { label: "Individual", value: "Individual" },
                  { label: "Organization", value: "Organization" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="expertise"
              // label={<span style={{ color: styles.labelColor }}>Expertise</span>}
              style={{ marginBottom: 12 }}
            >
              <Input
                placeholder="Your area of expertise / work"
                style={commonControlStyle}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name="message"
              // label={<span style={{ color: styles.labelColor }}>Message</span>}
              style={{ marginBottom: 12 }}
            >
              <Input.TextArea
                placeholder="Message"
                autoSize={{ minRows: 4, maxRows: 6 }}
                style={textAreaStyle}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <GeneratedFormButton
              type="default"
              htmlType={previewOnly ? "button" : "submit"}
              style={{ ...buttonStyle, ...buttonVars }}
              loading={previewOnly ? false : submitting}
            >
              Submit
            </GeneratedFormButton>
          </Col>
        </Row>
      </Form>
      <GeneratedWorkFormGlobalStyle />
    </>
  );
}
