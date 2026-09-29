"use client";

import { useState } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  Select,
  Upload,
  Checkbox,
  Button,
  notification,
  ConfigProvider,
} from "antd";
import { InboxOutlined, CheckCircleFilled } from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import { isValidEmail, isValidPhone, normalizeText } from "@/lib/formValidation";

const { TextArea } = Input;
const { Dragger } = Upload;

/* ── Styled Components ── */
const FormCard = styled.div`
  background: ${(p) => p.$bg || "#ffffff"};
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 36px;

  .ant-form-item {
    margin-bottom: 20px;
  }

  .ant-form-item-label > label {
    font-weight: 600;
    font-size: 14px;
    color: ${(p) => p.$labelColor || "rgba(0, 0, 0, 0.85)"};
  }

  /* Single border input styling matching Event Registration Form */
  .ant-input:not(textarea),
  .ant-input-affix-wrapper,
  .ant-select-selector {
    height: 48px !important;
    min-height: 48px !important;
    padding: 10px 14px !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
    border-radius: 8px !important;
    font-size: 15px !important;
    box-shadow: none !important;
    outline: none !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: 46px !important;
    font-size: 15px !important;
  }

  .ant-input-textarea textarea,
  textarea.ant-input {
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
    border-radius: 8px !important;
    padding: 12px 14px !important;
    font-size: 15px !important;
    min-height: 120px !important;
    box-shadow: none !important;
    outline: none !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .ant-input:hover,
  .ant-input-affix-wrapper:hover,
  .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
  .ant-input-textarea textarea:hover,
  textarea.ant-input:hover {
    border-color: ${(p) => p.$buttonBg || getColor("primary") || "#e03c33"} !important;
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper-focused,
  .ant-select-focused .ant-select-selector,
  .ant-select-open .ant-select-selector,
  .ant-input-textarea textarea:focus,
  textarea.ant-input:focus {
    border-color: ${(p) => p.$buttonBg || getColor("primary") || "#e03c33"} !important;
    box-shadow: 0 0 0 3px rgba(224, 60, 51, 0.08) !important;
    outline: none !important;
  }

  .ant-btn {
    border-radius: 8px;
    font-weight: 600;
    height: 48px;
    padding: 0 36px;
    font-size: 15px;
    background: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"};
    border-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"};
    color: ${(p) => p.$buttonColor || "#ffffff"};

    &:hover,
    &:focus {
      background: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
      border-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
      opacity: 0.92;
    }
  }

  /* Checkbox styling matching CTA button */
  .ant-checkbox .ant-checkbox-inner {
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
    border-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
  }

  .ant-checkbox-wrapper:hover .ant-checkbox-inner,
  .ant-checkbox:hover .ant-checkbox-inner,
  .ant-checkbox-input:focus + .ant-checkbox-inner,
  .ant-checkbox-checked:not(.ant-checkbox-disabled):hover .ant-checkbox-inner {
    border-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
  }

  .ant-checkbox-wrapper:hover .ant-checkbox-checked:not(.ant-checkbox-disabled) .ant-checkbox-inner {
    background-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
    opacity: 0.92;
  }

  .ant-checkbox-indeterminate .ant-checkbox-inner:after {
    background-color: ${(p) => p.$buttonBg || "var(--secondary-color, #2A283E)"} !important;
  }

  @media (max-width: 991px) {
    padding: 28px;
  }
  @media (max-width: 640px) {
    padding: 22px 18px;
    border-radius: 10px;

    .ant-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }

    .ant-input:not(textarea),
    .ant-select-selector,
    .ant-input-textarea textarea {
      font-size: 16px !important;
    }
  }
`;

const Intro = styled.p`
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.65;
  color: ${(p) => p.$color || "rgba(0, 0, 0, 0.65)"};

  @media (max-width: 640px) {
    font-size: 14px;
    margin-bottom: 18px;
  }
`;

