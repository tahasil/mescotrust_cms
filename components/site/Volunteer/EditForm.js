"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Col, Collapse, Form, Input, InputNumber, Row, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Volunteer";
const PREFIX = "volunteer";

const DEFAULTS = {
  volunteerPageValue: "volunteer",
  volunteerSourceValue: "volunteer-form",
  volunteerSubjectLine: "Volunteer Application",
  volunteerSubmitLabel: "Submit Application",
  volunteerSubmittingLabel: "Submitting...",
  volunteerRequiredMarker: "*",
  volunteerSuccessTitle: "Success",
  volunteerSuccessMessage: "Volunteer request submitted successfully.",
  volunteerFailureTitle: "Submission failed",
  volunteerFailureMessage: "Unable to submit the volunteer form. Please try again.",

  volunteerFullNameLabel: "Full Name",
  volunteerFullNamePlaceholder: "Enter your full name",
  volunteerEmailLabel: "Email Address",
  volunteerEmailPlaceholder: "your.email@example.com",
  volunteerPhoneLabel: "Phone Number",
  volunteerPhonePlaceholder: "+91 98765 43210",
  volunteerAgeLabel: "Age",
  volunteerAgePlaceholder: "18",
  volunteerEducationLabel: "Education",
  volunteerEducationPlaceholder: "Highest qualification",
  volunteerOccupationLabel: "Current Occupation",
  volunteerOccupationPlaceholder: "Student, Working Professional, etc.",
  volunteerAvailabilityLabel: "Availability (Hours per month)",
  volunteerAvailabilityPlaceholder: "",
  volunteerAreasLabel: "Areas of Interest (Select all that apply)",
  volunteerExperienceLabel: "Relevant Experience",
  volunteerExperiencePlaceholder: "Share any relevant volunteering or social work experience...",
  volunteerMotivationLabel: "Why do you want to volunteer with MESCO?",
  volunteerMotivationPlaceholder: "Tell us what motivates you to join our mission...",

  volunteerAreasOptions:
    "Education Support,Health Awareness,Event Management,Administrative,Fundraising,Women Empowerment",
  volunteerChecklistTitle: "Eligibility Criteria",
  volunteerChecklistDescription:
    "If you meet these criteria and are excited about making a difference, we'd love to have you on our team!",
  volunteerChecklistItems:
    "Minimum Age: 18 years\nMinimum: High school (10th/12th pass)\nInterest in community development\nMinimum 5-10 hours/week\nTeamwork and collaboration\nClean background (no criminal record)\nWillingness to travel locally (if needed)",
  volunteerChecklistBulletIconAlt: "Bullet icon",
  volunteerSubmitIconAlt: "Submit icon",

  volunteerErrorNameRequired: "Full name is required",
  volunteerErrorNameInvalid: "Name should contain alphabets only",
  volunteerErrorEmailRequired: "Email is required",
  volunteerErrorEmailInvalid: "Please enter a valid email address",
  volunteerErrorPhoneRequired: "Phone number is required",
  volunteerErrorPhoneInvalid: "Please enter a valid mobile number",
  volunteerErrorAgeRequired: "Age is required",
  volunteerErrorAgeInvalid: "Please enter a valid age",
  volunteerErrorAvailabilityRequired: "Availability is required",
  volunteerErrorAvailabilityInvalid: "Please enter valid hours",
  volunteerErrorMotivationRequired: "This field is required",
  volunteerErrorMotivationMin: "Minimum 5 characters required",

  volunteerFormCardRadius: 14,
  volunteerInputRadius: 8,
  volunteerChecklistCardRadius: 14,
  volunteerFormCardPadding: 24,
  volunteerChecklistCardPadding: 24,
  volunteerFieldGap: 14,
  volunteerGridColumnGap: 14,
  volunteerGridRowGap: 8,
  volunteerAreasColumnGap: 12,
  volunteerAreasRowGap: 8,
  volunteerSubmitRadius: 10,
  volunteerSubmitPaddingY: 11,
  volunteerSubmitPaddingX: 22,
  volunteerSubmitFontSize: 15,
  volunteerSubmitIconSize: 16,
  volunteerSubmitIconGap: 8,
  volunteerLabelFontSize: 13,
  volunteerInputFontSize: 14,
  volunteerInputMinHeight: 42,
  volunteerTextareaMinHeight: 78,
  volunteerChecklistTitleSize: 36,
  volunteerChecklistTitleLineHeight: 1.12,
  volunteerChecklistDescriptionSize: 14,
  volunteerChecklistItemSize: 13,
  volunteerAreaColumnsDesktop: 3,
  volunteerAreaColumnsTablet: 2,
  volunteerAreaColumnsMobile: 1,
  volunteerExperienceRows: 3,
  volunteerMotivationRows: 4,
  volunteerFormColumnSpanLg: 16,

  volunteerFormCardBgColorKey: "",
  volunteerFormCardBorderColorKey: "",
  volunteerLabelColorKey: "",
  volunteerInputBgColorKey: "",
  volunteerInputBorderColorKey: "",
  volunteerInputFocusBorderColorKey: "",
  volunteerInputTextColorKey: "",
  volunteerPlaceholderColorKey: "",
  volunteerCheckboxColorKey: "",
  volunteerAreasTextColorKey: "",
  volunteerRequiredStarColorKey: "",
  volunteerErrorTextColorKey: "",
  volunteerButtonBgColorKey: "",
  volunteerButtonTextColorKey: "",
  volunteerChecklistBgColorKey: "",
  volunteerChecklistCardBorderColorKey: "",
  volunteerChecklistTitleColorKey: "",
  volunteerChecklistTextColorKey: "",
  volunteerChecklistBulletColorKey: "",

  volunteerButtonBackground: "",
  volunteerChecklistBackground: "",
  volunteerFormCardBackground: "",
  volunteerSubmitIconUrl: "",
  volunteerChecklistBulletIconUrl: "",
};

