"use client";

import { useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  getTitleAlign,
  getTitleAlignStyles,
  getSubtitleAlignStyles,
  getHeaderAlignStyles,
} from "@/components/site/titleUtils";

const ModalSection = styled.div`
  width: 100%;
  padding: 40px 0;
  box-sizing: border-box;
`;

const HeaderBlock = styled.div`
  margin-bottom: 24px;
`;

export default function LeaveusamessageModal(props = {}) {
  const prefix = "leaveusamessageModal";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const subTitle = (
    props.subTitle ??
    props.leaveusamessageModalSubTitle ??
    "Get In Touch"
  ).toString().trim();
  const mainTitle = (
    props.mainTitle ??
    props.leaveusamessageModalMainTitle ??
    "Leave us a *message*"
  ).toString().trim();
  const triggerButtonText = (
    props.triggerButtonText ??
    props.leaveusamessageModalButtonText ??
    "Leave a Message"
  ).toString().trim();

  const titleAlign = getTitleAlign(props, "center", prefix);

  const subTitleColor = props.subTitleColorKey
    ? getColor(props.subTitleColorKey)
    : props.leaveusamessageModalSubTitleColorKey
      ? getColor(props.leaveusamessageModalSubTitleColorKey)
      : getColor("primary");

  const titleColor = props.titleColorKey
    ? getColor(props.titleColorKey)
    : props.leaveusamessageModalTitleColorKey
      ? getColor(props.leaveusamessageModalTitleColorKey)
      : getColor("black");

  const buttonBgColor = props.buttonBgColorKey
    ? getColor(props.buttonBgColorKey)
    : getColor("primary");
  const buttonTextColor = props.buttonTextColorKey
    ? getColor(props.buttonTextColorKey)
    : getColor("white");

  // Manage Section backgrounds & margins
  const sectionBgType = props[`${prefix}SectionBgType`] ?? props.sectionBgType ?? "default";
  const sectionBgImage = props[`${prefix}SectionBgImage`] ?? props.sectionBgImage ?? "";
  const sectionBgColorKey = props[`${prefix}SectionBgColorKey`] ?? props.sectionBgColorKey ?? "";
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = {
    ...(sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey) }
        : {}),
    ...(props[`${prefix}SectionPaddingTop`] != null ? { paddingTop: `${Number(props[`${prefix}SectionPaddingTop`])}px` } : {}),
    ...(props[`${prefix}SectionPaddingBottom`] != null ? { paddingBottom: `${Number(props[`${prefix}SectionPaddingBottom`])}px` } : {}),
    ...(props[`${prefix}SectionMarginTop`] != null ? { marginTop: `${Number(props[`${prefix}SectionMarginTop`])}px` } : {}),
    ...(props[`${prefix}SectionMarginBottom`] != null ? { marginBottom: `${Number(props[`${prefix}SectionMarginBottom`])}px` } : {}),
  };

  const pageContainerBgStyle = {
    ...(props[`${prefix}PageContainerMarginTop`] != null ? { marginTop: `${Number(props[`${prefix}PageContainerMarginTop`])}px` } : {}),
    ...(props[`${prefix}PageContainerMarginBottom`] != null ? { marginBottom: `${Number(props[`${prefix}PageContainerMarginBottom`])}px` } : {}),
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        message.success("Thank you! Your message has been sent.");
        form.resetFields();
        setIsModalOpen(false);
      } else {
        message.error("Failed to send message. Please try again.");
      }
    } catch {
      message.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <ModalSection className="fable-section">
          {(subTitle || mainTitle) && (
            <HeaderBlock style={getHeaderAlignStyles(titleAlign)}>
              {subTitle ? (
                <p
                  className="fable-eyebrow"
                  style={{
                    color: subTitleColor,
                    ...getSubtitleAlignStyles(titleAlign),
                  }}
                >
                  {subTitle}
                </p>
              ) : null}
              {mainTitle ? (
                <h2
                  className="fable-heading"
                  style={{
                    color: titleColor,
                    ...getTitleAlignStyles(titleAlign),
                  }}
                >
                  {renderHighlightedTitle(mainTitle, props)}
                </h2>
              ) : null}
            </HeaderBlock>
          )}

          <div
            style={{
              display: "flex",
              justifyContent:
                titleAlign === "left"
                  ? "flex-start"
                  : titleAlign === "right"
                    ? "flex-end"
                    : "center",
            }}
          >
            <Button
              type="primary"
              size="large"
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: buttonBgColor,
                color: buttonTextColor,
                borderColor: buttonBgColor,
                fontWeight: 600,
                padding: "0 28px",
                height: 48,
                borderRadius: 8,
              }}
            >
              {triggerButtonText}
            </Button>
          </div>

          <Modal
            title={
              <div>
                {subTitle ? (
                  <p
                    className="fable-eyebrow"
                    style={{ color: subTitleColor, marginBottom: 4 }}
                  >
                    {subTitle}
                  </p>
                ) : null}
                <h3 style={{ margin: 0, color: titleColor }}>
                  {renderHighlightedTitle(mainTitle, props)}
                </h3>
              </div>
            }
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            destroyOnClose
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ marginTop: 20 }}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input placeholder="Your Name" size="large" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="your.email@example.com" size="large" />
              </Form.Item>
              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: "Please enter your message" }]}
              >
                <Input.TextArea placeholder="How can we help?" rows={4} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{
                    backgroundColor: buttonBgColor,
                    color: buttonTextColor,
                    borderColor: buttonBgColor,
                  }}
                >
                  Send Message
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </ModalSection>
      </PageContainer>
    </FullWidthBackground>
  );
}
