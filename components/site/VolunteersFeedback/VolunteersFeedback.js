"use client";

import { useEffect, useState } from "react";
import { Col, Row, notification } from "antd";
import styled from "styled-components";
import {
  hasMinText,
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeText,
} from "@/lib/formValidation";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";
import { DEFAULT_VOLUNTEERS_FEEDBACK_PROPS } from "./constants";

function text(value, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}

function num(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const lower = Number.isFinite(min) ? min : n;
  const upper = Number.isFinite(max) ? max : n;
  return Math.max(lower, Math.min(upper, n));
}

function legacyNumber(value, oldValue, newValue) {
  return value === oldValue ? newValue : value;
}

function colorFromKey(key, fallback) {
  const colorKey = text(key);
  if (!colorKey) return fallback;
  return getColor(colorKey) || fallback;
}

export default function VolunteersFeedback(props = {}) {
  const [theme, setTheme] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const hasComponentProps = Object.keys(props || {}).some(
    (key) =>
      key === "mainTitle" ||
      key === "subTitle" ||
      key === "titleColorKey" ||
      key.startsWith("volunteersFeedback"),
  );

  useEffect(() => {
    if (hasComponentProps) return;
    fetch("/api/theme/VolunteersFeedback", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTheme(data && typeof data === "object" ? data : null))
      .catch(() => setTheme(null));
  }, [hasComponentProps]);

  const raw = hasComponentProps ? props : theme || {};
  const values = { ...DEFAULT_VOLUNTEERS_FEEDBACK_PROPS, ...raw };

  const mainTitle = text(
    values.mainTitle,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.mainTitle,
  );
  const subTitle = text(
    values.subTitle,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.subTitle,
  );
  const description = text(
    values.volunteersFeedbackDescription,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackDescription,
  );

  const titleEnabled = values.volunteersFeedbackTitleEnabled !== false;
  const subTitleEnabled = values.volunteersFeedbackSubTitleEnabled !== false;
  const descriptionEnabled =
    values.volunteersFeedbackDescriptionEnabled !== false;

  const nameLabel = text(
    values.volunteersFeedbackNameLabel,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackNameLabel,
  );
  const emailLabel = text(
    values.volunteersFeedbackEmailLabel,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackEmailLabel,
  );
  const phoneLabel = text(
    values.volunteersFeedbackPhoneLabel,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackPhoneLabel,
  );
  const messageLabel = text(
    values.volunteersFeedbackMessageLabel,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackMessageLabel,
  );

  const namePlaceholder = text(
    values.volunteersFeedbackNamePlaceholder,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackNamePlaceholder,
  );
  const emailPlaceholder = text(
    values.volunteersFeedbackEmailPlaceholder,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackEmailPlaceholder,
  );
  const phonePlaceholder = text(
    values.volunteersFeedbackPhonePlaceholder,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackPhonePlaceholder,
  );
  const messagePlaceholder = text(
    values.volunteersFeedbackMessagePlaceholder,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackMessagePlaceholder,
  );

  const submitText = text(
    values.volunteersFeedbackSubmitText,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubmitText,
  );
  const submittingText = text(
    values.volunteersFeedbackSubmittingText,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubmittingText,
  );
  const requiredMarker = text(
    values.volunteersFeedbackRequiredMarker,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackRequiredMarker,
  );

  const successTitle = text(
    values.volunteersFeedbackSuccessTitle,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSuccessTitle,
  );
  const successMessage = text(
    values.volunteersFeedbackSuccessMessage,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSuccessMessage,
  );
  const failureTitle = text(
    values.volunteersFeedbackFailureTitle,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackFailureTitle,
  );
  const failureMessage = text(
    values.volunteersFeedbackFailureMessage,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackFailureMessage,
  );

  const errorNameRequired = text(
    values.volunteersFeedbackErrorNameRequired,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorNameRequired,
  );
  const errorNameInvalid = text(
    values.volunteersFeedbackErrorNameInvalid,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorNameInvalid,
  );
  const errorEmailRequired = text(
    values.volunteersFeedbackErrorEmailRequired,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorEmailRequired,
  );
  const errorEmailInvalid = text(
    values.volunteersFeedbackErrorEmailInvalid,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorEmailInvalid,
  );
  const errorPhoneRequired = text(
    values.volunteersFeedbackErrorPhoneRequired,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorPhoneRequired,
  );
  const errorPhoneInvalid = text(
    values.volunteersFeedbackErrorPhoneInvalid,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorPhoneInvalid,
  );
  const errorMessageRequired = text(
    values.volunteersFeedbackErrorMessageRequired,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorMessageRequired,
  );
  const errorMessageMin = text(
    values.volunteersFeedbackErrorMessageMin,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackErrorMessageMin,
  );

  const messageMinLength = num(
    values.volunteersFeedbackMessageMinLength,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackMessageMinLength,
    1,
    200,
  );

  const submissionPage = text(values.volunteersFeedbackPageValue, "");
  const submissionSource = text(
    values.volunteersFeedbackSourceValue,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSourceValue,
  );

  const heroBgDesktop = text(
    values.volunteersFeedbackHeroBgDesktop,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackHeroBgDesktop,
  );
  const heroBgMobile = text(values.volunteersFeedbackHeroBgMobile, "");
  const heroOverlay = text(
    values.volunteersFeedbackHeroOverlay,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackHeroOverlay,
  );
  const heroMinHeight = num(
    values.volunteersFeedbackHeroMinHeight,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackHeroMinHeight,
    160,
    900,
  );
  const heroMinHeightMobile = num(
    values.volunteersFeedbackHeroMinHeightMobile,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackHeroMinHeightMobile,
    120,
    700,
  );

  const cardMaxWidth = num(
    values.volunteersFeedbackCardMaxWidth,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackCardMaxWidth,
    600,
    1800,
  );
  const cardOverlap = num(
    values.volunteersFeedbackCardOverlap,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackCardOverlap,
    0,
    220,
  );
  const cardRadiusRaw = num(
    values.volunteersFeedbackCardRadius,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackCardRadius,
    0,
    60,
  );
  const cardPaddingRaw = num(
    values.volunteersFeedbackCardPadding,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackCardPadding,
    12,
    80,
  );
  const cardShadow = text(
    values.volunteersFeedbackCardShadow,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackCardShadow,
  );
  const fieldGapRaw = num(
    values.volunteersFeedbackFieldGap,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackFieldGap,
    8,
    36,
  );
  const gridColumnGap = num(
    values.volunteersFeedbackGridColumnGap,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackGridColumnGap,
    8,
    40,
  );
  const gridRowGapRaw = num(
    values.volunteersFeedbackGridRowGap,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackGridRowGap,
    8,
    40,
  );
  const inputHeightRaw = num(
    values.volunteersFeedbackInputHeight,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackInputHeight,
    36,
    90,
  );
  const textAreaMinHeight = num(
    values.volunteersFeedbackTextAreaMinHeight,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackTextAreaMinHeight,
    54,
    300,
  );
  const submitRadiusRaw = num(
    values.volunteersFeedbackSubmitRadius,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubmitRadius,
    0,
    40,
  );
  const submitPaddingYRaw = num(
    values.volunteersFeedbackSubmitPaddingY,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubmitPaddingY,
    6,
    24,
  );
  const submitPaddingXRaw = num(
    values.volunteersFeedbackSubmitPaddingX,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubmitPaddingX,
    10,
    48,
  );

  const subTitleSize = num(
    values.volunteersFeedbackSubTitleSize,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubTitleSize,
    11,
    40,
  );
  const subTitleWeight = num(
    values.volunteersFeedbackSubTitleWeight,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackSubTitleWeight,
    300,
    900,
  );
  const titleSizeRaw = num(
    values.volunteersFeedbackTitleSize,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackTitleSize,
    15,
    56,
  );
  const titleLineHeight = num(
    values.volunteersFeedbackTitleLineHeight,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackTitleLineHeight,
    1,
    2.2,
  );
  const descriptionSizeRaw = num(
    values.volunteersFeedbackDescriptionSize,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackDescriptionSize,
    11,
    32,
  );
  const descriptionLineHeight = num(
    values.volunteersFeedbackDescriptionLineHeight,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackDescriptionLineHeight,
    1,
    2.2,
  );
  const labelSize = num(
    values.volunteersFeedbackLabelSize,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackLabelSize,
    10,
    30,
  );
  const inputFontSize = num(
    values.volunteersFeedbackInputFontSize,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackInputFontSize,
    11,
    24,
  );
  const buttonFontSizeRaw = num(
    values.volunteersFeedbackButtonFontSize,
    DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackButtonFontSize,
    11,
    28,
  );
  const cardRadius = legacyNumber(cardRadiusRaw, 20, 18);
  const cardPadding = legacyNumber(cardPaddingRaw, 32, 30);
  const fieldGap = legacyNumber(fieldGapRaw, 16, 14);
  const gridRowGap = legacyNumber(gridRowGapRaw, 14, 10);
  const inputHeight = legacyNumber(inputHeightRaw, 44, 42);
  const submitRadius = legacyNumber(submitRadiusRaw, 12, 10);
  const submitPaddingY = legacyNumber(submitPaddingYRaw, 10, 9);
  const submitPaddingX = legacyNumber(submitPaddingXRaw, 18, 16);
  const titleSize = legacyNumber(titleSizeRaw, 31, 16);
  const descriptionSize = legacyNumber(descriptionSizeRaw, 17, 14);
  const buttonFontSize = legacyNumber(buttonFontSizeRaw, 20, 16);

  const subTitleColor = colorFromKey(
    values.volunteersFeedbackSubTitleColorKey,
    "rgba(0, 0, 0, 0.85)",
  );
  const titleColor = colorFromKey(values.titleColorKey, "rgba(0, 0, 0, 0.88)");
  const descriptionColor = colorFromKey(
    values.volunteersFeedbackDescriptionColorKey,
    "rgba(0, 0, 0, 0.78)",
  );
  const cardBgColor = colorFromKey(
    values.volunteersFeedbackCardBgColorKey,
    "#ffffff",
  );
  const cardBorderColor = colorFromKey(
    values.volunteersFeedbackCardBorderColorKey,
    "rgba(15, 23, 42, 0.08)",
  );
  const labelColor = colorFromKey(
    values.volunteersFeedbackLabelColorKey,
    "rgba(0, 0, 0, 0.88)",
  );
  const inputBgColor = colorFromKey(
    values.volunteersFeedbackInputBgColorKey,
    "#ffffff",
  );
  const inputBorderColor = colorFromKey(
    values.volunteersFeedbackInputBorderColorKey,
    "rgba(15, 23, 42, 0.14)",
  );
  const inputTextColor = colorFromKey(
    values.volunteersFeedbackInputTextColorKey,
    "rgba(15, 23, 42, 0.9)",
  );
  const placeholderColor = colorFromKey(
    values.volunteersFeedbackPlaceholderColorKey,
    "rgba(15, 23, 42, 0.42)",
  );
  const errorColor = colorFromKey(
    values.volunteersFeedbackErrorColorKey,
    "#E03C33",
  );
  const buttonBgColor = colorFromKey(
    values.volunteersFeedbackButtonBgColorKey,
    getColor("gradient"),
  );
  const buttonTextColor = colorFromKey(
    values.volunteersFeedbackButtonTextColorKey,
    "#ffffff",
  );
  const requiredStarColor = colorFromKey(
    values.volunteersFeedbackRequiredStarColorKey,
    errorColor,
  );

  const sectionBgType = text(values.volunteersFeedbackSectionBgType, "default");
  const sectionBgImage = text(values.volunteersFeedbackSectionBgImage, "");
  const sectionBgColorKey = text(
    values.volunteersFeedbackSectionBgColorKey,
    "",
  );
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;

  const sectionPaddingTop =
    values.volunteersFeedbackSectionPaddingTop != null
      ? Number(values.volunteersFeedbackSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    values.volunteersFeedbackSectionPaddingBottom != null
      ? Number(values.volunteersFeedbackSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    values.volunteersFeedbackSectionMarginTop != null
      ? Number(values.volunteersFeedbackSectionMarginTop)
      : null;
  const sectionMarginBottom =
    values.volunteersFeedbackSectionMarginBottom != null
      ? Number(values.volunteersFeedbackSectionMarginBottom)
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgType = text(
    values.volunteersFeedbackPageContainerBgType,
    "default",
  );
  const pageContainerBgImage = text(
    values.volunteersFeedbackPageContainerBgImage,
    "",
  );
  const pageContainerBgColorKey = text(
    values.volunteersFeedbackPageContainerBgColorKey,
    "",
  );
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;

  const containerPaddingTop =
    values.volunteersFeedbackPageContainerPaddingTop != null
      ? Number(values.volunteersFeedbackPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    values.volunteersFeedbackPageContainerPaddingRight != null
      ? Number(values.volunteersFeedbackPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    values.volunteersFeedbackPageContainerPaddingBottom != null
      ? Number(values.volunteersFeedbackPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    values.volunteersFeedbackPageContainerPaddingLeft != null
      ? Number(values.volunteersFeedbackPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    values.volunteersFeedbackPageContainerMarginTop != null
      ? Number(values.volunteersFeedbackPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    values.volunteersFeedbackPageContainerMarginBottom != null
      ? Number(values.volunteersFeedbackPageContainerMarginBottom)
      : null;
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
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  const sectionStyleVars = {
    "--vf-card-bg": cardBgColor,
    "--vf-card-border": cardBorderColor,
    "--vf-card-shadow": cardShadow,
    "--vf-label-color": labelColor,
    "--vf-required-color": requiredStarColor,
    "--vf-input-bg": inputBgColor,
    "--vf-input-border": inputBorderColor,
    "--vf-input-text": inputTextColor,
    "--vf-placeholder": placeholderColor,
    "--vf-error": errorColor,
    "--vf-button-bg": buttonBgColor,
    "--vf-button-text": buttonTextColor,
    "--vf-card-radius": `${cardRadius}px`,
    "--vf-card-padding": `${cardPadding}px`,
    "--vf-field-gap": `${fieldGap}px`,
    "--vf-grid-col-gap": `${gridColumnGap}px`,
    "--vf-grid-row-gap": `${gridRowGap}px`,
    "--vf-input-height": `${inputHeight}px`,
    "--vf-textarea-min-height": `${textAreaMinHeight}px`,
    "--vf-button-radius": `${submitRadius}px`,
    "--vf-button-py": `${submitPaddingY}px`,
    "--vf-button-px": `${submitPaddingX}px`,
    "--vf-subtitle-size": `${subTitleSize}px`,
    "--vf-subtitle-weight": String(subTitleWeight),
    "--vf-title-size": `${titleSize}px`,
    "--vf-title-line-height": String(titleLineHeight),
    "--vf-description-size": `${descriptionSize}px`,
    "--vf-description-line-height": String(descriptionLineHeight),
    "--vf-label-size": `${labelSize}px`,
    "--vf-input-font-size": `${inputFontSize}px`,
    "--vf-button-font-size": `${buttonFontSize}px`,
    "--vf-subtitle-color": subTitleColor,
    "--vf-title-color": titleColor,
    "--vf-description-color": descriptionColor,
    "--vf-card-max-width": `${cardMaxWidth}px`,
    "--vf-card-overlap": `${cardOverlap}px`,
    "--vf-hero-height": `${heroMinHeight}px`,
    "--vf-hero-height-mobile": `${heroMinHeightMobile}px`,
    "--vf-hero-overlay":
      heroOverlay ||
      DEFAULT_VOLUNTEERS_FEEDBACK_PROPS.volunteersFeedbackHeroOverlay,
  };

  const clearFieldError = (fieldName) => {
    if (!errors[fieldName]) return;
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    clearFieldError(fieldName);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      name: normalizeText(formData.name),
      email: normalizeText(formData.email),
      phone: normalizeText(formData.phone),
      message: normalizeText(formData.message),
      page:
        submissionPage ||
        (typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : ""),
      source: submissionSource,
      volunteersFeedbackTrap: "",
    };

    const nextErrors = {};
    if (!payload.name) nextErrors.name = errorNameRequired;
    else if (!isValidName(payload.name)) nextErrors.name = errorNameInvalid;
    if (!payload.email) nextErrors.email = errorEmailRequired;
    else if (!isValidEmail(payload.email)) nextErrors.email = errorEmailInvalid;
    if (!payload.phone) nextErrors.phone = errorPhoneRequired;
    else if (!isValidPhone(payload.phone)) nextErrors.phone = errorPhoneInvalid;
    if (!payload.message) nextErrors.message = errorMessageRequired;
    else if (!hasMinText(payload.message, messageMinLength)) {
      nextErrors.message = errorMessageMin;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/volunteers-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out?.success) {
        notification.error({
          message: failureTitle,
          description: out?.error || failureMessage,
          placement: "bottomRight",
        });
        return;
      }
      notification.success({
        message: successTitle,
        description: out?.message || successMessage,
        placement: "bottomRight",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setErrors({});
      window.dispatchEvent(new Event("new-volunteers-feedback-submission"));
    } catch {
      notification.error({
        message: failureTitle,
        description: failureMessage,
        placement: "bottomRight",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <VolunteersFeedbackRoot style={sectionStyleVars}>
        <HeroBanner $bgDesktop={heroBgDesktop} $bgMobile={heroBgMobile} />

        <FeedbackContainer style={pageContainerBgStyle}>
          <FeedbackCard>
            <FeedbackHeader>
              {subTitleEnabled && subTitle ? (
                <HeaderSubTitle>{subTitle}</HeaderSubTitle>
              ) : null}
              {titleEnabled && mainTitle ? (
                <HeaderTitle>{mainTitle}</HeaderTitle>
              ) : null}
              {descriptionEnabled && description ? (
                <HeaderDescription>{description}</HeaderDescription>
              ) : null}
            </FeedbackHeader>

            <FeedbackForm onSubmit={handleSubmit} noValidate>
              <Row gutter={[gridColumnGap, gridRowGap]}>
                <Col xs={24} md={8}>
                  <FieldWrap>
                    <FieldLabel>
                      {nameLabel} <RequiredMark>{requiredMarker}</RequiredMark>
                    </FieldLabel>
                    <FieldInput
                      type="text"
                      value={formData.name}
                      placeholder={namePlaceholder}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      $hasError={Boolean(errors.name)}
                    />
                    {errors.name ? (
                      <FieldError>{errors.name}</FieldError>
                    ) : null}
                  </FieldWrap>
                </Col>
                <Col xs={24} md={8}>
                  <FieldWrap>
                    <FieldLabel>
                      {emailLabel} <RequiredMark>{requiredMarker}</RequiredMark>
                    </FieldLabel>
                    <FieldInput
                      type="email"
                      value={formData.email}
                      placeholder={emailPlaceholder}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      $hasError={Boolean(errors.email)}
                    />
                    {errors.email ? (
                      <FieldError>{errors.email}</FieldError>
                    ) : null}
                  </FieldWrap>
                </Col>
                <Col xs={24} md={8}>
                  <FieldWrap>
                    <FieldLabel>
                      {phoneLabel} <RequiredMark>{requiredMarker}</RequiredMark>
                    </FieldLabel>
                    <FieldInput
                      type="tel"
                      value={formData.phone}
                      placeholder={phonePlaceholder}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      $hasError={Boolean(errors.phone)}
                    />
                    {errors.phone ? (
                      <FieldError>{errors.phone}</FieldError>
                    ) : null}
                  </FieldWrap>
                </Col>
                <Col xs={24}>
                  <FieldWrap>
                    <FieldLabel>
                      {messageLabel}{" "}
                      <RequiredMark>{requiredMarker}</RequiredMark>
                    </FieldLabel>
                    <FieldTextArea
                      value={formData.message}
                      placeholder={messagePlaceholder}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      $hasError={Boolean(errors.message)}
                    />
                    {errors.message ? (
                      <FieldError>{errors.message}</FieldError>
                    ) : null}
                  </FieldWrap>
                </Col>
              </Row>

              <SubmitWrap>
                <SubmitButton type="submit" disabled={submitting}>
                  {submitting ? submittingText : submitText}
                </SubmitButton>
              </SubmitWrap>
            </FeedbackForm>
          </FeedbackCard>
        </FeedbackContainer>
      </VolunteersFeedbackRoot>
    </FullWidthBackground>
  );
}

const VolunteersFeedbackRoot = styled.div`
  width: 100%;
`;

const HeroBanner = styled.div`
  position: relative;
  min-height: var(--vf-hero-height);
  width: 100%;
  background-color: #2f2f2f;
  background-image: ${(p) => (p.$bgDesktop ? `url(${p.$bgDesktop})` : "none")};
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;

  @media (max-width: 768px) {
    min-height: var(--vf-hero-height-mobile);
    background-image: ${(p) =>
      p.$bgMobile
        ? `url(${p.$bgMobile})`
        : p.$bgDesktop
          ? `url(${p.$bgDesktop})`
          : "none"};
  }
`;

const FeedbackContainer = styled(PageContainer)`
  position: relative;
  z-index: 3;
  padding-top: 0;
  padding-bottom: 28px;
  margin-top: calc(var(--vf-card-overlap) * -1);

  @media (max-width: 991px) {
    margin-top: calc(var(--vf-card-overlap) * -0.8);
    padding-bottom: 20px;
  }

  @media (max-width: 768px) {
    margin-top: calc(var(--vf-card-overlap) * -0.65);
    padding-top: 0;
    padding-bottom: 12px;
  }
`;

const FeedbackCard = styled.div`
  position: relative;
  z-index: 2;
  margin: 0 auto;
  max-width: var(--vf-card-max-width);
  width: 100%;
  background: var(--vf-card-bg);
  border: 1px solid var(--vf-card-border);
  border-radius: var(--vf-card-radius);
  box-shadow: var(--vf-card-shadow);
  padding: var(--vf-card-padding);

  @media (max-width: 991px) {
    padding: calc(var(--vf-card-padding) - 6px);
  }

  @media (max-width: 768px) {
    padding: calc(var(--vf-card-padding) - 12px);
    border-radius: calc(var(--vf-card-radius) - 4px);
  }
`;

const FeedbackHeader = styled.div`
  margin-bottom: 14px;
`;

const HeaderSubTitle = styled.p`
  margin: 0 0 6px;
  color: var(--vf-subtitle-color);
  font-size: var(--vf-subtitle-size);
  font-weight: var(--vf-subtitle-weight);
  line-height: 1.3;
`;

const HeaderTitle = styled.h2`
  margin: 0 0 10px;
  color: var(--vf-title-color);
  font-size: var(--vf-title-size);
  font-weight: 600;
  line-height: var(--vf-title-line-height);
`;

const HeaderDescription = styled.p`
  margin: 0;
  color: var(--vf-description-color);
  font-size: var(--vf-description-size);
  line-height: var(--vf-description-line-height);
`;

const FeedbackForm = styled.form`
  margin-top: 4px;
`;

const FieldWrap = styled.div`
  margin-bottom: var(--vf-field-gap);

  @media (max-width: 768px) {
    margin-bottom: calc(var(--vf-field-gap) - 2px);
  }
`;

const FieldLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  color: var(--vf-label-color);
  font-size: var(--vf-label-size);
  font-weight: 500;
  line-height: 1.35;
`;

const RequiredMark = styled.span`
  color: var(--vf-required-color);
`;

const FieldInput = styled.input`
  width: 100%;
  height: var(--vf-input-height);
  border-radius: 9px;
  border: 1px solid
    ${(p) => (p.$hasError ? "var(--vf-error)" : "var(--vf-input-border)")};
  background: var(--vf-input-bg);
  color: var(--vf-input-text);
  padding: 10px 12px;
  font-size: var(--vf-input-font-size);
  line-height: 1.4;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: var(--vf-input-border);
    box-shadow: 0 0 0 3px rgba(224, 60, 51, 0.1);
  }

  &::placeholder {
    color: var(--vf-placeholder);
  }

  @media (max-width: 640px) {
    font-size: 16px;
  }
`;

const FieldTextArea = styled.textarea`
  width: 100%;
  min-height: var(--vf-textarea-min-height);
  border-radius: 9px;
  border: 1px solid
    ${(p) => (p.$hasError ? "var(--vf-error)" : "var(--vf-input-border)")};
  background: var(--vf-input-bg);
  color: var(--vf-input-text);
  padding: 11px 12px;
  font-size: var(--vf-input-font-size);
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: var(--vf-input-border);
    box-shadow: 0 0 0 3px rgba(224, 60, 51, 0.1);
  }

  &::placeholder {
    color: var(--vf-placeholder);
  }

  @media (max-width: 640px) {
    font-size: 16px;
  }
`;

const FieldError = styled.div`
  margin-top: 6px;
  color: var(--vf-error);
  font-size: 12px;
  line-height: 1.35;
`;

const SubmitWrap = styled.div`
  margin-top: 2px;
`;

const SubmitButton = styled.button`
  border: 0;
  border-radius: var(--vf-button-radius);
  background: var(--vf-button-bg);
  color: var(--vf-button-text);
  padding: var(--vf-button-py) var(--vf-button-px);
  font-size: var(--vf-button-font-size);
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 640px) {
    width: 100%;
    text-align: center;
  }
`;
