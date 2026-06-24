"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Checkbox, Col, ConfigProvider, Row, notification } from "antd";
import styled from "styled-components";
import { submitContact } from "@/app/actions/contact";
import { FullWidthBackground, PageContainer, getColor } from "@/styles/Theme";
import {
  hasMinText,
  isValidAge,
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeText,
} from "@/lib/formValidation";

function text(value, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function colorFromKey(keyValue, fallback) {
  const key = text(keyValue);
  return key ? getColor(key) : fallback;
}

function listFromValue(value, separator = ",") {
  return text(value)
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

const Wrapper = styled.div`
  --volunteer-placeholder-color: rgba(0, 0, 0, 0.35);
  --volunteer-focus-border-color: rgba(0, 0, 0, 0.32);
  --volunteer-field-gap: 14px;
  --volunteer-areas-column-gap: 12px;
  --volunteer-areas-row-gap: 8px;
  --volunteer-input-min-height: 42px;
  --volunteer-textarea-min-height: 78px;
  --volunteer-area-cols-desktop: 3;
  --volunteer-area-cols-tablet: 2;
  --volunteer-area-cols-mobile: 1;
  --volunteer-side-title-size: 36px;
  --volunteer-side-title-line-height: 1.12;
  --volunteer-side-description-size: 14px;
  --volunteer-side-item-size: 13px;
  --volunteer-label-size: 13px;
  --volunteer-input-size: 14px;
  --volunteer-required-color: #cf372f;
  --volunteer-error-color: #cf372f;

  .volunteer-shell {
    align-items: stretch;
  }

  .volunteer-form-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
    padding: 24px;
    height: 100%;
  }

  .volunteer-field {
    margin-bottom: var(--volunteer-field-gap);
  }

  .volunteer-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: var(--volunteer-label-size);
    line-height: 1.4;
    color: rgba(0, 0, 0, 0.85);
  }

  .required-star {
    color: var(--volunteer-required-color);
  }

  .volunteer-error {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--volunteer-error-color);
  }

  .volunteer-input {
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    padding: 10px 12px;
    min-height: var(--volunteer-input-min-height);
    font-size: var(--volunteer-input-size);
    line-height: 1.4;
    background: #fff;
    color: rgba(0, 0, 0, 0.88);
    outline: none;
    transition: border-color 0.2s ease;
  }

  .volunteer-input:focus {
    border-color: var(--volunteer-focus-border-color);
  }

  .volunteer-input::placeholder {
    color: var(--volunteer-placeholder-color);
  }

  .volunteer-textarea {
    resize: vertical;
    min-height: var(--volunteer-textarea-min-height);
  }

  .volunteer-areas {
    display: grid;
    grid-template-columns: repeat(
      var(--volunteer-area-cols-desktop),
      minmax(0, 1fr)
    );
    column-gap: var(--volunteer-areas-column-gap);
    row-gap: var(--volunteer-areas-row-gap);
  }

  .volunteer-checkbox {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.78);
    line-height: 1.3;
  }

  .volunteer-checkbox .ant-checkbox + span {
    padding-inline-start: 8px;
    color: inherit;
  }

  .volunteer-submit {
    border: none;
    border-radius: 10px;
    min-height: 44px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    transition: opacity 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .volunteer-submit-icon {
    display: block;
    object-fit: contain;
  }

  .volunteer-submit:hover {
    opacity: 0.9;
  }

  .volunteer-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .volunteer-side-card {
    border-radius: 14px;
    padding: 24px;
    min-height: 80px;
    color: #fff;
    border: 1px solid transparent;
    background: linear-gradient(148deg, #cf372f 0%, #741f1b 100%);
  }

  .volunteer-side-title {
    margin: 0 0 10px 0;
    font-size: var(--volunteer-side-title-size);
    line-height: var(--volunteer-side-title-line-height);
    font-weight: 500;
    color: inherit;
  }

  .volunteer-side-description {
    margin: 0 0 14px 0;
    font-size: var(--volunteer-side-description-size);
    line-height: 1.5;
    color: inherit;
    opacity: 0.95;
  }

  .volunteer-side-list {
    margin: 0;
    padding-left: 18px;
  }

  .volunteer-side-list li {
    font-size: var(--volunteer-side-item-size);
    line-height: 1.6;
    margin-bottom: 8px;
    color: inherit;
  }

  .volunteer-side-list li::marker {
    color: var(--volunteer-bullet-color, #fff);
  }

  .volunteer-side-list--icon {
    list-style: none;
    padding-left: 0;
  }

  .volunteer-side-list--icon li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  .volunteer-side-bullet-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
    margin-top: 3px;
    flex: 0 0 auto;
  }

  @media (max-width: 991px) {
    .volunteer-side-title {
      font-size: calc(var(--volunteer-side-title-size) - 6px);
    }
    .volunteer-areas {
      grid-template-columns: repeat(
        var(--volunteer-area-cols-tablet),
        minmax(0, 1fr)
      );
    }
  }

  @media (max-width: 767px) {
    .volunteer-form-card,
    .volunteer-side-card {
      padding: 16px;
      border-radius: 12px;
    }
    .volunteer-side-title {
      font-size: calc(var(--volunteer-side-title-size) - 10px);
    }
    .volunteer-areas {
      grid-template-columns: repeat(
        var(--volunteer-area-cols-mobile),
        minmax(0, 1fr)
      );
      gap: 8px;
    }
  }
`;

function VolunteerSubmitButton({
  label,
  pendingLabel,
  background,
  textColor,
  iconUrl,
  iconAlt,
  iconSize,
  iconGap,
  radius,
  paddingY,
  paddingX,
  fontSize,
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="volunteer-submit"
      style={{
        background,
        color: textColor,
        borderRadius: radius,
        padding: `${paddingY}px ${paddingX}px`,
        fontSize: `${fontSize}px`,
        gap: `${iconGap}px`,
      }}
      disabled={pending}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={iconAlt || "Submit icon"}
          className="volunteer-submit-icon"
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        />
      ) : null}
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}

export default function Volunteer(props = {}) {
  const [state, formAction] = useFormState(submitContact, null);
  const formRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  const pageValue = text(props?.volunteerPageValue, "volunteer");
  const sourceValue = text(props?.volunteerSourceValue, "volunteer-form");
  const subjectLine = text(
    props?.volunteerSubjectLine,
    "Volunteer Application",
  );

  const successTitle = text(props?.volunteerSuccessTitle, "Success");
  const successMessage = text(
    props?.volunteerSuccessMessage,
    "Volunteer request submitted successfully.",
  );
  const failureTitle = text(props?.volunteerFailureTitle, "Submission failed");
  const failureMessage = text(
    props?.volunteerFailureMessage,
    "Unable to submit the volunteer form. Please try again.",
  );

  const fullNameLabel = text(props?.volunteerFullNameLabel, "Full Name");
  const fullNamePlaceholder = text(
    props?.volunteerFullNamePlaceholder,
    "Enter your full name",
  );
  const emailLabel = text(props?.volunteerEmailLabel, "Email Address");
  const emailPlaceholder = text(
    props?.volunteerEmailPlaceholder,
    "your.email@example.com",
  );
  const phoneLabel = text(props?.volunteerPhoneLabel, "Phone Number");
  const phonePlaceholder = text(
    props?.volunteerPhonePlaceholder,
    "+91 98765 43210",
  );
  const ageLabel = text(props?.volunteerAgeLabel, "Age");
  const agePlaceholder = text(props?.volunteerAgePlaceholder, "18");
  const educationLabel = text(props?.volunteerEducationLabel, "Education");
  const educationPlaceholder = text(
    props?.volunteerEducationPlaceholder,
    "Highest qualification",
  );
  const occupationLabel = text(
    props?.volunteerOccupationLabel,
    "Current Occupation",
  );
  const occupationPlaceholder = text(
    props?.volunteerOccupationPlaceholder,
    "Student, Working Professional, etc.",
  );
  const availabilityLabel = text(
    props?.volunteerAvailabilityLabel,
    "Availability (Hours per month)",
  );
  const availabilityPlaceholder = text(
    props?.volunteerAvailabilityPlaceholder,
    "",
  );
  const areasLabel = text(
    props?.volunteerAreasLabel,
    "Areas of Interest (Select all that apply)",
  );
  const experienceLabel = text(
    props?.volunteerExperienceLabel,
    "Relevant Experience",
  );
  const experiencePlaceholder = text(
    props?.volunteerExperiencePlaceholder,
    "Share any relevant volunteering or social work experience...",
  );
  const motivationLabel = text(
    props?.volunteerMotivationLabel,
    "Why do you want to volunteer with MESCO?",
  );
  const motivationPlaceholder = text(
    props?.volunteerMotivationPlaceholder,
    "Tell us what motivates you to join our mission...",
  );
  const submitLabel = text(props?.volunteerSubmitLabel, "Submit Application");
  const submittingLabel = text(
    props?.volunteerSubmittingLabel,
    "Submitting...",
  );
  const requiredMarker = text(props?.volunteerRequiredMarker, "*");

  const areaOptions = listFromValue(
    props?.volunteerAreasOptions ??
      "Education Support,Health Awareness,Event Management,Administrative,Fundraising,Women Empowerment",
    ",",
  );

  const sideTitle = text(
    props?.volunteerChecklistTitle,
    "Eligibility Criteria",
  );
  const sideDescription = text(
    props?.volunteerChecklistDescription,
    "If you meet these criteria and are excited about making a difference, we'd love to have you on our team!",
  );
  const sideItems = listFromValue(
    props?.volunteerChecklistItems ??
      "Minimum Age: 18 years\nMinimum: High school (10th/12th pass)\nInterest in community development\nMinimum 5-10 hours/week\nTeamwork and collaboration\nClean background (no criminal record)\nWillingness to travel locally (if needed)",
    "\n",
  );
  const sideBulletIconUrl = text(props?.volunteerChecklistBulletIconUrl, "");
  const sideBulletIconAlt = text(
    props?.volunteerChecklistBulletIconAlt,
    "Bullet icon",
  );

  const submitIconUrl = text(props?.volunteerSubmitIconUrl, "");
  const submitIconAlt = text(props?.volunteerSubmitIconAlt, "Submit icon");

  const errorNameRequired = text(
    props?.volunteerErrorNameRequired,
    "Full name is required",
  );
  const errorNameInvalid = text(
    props?.volunteerErrorNameInvalid,
    "Name should contain alphabets only",
  );
  const errorEmailRequired = text(
    props?.volunteerErrorEmailRequired,
    "Email is required",
  );
  const errorEmailInvalid = text(
    props?.volunteerErrorEmailInvalid,
    "Please enter a valid email address",
  );
  const errorPhoneRequired = text(
    props?.volunteerErrorPhoneRequired,
    "Phone number is required",
  );
  const errorPhoneInvalid = text(
    props?.volunteerErrorPhoneInvalid,
    "Please enter a valid mobile number",
  );
  const errorAgeRequired = text(
    props?.volunteerErrorAgeRequired,
    "Age is required",
  );
  const errorAgeInvalid = text(
    props?.volunteerErrorAgeInvalid,
    "Please enter a valid age",
  );
  const errorAvailabilityRequired = text(
    props?.volunteerErrorAvailabilityRequired,
    "Availability is required",
  );
  const errorAvailabilityInvalid = text(
    props?.volunteerErrorAvailabilityInvalid,
    "Please enter valid hours",
  );
  const errorMotivationRequired = text(
    props?.volunteerErrorMotivationRequired,
    "This field is required",
  );
  const errorMotivationMin = text(
    props?.volunteerErrorMotivationMin,
    "Minimum 5 characters required",
  );

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      notification.success({
        message: successTitle,
        description: successMessage,
        placement: "bottomRight",
      });
      formRef.current?.reset();
      setValidationErrors({});
      window.dispatchEvent(new Event("new-contact-submission"));
      return;
    }
    if (state.error) {
      notification.error({
        message: failureTitle,
        description: state.error || failureMessage,
        placement: "bottomRight",
      });
    }
  }, [state, successTitle, successMessage, failureTitle, failureMessage]);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = normalizeText(formData.get("name"));
    const email = normalizeText(formData.get("email"));
    const phone = normalizeText(formData.get("phone"));
    const ageVal = normalizeText(formData.get("age"));
    const availabilityVal = normalizeText(formData.get("availability"));
    const motivationVal = normalizeText(formData.get("motivation"));

    const nextErrors = {};
    if (!name) nextErrors.name = errorNameRequired;
    if (name && !isValidName(name)) nextErrors.name = errorNameInvalid;
    if (!email) nextErrors.email = errorEmailRequired;
    if (email && !isValidEmail(email)) nextErrors.email = errorEmailInvalid;
    if (!phone) nextErrors.phone = errorPhoneRequired;
    if (phone && !isValidPhone(phone)) nextErrors.phone = errorPhoneInvalid;
    if (!ageVal) nextErrors.age = errorAgeRequired;
    if (ageVal && !isValidAge(ageVal)) nextErrors.age = errorAgeInvalid;
    if (!availabilityVal) nextErrors.availability = errorAvailabilityRequired;
    if (availabilityVal && !/^\d{1,3}$/.test(availabilityVal)) {
      nextErrors.availability = errorAvailabilityInvalid;
    }
    if (!motivationVal) nextErrors.motivation = errorMotivationRequired;
    if (motivationVal && !hasMinText(motivationVal, 5)) {
      nextErrors.motivation = errorMotivationMin;
    }

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setValidationErrors(nextErrors);
      return;
    }

    setValidationErrors({});

    const interests = formData
      .getAll("interest")
      .map((item) => text(item))
      .filter(Boolean);
    const education = text(formData.get("education"));
    const occupation = text(formData.get("occupation"));
    const experience = text(formData.get("experience"));
    const motivation = motivationVal;
    const availability = availabilityVal;

    const details = [
      `Age: ${ageVal || "-"}`,
      `Education: ${education || "-"}`,
      `Occupation: ${occupation || "-"}`,
      `Availability (hours/month): ${availability || "-"}`,
      `Areas of Interest: ${interests.length ? interests.join(", ") : "-"}`,
      `Relevant Experience: ${experience || "-"}`,
      "",
      "Motivation:",
      motivation || "-",
    ];

    const messageInput = form.querySelector('input[name="message"]');
    if (messageInput) {
      messageInput.value = details.join("\n");
    }
  };

  const formCardBgColorKey = text(props?.volunteerFormCardBgColorKey);
  const formCardBorderColorKey = text(props?.volunteerFormCardBorderColorKey);
  const labelColorKey = text(props?.volunteerLabelColorKey);
  const inputBgColorKey = text(props?.volunteerInputBgColorKey);
  const inputBorderColorKey = text(props?.volunteerInputBorderColorKey);
  const inputFocusBorderColorKey = text(
    props?.volunteerInputFocusBorderColorKey,
  );
  const inputTextColorKey = text(props?.volunteerInputTextColorKey);
  const placeholderColorKey = text(props?.volunteerPlaceholderColorKey);
  const checkboxColorKey = text(props?.volunteerCheckboxColorKey);
  const areasTextColorKey = text(props?.volunteerAreasTextColorKey);
  const requiredStarColorKey = text(props?.volunteerRequiredStarColorKey);
  const errorTextColorKey = text(props?.volunteerErrorTextColorKey);
  const submitBtnBgColorKey = text(props?.volunteerButtonBgColorKey);
  const submitBtnTextColorKey = text(props?.volunteerButtonTextColorKey);
  const sideBgColorKey = text(props?.volunteerChecklistBgColorKey);
  const sideTitleColorKey = text(props?.volunteerChecklistTitleColorKey);
  const sideTextColorKey = text(props?.volunteerChecklistTextColorKey);
  const sideBulletColorKey = text(props?.volunteerChecklistBulletColorKey);
  const sideCardBorderColorKey = text(
    props?.volunteerChecklistCardBorderColorKey,
  );

  const formCardBgColor = colorFromKey(formCardBgColorKey, "#ffffff");
  const formCardBorderColor = colorFromKey(
    formCardBorderColorKey,
    "rgba(0,0,0,0.08)",
  );
  const labelColor = colorFromKey(labelColorKey, "rgba(0,0,0,0.85)");
  const inputBgColor = colorFromKey(inputBgColorKey, "#ffffff");
  const inputBorderColor = colorFromKey(
    inputBorderColorKey,
    "rgba(0,0,0,0.12)",
  );
  const inputFocusBorderColor = colorFromKey(
    inputFocusBorderColorKey,
    "rgba(0,0,0,0.32)",
  );
  const inputTextColor = colorFromKey(inputTextColorKey, "rgba(0,0,0,0.88)");
  const placeholderColor = colorFromKey(
    placeholderColorKey,
    "rgba(0,0,0,0.35)",
  );
  const checkboxColor = colorFromKey(checkboxColorKey, getColor("primary"));
  const areasTextColor = colorFromKey(areasTextColorKey, labelColor);
  const requiredStarColor = colorFromKey(requiredStarColorKey, "#cf372f");
  const errorTextColor = colorFromKey(errorTextColorKey, "#cf372f");

  const submitCustomBackground = text(props?.volunteerButtonBackground);
  const submitBtnBgColor =
    submitCustomBackground ||
    colorFromKey(
      submitBtnBgColorKey,
      "linear-gradient(140deg, #b6342b 0%, #6f1f1b 100%)",
    );
  const submitBtnTextColor = colorFromKey(submitBtnTextColorKey, "#ffffff");

  const sideCustomBackground = text(props?.volunteerChecklistBackground);
  const sideBgColor =
    sideCustomBackground ||
    colorFromKey(
      sideBgColorKey,
      "linear-gradient(148deg, #cf372f 0%, #741f1b 100%)",
    );
  const sideTitleColor = colorFromKey(sideTitleColorKey, "#ffffff");
  const sideTextColor = colorFromKey(sideTextColorKey, "#ffffff");
  const sideBulletColor = colorFromKey(sideBulletColorKey, "#ffffff");
  const sideCardBorderColor = colorFromKey(
    sideCardBorderColorKey,
    "transparent",
  );

  const formCardRadius = clamp(props?.volunteerFormCardRadius, 0, 48, 14);
  const inputRadius = clamp(props?.volunteerInputRadius, 0, 24, 8);
  const sideCardRadius = clamp(props?.volunteerChecklistCardRadius, 0, 48, 14);
  const formCardPadding = clamp(props?.volunteerFormCardPadding, 8, 72, 24);
  const sideCardPadding = clamp(
    props?.volunteerChecklistCardPadding,
    8,
    72,
    24,
  );
  const fieldGap = clamp(props?.volunteerFieldGap, 6, 36, 14);
  const gridColumnGap = clamp(props?.volunteerGridColumnGap, 8, 36, 14);
  const gridRowGap = clamp(props?.volunteerGridRowGap, 4, 24, 8);
  const areasColumnGap = clamp(props?.volunteerAreasColumnGap, 4, 24, 12);
  const areasRowGap = clamp(props?.volunteerAreasRowGap, 4, 24, 8);
  const submitRadius = clamp(props?.volunteerSubmitRadius, 0, 40, 10);
  const submitPaddingY = clamp(props?.volunteerSubmitPaddingY, 6, 24, 11);
  const submitPaddingX = clamp(props?.volunteerSubmitPaddingX, 10, 40, 22);
  const submitFontSize = clamp(props?.volunteerSubmitFontSize, 12, 24, 15);
  const submitIconSize = clamp(props?.volunteerSubmitIconSize, 10, 36, 16);
  const submitIconGap = clamp(props?.volunteerSubmitIconGap, 4, 20, 8);
  const labelFontSize = clamp(props?.volunteerLabelFontSize, 11, 24, 13);
  const inputFontSize = clamp(props?.volunteerInputFontSize, 11, 24, 14);
  const inputMinHeight = clamp(props?.volunteerInputMinHeight, 32, 80, 42);
  const textareaMinHeight = clamp(
    props?.volunteerTextareaMinHeight,
    56,
    220,
    78,
  );
  const sideTitleSize = clamp(props?.volunteerChecklistTitleSize, 18, 56, 36);
  const sideTitleLineHeight = clamp(
    props?.volunteerChecklistTitleLineHeight,
    1,
    2,
    1.12,
  );
  const sideDescriptionSize = clamp(
    props?.volunteerChecklistDescriptionSize,
    11,
    24,
    14,
  );
  const sideItemSize = clamp(props?.volunteerChecklistItemSize, 11, 24, 13);
  const areaColsDesktop = clamp(props?.volunteerAreaColumnsDesktop, 1, 6, 3);
  const areaColsTablet = clamp(props?.volunteerAreaColumnsTablet, 1, 4, 2);
  const areaColsMobile = clamp(props?.volunteerAreaColumnsMobile, 1, 2, 1);
  const experienceRows = clamp(props?.volunteerExperienceRows, 2, 10, 3);
  const motivationRows = clamp(props?.volunteerMotivationRows, 2, 12, 4);
  const formColumnSpanLg = clamp(props?.volunteerFormColumnSpanLg, 10, 20, 16);
  const sideColumnSpanLg = 24 - formColumnSpanLg;

  const formCardCustomBackground = text(props?.volunteerFormCardBackground);
  const formCardBackground = formCardCustomBackground || formCardBgColor;

  const sectionBgType = text(props?.volunteerSectionBgType, "default");
  const sectionBgImage = text(props?.volunteerSectionBgImage, "");
  const sectionBgColorKey = text(props?.volunteerSectionBgColorKey, "");
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
    props?.volunteerSectionPaddingTop != null
      ? Number(props.volunteerSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.volunteerSectionPaddingBottom != null
      ? Number(props.volunteerSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.volunteerSectionMarginTop != null
      ? Number(props.volunteerSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.volunteerSectionMarginBottom != null
      ? Number(props.volunteerSectionMarginBottom)
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
    props?.volunteerPageContainerBgType,
    "default",
  );
  const pageContainerBgImage = text(props?.volunteerPageContainerBgImage, "");
  const pageContainerBgColorKey = text(
    props?.volunteerPageContainerBgColorKey,
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
    props?.volunteerPageContainerPaddingTop != null
      ? Number(props.volunteerPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.volunteerPageContainerPaddingRight != null
      ? Number(props.volunteerPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.volunteerPageContainerPaddingBottom != null
      ? Number(props.volunteerPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.volunteerPageContainerPaddingLeft != null
      ? Number(props.volunteerPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.volunteerPageContainerMarginTop != null
      ? Number(props.volunteerPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.volunteerPageContainerMarginBottom != null
      ? Number(props.volunteerPageContainerMarginBottom)
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

  const sharedInputStyle = {
    background: inputBgColor,
    borderColor: inputBorderColor,
    color: inputTextColor,
    borderRadius: inputRadius,
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Wrapper
          style={{
            "--volunteer-placeholder-color": placeholderColor,
            "--volunteer-focus-border-color": inputFocusBorderColor,
            "--volunteer-field-gap": `${fieldGap}px`,
            "--volunteer-areas-column-gap": `${areasColumnGap}px`,
            "--volunteer-areas-row-gap": `${areasRowGap}px`,
            "--volunteer-input-min-height": `${inputMinHeight}px`,
            "--volunteer-textarea-min-height": `${textareaMinHeight}px`,
            "--volunteer-area-cols-desktop": String(areaColsDesktop),
            "--volunteer-area-cols-tablet": String(areaColsTablet),
            "--volunteer-area-cols-mobile": String(areaColsMobile),
            "--volunteer-side-title-size": `${sideTitleSize}px`,
            "--volunteer-side-title-line-height": String(sideTitleLineHeight),
            "--volunteer-side-description-size": `${sideDescriptionSize}px`,
            "--volunteer-side-item-size": `${sideItemSize}px`,
            "--volunteer-label-size": `${labelFontSize}px`,
            "--volunteer-input-size": `${inputFontSize}px`,
            "--volunteer-required-color": requiredStarColor,
            "--volunteer-error-color": errorTextColor,
          }}
        >
          <Row gutter={[gridColumnGap, gridRowGap]} className="volunteer-shell">
            <Col xs={24} lg={formColumnSpanLg}>
              <div
                className="volunteer-form-card"
                style={{
                  background: formCardBackground,
                  borderColor: formCardBorderColor,
                  borderRadius: formCardRadius,
                  padding: `${formCardPadding}px`,
                }}
              >
                <form
                  ref={formRef}
                  action={formAction}
                  onSubmit={handleSubmit}
                  className="volunteer-form"
                  noValidate
                >
                  <input type="hidden" name="page" value={pageValue} readOnly />
                  <input
                    type="hidden"
                    name="source"
                    value={sourceValue}
                    readOnly
                  />
                  <input
                    type="hidden"
                    name="subject"
                    value={subjectLine}
                    readOnly
                  />
                  <input type="hidden" name="message" defaultValue="" />

                  <Row gutter={[gridColumnGap, gridRowGap]}>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {fullNameLabel}{" "}
                          <span className="required-star">
                            {requiredMarker}
                          </span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="name"
                          required
                          placeholder={fullNamePlaceholder}
                          onChange={() => {
                            if (validationErrors.name) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                name: "",
                              }));
                            }
                          }}
                        />
                        {validationErrors.name ? (
                          <div className="volunteer-error">
                            {validationErrors.name}
                          </div>
                        ) : null}
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {emailLabel}{" "}
                          <span className="required-star">
                            {requiredMarker}
                          </span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="email"
                          type="email"
                          required
                          placeholder={emailPlaceholder}
                          onChange={() => {
                            if (validationErrors.email) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                email: "",
                              }));
                            }
                          }}
                        />
                        {validationErrors.email ? (
                          <div className="volunteer-error">
                            {validationErrors.email}
                          </div>
                        ) : null}
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {phoneLabel}{" "}
                          <span className="required-star">
                            {requiredMarker}
                          </span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="phone"
                          inputMode="numeric"
                          required
                          placeholder={phonePlaceholder}
                          onChange={() => {
                            if (validationErrors.phone) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                phone: "",
                              }));
                            }
                          }}
                        />
                        {validationErrors.phone ? (
                          <div className="volunteer-error">
                            {validationErrors.phone}
                          </div>
                        ) : null}
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {ageLabel}{" "}
                          <span className="required-star">
                            {requiredMarker}
                          </span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="age"
                          inputMode="numeric"
                          required
                          placeholder={agePlaceholder}
                          onChange={() => {
                            if (validationErrors.age) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                age: "",
                              }));
                            }
                          }}
                        />
                        {validationErrors.age ? (
                          <div className="volunteer-error">
                            {validationErrors.age}
                          </div>
                        ) : null}
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {educationLabel}
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="education"
                          placeholder={educationPlaceholder}
                        />
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {occupationLabel}
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="occupation"
                          placeholder={occupationPlaceholder}
                        />
                      </div>
                    </Col>

                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {availabilityLabel}{" "}
                          <span className="required-star">
                            {requiredMarker}
                          </span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={sharedInputStyle}
                          name="availability"
                          inputMode="numeric"
                          required
                          placeholder={availabilityPlaceholder}
                          onChange={() => {
                            if (validationErrors.availability) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                availability: "",
                              }));
                            }
                          }}
                        />
                        {validationErrors.availability ? (
                          <div className="volunteer-error">
                            {validationErrors.availability}
                          </div>
                        ) : null}
                      </div>
                    </Col>

                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {areasLabel}
                        </label>
                        <ConfigProvider
                          theme={{ token: { colorPrimary: checkboxColor } }}
                        >
                          <div className="volunteer-areas">
                            {areaOptions.map((item) => (
                              <Checkbox
                                key={item}
                                name="interest"
                                value={item}
                                className="volunteer-checkbox"
                                style={{ color: areasTextColor }}
                              >
                                {item}
                              </Checkbox>
                            ))}
                          </div>
                        </ConfigProvider>
                      </div>
                    </Col>

                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {experienceLabel}
                        </label>
                        <textarea
                          className="volunteer-input volunteer-textarea"
                          style={sharedInputStyle}
                          name="experience"
                          rows={experienceRows}
                          placeholder={experiencePlaceholder}
                        />
                      </div>
                    </Col>

                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          {motivationLabel}{" "}
                          <span className="required-star">
                            {requiredMarker}
                          </span>
                        </label>
                        <textarea
                          className="volunteer-input volunteer-textarea"
                          style={sharedInputStyle}
                          name="motivation"
                          required
                          rows={motivationRows}
                          placeholder={motivationPlaceholder}
                          onChange={() => {
                            if (validationErrors.motivation) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                motivation: "",
                              }));
                            }
                          }}
                        />
                        {validationErrors.motivation ? (
                          <div className="volunteer-error">
                            {validationErrors.motivation}
                          </div>
                        ) : null}
                      </div>
                    </Col>

                    <Col xs={24}>
                      <VolunteerSubmitButton
                        label={submitLabel}
                        pendingLabel={submittingLabel}
                        background={submitBtnBgColor}
                        textColor={submitBtnTextColor}
                        iconUrl={submitIconUrl}
                        iconAlt={submitIconAlt}
                        iconSize={submitIconSize}
                        iconGap={submitIconGap}
                        radius={submitRadius}
                        paddingY={submitPaddingY}
                        paddingX={submitPaddingX}
                        fontSize={submitFontSize}
                      />
                    </Col>
                  </Row>
                </form>
              </div>
            </Col>

            <Col xs={24} lg={sideColumnSpanLg}>
              <div
                className="volunteer-side-card"
                style={{
                  background: sideBgColor,
                  borderColor: sideCardBorderColor,
                  borderRadius: sideCardRadius,
                  padding: `${sideCardPadding}px`,
                }}
              >
                {sideTitle && (
                  <h3
                    className="volunteer-side-title"
                    style={{ color: sideTitleColor }}
                  >
                    {sideTitle}
                  </h3>
                )}
                {sideDescription && (
                  <p
                    className="volunteer-side-description"
                    style={{ color: sideTextColor }}
                  >
                    {sideDescription}
                  </p>
                )}
                {sideItems.length > 0 && (
                  <ul
                    className={`volunteer-side-list${
                      sideBulletIconUrl ? " volunteer-side-list--icon" : ""
                    }`}
                  >
                    {sideItems.map((item, idx) => (
                      <li
                        key={`${item}-${idx}`}
                        style={{
                          color: sideTextColor,
                          "--volunteer-bullet-color": sideBulletColor,
                        }}
                      >
                        {sideBulletIconUrl ? (
                          <img
                            src={sideBulletIconUrl}
                            alt={sideBulletIconAlt}
                            className="volunteer-side-bullet-icon"
                          />
                        ) : null}
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Col>
          </Row>
        </Wrapper>
      </PageContainer>
    </FullWidthBackground>
  );
}