function toText(data, key) {
  if (data?.[key] == null) return DEFAULTS[key] ?? "";
  return String(data[key]).trim();
}

function toNum(data, key) {
  const fallback = DEFAULTS[key];
  const n = Number(data?.[key]);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function applyFormValues(form, data) {
  form.setFieldsValue({
    ...getManageSectionInitialValues(PREFIX, data),
    volunteerPageValue: toText(data, "volunteerPageValue"),
    volunteerSourceValue: toText(data, "volunteerSourceValue"),
    volunteerSubjectLine: toText(data, "volunteerSubjectLine"),
    volunteerSubmitLabel: toText(data, "volunteerSubmitLabel"),
    volunteerSubmittingLabel: toText(data, "volunteerSubmittingLabel"),
    volunteerRequiredMarker: toText(data, "volunteerRequiredMarker"),
    volunteerSuccessTitle: toText(data, "volunteerSuccessTitle"),
    volunteerSuccessMessage: toText(data, "volunteerSuccessMessage"),
    volunteerFailureTitle: toText(data, "volunteerFailureTitle"),
    volunteerFailureMessage: toText(data, "volunteerFailureMessage"),

    volunteerFullNameLabel: toText(data, "volunteerFullNameLabel"),
    volunteerFullNamePlaceholder: toText(data, "volunteerFullNamePlaceholder"),
    volunteerEmailLabel: toText(data, "volunteerEmailLabel"),
    volunteerEmailPlaceholder: toText(data, "volunteerEmailPlaceholder"),
    volunteerPhoneLabel: toText(data, "volunteerPhoneLabel"),
    volunteerPhonePlaceholder: toText(data, "volunteerPhonePlaceholder"),
    volunteerAgeLabel: toText(data, "volunteerAgeLabel"),
    volunteerAgePlaceholder: toText(data, "volunteerAgePlaceholder"),
    volunteerEducationLabel: toText(data, "volunteerEducationLabel"),
    volunteerEducationPlaceholder: toText(data, "volunteerEducationPlaceholder"),
    volunteerOccupationLabel: toText(data, "volunteerOccupationLabel"),
    volunteerOccupationPlaceholder: toText(data, "volunteerOccupationPlaceholder"),
    volunteerAvailabilityLabel: toText(data, "volunteerAvailabilityLabel"),
    volunteerAvailabilityPlaceholder: toText(data, "volunteerAvailabilityPlaceholder"),
    volunteerAreasLabel: toText(data, "volunteerAreasLabel"),
    volunteerExperienceLabel: toText(data, "volunteerExperienceLabel"),
    volunteerExperiencePlaceholder: toText(data, "volunteerExperiencePlaceholder"),
    volunteerMotivationLabel: toText(data, "volunteerMotivationLabel"),
    volunteerMotivationPlaceholder: toText(data, "volunteerMotivationPlaceholder"),

    volunteerAreasOptions: toText(data, "volunteerAreasOptions"),
    volunteerChecklistTitle: toText(data, "volunteerChecklistTitle"),
    volunteerChecklistDescription: toText(data, "volunteerChecklistDescription"),
    volunteerChecklistItems: toText(data, "volunteerChecklistItems"),
    volunteerChecklistBulletIconUrl: toText(data, "volunteerChecklistBulletIconUrl"),
    volunteerChecklistBulletIconAlt: toText(data, "volunteerChecklistBulletIconAlt"),
    volunteerSubmitIconUrl: toText(data, "volunteerSubmitIconUrl"),
    volunteerSubmitIconAlt: toText(data, "volunteerSubmitIconAlt"),

    volunteerErrorNameRequired: toText(data, "volunteerErrorNameRequired"),
    volunteerErrorNameInvalid: toText(data, "volunteerErrorNameInvalid"),
    volunteerErrorEmailRequired: toText(data, "volunteerErrorEmailRequired"),
    volunteerErrorEmailInvalid: toText(data, "volunteerErrorEmailInvalid"),
    volunteerErrorPhoneRequired: toText(data, "volunteerErrorPhoneRequired"),
    volunteerErrorPhoneInvalid: toText(data, "volunteerErrorPhoneInvalid"),
    volunteerErrorAgeRequired: toText(data, "volunteerErrorAgeRequired"),
    volunteerErrorAgeInvalid: toText(data, "volunteerErrorAgeInvalid"),
    volunteerErrorAvailabilityRequired: toText(data, "volunteerErrorAvailabilityRequired"),
    volunteerErrorAvailabilityInvalid: toText(data, "volunteerErrorAvailabilityInvalid"),
    volunteerErrorMotivationRequired: toText(data, "volunteerErrorMotivationRequired"),
    volunteerErrorMotivationMin: toText(data, "volunteerErrorMotivationMin"),

    volunteerFormCardRadius: toNum(data, "volunteerFormCardRadius"),
    volunteerInputRadius: toNum(data, "volunteerInputRadius"),
    volunteerChecklistCardRadius: toNum(data, "volunteerChecklistCardRadius"),
    volunteerFormCardPadding: toNum(data, "volunteerFormCardPadding"),
    volunteerChecklistCardPadding: toNum(data, "volunteerChecklistCardPadding"),
    volunteerFieldGap: toNum(data, "volunteerFieldGap"),
    volunteerGridColumnGap: toNum(data, "volunteerGridColumnGap"),
    volunteerGridRowGap: toNum(data, "volunteerGridRowGap"),
    volunteerAreasColumnGap: toNum(data, "volunteerAreasColumnGap"),
    volunteerAreasRowGap: toNum(data, "volunteerAreasRowGap"),
    volunteerSubmitRadius: toNum(data, "volunteerSubmitRadius"),
    volunteerSubmitPaddingY: toNum(data, "volunteerSubmitPaddingY"),
    volunteerSubmitPaddingX: toNum(data, "volunteerSubmitPaddingX"),
    volunteerSubmitFontSize: toNum(data, "volunteerSubmitFontSize"),
    volunteerSubmitIconSize: toNum(data, "volunteerSubmitIconSize"),
    volunteerSubmitIconGap: toNum(data, "volunteerSubmitIconGap"),
    volunteerLabelFontSize: toNum(data, "volunteerLabelFontSize"),
    volunteerInputFontSize: toNum(data, "volunteerInputFontSize"),
    volunteerInputMinHeight: toNum(data, "volunteerInputMinHeight"),
    volunteerTextareaMinHeight: toNum(data, "volunteerTextareaMinHeight"),
    volunteerChecklistTitleSize: toNum(data, "volunteerChecklistTitleSize"),
    volunteerChecklistTitleLineHeight: toNum(data, "volunteerChecklistTitleLineHeight"),
    volunteerChecklistDescriptionSize: toNum(data, "volunteerChecklistDescriptionSize"),
    volunteerChecklistItemSize: toNum(data, "volunteerChecklistItemSize"),
    volunteerAreaColumnsDesktop: toNum(data, "volunteerAreaColumnsDesktop"),
    volunteerAreaColumnsTablet: toNum(data, "volunteerAreaColumnsTablet"),
    volunteerAreaColumnsMobile: toNum(data, "volunteerAreaColumnsMobile"),
    volunteerExperienceRows: toNum(data, "volunteerExperienceRows"),
    volunteerMotivationRows: toNum(data, "volunteerMotivationRows"),
    volunteerFormColumnSpanLg: toNum(data, "volunteerFormColumnSpanLg"),

    volunteerFormCardBgColorKey: toText(data, "volunteerFormCardBgColorKey"),
    volunteerFormCardBorderColorKey: toText(data, "volunteerFormCardBorderColorKey"),
    volunteerLabelColorKey: toText(data, "volunteerLabelColorKey"),
    volunteerInputBgColorKey: toText(data, "volunteerInputBgColorKey"),
    volunteerInputBorderColorKey: toText(data, "volunteerInputBorderColorKey"),
    volunteerInputFocusBorderColorKey: toText(data, "volunteerInputFocusBorderColorKey"),
    volunteerInputTextColorKey: toText(data, "volunteerInputTextColorKey"),
    volunteerPlaceholderColorKey: toText(data, "volunteerPlaceholderColorKey"),
    volunteerCheckboxColorKey: toText(data, "volunteerCheckboxColorKey"),
    volunteerAreasTextColorKey: toText(data, "volunteerAreasTextColorKey"),
    volunteerRequiredStarColorKey: toText(data, "volunteerRequiredStarColorKey"),
    volunteerErrorTextColorKey: toText(data, "volunteerErrorTextColorKey"),
    volunteerButtonBgColorKey: toText(data, "volunteerButtonBgColorKey"),
    volunteerButtonTextColorKey: toText(data, "volunteerButtonTextColorKey"),
    volunteerChecklistBgColorKey: toText(data, "volunteerChecklistBgColorKey"),
    volunteerChecklistCardBorderColorKey: toText(data, "volunteerChecklistCardBorderColorKey"),
    volunteerChecklistTitleColorKey: toText(data, "volunteerChecklistTitleColorKey"),
    volunteerChecklistTextColorKey: toText(data, "volunteerChecklistTextColorKey"),
    volunteerChecklistBulletColorKey: toText(data, "volunteerChecklistBulletColorKey"),
    volunteerButtonBackground: toText(data, "volunteerButtonBackground"),
    volunteerChecklistBackground: toText(data, "volunteerChecklistBackground"),
    volunteerFormCardBackground: toText(data, "volunteerFormCardBackground"),
  });
}

function VolunteerEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(form, data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [
              ...new Set([
                ...Object.keys(palette),
                ...customColors.map((c) => c?.name).filter(Boolean),
              ]),
            ].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        applyFormValues(form, data);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Volunteer"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          mainTitle: "",
          subTitle: "",
          volunteerTitleEnabled: false,
          volunteerSubTitleEnabled: false,
          volunteerDescription: "",
          volunteerPageValue: String(values.volunteerPageValue ?? "").trim(),
          volunteerSourceValue: String(values.volunteerSourceValue ?? "").trim(),
          volunteerSubjectLine: String(values.volunteerSubjectLine ?? "").trim(),
          volunteerSubmitLabel: String(values.volunteerSubmitLabel ?? "").trim(),
          volunteerSubmittingLabel: String(values.volunteerSubmittingLabel ?? "").trim(),
          volunteerRequiredMarker: String(values.volunteerRequiredMarker ?? "").trim(),
          volunteerSuccessTitle: String(values.volunteerSuccessTitle ?? "").trim(),
          volunteerSuccessMessage: String(values.volunteerSuccessMessage ?? "").trim(),
          volunteerFailureTitle: String(values.volunteerFailureTitle ?? "").trim(),
          volunteerFailureMessage: String(values.volunteerFailureMessage ?? "").trim(),

          volunteerFullNameLabel: String(values.volunteerFullNameLabel ?? "").trim(),
          volunteerFullNamePlaceholder: String(values.volunteerFullNamePlaceholder ?? "").trim(),
          volunteerEmailLabel: String(values.volunteerEmailLabel ?? "").trim(),
          volunteerEmailPlaceholder: String(values.volunteerEmailPlaceholder ?? "").trim(),
          volunteerPhoneLabel: String(values.volunteerPhoneLabel ?? "").trim(),
          volunteerPhonePlaceholder: String(values.volunteerPhonePlaceholder ?? "").trim(),
          volunteerAgeLabel: String(values.volunteerAgeLabel ?? "").trim(),
          volunteerAgePlaceholder: String(values.volunteerAgePlaceholder ?? "").trim(),
          volunteerEducationLabel: String(values.volunteerEducationLabel ?? "").trim(),
          volunteerEducationPlaceholder: String(values.volunteerEducationPlaceholder ?? "").trim(),
          volunteerOccupationLabel: String(values.volunteerOccupationLabel ?? "").trim(),
          volunteerOccupationPlaceholder: String(values.volunteerOccupationPlaceholder ?? "").trim(),
          volunteerAvailabilityLabel: String(values.volunteerAvailabilityLabel ?? "").trim(),
          volunteerAvailabilityPlaceholder: String(values.volunteerAvailabilityPlaceholder ?? "").trim(),
          volunteerAreasLabel: String(values.volunteerAreasLabel ?? "").trim(),
          volunteerExperienceLabel: String(values.volunteerExperienceLabel ?? "").trim(),
          volunteerExperiencePlaceholder: String(values.volunteerExperiencePlaceholder ?? "").trim(),
          volunteerMotivationLabel: String(values.volunteerMotivationLabel ?? "").trim(),
          volunteerMotivationPlaceholder: String(values.volunteerMotivationPlaceholder ?? "").trim(),

          volunteerAreasOptions: String(values.volunteerAreasOptions ?? "").trim(),
          volunteerChecklistTitle: String(values.volunteerChecklistTitle ?? "").trim(),
          volunteerChecklistDescription: String(values.volunteerChecklistDescription ?? "").trim(),
          volunteerChecklistItems: String(values.volunteerChecklistItems ?? "").trim(),
          volunteerChecklistBulletIconUrl: String(values.volunteerChecklistBulletIconUrl ?? "").trim(),
          volunteerChecklistBulletIconAlt: String(values.volunteerChecklistBulletIconAlt ?? "").trim(),
          volunteerSubmitIconUrl: String(values.volunteerSubmitIconUrl ?? "").trim(),
          volunteerSubmitIconAlt: String(values.volunteerSubmitIconAlt ?? "").trim(),

          volunteerErrorNameRequired: String(values.volunteerErrorNameRequired ?? "").trim(),
          volunteerErrorNameInvalid: String(values.volunteerErrorNameInvalid ?? "").trim(),
          volunteerErrorEmailRequired: String(values.volunteerErrorEmailRequired ?? "").trim(),
          volunteerErrorEmailInvalid: String(values.volunteerErrorEmailInvalid ?? "").trim(),
          volunteerErrorPhoneRequired: String(values.volunteerErrorPhoneRequired ?? "").trim(),
          volunteerErrorPhoneInvalid: String(values.volunteerErrorPhoneInvalid ?? "").trim(),
          volunteerErrorAgeRequired: String(values.volunteerErrorAgeRequired ?? "").trim(),
          volunteerErrorAgeInvalid: String(values.volunteerErrorAgeInvalid ?? "").trim(),
          volunteerErrorAvailabilityRequired: String(
            values.volunteerErrorAvailabilityRequired ?? "",
          ).trim(),
          volunteerErrorAvailabilityInvalid: String(
            values.volunteerErrorAvailabilityInvalid ?? "",
          ).trim(),
          volunteerErrorMotivationRequired: String(values.volunteerErrorMotivationRequired ?? "").trim(),
          volunteerErrorMotivationMin: String(values.volunteerErrorMotivationMin ?? "").trim(),

          volunteerFormCardRadius: clamp(
            values.volunteerFormCardRadius,
            0,
            48,
            DEFAULTS.volunteerFormCardRadius,
          ),
          volunteerInputRadius: clamp(values.volunteerInputRadius, 0, 24, DEFAULTS.volunteerInputRadius),
          volunteerChecklistCardRadius: clamp(
            values.volunteerChecklistCardRadius,
            0,
            48,
            DEFAULTS.volunteerChecklistCardRadius,
          ),
          volunteerFormCardPadding: clamp(
            values.volunteerFormCardPadding,
            8,
            72,
            DEFAULTS.volunteerFormCardPadding,
          ),
          volunteerChecklistCardPadding: clamp(
            values.volunteerChecklistCardPadding,
            8,
            72,
            DEFAULTS.volunteerChecklistCardPadding,
          ),
          volunteerFieldGap: clamp(values.volunteerFieldGap, 6, 36, DEFAULTS.volunteerFieldGap),
          volunteerGridColumnGap: clamp(
            values.volunteerGridColumnGap,
            8,
            36,
            DEFAULTS.volunteerGridColumnGap,
          ),
          volunteerGridRowGap: clamp(values.volunteerGridRowGap, 4, 24, DEFAULTS.volunteerGridRowGap),
          volunteerAreasColumnGap: clamp(
            values.volunteerAreasColumnGap,
            4,
            24,
            DEFAULTS.volunteerAreasColumnGap,
          ),
          volunteerAreasRowGap: clamp(values.volunteerAreasRowGap, 4, 24, DEFAULTS.volunteerAreasRowGap),
          volunteerSubmitRadius: clamp(
            values.volunteerSubmitRadius,
            0,
            40,
            DEFAULTS.volunteerSubmitRadius,
          ),
          volunteerSubmitPaddingY: clamp(
            values.volunteerSubmitPaddingY,
            6,
            24,
            DEFAULTS.volunteerSubmitPaddingY,
          ),
          volunteerSubmitPaddingX: clamp(
            values.volunteerSubmitPaddingX,
            10,
            40,
            DEFAULTS.volunteerSubmitPaddingX,
          ),
          volunteerSubmitFontSize: clamp(
            values.volunteerSubmitFontSize,
            12,
            24,
            DEFAULTS.volunteerSubmitFontSize,
          ),
          volunteerSubmitIconSize: clamp(
            values.volunteerSubmitIconSize,
            10,
            36,
            DEFAULTS.volunteerSubmitIconSize,
          ),
          volunteerSubmitIconGap: clamp(
            values.volunteerSubmitIconGap,
            4,
            20,
            DEFAULTS.volunteerSubmitIconGap,
          ),
          volunteerLabelFontSize: clamp(
            values.volunteerLabelFontSize,
            11,
            24,
            DEFAULTS.volunteerLabelFontSize,
          ),
          volunteerInputFontSize: clamp(
            values.volunteerInputFontSize,
            11,
            24,
            DEFAULTS.volunteerInputFontSize,
          ),
          volunteerInputMinHeight: clamp(
            values.volunteerInputMinHeight,
            32,
            80,
            DEFAULTS.volunteerInputMinHeight,
          ),
          volunteerTextareaMinHeight: clamp(
            values.volunteerTextareaMinHeight,
            56,
            220,
            DEFAULTS.volunteerTextareaMinHeight,
          ),
          volunteerChecklistTitleSize: clamp(
            values.volunteerChecklistTitleSize,
            18,
            56,
            DEFAULTS.volunteerChecklistTitleSize,
          ),
          volunteerChecklistTitleLineHeight: clamp(
            values.volunteerChecklistTitleLineHeight,
            1,
            2,
            DEFAULTS.volunteerChecklistTitleLineHeight,
          ),
          volunteerChecklistDescriptionSize: clamp(
            values.volunteerChecklistDescriptionSize,
            11,
            24,
            DEFAULTS.volunteerChecklistDescriptionSize,
          ),
          volunteerChecklistItemSize: clamp(
            values.volunteerChecklistItemSize,
            11,
            24,
            DEFAULTS.volunteerChecklistItemSize,
          ),
          volunteerAreaColumnsDesktop: clamp(
            values.volunteerAreaColumnsDesktop,
            1,
            6,
            DEFAULTS.volunteerAreaColumnsDesktop,
          ),
          volunteerAreaColumnsTablet: clamp(
            values.volunteerAreaColumnsTablet,
            1,
            4,
            DEFAULTS.volunteerAreaColumnsTablet,
          ),
          volunteerAreaColumnsMobile: clamp(
            values.volunteerAreaColumnsMobile,
            1,
            2,
            DEFAULTS.volunteerAreaColumnsMobile,
          ),
          volunteerExperienceRows: clamp(
            values.volunteerExperienceRows,
            2,
            10,
            DEFAULTS.volunteerExperienceRows,
          ),
          volunteerMotivationRows: clamp(
            values.volunteerMotivationRows,
            2,
            12,
            DEFAULTS.volunteerMotivationRows,
          ),
          volunteerFormColumnSpanLg: clamp(
            values.volunteerFormColumnSpanLg,
            10,
            20,
            DEFAULTS.volunteerFormColumnSpanLg,
          ),

          titleColorKey: "",
          volunteerSubTitleColorKey: "",
          volunteerDescriptionColorKey: "",
          volunteerFormCardBgColorKey: String(values.volunteerFormCardBgColorKey ?? "").trim(),
          volunteerFormCardBorderColorKey: String(values.volunteerFormCardBorderColorKey ?? "").trim(),
          volunteerLabelColorKey: String(values.volunteerLabelColorKey ?? "").trim(),
          volunteerInputBgColorKey: String(values.volunteerInputBgColorKey ?? "").trim(),
          volunteerInputBorderColorKey: String(values.volunteerInputBorderColorKey ?? "").trim(),
          volunteerInputFocusBorderColorKey: String(
            values.volunteerInputFocusBorderColorKey ?? "",
          ).trim(),
          volunteerInputTextColorKey: String(values.volunteerInputTextColorKey ?? "").trim(),
          volunteerPlaceholderColorKey: String(values.volunteerPlaceholderColorKey ?? "").trim(),
          volunteerCheckboxColorKey: String(values.volunteerCheckboxColorKey ?? "").trim(),
          volunteerAreasTextColorKey: String(values.volunteerAreasTextColorKey ?? "").trim(),
          volunteerRequiredStarColorKey: String(values.volunteerRequiredStarColorKey ?? "").trim(),
          volunteerErrorTextColorKey: String(values.volunteerErrorTextColorKey ?? "").trim(),
          volunteerButtonBgColorKey: String(values.volunteerButtonBgColorKey ?? "").trim(),
          volunteerButtonTextColorKey: String(values.volunteerButtonTextColorKey ?? "").trim(),
          volunteerChecklistBgColorKey: String(values.volunteerChecklistBgColorKey ?? "").trim(),
          volunteerChecklistCardBorderColorKey: String(
            values.volunteerChecklistCardBorderColorKey ?? "",
          ).trim(),
          volunteerChecklistTitleColorKey: String(values.volunteerChecklistTitleColorKey ?? "").trim(),
          volunteerChecklistTextColorKey: String(values.volunteerChecklistTextColorKey ?? "").trim(),
          volunteerChecklistBulletColorKey: String(values.volunteerChecklistBulletColorKey ?? "").trim(),
          volunteerButtonBackground: String(values.volunteerButtonBackground ?? "").trim(),
          volunteerChecklistBackground: String(values.volunteerChecklistBackground ?? "").trim(),
          volunteerFormCardBackground: String(values.volunteerFormCardBackground ?? "").trim(),
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

        setSaving(true);
        fetch(API_PATH, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) return res.json().then((d) => Promise.reject(d));
          })
          .then(() => {
            message.success("Volunteer saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={[
          "manage-section",
          "title-colors",
          "content",
          "labels",
          "right-card",
          "layout",
        ]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
              />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Volunteer")}
              />
            ),
          },
          {
            key: "content",
            label: "Form Content",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerPageValue" label="Submission page value">
                    <Input placeholder="volunteer" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSourceValue" label="Submission source value">
                    <Input placeholder="volunteer-form" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSubjectLine" label="Submission subject">
                    <Input placeholder="Volunteer Application" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSubmitLabel" label="Submit button label">
                    <Input placeholder="Submit Application" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSubmittingLabel" label="Submitting label">
                    <Input placeholder="Submitting..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerRequiredMarker" label="Required marker text">
                    <Input placeholder="*" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="volunteerAreasOptions"
                    label="Areas of interest options"
                    extra="Comma-separated list"
                  >
                    <Input.TextArea rows={3} placeholder={DEFAULTS.volunteerAreasOptions} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "labels",
            label: "Field Labels & Placeholders",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerFullNameLabel" label="Full name label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerEmailLabel" label="Email label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerPhoneLabel" label="Phone label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerAgeLabel" label="Age label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerEducationLabel" label="Education label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerOccupationLabel" label="Occupation label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerAvailabilityLabel" label="Availability label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerAreasLabel" label="Areas label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerExperienceLabel" label="Experience label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerMotivationLabel" label="Motivation label">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerFullNamePlaceholder" label="Full name placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerEmailPlaceholder" label="Email placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerPhonePlaceholder" label="Phone placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerAgePlaceholder" label="Age placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerEducationPlaceholder" label="Education placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerOccupationPlaceholder" label="Occupation placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerAvailabilityPlaceholder" label="Availability placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerExperiencePlaceholder" label="Experience placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerMotivationPlaceholder" label="Motivation placeholder">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "right-card",
            label: "Eligibility Card",
            children: (
              <>
                <Form.Item name="volunteerChecklistTitle" label="Card title">
                  <Input placeholder="Eligibility Criteria" />
                </Form.Item>
                <Form.Item name="volunteerChecklistDescription" label="Card description">
                  <Input.TextArea rows={3} placeholder="Card intro text..." />
                </Form.Item>
                <Form.Item
                  name="volunteerChecklistItems"
                  label="Bullet points"
                  extra="One line per bullet"
                >
                  <Input.TextArea rows={6} placeholder={DEFAULTS.volunteerChecklistItems} />
                </Form.Item>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="volunteerChecklistBackground" label="Card background CSS (optional)">
                      <Input placeholder="linear-gradient(...)" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="volunteerButtonBackground" label="Button background CSS (optional)">
                      <Input placeholder="linear-gradient(...)" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="volunteerFormCardBackground" label="Form card background CSS (optional)">
                      <Input placeholder="#ffffff or linear-gradient(...)" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "icons",
            label: "Icons",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSubmitIconUrl" label="Submit button icon">
                    <MediaPickerInput placeholder="/images/icon.svg" uiVariant="stacked" />
                  </Form.Item>
                  <Form.Item name="volunteerSubmitIconAlt" label="Submit icon alt text">
                    <Input placeholder="Submit icon" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerChecklistBulletIconUrl" label="Eligibility bullet icon">
                    <MediaPickerInput placeholder="/images/bullet.svg" uiVariant="stacked" />
                  </Form.Item>
                  <Form.Item name="volunteerChecklistBulletIconAlt" label="Bullet icon alt text">
                    <Input placeholder="Bullet icon" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "messages",
            label: "Messages & Validation",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSuccessTitle" label="Success notification title">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerSuccessMessage" label="Success notification message">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="volunteerFailureTitle" label="Failure notification title">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerFailureMessage" label="Failure notification message">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerErrorNameRequired" label="Name required">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorNameInvalid" label="Name invalid">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorEmailRequired" label="Email required">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorEmailInvalid" label="Email invalid">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorPhoneRequired" label="Phone required">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorPhoneInvalid" label="Phone invalid">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorAgeRequired" label="Age required">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorAgeInvalid" label="Age invalid">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorAvailabilityRequired" label="Availability required">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorAvailabilityInvalid" label="Availability invalid">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorMotivationRequired" label="Motivation required">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteerErrorMotivationMin" label="Motivation minimum length">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "layout",
            label: "Layout & Spacing",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerFormColumnSpanLg" label="Form width on desktop (10-20)">
                    <InputNumber min={10} max={20} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerFormCardRadius" label="Form card radius (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerInputRadius" label="Input radius (px)">
                    <InputNumber min={0} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerChecklistCardRadius" label="Card radius (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerFormCardPadding" label="Form card padding (px)">
                    <InputNumber min={8} max={72} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerChecklistCardPadding" label="Card padding (px)">
                    <InputNumber min={8} max={72} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerFieldGap" label="Field gap (px)">
                    <InputNumber min={6} max={36} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerGridColumnGap" label="Grid column gap (px)">
                    <InputNumber min={8} max={36} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerGridRowGap" label="Grid row gap (px)">
                    <InputNumber min={4} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerAreasColumnGap" label="Areas column gap (px)">
                    <InputNumber min={4} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerAreasRowGap" label="Areas row gap (px)">
                    <InputNumber min={4} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerSubmitRadius" label="Button radius (px)">
                    <InputNumber min={0} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerSubmitPaddingY" label="Button vertical padding (px)">
                    <InputNumber min={6} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerSubmitPaddingX" label="Button horizontal padding (px)">
                    <InputNumber min={10} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerSubmitFontSize" label="Button font size (px)">
                    <InputNumber min={12} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerSubmitIconSize" label="Button icon size (px)">
                    <InputNumber min={10} max={36} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerSubmitIconGap" label="Button icon gap (px)">
                    <InputNumber min={4} max={20} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerLabelFontSize" label="Label font size (px)">
                    <InputNumber min={11} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerInputFontSize" label="Input font size (px)">
                    <InputNumber min={11} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerInputMinHeight" label="Input minimum height (px)">
                    <InputNumber min={32} max={80} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerTextareaMinHeight" label="Textarea minimum height (px)">
                    <InputNumber min={56} max={220} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerChecklistTitleSize" label="Card title size (px)">
                    <InputNumber min={18} max={56} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerChecklistTitleLineHeight" label="Card title line-height">
                    <InputNumber min={1} max={2} step={0.01} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerChecklistDescriptionSize" label="Card description size (px)">
                    <InputNumber min={11} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerChecklistItemSize" label="Card item size (px)">
                    <InputNumber min={11} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="volunteerAreaColumnsDesktop" label="Areas columns desktop">
                    <InputNumber min={1} max={6} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerAreaColumnsTablet" label="Areas columns tablet">
                    <InputNumber min={1} max={4} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteerAreaColumnsMobile" label="Areas columns mobile">
                    <InputNumber min={1} max={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="volunteerExperienceRows" label="Experience textarea rows">
                    <InputNumber min={2} max={10} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerMotivationRows" label="Motivation textarea rows">
                    <InputNumber min={2} max={12} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(VolunteerEditForm);