const SuccessView = styled.div`
  text-align: center;
  padding: 32px 16px;

  .succ-icon {
    font-size: 56px;
    color: #52c41a;
    margin-bottom: 16px;
  }

  .succ-title {
    font-size: 20px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.88);
    margin-bottom: 10px;
  }

  .succ-ref {
    display: inline-block;
    background: rgba(0, 0, 0, 0.04);
    padding: 4px 12px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.75);
    margin-bottom: 18px;
  }

  .succ-desc {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(0, 0, 0, 0.65);
    max-width: 460px;
    margin: 0 auto 24px;
  }
`;

const Honeypot = styled.input`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;

const DEFAULT_POSITIONS = [
  "General Application",
  "Programme Coordinator",
  "Medical Officer",
  "Accounts Executive",
  "Content & Communications Executive",
  "Social Worker",
  "IT Support Specialist",
  "Internship",
];

const EXPERIENCE_OPTIONS = [
  { label: "Fresher / 0-1 Year", value: "Fresher / 0-1 Year" },
  { label: "1 - 3 Years", value: "1 - 3 Years" },
  { label: "3 - 5 Years", value: "3 - 5 Years" },
  { label: "5 - 8 Years", value: "5 - 8 Years" },
  { label: "8+ Years", value: "8+ Years" },
];

export default function CareersUpload(props = {}) {
  const PREFIX = "careersUpload";
  const [form] = Form.useForm();

  /* -- Section background & Spacing -- */
  const sectionBgType = (props?.[PREFIX + "SectionBgType"] ?? "default").toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "").toString().trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop =
    props?.[PREFIX + "SectionPaddingTop"] != null ? Number(props[PREFIX + "SectionPaddingTop"]) : null;
  const sectionPaddingBottom =
    props?.[PREFIX + "SectionPaddingBottom"] != null ? Number(props[PREFIX + "SectionPaddingBottom"]) : null;
  const sectionMarginTop =
    props?.[PREFIX + "SectionMarginTop"] != null ? Number(props[PREFIX + "SectionMarginTop"]) : null;
  const sectionMarginBottom =
    props?.[PREFIX + "SectionMarginBottom"] != null ? Number(props[PREFIX + "SectionMarginBottom"]) : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  /* -- Page Container Styling -- */
  const pageContainerBgType = (props?.[PREFIX + "PageContainerBgType"] ?? "default").toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.[PREFIX + "PageContainerBgColorKey"] ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop =
    props?.[PREFIX + "PageContainerPaddingTop"] != null ? Number(props[PREFIX + "PageContainerPaddingTop"]) : null;
  const containerPaddingRight =
    props?.[PREFIX + "PageContainerPaddingRight"] != null ? Number(props[PREFIX + "PageContainerPaddingRight"]) : null;
  const containerPaddingBottom =
    props?.[PREFIX + "PageContainerPaddingBottom"] != null ? Number(props[PREFIX + "PageContainerPaddingBottom"]) : null;
  const containerPaddingLeft =
    props?.[PREFIX + "PageContainerPaddingLeft"] != null ? Number(props[PREFIX + "PageContainerPaddingLeft"]) : null;
  const containerMarginTop =
    props?.[PREFIX + "PageContainerMarginTop"] != null ? Number(props[PREFIX + "PageContainerMarginTop"]) : null;
  const containerMarginBottom =
    props?.[PREFIX + "PageContainerMarginBottom"] != null ? Number(props[PREFIX + "PageContainerMarginBottom"]) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
        }
      : undefined;

  /* -- Title, Subtitle, Alignment, Intro -- */
  const mainTitle = (props?.mainTitle ?? props?.careersUploadMainTitle ?? "Build a Meaningful Career With Us").toString().trim();
  const subTitle = (props?.subTitle ?? props?.careersUploadSubTitle ?? "").toString().trim();
  const titleEnabled = props?.careersUploadTitleEnabled !== false && props?.titleEnabled !== false;
  const subTitleEnabled = props?.careersUploadSubTitleEnabled !== false && props?.subTitleEnabled !== false;
  const titleAlign = (props?.careersUploadTitleAlign ?? props?.titleAlign ?? "left").toString().toLowerCase().trim();
  const textAlignValue = titleAlign === "center" ? "center" : titleAlign === "right" ? "right" : "left";
  const titleColorKey = (props?.titleColorKey ?? props?.careersUploadTitleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColorKey = (props?.careersUploadSubTitleColorKey ?? props?.subTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;
  const intro = (
    props?.careersUploadIntroText ??
    "Please fill in your details below to submit your application. We will reach out with the next steps."
  ).toString();

  /* -- Colors -- */
  const cardBgColorKey = (props?.careersUploadCardBgColorKey ?? "").toString().trim();
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "#ffffff";
  const labelColorKey = (props?.careersUploadLabelColorKey ?? "").toString().trim();
  const labelColor = labelColorKey ? getColor(labelColorKey) : "rgba(0, 0, 0, 0.85)";
  const buttonBgColorKey = (props?.careersUploadButtonBgColorKey ?? "").toString().trim();
  const buttonBgColor = buttonBgColorKey ? getColor(buttonBgColorKey) : getColor("secondary");
  const buttonTextColorKey = (props?.careersUploadButtonTextColorKey ?? "").toString().trim();
  const buttonTextColor = buttonTextColorKey ? getColor(buttonTextColorKey) : "#ffffff";

  /* -- Form Field Configs -- */
  const rawPositions = props?.careersUploadPositions;
  const positionsList = Array.isArray(rawPositions) && rawPositions.length > 0
    ? rawPositions
    : typeof rawPositions === "string" && rawPositions.trim()
      ? rawPositions.split(",").map((p) => p.trim()).filter(Boolean)
      : DEFAULT_POSITIONS;

  const positionOptions = positionsList.map((p) => ({ label: p, value: p }));

  const showQualification = props?.careersUploadShowQualification !== false;
  const showExperience = props?.careersUploadShowExperience !== false;
  const showCity = props?.careersUploadShowCity !== false;
  const showCoverLetter = props?.careersUploadShowCoverLetter !== false;
  const maxFileSizeMB = Number(props?.careersUploadMaxFileSizeMB) || 5;
  const submitBtnText = (props?.careersUploadSubmitBtnText ?? "Submit Application").toString().trim();
  const submitBtnAlign = (props?.careersUploadSubmitBtnAlign ?? props?.submitBtnAlign ?? "left").toString().toLowerCase().trim();
  const btnJustify =
    submitBtnAlign === "center"
      ? "center"
      : submitBtnAlign === "right"
        ? "flex-end"
        : submitBtnAlign === "full"
          ? "stretch"
          : "flex-start";
  const isFullWidthBtn = submitBtnAlign === "full";
  const successTitle = (props?.careersUploadSuccessTitle ?? "Application Submitted Successfully!").toString().trim();
  const successMessage = (
    props?.careersUploadSuccessMessage ??
    "Thank you! Your application and resume have been received. We will reach out with the next steps."
  ).toString().trim();

  /* -- State -- */
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);

  const handleBeforeUpload = (file) => {
    const allowedExts = [".pdf", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      notification.error({
        message: "Invalid File",
        description: "Only PDF, DOC, and DOCX files are allowed.",
        placement: "bottomRight",
      });
      return Upload.LIST_IGNORE;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      notification.error({
        message: "File Too Large",
        description: `Resume file exceeds the ${maxFileSizeMB}MB limit.`,
        placement: "bottomRight",
      });
      return Upload.LIST_IGNORE;
    }

    setFileList([file]);
    return false;
  };

  const handleRemoveFile = () => {
    setFileList([]);
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      notification.error({
        message: "Resume Required",
        description: "Please attach your resume / CV document.",
        placement: "bottomRight",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("fullName", normalizeText(values.fullName));
      payload.append("email", normalizeText(values.email).toLowerCase());
      payload.append("phone", normalizeText(values.phone));
      payload.append("position", values.position || positionsList[0] || "General Application");
      payload.append("qualification", normalizeText(values.qualification));
      payload.append("experience", normalizeText(values.experience));
      payload.append("currentCity", normalizeText(values.currentCity));
      payload.append("coverLetter", normalizeText(values.coverLetter));
      payload.append("website", values.website || "");
      payload.append("source", "CareersUpload");
      if (typeof window !== "undefined") {
        payload.append("page", window.location.pathname);
      }
      if (fileList[0]) {
        payload.append("resume", fileList[0]);
      }

      const res = await fetch("/api/public/careers-upload", {
        method: "POST",
        body: payload,
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        notification.error({
          message: "Submission Failed",
          description: out?.error || "Failed to submit application. Please try again.",
          placement: "bottomRight",
        });
        return;
      }

      notification.success({
        message: "Success",
        description: successMessage,
        placement: "bottomRight",
      });

      setSubmittedRef(out?.id || "CAREER-" + Date.now().toString().slice(-6));
    } catch {
      notification.error({
        message: "Submission Failed",
        description: "Network error. Please try again.",
        placement: "bottomRight",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRef(null);
    setFileList([]);
    form.resetFields();
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
          {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
            <header
              className="fable-section-heading"
              style={{
                marginBottom: 32,
                textAlign: textAlignValue,
              }}
            >
              {subTitleEnabled && subTitle ? (
                <p
                  className="fable-eyebrow"
                  style={{
                    ...(subTitleColor ? { color: subTitleColor } : {}),
                    textAlign: textAlignValue,
                  }}
                >
                  {subTitle}
                </p>
              ) : null}
              {titleEnabled && mainTitle ? (
                <h2
                  className="fable-heading"
                  style={{
                    ...(titleColor ? { color: titleColor } : {}),
                    textAlign: textAlignValue,
                    maxWidth: "none",
                    marginLeft: textAlignValue === "center" ? "auto" : textAlignValue === "right" ? "auto" : "0",
                    marginRight: textAlignValue === "center" ? "auto" : textAlignValue === "right" ? "0" : "auto",
                  }}
                >
                  {renderHighlightedTitle(mainTitle, props)}
                </h2>
              ) : null}
            </header>
          )}

          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} md={20} lg={16}>
              <FormCard
                $bg={cardBgColor}
                $labelColor={labelColor}
                $buttonBg={buttonBgColor}
                $buttonColor={buttonTextColor}
              >
                {submittedRef ? (
                  <SuccessView>
                    <div className="succ-icon">
                      <CheckCircleFilled />
                    </div>
                    <div className="succ-title">{successTitle}</div>
                    <div className="succ-ref">Ref ID: {submittedRef}</div>
                    <p className="succ-desc">{successMessage}</p>
                    <Button type="primary" size="large" onClick={handleReset}>
                      Submit Another Application
                    </Button>
                  </SuccessView>
                ) : (
                  <>
                    {intro && <Intro>{intro}</Intro>}

                    <ConfigProvider
                      theme={{
                        token: {
                          colorPrimary: buttonBgColor || "#2A283E",
                          borderRadius: 8,
                          controlHeightLG: 48,
                          fontSize: 15,
                          fontSizeLG: 15,
                        },
                      }}
                    >
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                          consent: true,
                        }}
                        requiredMark={(label, { required }) => (
                          <span>
                            {label}
                            {required && <span style={{ color: "#e03c33", marginLeft: 4 }}>*</span>}
                          </span>
                        )}
                      >
                        {/* Honeypot for spam protection */}
                        <Form.Item name="website" noStyle>
                          <Honeypot tabIndex={-1} autoComplete="off" />
                        </Form.Item>

                        {/* Form Fields: 2 Columns per Row (matching Event Registration Form) */}
                        <Row gutter={[16, 0]}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="fullName"
                              label="Full name"
                              rules={[
                                { required: true, message: "Full name is required" },
                                {
                                  validator: (_, val) => {
                                    if (val && !normalizeText(val)) {
                                      return Promise.reject(new Error("Full name cannot be empty"));
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Input size="large" placeholder="Enter full name..." />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="email"
                              label="Email"
                              rules={[
                                { required: true, message: "Email is required" },
                                {
                                  validator: (_, val) => {
                                    if (val && !isValidEmail(val)) {
                                      return Promise.reject(new Error("Please enter a valid email address"));
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Input size="large" type="email" placeholder="Enter email..." />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={[16, 0]}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="phone"
                              label="Phone"
                              rules={[
                                { required: true, message: "Phone number is required" },
                                {
                                  validator: (_, val) => {
                                    if (val && !isValidPhone(val)) {
                                      return Promise.reject(
                                        new Error("Please enter a valid 10-digit mobile number"),
                                      );
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Input size="large" placeholder="Enter phone number..." />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="position"
                              label="Position / Role of Interest"
                              rules={[{ required: true, message: "Please select position / role" }]}
                            >
                              <Select
                                size="large"
                                placeholder="Select position / role..."
                                allowClear
                                options={positionOptions}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        {(showQualification || showExperience) && (
                          <Row gutter={[16, 0]}>
                            {showQualification && (
                              <Col xs={24} sm={showExperience ? 12 : 24}>
                                <Form.Item name="qualification" label="Highest Qualification">
                                  <Input size="large" placeholder="Enter highest qualification..." />
                                </Form.Item>
                              </Col>
                            )}

                            {showExperience && (
                              <Col xs={24} sm={showQualification ? 12 : 24}>
                                <Form.Item name="experience" label="Total Experience">
                                  <Select
                                    size="large"
                                    placeholder="Select total experience..."
                                    allowClear
                                    options={EXPERIENCE_OPTIONS}
                                  />
                                </Form.Item>
                              </Col>
                            )}
                          </Row>
                        )}

                        {showCity && (
                          <Row gutter={[16, 0]}>
                            <Col span={24}>
                              <Form.Item name="currentCity" label="Current City / Location">
                                <Input size="large" placeholder="Enter current city / location..." />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}

                        {/* Separate Single Row: Message */}
                        {showCoverLetter && (
                          <Row gutter={[16, 0]}>
                            <Col span={24}>
                              <Form.Item name="coverLetter" label="Message">
                                <TextArea
                                  size="large"
                                  rows={4}
                                  placeholder="Enter message..."
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}

                        {/* Separate Single Row: Upload Resume / CV */}
                        <Row gutter={[16, 0]}>
                          <Col span={24}>
                            <Form.Item
                              label="Upload Resume / CV"
                              required
                              extra={`Supported formats: PDF, DOC, DOCX up to ${maxFileSizeMB}MB`}
                            >
                              <Dragger
                                fileList={fileList}
                                beforeUpload={handleBeforeUpload}
                                onRemove={handleRemoveFile}
                                maxCount={1}
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                style={{ padding: "18px 12px", background: "rgba(0,0,0,0.01)" }}
                              >
                                <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                                  <InboxOutlined style={{ color: "#e03c33", fontSize: 32 }} />
                                </p>
                                <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                                  Click or drag Resume / CV file to this area to upload
                                </p>
                                <p className="ant-upload-hint" style={{ fontSize: 12, margin: 0, color: "rgba(0,0,0,0.55)" }}>
                                  PDF, DOC, DOCX up to {maxFileSizeMB}MB
                                </p>
                              </Dragger>
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Declaration Checkbox */}
                        <Row gutter={[16, 0]}>
                          <Col span={24}>
                            <Form.Item
                              name="consent"
                              valuePropName="checked"
                              rules={[
                                {
                                  validator: (_, val) =>
                                    val
                                      ? Promise.resolve()
                                      : Promise.reject(new Error("Please accept the declaration")),
                                },
                              ]}
                            >
                              <Checkbox>
                                <span style={{ fontSize: 13, color: "rgba(0,0,0,0.65)", lineHeight: 1.4 }}>
                                  I declare that the information provided is accurate and agree to MESCO Trust processing my application for recruitment purposes.
                                </span>
                              </Checkbox>
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Submit Button */}
                        <Row gutter={[16, 0]}>
                          <Col span={24}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: btnJustify,
                                width: "100%",
                              }}
                            >
                              <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                style={isFullWidthBtn ? { width: "100%" } : undefined}
                              >
                                {submitting ? "Submitting..." : submitBtnText}
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Form>
                    </ConfigProvider>
                  </>
                )}
              </FormCard>
            </Col>
          </Row>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
