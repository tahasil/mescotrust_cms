"use client";

import { useMemo, useState } from "react";
import { Col, Form, Input, Row, Select, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import styled, { createGlobalStyle } from "styled-components";
import { ThemeButton, getColor } from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";
import { isValidMapEmbedInput, normalizeMapEmbedInput } from "@/lib/mapEmbed";

const DEFAULT_FORM_KEY = "form-4";
const DEFAULT_SUCCESS_MESSAGE = "Form submitted successfully.";
const DEFAULT_LEFT_CONTENT_HTML =
  "<p>If you would like to get involved or collaborate with us, please register your interest here and we will get back to you.</p>";
const DEFAULT_MAP_EMBED_URL =
  "https://maps.google.com/maps?q=Karnataka%20Bangalore&t=&z=14&ie=UTF8&iwloc=&output=embed";

const ContactUsSubmitButton = styled(ThemeButton)`
  && {
    width: 100%;
    min-height: 56px;
    border: none !important;
    border-radius: var(--contact-us-btn-radius, 999px) !important;
    box-shadow: 0 8px 24px rgba(251, 176, 64, 0.35) !important;
    font-size: 20px !important;
    font-weight: 600 !important;
    line-height: 1 !important;
    background: var(--contact-us-btn-bg) !important;
    color: var(--contact-us-btn-text) !important;
  }

  &&:hover,
  &&:active,
  &&:focus {
    background: var(--contact-us-btn-hover-bg) !important;
    color: var(--contact-us-btn-hover-text) !important;
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

function toFiniteNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
}

const ContactUsFormGlobalStyle = createGlobalStyle`
  .contact-us-figma-layout {
    width: 100%;
  }

  .contact-us-figma-left {
    width: 100%;
  }

  .contact-us-rich-content {
    width: 100%;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .contact-us-rich-content p {
    margin: 0 0 var(--contact-us-left-paragraph-gap, 16px);
  }

  .contact-us-rich-content p:last-child {
    margin-bottom: 0;
  }

  .contact-us-rich-content a {
    color: inherit;
  }

  .contact-us-map-note {
    margin-top: 8px;
    color: #a66d00;
    font-size: 12px;
    line-height: 1.5;
  }

  .contact-us-map-frame {
    width: 100%;
    overflow: hidden;
    background: #f8fafc;
  }

  .contact-us-map-frame iframe {
    width: 100%;
    height: var(--contact-us-map-h-desktop, 370px);
    border: none;
    display: block;
  }

  .contact-us-figma-form .ant-form-item {
    margin-bottom: 14px !important;
  }

  .contact-us-figma-form .ant-form-item-with-help {
    margin-bottom: 28px !important;
  }

  .contact-us-figma-form .ant-form-item-explain {
    margin-top: 5px;
    min-height: 16px;
    font-size: 13px;
  }

  .contact-us-figma-form input.ant-input {
    height: 56px !important;
    min-height: 56px !important;
    line-height: 56px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-radius: 999px !important;
  }

  .contact-us-figma-form .ant-select-single {
    height: 56px !important;
  }

  .contact-us-figma-form .ant-select-single .ant-select-selector {
    height: 56px !important;
    min-height: 56px !important;
    border-radius: 999px !important;
    border-color: #d8dee6 !important;
    background: #ffffff !important;
    padding: 0 44px 0 20px !important;
    box-shadow: none !important;
    display: flex;
    align-items: center;
  }

  .contact-us-figma-form .ant-select-single .ant-select-selection-wrap {
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
  }

  .contact-us-figma-form .ant-select-selection-item,
  .contact-us-figma-form .ant-select-selection-placeholder {
    display: flex !important;
    align-items: center !important;
    height: 100%;
    font-size: 17px;
    color: #2b2b2b !important;
  }

  .contact-us-figma-form .ant-select-arrow {
    inset-inline-end: 20px !important;
    top: 50% !important;
    margin-top: 0 !important;
    transform: translateY(-50%) !important;
    color: #2d2d2d !important;
  }

  .contact-us-figma-form .contact-us-figma-form__chevron {
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  .contact-us-figma-form .ant-select-open .contact-us-figma-form__chevron {
    transform: rotate(180deg);
  }

  .contact-us-figma-select-dropdown {
    border-radius: 20px !important;
    overflow: hidden;
    border: 1px solid #d8dee6 !important;
    box-shadow: 0 12px 28px rgba(14, 34, 47, 0.15) !important;
  }

  .contact-us-figma-select-dropdown .ant-select-item {
    min-height: 48px;
    display: flex;
    align-items: center;
    font-size: 16px;
    padding: 10px 20px;
  }

  @media (max-width: 991px) {
    .contact-us-map-frame iframe {
      height: var(--contact-us-map-h-tablet, 300px);
    }
  }

  @media (max-width: 767px) {
    .contact-us-figma-layout .ant-row {
      row-gap: 22px !important;
    }

    .contact-us-rich-content p {
      margin-bottom: calc(var(--contact-us-left-paragraph-gap, 16px) * 0.9);
    }

    .contact-us-map-frame iframe {
      height: var(--contact-us-map-h-mobile, 260px);
    }

    .contact-us-figma-form .ant-form-item {
      margin-bottom: 12px !important;
    }

    .contact-us-figma-form .ant-form-item-with-help {
      margin-bottom: 22px !important;
    }

    .contact-us-figma-form .ant-select-single,
    .contact-us-figma-form .ant-select-single .ant-select-selector {
      height: 50px !important;
      min-height: 50px !important;
    }

    .contact-us-figma-form input.ant-input {
      height: 50px !important;
      min-height: 50px !important;
      line-height: 50px !important;
    }
  }
`;

/**
 * Contact Us form preview + runtime renderer.
 * Shortcode: [form id="form-4"]
 * Default Form Key: form-4
 */
export default function ContactUsPreview({
  ui = {},
  successMessage = DEFAULT_SUCCESS_MESSAGE,
  previewOnly = false,
  formKey = DEFAULT_FORM_KEY,
  source = "generated-form",
  page = "",
  mapEmbedUrl = "",
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const activeFormKey = String(formKey || "").trim() || DEFAULT_FORM_KEY;

  const styles = useMemo(
    () => ({
      buttonBg:
        resolveThemeColorValue(ui?.buttonBgColorKey, "") ||
        resolveThemeColorValue(
          ui?.buttonBg,
          "linear-gradient(90deg, #fdd272 0%, #fbb040 100%)",
        ) ||
        "linear-gradient(90deg, #fdd272 0%, #fbb040 100%)",
      buttonTextColor:
        resolveThemeColorValue(ui?.buttonTextColorKey, "") ||
        resolveThemeColorValue(ui?.buttonTextColor, "primary") ||
        "#00516f",
      buttonHoverBg:
        resolveThemeColorValue(ui?.buttonHoverBgColorKey, "") ||
        resolveThemeColorValue(
          ui?.buttonHoverBg,
          "linear-gradient(90deg, #fbb040 0%, #f7a11a 100%)",
        ) ||
        "linear-gradient(90deg, #fbb040 0%, #f7a11a 100%)",
      buttonHoverTextColor:
        resolveThemeColorValue(ui?.buttonHoverTextColorKey, "") ||
        resolveThemeColorValue(ui?.buttonHoverTextColor, "primary") ||
        "#00516f",
      buttonRadius: toFiniteNumber(ui?.buttonRadius, 999, 0, 999),
      leftContentHtml:
        String(ui?.leftContentHtml || "").trim() || DEFAULT_LEFT_CONTENT_HTML,
      leftContentColor:
        resolveThemeColorValue(ui?.leftContentColorKey, "") ||
        resolveThemeColorValue(ui?.leftContentColor, "") ||
        "#1f2933",
      leftContentAlign: ["left", "center", "right"].includes(
        String(ui?.leftContentAlign || "")
          .trim()
          .toLowerCase(),
      )
        ? String(ui?.leftContentAlign || "")
            .trim()
            .toLowerCase()
        : "left",
      leftContentFontSize: toFiniteNumber(ui?.leftContentFontSize, 16, 12, 48),
      leftContentLineHeight: toFiniteNumber(
        ui?.leftContentLineHeight,
        1.6,
        1,
        3,
      ),
      leftContentBottomSpacing: toFiniteNumber(
        ui?.leftContentBottomSpacing,
        16,
        0,
        80,
      ),
      leftMapTopSpacing: toFiniteNumber(ui?.leftMapTopSpacing, 18, 0, 120),
      mapHeightDesktop: toFiniteNumber(ui?.mapHeightDesktop, 370, 180, 720),
      mapHeightTablet: toFiniteNumber(ui?.mapHeightTablet, 300, 160, 640),
      mapHeightMobile: toFiniteNumber(ui?.mapHeightMobile, 260, 140, 560),
      mapBorderRadius: toFiniteNumber(ui?.mapBorderRadius, 4, 0, 40),
      mapBorderColor:
        resolveThemeColorValue(ui?.mapBorderColorKey, "") ||
        resolveThemeColorValue(ui?.mapBorderColor, "") ||
        "#edf0f3",
    }),
    [ui],
  );

  const configuredMapInput = String(
    ui?.mapEmbedUrl || mapEmbedUrl || "",
  ).trim();
  const hasCustomMapInput = configuredMapInput.length > 0;
  const hasValidCustomMap =
    hasCustomMapInput && isValidMapEmbedInput(configuredMapInput);
  const resolvedMapUrl = hasValidCustomMap
    ? normalizeMapEmbedInput(configuredMapInput)
    : DEFAULT_MAP_EMBED_URL;
  const mapFallbackUsed = hasCustomMapInput && !hasValidCustomMap;

  const controlStyle = {
    height: 56,
    minHeight: 56,
    lineHeight: "56px",
    paddingBlock: 0,
    borderRadius: 999,
    borderColor: "#d8dee6",
    boxShadow: "none",
    fontSize: 17,
    paddingInline: 20,
    color: "#2b2b2b",
    background: "#ffffff",
  };

  const textAreaStyle = {
    minHeight: 150,
    borderRadius: 24,
    borderColor: "#d8dee6",
    boxShadow: "none",
    fontSize: 17,
    padding: "14px 20px",
    color: "#2b2b2b",
    background: "#ffffff",
    resize: "vertical",
  };

  const wrapperVars = {
    "--contact-us-map-h-desktop": `${styles.mapHeightDesktop}px`,
    "--contact-us-map-h-tablet": `${styles.mapHeightTablet}px`,
    "--contact-us-map-h-mobile": `${styles.mapHeightMobile}px`,
    "--contact-us-left-paragraph-gap": `${styles.leftContentBottomSpacing}px`,
  };

  const leftContentStyle = {
    color: styles.leftContentColor,
    textAlign: styles.leftContentAlign,
    fontSize: `${styles.leftContentFontSize}px`,
    lineHeight: styles.leftContentLineHeight,
  };

  const mapFrameStyle = {
    marginTop: `${styles.leftMapTopSpacing}px`,
    borderRadius: `${styles.mapBorderRadius}px`,
    border: `1px solid ${styles.mapBorderColor}`,
  };

  const buttonVars = {
    "--contact-us-btn-bg": styles.buttonBg,
    "--contact-us-btn-text": styles.buttonTextColor,
    "--contact-us-btn-hover-bg": styles.buttonHoverBg,
    "--contact-us-btn-hover-text": styles.buttonHoverTextColor,
    "--contact-us-btn-radius": `${Math.max(0, styles.buttonRadius)}px`,
  };

  const handleFinish = async (values) => {
    if (previewOnly) return;

    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/public/forms/${encodeURIComponent(activeFormKey)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: values,
            source: String(source || "").trim() || "generated-form",
            page:
              String(page || "").trim() ||
              (typeof window !== "undefined" ? window.location.pathname : ""),
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
      <div className="contact-us-figma-layout" style={wrapperVars}>
        <Row gutter={[38, 24]} align="top">
          <Col xs={24} lg={11}>
            <div className="contact-us-figma-left">
              <SafeHtml
                html={styles.leftContentHtml}
                className="contact-us-rich-content"
                style={leftContentStyle}
              />
              {previewOnly && mapFallbackUsed ? (
                <div className="contact-us-map-note">
                  Invalid map link detected. Showing fallback map preview.
                </div>
              ) : null}
              <div className="contact-us-map-frame" style={mapFrameStyle}>
                <iframe
                  src={resolvedMapUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="TSUV Office Location"
                />
              </div>
            </div>
          </Col>
          <Col xs={24} lg={13}>
            <Form
              form={form}
              className="contact-us-figma-form"
              layout="vertical"
              requiredMark={false}
              onFinish={handleFinish}
            >
              <Row gutter={[0, 0]}>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    rules={[{ required: true, message: "Name is required" }]}
                  >
                    <Input placeholder="Name*" style={controlStyle} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Enter valid email" },
                    ]}
                  >
                    <Input placeholder="Email*" style={controlStyle} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="profileType"
                    rules={[{ required: true, message: "Type is required" }]}
                  >
                    <Select
                      placeholder="Individual / Organization"
                      suffixIcon={
                        <DownOutlined className="contact-us-figma-form__chevron" />
                      }
                      dropdownClassName="contact-us-figma-select-dropdown"
                      popupClassName="contact-us-figma-select-dropdown"
                      options={[
                        { label: "Individual", value: "Individual" },
                        { label: "Organization", value: "Organization" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="expertise">
                    <Input
                      placeholder="Your Area of Expertise / Work"
                      style={controlStyle}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="message">
                    <Input.TextArea
                      placeholder="What would you like to offer / collaborate on?"
                      autoSize={{ minRows: 5, maxRows: 9 }}
                      style={textAreaStyle}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <ContactUsSubmitButton
                    type="default"
                    htmlType={previewOnly ? "button" : "submit"}
                    loading={previewOnly ? false : submitting}
                    style={buttonVars}
                  >
                    Submit
                  </ContactUsSubmitButton>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </div>
      <ContactUsFormGlobalStyle />
    </>
  );
}
