"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import styled, { createGlobalStyle } from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
import {
  getTitleAlignStyles,
  getSubtitleAlignStyles,
} from "@/components/site/titleUtils";
import { isValidEmail, isValidPhone, normalizeText } from "@/lib/formValidation";

const InternshipSelectDropdownStyles = createGlobalStyle`
  .internship-upload-dropdown.ant-select-dropdown {
    padding: 6px !important;
    border-radius: 8px !important;
  }

  .internship-upload-dropdown.ant-select-dropdown .ant-select-item-option {
    border-radius: 6px !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
    color: rgba(0, 0, 0, 0.85) !important;
  }

  .internship-upload-dropdown.ant-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: #f5f5f5 !important;
    color: rgba(0, 0, 0, 0.88) !important;
  }

  .internship-upload-dropdown.ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: #f0f2f5 !important;
    color: rgba(0, 0, 0, 0.88) !important;
    font-weight: 600 !important;
  }
`;

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

  /* Single border input styling matching Careers & Event Registration forms */
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

  .ant-btn-primary:not(.ant-upload-list-item-action):not(.ant-upload-list-item-card-actions-btn) {
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

  /* Reset Upload file list action buttons */
  .ant-upload-list-item-action,
  .ant-upload-list-item-card-actions-btn,
  .ant-upload-list-item .ant-btn {
    height: auto !important;
    min-height: auto !important;
    width: auto !important;
    padding: 4px 6px !important;
    background: transparent !important;
    border: none !important;
    color: rgba(0, 0, 0, 0.45) !important;
    box-shadow: none !important;
    border-radius: 4px !important;

    &:hover,
    &:focus {
      background: rgba(224, 60, 51, 0.1) !important;
      color: #e03c33 !important;
      border-color: transparent !important;
    }

    .anticon {
      font-size: 14px;
      color: inherit;
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

  @media (max-width: 991px) {
    padding: 28px;
  }
  @media (max-width: 640px) {
    padding: 22px 18px;
    border-radius: 10px;

    .ant-btn-primary:not(.ant-upload-list-item-action) {
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

const WORK_MODE_OPTIONS = [
  { label: "Office (On-site)", value: "Office" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Remote", value: "Remote" },
];

const DURATION_OPTIONS = [
  { label: "1 Month", value: "1 Month" },
  { label: "2 Months", value: "2 Months" },
  { label: "3 Months", value: "3 Months" },
  { label: "6 Months", value: "6 Months" },
  { label: "Flexible", value: "Flexible" },
];

const DEFAULT_ROLES = [
  "Social Media and Digital Marketing",
  "Graphic Design and Video Editing",
  "Content Writing and Communications",
  "Website Development and IT Support",
  "Research and Data Management",
  "Programme Coordination",
  "Fundraising and CSR Support",
];

export default function InternshipUpload(props = {}) {
  const PREFIX = "internshipUpload";
  const [form] = Form.useForm();
  const hasUserManuallySelectedRef = useRef(false);

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

  /* -- Title, Subtitle, Alignment, Intro (Exact match with CareersUpload) -- */
  const mainTitle = (
    props?.mainTitle ??
    props?.[PREFIX + "MainTitle"] ??
    "Current Openings"
  ).toString().trim();
  const subTitle = (
    props?.subTitle ??
    props?.[PREFIX + "SubTitle"] ??
    "WE'RE HIRING"
  ).toString().trim();
  const titleEnabled = props?.[PREFIX + "TitleEnabled"] !== false && props?.titleEnabled !== false;
  const subTitleEnabled = props?.[PREFIX + "SubTitleEnabled"] !== false && props?.subTitleEnabled !== false;
  const titleAlign = (props?.[PREFIX + "TitleAlign"] ?? props?.titleAlign ?? "center").toString().toLowerCase().trim();
  const textAlignValue = titleAlign === "left" ? "left" : titleAlign === "right" ? "right" : "center";
  const titleColorKey = (props?.titleColorKey ?? props?.[PREFIX + "TitleColorKey"] ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColorKey = (props?.[PREFIX + "SubTitleColorKey"] ?? props?.subTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;
  const intro = (
    props?.[PREFIX + "IntroText"] ??
    "MESCO Trust works across education, healthcare, poverty relief and community development. Individuals interested in contributing their skills and gaining experience may apply below."
  ).toString();

  /* -- Colors -- */
  const cardBgColorKey = (props?.[PREFIX + "CardBgColorKey"] ?? "").toString().trim();
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "#ffffff";
  const labelColorKey = (props?.[PREFIX + "LabelColorKey"] ?? "").toString().trim();
  const labelColor = labelColorKey ? getColor(labelColorKey) : "rgba(0, 0, 0, 0.85)";
  const buttonBgColorKey = (props?.[PREFIX + "ButtonBgColorKey"] ?? "").toString().trim();
  const buttonBgColor = buttonBgColorKey ? getColor(buttonBgColorKey) : getColor("secondary");
  const buttonTextColorKey = (props?.[PREFIX + "ButtonTextColorKey"] ?? "").toString().trim();
  const buttonTextColor = buttonTextColorKey ? getColor(buttonTextColorKey) : "#ffffff";

  /* -- Roles calculation -- */
  const rawRoles = props?.[PREFIX + "Roles"] ?? props?.roles ?? props?.openings;
  const roleOptions = useMemo(() => {
    let candidateRoles = DEFAULT_ROLES;
    if (Array.isArray(rawRoles) && rawRoles.length > 0) {
      candidateRoles = rawRoles;
    } else if (typeof rawRoles === "string" && rawRoles.trim()) {
      candidateRoles = rawRoles.includes("\n")
        ? rawRoles.split("\n")
        : rawRoles.split(",");
    }

    const seen = new Set();
    const list = [];
    for (const item of candidateRoles) {
      const clean = typeof item === "string" ? item.trim() : String(item?.title || item?.name || "").trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (lower === "other" || seen.has(lower)) continue;
      seen.add(lower);
      list.push({ label: clean, value: clean });
    }
    list.push({ label: "Other", value: "Other" });
    return list;
  }, [rawRoles]);

  /* -- Field visibility toggles -- */
  const showSkills = props?.[PREFIX + "ShowSkills"] !== false;
  const showWorkMode = props?.[PREFIX + "ShowWorkMode"] !== false;
  const showDuration = props?.[PREFIX + "ShowDuration"] !== false;
  const showStartDate = props?.[PREFIX + "ShowStartDate"] !== false;
  const showCity = props?.[PREFIX + "ShowCity"] !== false;
  const showDescription = props?.[PREFIX + "ShowDescription"] !== false;
  const maxFileSizeMB = Number(props?.[PREFIX + "MaxFileSizeMB"]) || 5;

  const submitBtnText = (props?.[PREFIX + "SubmitBtnText"] ?? "Submit Application").toString().trim();
  const submitBtnAlign = (props?.[PREFIX + "SubmitBtnAlign"] ?? props?.submitBtnAlign ?? "left").toString().toLowerCase().trim();
  const btnJustify =
    submitBtnAlign === "center"
      ? "center"
      : submitBtnAlign === "right"
        ? "flex-end"
        : submitBtnAlign === "full"
          ? "stretch"
          : "flex-start";
  const isFullWidthBtn = submitBtnAlign === "full";
  const successTitle = (props?.[PREFIX + "SuccessTitle"] ?? "Application Submitted Successfully!").toString().trim();
  const successMessage = (
    props?.[PREFIX + "SuccessMessage"] ??
    "Thank you! Your internship application and resume have been received. We will reach out with the next steps."
  ).toString().trim();

  /* -- State -- */
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);

  const watchedRole = Form.useWatch("roleTitle", form);
  const isOtherSelected = watchedRole === "Other";

  useEffect(() => {
    if (!isOtherSelected) {
      if (form.getFieldValue("customRole")) {
        form.setFieldsValue({ customRole: undefined });
      }
    }
  }, [isOtherSelected, form]);

  // Automatic role selection from URL query parameter
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasUserManuallySelectedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const paramRole =
      params.get("role") ||
      params.get("position") ||
      params.get("department") ||
      params.get("opening") ||
      params.get("job");

    if (paramRole) {
      const cleanParam = paramRole.trim().toLowerCase();
      const matched = roleOptions.find((o) => {
        const titleLower = o.label.toLowerCase();
        const valueLower = String(o.value).toLowerCase();
        const slugHyphen = titleLower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const slugUnderscore = titleLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const strippedTitle = titleLower.replace(/[^a-z0-9]/g, "");
        const strippedParam = cleanParam.replace(/[^a-z0-9]/g, "");
        return (
          titleLower === cleanParam ||
          valueLower === cleanParam ||
          slugHyphen === cleanParam ||
          slugUnderscore === cleanParam ||
          (strippedParam && strippedTitle === strippedParam)
        );
      });

      if (matched) {
        form.setFieldsValue({ roleTitle: matched.value });
      }
    }
  }, [roleOptions, form]);

  // Listen for role selection events from job card clicks
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRoleSelectEvent = (e) => {
      const role = e.detail?.role || e.detail?.position || e.detail?.id;
      if (!role) return;
      hasUserManuallySelectedRef.current = true;
      const cleanParam = String(role).trim().toLowerCase();
      const matched = roleOptions.find((o) => {
        const titleLower = o.label.toLowerCase().trim();
        const valueLower = String(o.value).toLowerCase().trim();
        const slugHyphen = titleLower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const slugUnderscore = titleLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const strippedTitle = titleLower.replace(/[^a-z0-9]/g, "");
        const strippedParam = cleanParam.replace(/[^a-z0-9]/g, "");
        return (
          titleLower === cleanParam ||
          valueLower === cleanParam ||
          slugHyphen === cleanParam ||
          slugUnderscore === cleanParam ||
          (strippedParam && strippedTitle === strippedParam)
        );
      });
      if (matched) {
        form.setFieldsValue({ roleTitle: matched.value });
        if (form.getFieldValue("customRole")) {
          form.setFieldsValue({ customRole: undefined });
        }
      } else if (cleanParam === "other") {
        form.setFieldsValue({ roleTitle: "Other" });
      }
    };

    window.addEventListener("careers-select-role", handleRoleSelectEvent);
    window.addEventListener("internship-select-role", handleRoleSelectEvent);
    return () => {
      window.removeEventListener("careers-select-role", handleRoleSelectEvent);
      window.removeEventListener("internship-select-role", handleRoleSelectEvent);
    };
  }, [roleOptions, form]);

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

    const isOther = values.roleTitle === "Other";
    const customRole = normalizeText(values.customRole);

    if (isOther && !customRole) {
      notification.error({
        message: "Role Required",
        description: "Please specify the preferred role or department name.",
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

      if (isOther) {
        payload.append("roleTitle", customRole);
        payload.append("customRole", customRole);
        payload.append("roleCategory", "Other");
      } else {
        payload.append("roleTitle", values.roleTitle);
        payload.append("roleCategory", "ActiveRole");
      }

      payload.append("skills", normalizeText(values.skills));
      payload.append("workMode", normalizeText(values.workMode));
      payload.append("duration", normalizeText(values.duration));
      payload.append("startDate", normalizeText(values.startDate));
      payload.append("currentCity", normalizeText(values.currentCity));
      payload.append("statement", normalizeText(values.statement));
      payload.append("website", values.website || "");
      payload.append("source", "InternshipUpload");
      if (typeof window !== "undefined") {
        payload.append("page", window.location.pathname);
      }
      if (fileList[0]) {
        payload.append("resume", fileList[0]);
      }

      const res = await fetch("/api/public/internship-upload", {
        method: "POST",
        body: payload,
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(out?.error || "Failed to submit internship application.");
      }

      notification.success({
        message: "Application Submitted",
        description: "Your internship application has been received.",
        placement: "bottomRight",
      });

      setSubmittedRef(out.reference || "SUBMITTED");
      form.resetFields();
      setFileList([]);
    } catch (err) {
      notification.error({
        message: "Submission Failed",
        description: err?.message || "Could not submit your application. Please check your details and try again.",
        placement: "bottomRight",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
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
                    textAlign: titleAlign,
                    ...getSubtitleAlignStyles(titleAlign),
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
                    maxWidth: "none",
                    ...getTitleAlignStyles(titleAlign),
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
                id="internship-application-form"
                $bg={cardBgColor}
                $labelColor={labelColor}
                $buttonBg={buttonBgColor}
                $buttonColor={buttonTextColor}
              >
                {submittedRef ? (
                  <SuccessView>
                    <CheckCircleFilled className="succ-icon" />
                    <div className="succ-title">{successTitle}</div>
                    <div className="succ-ref">Reference ID: {submittedRef}</div>
                    <div className="succ-desc">{successMessage}</div>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        setSubmittedRef(null);
                        form.resetFields();
                        setFileList([]);
                      }}
                    >
                      Submit Another Application
                    </Button>
                  </SuccessView>
                ) : (
                  <>
                    {intro && <Intro $color="rgba(0, 0, 0, 0.65)">{intro}</Intro>}

                    <InternshipSelectDropdownStyles />
                    <ConfigProvider
                      theme={{
                        token: {
                          colorPrimary: "#e03c33",
                          borderRadius: 8,
                          controlHeightLG: 48,
                          fontSize: 15,
                          fontSizeLG: 15,
                          controlItemBgActive: "#f0f2f5",
                          controlItemBgHover: "#f5f5f7",
                        },
                        components: {
                          Select: {
                            controlItemBgActive: "#f0f2f5",
                            controlItemBgHover: "#f5f5f7",
                            optionSelectedColor: "rgba(0, 0, 0, 0.88)",
                            optionSelectedFontWeight: 600,
                          },
                        },
                      }}
                    >
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                          consent: true,
                          workMode: "Office",
                          duration: "3 Months",
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

                        {/* Candidate Full Name & Email */}
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

                        {/* Phone & Role / Department */}
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
                              name="roleTitle"
                              label="Role Title / Department"
                              rules={[{ required: true, message: "Please select internship role / department" }]}
                            >
                              <Select
                                size="large"
                                placeholder="Select role / department..."
                                allowClear
                                popupClassName="internship-upload-dropdown"
                                options={roleOptions}
                                onChange={(val) => {
                                  hasUserManuallySelectedRef.current = true;
                                  form.setFieldsValue({ roleTitle: val });
                                  if (val !== "Other") {
                                    form.setFieldsValue({ customRole: undefined });
                                  }
                                }}
                              />
                            </Form.Item>

                            {isOtherSelected && (
                              <Form.Item
                                name="customRole"
                                label="Specify Role / Department"
                                rules={[
                                  { required: true, message: "Please specify the role or department" },
                                  {
                                    validator: (_, val) => {
                                      if (val && !normalizeText(val)) {
                                        return Promise.reject(
                                          new Error("Role / department cannot be empty"),
                                        );
                                      }
                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                              >
                                <Input
                                  size="large"
                                  placeholder="Enter your preferred role / department"
                                  autoFocus
                                />
                              </Form.Item>
                            )}
                          </Col>
                        </Row>

                        {/* Eligibility & Skills */}
                        {showSkills && (
                          <Row gutter={[16, 0]}>
                            <Col span={24}>
                              <Form.Item
                                name="skills"
                                label="Eligibility & Skills"
                                extra="Your current degree, academic background, technical skills, or relevant experience"
                              >
                                <Input
                                  size="large"
                                  placeholder="e.g. Pursuing B.Sc IT / Graphic Design skills (Photoshop, Illustrator)..."
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}

                        {/* Location & Work Mode + Current City */}
                        {(showWorkMode || showCity) && (
                          <Row gutter={[16, 0]}>
                            {showWorkMode && (
                              <Col xs={24} sm={showCity ? 12 : 24}>
                                <Form.Item name="workMode" label="Location & Work Mode">
                                  <Select
                                    size="large"
                                    placeholder="Select work mode..."
                                    popupClassName="internship-upload-dropdown"
                                    options={WORK_MODE_OPTIONS}
                                  />
                                </Form.Item>
                              </Col>
                            )}

                            {showCity && (
                              <Col xs={24} sm={showWorkMode ? 12 : 24}>
                                <Form.Item name="currentCity" label="Current City / Location">
                                  <Input size="large" placeholder="e.g. Mumbai, Navi Mumbai..." />
                                </Form.Item>
                              </Col>
                            )}
                          </Row>
                        )}

                        {/* Duration & Start Date */}
                        {(showDuration || showStartDate) && (
                          <Row gutter={[16, 0]}>
                            {showDuration && (
                              <Col xs={24} sm={showStartDate ? 12 : 24}>
                                <Form.Item
                                  name="duration"
                                  label="Duration & Stipend"
                                  extra="Stipend: As per MESCO Trust Policy (publish only when confirmed)"
                                >
                                  <Select
                                    size="large"
                                    placeholder="Select duration..."
                                    popupClassName="internship-upload-dropdown"
                                    options={DURATION_OPTIONS}
                                  />
                                </Form.Item>
                              </Col>
                            )}

                            {showStartDate && (
                              <Col xs={24} sm={showDuration ? 12 : 24}>
                                <Form.Item name="startDate" label="Start Date / Availability">
                                  <Input size="large" placeholder="e.g. Immediately or DD/MM/YYYY" />
                                </Form.Item>
                              </Col>
                            )}
                          </Row>
                        )}

                        {/* Description & Responsibilities / Statement of Interest */}
                        {showDescription && (
                          <Row gutter={[16, 0]}>
                            <Col span={24}>
                              <Form.Item
                                name="statement"
                                label="Description & Responsibilities of Interest"
                                extra="Describe why you want to intern at MESCO Trust and which responsibilities you want to take on"
                              >
                                <TextArea
                                  size="large"
                                  rows={4}
                                  placeholder="Enter your statement of interest or preferred responsibilities..."
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}

                        {/* Resume / CV Dragger */}
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
                                <p
                                  className="ant-upload-text"
                                  style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}
                                >
                                  Click or drag Resume / CV file to this area to upload
                                </p>
                                <p
                                  className="ant-upload-hint"
                                  style={{ fontSize: 12, margin: 0, color: "rgba(0,0,0,0.55)" }}
                                >
                                  PDF, DOC, DOCX up to {maxFileSizeMB}MB
                                </p>
                              </Dragger>
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Consent Checkbox */}
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
                                  I declare that the information provided is accurate and agree to MESCO Trust processing my application for the internship programme.
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
