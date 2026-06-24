"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Col, Row, Select, notification } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import {
  isValidEmail,
  isValidName,
  isValidPan,
  isValidPhone,
  normalizeText,
  toDigits,
} from "@/lib/formValidation";
import {
  computePurposeAmount,
  DONATE_NOW_BASE_FIELDS,
  getDefaultDonateNowPurposes,
  DONATE_NOW_FIGMA_PURPOSE_ORDER,
  getDefaultPurposeValue,
  getPurposeRuleState,
  normalizeDonateNowConfig,
} from "@/lib/donateNowConfig";

function resolveColor(key, fallback) {
  const colorKey = String(key ?? "").trim();
  return colorKey ? getColor(colorKey) : fallback;
}

function getFieldDefaultValue(fieldConfig) {
  if (
    fieldConfig?.defaultValue != null &&
    String(fieldConfig.defaultValue).trim()
  ) {
    return String(fieldConfig.defaultValue);
  }
  if (
    fieldConfig?.inputType === "select" &&
    Array.isArray(fieldConfig.options)
  ) {
    const firstOption = fieldConfig.options[0];
    if (firstOption?.value != null) return String(firstOption.value);
  }
  return "";
}

function getInitialFieldValues(fieldConfigMap) {
  const values = {};
  DONATE_NOW_BASE_FIELDS.forEach((fieldDef) => {
    const config = fieldConfigMap[fieldDef.key] || fieldDef;
    values[fieldDef.key] = getFieldDefaultValue(config);
  });
  return values;
}

function asNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatInr(value) {
  const num = asNumber(value);
  if (!num) return "";
  return `₹${num.toLocaleString("en-IN")}`;
}

function isSelectField(fieldConfig) {
  return (
    fieldConfig?.inputType === "select" && Array.isArray(fieldConfig?.options)
  );
}

function getFieldValidationError(fieldKey, value, fieldConfig, required) {
  const normalized = normalizeText(value);
  if (required && !normalized) {
    return `${fieldConfig?.label || fieldKey} is required`;
  }
  if (!normalized) return "";

  const validation = String(fieldConfig?.validation || "").toLowerCase();
  if (validation === "email" && !isValidEmail(normalized)) {
    return "Please enter a valid email address";
  }
  if (validation === "phone" && !isValidPhone(normalized)) {
    return "Please enter a valid mobile number";
  }
  if (validation === "pan" && !isValidPan(normalized)) {
    return "Please enter a valid PAN";
  }
  if (validation === "name" && !isValidName(normalized)) {
    return "Name should contain alphabets only";
  }
  if (validation === "number" && !/^\d+$/.test(toDigits(normalized))) {
    return "Please enter a valid number";
  }
  if (validation === "amount") {
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "Please enter a valid amount";
    }
  }
  if (validation === "lookup") {
    const isEmailInput = normalized.includes("@");
    if (isEmailInput && !isValidEmail(normalized)) {
      return "Please enter a valid email";
    }
    if (!isEmailInput) {
      const lookupDigits = toDigits(normalized);
      if (lookupDigits.length < 10 || lookupDigits.length > 15) {
        return "Please enter a valid mobile number";
      }
    }
  }
  return "";
}

function normalizeAdditionalFieldValue(fieldType, value) {
  if (fieldType === "number") {
    const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : "";
  }
  return String(value ?? "");
}

function logDonorLookupClientDebug(stage, payload = {}) {
  if (process.env.NODE_ENV === "production") return;
  // Debug helper for lookup diagnostics in browser console.
  console.info("[donor-lookup-ui]", stage, payload);
}

const DONOR_TYPE_OPTIONS = [
  { label: "New Donor", value: "new" },
  { label: "Existing Donor", value: "existing" },
];

const DONOR_PROFILE_FIELD_KEYS = [
  "name",
  "pan",
  "email",
  "mobile",
  "address",
  "city",
  "state",
  "country",
  "pincode",
];

const REQUIRED_LOOKUP_AUTOFILL_FIELDS = [
  "name",
  "pan",
  "email",
  "mobile",
  "address",
  "city",
  "state",
  "country",
  "pincode",
];

function getInitialLookupState() {
  return {
    loading: false,
    found: false,
    verified: false,
    verificationToken: "",
    requiresPanLast4: false,
    masked: null,
    matchedSubmissionId: "",
    lastDonation: null,
  };
}

function getInitialVerificationState() {
  return {
    email: "",
    mobile: "",
    panLast4: "",
  };
}

export default function DonateNow(props = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [encData, setEncData] = useState(null);
  const gatewayFormRef = useRef(null);
  const lookupTimerRef = useRef(null);
  const previousPurposeIdRef = useRef("");

  const normalizedConfig = useMemo(
    () => normalizeDonateNowConfig(props),
    [props],
  );
  const {
    fieldConfig,
    purposes,
    purposeSource,
    copy,
    lookupSettings,
    paymentSettings,
    defaultPurposeId,
  } = normalizedConfig;
  const selectablePurposes = useMemo(
    () =>
      purposes.filter((purpose) => {
        if (!purpose?.active) return false;
        const id = String(purpose.id || "").trim();
        const name = String(purpose.name || "").trim();
        return Boolean(id) && Boolean(name);
      }),
    [purposes],
  );
  const renderedPurposes = useMemo(() => {
    const cardEligiblePurposes = selectablePurposes.filter((purpose) => {
      if (purpose?.showOnCard === false) return false;
      const title = String(purpose.cardTitle || purpose.name || "").trim();
      const amountText = String(purpose.cardAmountText || "").trim();
      const amountValue = Number(
        purpose.fixedAmount || purpose.defaultAmount || 0,
      );
      return Boolean(title) && (Boolean(amountText) || amountValue > 0);
    });
    const byDisplayOrder = (a, b) => {
      const orderA = Number(a.displayOrder) || 0;
      const orderB = Number(b.displayOrder) || 0;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.name || "").localeCompare(String(b.name || ""));
    };
    if (purposeSource === "custom") {
      return [...cardEligiblePurposes].sort(byDisplayOrder);
    }
    const fallbackById =
      purposeSource === "custom"
        ? new Map()
        : new Map(
            getDefaultDonateNowPurposes().map((purpose) => [
              String(purpose.id),
              purpose,
            ]),
          );
    const byId = new Map(
      cardEligiblePurposes.map((purpose) => [String(purpose.id), purpose]),
    );
    const figmaOrdered = DONATE_NOW_FIGMA_PURPOSE_ORDER.map(
      (id) => byId.get(id) || fallbackById.get(id),
    ).filter(Boolean);
    const figmaIds = new Set(figmaOrdered.map((purpose) => purpose.id));
    const remaining = cardEligiblePurposes
      .filter((purpose) => !figmaIds.has(purpose.id))
      .sort(byDisplayOrder);
    return [...figmaOrdered, ...remaining];
  }, [selectablePurposes, purposeSource]);

  const [selectedPurposeId, setSelectedPurposeId] = useState(
    defaultPurposeId || getDefaultPurposeValue(selectablePurposes),
  );
  const [donorType, setDonorType] = useState("");
  const [fieldValues, setFieldValues] = useState(() =>
    getInitialFieldValues(fieldConfig),
  );
  const [additionalFieldValues, setAdditionalFieldValues] = useState({});
  const [amountTouched, setAmountTouched] = useState(false);
  const [lookupState, setLookupState] = useState(() => getInitialLookupState());
  const [verificationValues, setVerificationValues] = useState(() =>
    getInitialVerificationState(),
  );
  const [verifyingDonor, setVerifyingDonor] = useState(false);

  const isExistingDonor = donorType === "existing";
  const isNewDonor = donorType === "new";
  const isDonorTypeSelected = isExistingDonor || isNewDonor;
  const canUseMainFormFields =
    isDonorTypeSelected &&
    (!isExistingDonor || (lookupState.found && lookupState.verified));
  const lookupAutofillFields = useMemo(
    () =>
      [...new Set([...lookupSettings.reusableFields, ...REQUIRED_LOOKUP_AUTOFILL_FIELDS])],
    [lookupSettings.reusableFields],
  );

  useEffect(() => {
    setSelectedPurposeId(
      defaultPurposeId || getDefaultPurposeValue(selectablePurposes),
    );
    setDonorType("");
    setFieldValues(getInitialFieldValues(fieldConfig));
    setAdditionalFieldValues({});
    setAmountTouched(false);
    setLookupState(getInitialLookupState());
    setVerificationValues(getInitialVerificationState());
    setVerifyingDonor(false);
    setErrors({});
    previousPurposeIdRef.current = "";
  }, [defaultPurposeId, selectablePurposes, fieldConfig]);

  useEffect(() => {
    if (lookupTimerRef.current) {
      window.clearTimeout(lookupTimerRef.current);
    }
    setLookupState(getInitialLookupState());
    setVerificationValues(getInitialVerificationState());
    setVerifyingDonor(false);
    setFieldValues((previous) => {
      const defaults = getInitialFieldValues(fieldConfig);
      const next = { ...previous };
      next.lookup = defaults.lookup ?? "";
      DONOR_PROFILE_FIELD_KEYS.forEach((fieldKey) => {
        next[fieldKey] = defaults[fieldKey] ?? "";
      });
      return next;
    });
  }, [donorType, fieldConfig]);

  const selectedPurpose = useMemo(
    () =>
      selectablePurposes.find((purpose) => purpose.id === selectedPurposeId) ||
      selectablePurposes[0] ||
      null,
    [selectablePurposes, selectedPurposeId],
  );

  const purposeRuleState = useMemo(
    () => getPurposeRuleState(selectedPurpose, fieldConfig),
    [selectedPurpose, fieldConfig],
  );
  const hiddenFields = purposeRuleState.hidden;
  const disabledFields = purposeRuleState.disabled;
  const requiredFields = purposeRuleState.required;

  const additionalFields = useMemo(
    () =>
      Array.isArray(selectedPurpose?.additionalFields)
        ? selectedPurpose.additionalFields.filter(
            (field) => field.active && !field.hidden,
          )
        : [],
    [selectedPurpose],
  );
  const quantityFieldKey = selectedPurpose?.quantityFieldKey || "studentsCount";
  const quantityFieldValue = fieldValues[quantityFieldKey];

  useEffect(() => {
    if (!selectedPurpose) return;
    const purposeChanged = previousPurposeIdRef.current !== selectedPurpose.id;
    const minQuantity = Math.max(1, Number(selectedPurpose.minQuantity || 1));
    const defaultStudentsCount = Math.max(
      1,
      Number(
        selectedPurpose.defaultStudentsCount ||
          selectedPurpose.minQuantity ||
          1,
      ),
    );

    setFieldValues((previous) => {
      const next = { ...previous };
      let changed = false;

      if (next.purpose !== selectedPurpose.id) {
        next.purpose = selectedPurpose.id;
        changed = true;
      }

      if (
        selectedPurpose.calculationMode === "multiply_by_students" ||
        selectedPurpose.showStudentsCount
      ) {
        const parsedQuantity = Number.parseInt(
          String(previous[quantityFieldKey] || ""),
          10,
        );
        if (purposeChanged) {
          next[quantityFieldKey] = String(defaultStudentsCount);
          changed = true;
        } else if (
          !Number.isFinite(parsedQuantity) ||
          parsedQuantity < minQuantity
        ) {
          next[quantityFieldKey] = String(defaultStudentsCount);
          changed = true;
        }
      }

      const quantityValue = next[quantityFieldKey];
      const nextAmount = computePurposeAmount({
        purpose: selectedPurpose,
        quantityValue,
        studentsCount: next.studentsCount,
        currentAmount: previous.amount,
        amountTouched,
      });
      if (String(previous.amount || "") !== nextAmount) {
        next.amount = nextAmount;
        changed = true;
      }

      return changed ? next : previous;
    });
    previousPurposeIdRef.current = selectedPurpose.id;
  }, [selectedPurpose, quantityFieldKey, quantityFieldValue, amountTouched]);

  const mainTitle = String(props?.mainTitle || "").trim();
  const subTitle = String(props?.subTitle || "").trim();
  const titleEnabled = props?.donateNowTitleEnabled !== false;
  const subTitleEnabled = props?.donateNowSubTitleEnabled !== false;
  const titleColor = resolveColor(props?.titleColorKey, getColor("primary"));
  const subTitleColor = resolveColor(
    props?.donateNowSubTitleColorKey,
    undefined,
  );

  const donateButtonBg = resolveColor(props?.donateNowBtnBgColorKey, "#8b1a1a");
  const donateButtonText = resolveColor(
    props?.donateNowBtnTextColorKey,
    "#ffffff",
  );
  const qrBtnBorder = resolveColor(
    props?.donateNowQrBtnBorderColorKey,
    "#8b1a1a",
  );
  const qrBtnText = resolveColor(props?.donateNowQrBtnTextColorKey, "#8b1a1a");
  const formHeadingColor = resolveColor(
    props?.donateNowFormHeadingColorKey,
    "#111111",
  );

  const qrImageDesktop = String(
    props?.donateNowQrImageDesktop || props?.donateNowQrImageUrl || "",
  ).trim();
  const qrImageMobile = String(props?.donateNowQrImageMobile || "").trim();
  const qrImageUrl = qrImageDesktop || qrImageMobile;

  const PREFIX = "donateNow";
  const sectionBgType = (
    props?.[`${PREFIX}SectionBgType`] ?? "default"
  ).toString();
  const sectionBgImage = String(
    props?.[`${PREFIX}SectionBgImage`] ?? "",
  ).trim();
  const sectionBgColorKey = String(
    props?.[`${PREFIX}SectionBgColorKey`] ?? "",
  ).trim();
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
  const sectionBgStyle = {
    ...(sectionBgStyleBase || {}),
    ...(props?.[`${PREFIX}SectionPaddingTop`] != null
      ? { paddingTop: `${Number(props[`${PREFIX}SectionPaddingTop`])}px` }
      : {}),
    ...(props?.[`${PREFIX}SectionPaddingBottom`] != null
      ? { paddingBottom: `${Number(props[`${PREFIX}SectionPaddingBottom`])}px` }
      : {}),
    ...(props?.[`${PREFIX}SectionMarginTop`] != null
      ? { marginTop: `${Number(props[`${PREFIX}SectionMarginTop`])}px` }
      : {}),
    ...(props?.[`${PREFIX}SectionMarginBottom`] != null
      ? { marginBottom: `${Number(props[`${PREFIX}SectionMarginBottom`])}px` }
      : {}),
  };

  const pageContainerBgType = (
    props?.[`${PREFIX}PageContainerBgType`] ?? "default"
  ).toString();
  const pageContainerBgImage = String(
    props?.[`${PREFIX}PageContainerBgImage`] ?? "",
  ).trim();
  const pageContainerBgColorKey = String(
    props?.[`${PREFIX}PageContainerBgColorKey`] ?? "",
  ).trim();
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
  const pageContainerBgStyle = {
    ...(pageContainerBgStyleBase || {}),
    ...(props?.[`${PREFIX}PageContainerPaddingTop`] != null
      ? { paddingTop: `${Number(props[`${PREFIX}PageContainerPaddingTop`])}px` }
      : {}),
    ...(props?.[`${PREFIX}PageContainerPaddingRight`] != null
      ? {
          paddingRight: `${Number(props[`${PREFIX}PageContainerPaddingRight`])}px`,
        }
      : {}),
    ...(props?.[`${PREFIX}PageContainerPaddingBottom`] != null
      ? {
          paddingBottom: `${Number(props[`${PREFIX}PageContainerPaddingBottom`])}px`,
        }
      : {}),
    ...(props?.[`${PREFIX}PageContainerPaddingLeft`] != null
      ? {
          paddingLeft: `${Number(props[`${PREFIX}PageContainerPaddingLeft`])}px`,
        }
      : {}),
    ...(props?.[`${PREFIX}PageContainerMarginTop`] != null
      ? { marginTop: `${Number(props[`${PREFIX}PageContainerMarginTop`])}px` }
      : {}),
    ...(props?.[`${PREFIX}PageContainerMarginBottom`] != null
      ? {
          marginBottom: `${Number(props[`${PREFIX}PageContainerMarginBottom`])}px`,
        }
      : {}),
  };

  const selectPurpose = (nextPurposeId) => {
    setSelectedPurposeId(nextPurposeId);
    setAmountTouched(false);
    if (errors.purpose) {
      setErrors((previous) => ({ ...previous, purpose: "" }));
    }
  };

  const isBaseFieldVisible = (fieldKey) => {
    if (fieldKey === "lookup") return isExistingDonor;
    if (!isDonorTypeSelected) return false;
    if (isExistingDonor && !lookupState.found) return false;
    return !hiddenFields.has(fieldKey);
  };

  const handleDonorTypeChange = (nextDonorType) => {
    setDonorType(nextDonorType || "");
    setErrors((previous) => {
      const next = { ...previous };
      delete next.donorType;
      delete next.lookup;
      delete next.donorVerification;
      delete next.verifyEmail;
      delete next.verifyMobile;
      delete next.verifyPanLast4;
      return next;
    });
  };

  const handleFieldValue = (fieldKey, nextValue) => {
    if (fieldKey === "lookup") {
      setLookupState(getInitialLookupState());
      setVerificationValues(getInitialVerificationState());
      setVerifyingDonor(false);
    }
    setFieldValues((previous) => ({ ...previous, [fieldKey]: nextValue }));
    if (errors[fieldKey]) {
      setErrors((previous) => ({ ...previous, [fieldKey]: "" }));
    }
  };

  const handleAdditionalValue = (fieldKey, nextValue) => {
    setAdditionalFieldValues((previous) => ({
      ...previous,
      [fieldKey]: nextValue,
    }));
    const errorKey = `additional:${fieldKey}`;
    if (errors[errorKey]) {
      setErrors((previous) => ({ ...previous, [errorKey]: "" }));
    }
  };

  const handleVerificationValue = (fieldKey, nextValue) => {
    setVerificationValues((previous) => ({ ...previous, [fieldKey]: nextValue }));
    const errorKeyMap = {
      email: "verifyEmail",
      mobile: "verifyMobile",
      panLast4: "verifyPanLast4",
    };
    const errorKey = errorKeyMap[fieldKey];
    setErrors((previous) => {
      const next = { ...previous };
      if (errorKey) delete next[errorKey];
      delete next.donorVerification;
      return next;
    });
  };

  const getLookupValidationError = (lookupValue, required = false) =>
    getFieldValidationError(
      "lookup",
      lookupValue,
      fieldConfig.lookup || DONATE_NOW_BASE_FIELDS[0],
      required,
    );

  const lookupAllowed = (lookupValue) => {
    if (!isExistingDonor || !lookupSettings.enabled) return false;

    const trimmed = normalizeText(lookupValue);
    if (!trimmed || trimmed.length < lookupSettings.minimumCharacters)
      return false;

    if (trimmed.includes("@")) {
      return lookupSettings.lookupByEmail && isValidEmail(trimmed);
    }

    return (
      lookupSettings.lookupByMobile &&
      toDigits(trimmed).length >= 10 &&
      toDigits(trimmed).length <= 15
    );
  };

  const performLookup = async (lookupValue, options = {}) => {
    const { showValidationError = false } = options;
    const trimmedLookup = normalizeText(lookupValue);
    if (!isExistingDonor || !lookupSettings.enabled) return;
    if (!trimmedLookup) {
      setLookupState(getInitialLookupState());
      if (showValidationError) {
        setErrors((previous) => ({
          ...previous,
          lookup:
            getLookupValidationError(trimmedLookup, true) ||
            "Email / Mobile No. is required",
        }));
      }
      return;
    }

    const lookupValidationError = getLookupValidationError(trimmedLookup);
    if (lookupValidationError) {
      setLookupState(getInitialLookupState());
      if (showValidationError) {
        setErrors((previous) => ({ ...previous, lookup: lookupValidationError }));
      }
      return;
    }
    if (!lookupAllowed(trimmedLookup)) return;

    setLookupState((previous) => ({ ...previous, loading: true }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.lookup;
      delete next.donorVerification;
      delete next.verifyEmail;
      delete next.verifyMobile;
      delete next.verifyPanLast4;
      return next;
    });
    try {
      const include = lookupAutofillFields.join(",");
      const url = `/api/payment/donor-lookup?q=${encodeURIComponent(
        trimmedLookup,
      )}&include=${encodeURIComponent(include)}`;
      const res = await fetch(url);
      let data = null;
      try {
        data = await res.json();
      } catch (parseError) {
        logDonorLookupClientDebug("response-parse-failed", {
          lookupValue: trimmedLookup,
          status: res.status,
          statusText: res.statusText,
          parseError: parseError?.message || "",
        });
      }

      logDonorLookupClientDebug("response", {
        lookupValue: trimmedLookup,
        ok: res.ok,
        status: res.status,
        payload: data,
      });

      if (!res.ok) {
        setLookupState(getInitialLookupState());
        setErrors((previous) => ({
          ...previous,
          lookup: "Lookup request failed. Please try again.",
        }));
        setFieldValues((previous) => {
          const defaults = getInitialFieldValues(fieldConfig);
          const next = { ...previous };
          DONOR_PROFILE_FIELD_KEYS.forEach((fieldKey) => {
            next[fieldKey] = defaults[fieldKey] ?? "";
          });
          return next;
        });
        return;
      }
      if (!data?.found || !data?.donorMasked) {
        setLookupState(getInitialLookupState());
        setVerificationValues(getInitialVerificationState());
        setErrors((previous) => ({
          ...previous,
          lookup:
            copy.donorNotFoundMessage ||
            "No donor found for this email / mobile.",
        }));
        setFieldValues((previous) => {
          const defaults = getInitialFieldValues(fieldConfig);
          const next = { ...previous };
          DONOR_PROFILE_FIELD_KEYS.forEach((fieldKey) => {
            next[fieldKey] = defaults[fieldKey] ?? "";
          });
          return next;
        });
        return;
      }

      setLookupState({
        loading: false,
        found: true,
        verified: false,
        verificationToken: String(data.verificationToken || ""),
        requiresPanLast4: Boolean(data.requiresPanLast4),
        masked: data.masked || null,
        matchedSubmissionId: String(data.matchedSubmissionId || ""),
        lastDonation: data.lastDonation || null,
      });

      setFieldValues((previous) => {
        const next = { ...previous };
        lookupAutofillFields.forEach((fieldKey) => {
          if (!DONATE_NOW_BASE_FIELDS.some((field) => field.key === fieldKey))
            return;
          const incoming = String(data?.donorMasked?.[fieldKey] ?? "").trim();
          if (incoming) next[fieldKey] = incoming;
        });
        return next;
      });
      setVerificationValues(getInitialVerificationState());

      if (copy.donorFoundMessage) {
        notification.success({
          message: "Returning donor found",
          description:
            "Donor identified. Verify your identity to unlock full details.",
          placement: "bottomRight",
        });
      }
    } catch (error) {
      logDonorLookupClientDebug("request-failed", {
        lookupValue: trimmedLookup,
        message: error?.message || "",
      });
      setLookupState(getInitialLookupState());
      setErrors((previous) => ({
        ...previous,
        lookup: "Lookup request failed. Please try again.",
      }));
      setFieldValues((previous) => {
        const defaults = getInitialFieldValues(fieldConfig);
        const next = { ...previous };
        DONOR_PROFILE_FIELD_KEYS.forEach((fieldKey) => {
          next[fieldKey] = defaults[fieldKey] ?? "";
        });
        return next;
      });
    }
  };

  const verifyExistingDonor = async () => {
    if (!lookupState.found || lookupState.verified || verifyingDonor) return;

    const verifyEmail = normalizeText(verificationValues.email).toLowerCase();
    const verifyMobile = normalizeText(verificationValues.mobile);
    const verifyPanLast4 = normalizeText(verificationValues.panLast4).toUpperCase();
    const nextErrors = {};

    if (!isValidEmail(verifyEmail)) {
      nextErrors.verifyEmail = "Please enter a valid email";
    }
    if (!isValidPhone(verifyMobile)) {
      nextErrors.verifyMobile = "Please enter a valid mobile number";
    }
    if (lookupState.requiresPanLast4) {
      if (!/^[A-Z0-9]{4}$/.test(verifyPanLast4)) {
        nextErrors.verifyPanLast4 = "Enter first 4 PAN characters";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((previous) => ({ ...previous, ...nextErrors }));
      return;
    }
    if (!lookupState.verificationToken) {
      setErrors((previous) => ({
        ...previous,
        donorVerification: "Verification expired. Please lookup again.",
      }));
      return;
    }

    setVerifyingDonor(true);
    try {
      const response = await fetch("/api/payment/donor-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: lookupState.verificationToken,
          email: verifyEmail,
          mobile: verifyMobile,
          panLast4: verifyPanLast4,
          include: lookupAutofillFields.join(","),
        }),
      });
      const data = await response.json();
      logDonorLookupClientDebug("verify-response", {
        ok: response.ok,
        status: response.status,
        payload: data,
      });

      if (!response.ok || !data?.verified || !data?.donor) {
        setErrors((previous) => ({
          ...previous,
          donorVerification:
            data?.error ||
            "Verification failed. Please check your details and try again.",
        }));
        setVerifyingDonor(false);
        return;
      }

      setLookupState((previous) => ({
        ...previous,
        loading: false,
        found: true,
        verified: true,
        matchedSubmissionId:
          String(data?.matchedSubmissionId || "") || previous.matchedSubmissionId,
      }));

      setFieldValues((previous) => {
        const next = { ...previous };
        lookupAutofillFields.forEach((fieldKey) => {
          if (!DONATE_NOW_BASE_FIELDS.some((field) => field.key === fieldKey))
            return;
          const incoming = String(data?.donor?.[fieldKey] ?? "").trim();
          if (incoming) next[fieldKey] = incoming;
        });
        return next;
      });

      setErrors((previous) => {
        const next = { ...previous };
        delete next.donorVerification;
        delete next.verifyEmail;
        delete next.verifyMobile;
        delete next.verifyPanLast4;
        return next;
      });
      notification.success({
        message: "Verification complete",
        description: "Full donor details unlocked. You can review and update.",
        placement: "bottomRight",
      });
    } catch (error) {
      logDonorLookupClientDebug("verify-request-failed", {
        message: error?.message || "",
      });
      setErrors((previous) => ({
        ...previous,
        donorVerification: "Verification failed. Please try again.",
      }));
    } finally {
      setVerifyingDonor(false);
    }
  };

  const scheduleLookup = (nextLookupValue) => {
    if (!isExistingDonor || !lookupSettings.enabled) return;
    if (lookupTimerRef.current) {
      window.clearTimeout(lookupTimerRef.current);
    }

    const trimmedLookup = normalizeText(nextLookupValue);
    if (!trimmedLookup || getLookupValidationError(trimmedLookup)) {
      setLookupState(getInitialLookupState());
      return;
    }
    if (!lookupAllowed(trimmedLookup)) return;

    lookupTimerRef.current = window.setTimeout(() => {
      performLookup(trimmedLookup);
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) window.clearTimeout(lookupTimerRef.current);
    };
  }, []);

  const validateBeforeSubmit = () => {
    const nextErrors = {};

    if (!isDonorTypeSelected) {
      nextErrors.donorType = "Please select donor type";
    }

    if (isExistingDonor) {
      const lookupValue = normalizeText(fieldValues.lookup);
      const lookupError = getLookupValidationError(lookupValue, true);
      if (lookupError) {
        nextErrors.lookup = lookupError;
      } else if (!lookupState.found) {
        nextErrors.lookup =
          copy.donorNotFoundMessage ||
          "Please identify the existing donor using email / mobile.";
      } else if (!lookupState.verified) {
        nextErrors.donorVerification =
          "Please complete donor verification to unlock and edit full details.";
      }
    }

    if (isExistingDonor && !lookupState.verified) {
      setErrors(nextErrors);
      return false;
    }

    DONATE_NOW_BASE_FIELDS.forEach((baseField) => {
      const key = baseField.key;
      const config = fieldConfig[key] || baseField;

      if (!isBaseFieldVisible(key)) return;
      if (key === "purpose") return;
      if (key === "lookup") return;

      const required = requiredFields.has(key);
      const validationError = getFieldValidationError(
        key,
        fieldValues[key],
        config,
        required,
      );
      if (validationError) nextErrors[key] = validationError;
    });

    if (!selectedPurpose?.id) {
      nextErrors.purpose = "Please select a purpose";
    }

    if (canUseMainFormFields) {
      additionalFields.forEach((extraField) => {
        const currentValue = additionalFieldValues[extraField.key];
        const normalized = normalizeText(currentValue);
        const errorKey = `additional:${extraField.key}`;

        if (extraField.required && !normalized) {
          nextErrors[errorKey] = `${extraField.label} is required`;
          return;
        }
        if (
          extraField.type === "number" &&
          normalized &&
          Number.isNaN(Number(normalized))
        ) {
          nextErrors[errorKey] = `${extraField.label} must be a number`;
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateBeforeSubmit()) return;

    const donor = {
      name: normalizeText(fieldValues.name),
      email: normalizeText(fieldValues.email),
      mobile: toDigits(fieldValues.mobile) || normalizeText(fieldValues.mobile),
      pan: normalizeText(fieldValues.pan).toUpperCase(),
      address: normalizeText(fieldValues.address),
      city: normalizeText(fieldValues.city),
      state: normalizeText(fieldValues.state),
      country: normalizeText(fieldValues.country || "India"),
      pincode: normalizeText(fieldValues.pincode),
    };

    const lookupRaw = isExistingDonor ? normalizeText(fieldValues.lookup) : "";
    const lookupMethod = lookupRaw.includes("@") ? "email" : "mobile";
    const additionalFieldsPayload = {};
    additionalFields.forEach((field) => {
      additionalFieldsPayload[field.key] = normalizeAdditionalFieldValue(
        field.type,
        additionalFieldValues[field.key] ?? field.defaultValue ?? "",
      );
    });

    const amount = Number(fieldValues.amount);
    const payload = {
      amount,
      currency: paymentSettings.currency || "INR",
      purpose: selectedPurpose?.name || "",
      purposeId: selectedPurpose?.id || "",
      zakat: normalizeText(fieldValues.zakat) || "No",
      interestMoney: normalizeText(fieldValues.interestMoney) || "No",
      studentsCount: normalizeText(fieldValues.studentsCount),
      note: normalizeText(fieldValues.note),
      donor,
      additionalFields: additionalFieldsPayload,
      termsAccepted: false,
      source: "DonateNow",
      donorType: isExistingDonor ? "existing" : "new",
      pagePath:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "",
      lookup: {
        query: lookupRaw,
        method: lookupRaw ? lookupMethod : "none",
        matched: lookupState.found,
        matchedSubmissionId: lookupState.matchedSubmissionId || "",
      },
      purposeRuleSnapshot: {
        purpose: selectedPurpose || {},
        hiddenFields: Array.from(hiddenFields),
        disabledFields: Array.from(disabledFields),
        requiredFields: Array.from(requiredFields),
      },
      paymentSettingsSnapshot: paymentSettings,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        notification.error({
          message: "Submission failed",
          description:
            data?.error || copy.errorMessage || "Failed to initiate payment",
          placement: "bottomRight",
        });
        setSubmitting(false);
        return;
      }

      notification.success({
        message: "Success",
        description: copy.successMessage || "Redirecting to payment gateway...",
        placement: "bottomRight",
      });

      setEncData(data);
      window.setTimeout(() => {
        gatewayFormRef.current?.submit();
      }, 120);
    } catch (error) {
      notification.error({
        message: "Submission failed",
        description: copy.errorMessage || "Something went wrong",
        placement: "bottomRight",
      });
      setSubmitting(false);
    }
  };

  const fieldOptions = useMemo(
    () =>
      DONATE_NOW_BASE_FIELDS.reduce((acc, item) => {
        const config = fieldConfig[item.key] || item;
        if (isSelectField(config)) {
          acc[item.key] = config.options.map((option) => ({
            label: option.label,
            value: option.value,
          }));
        }
        return acc;
      }, {}),
    [fieldConfig],
  );

  const renderBaseField = (baseField) => {
    const key = baseField.key;
    const config = fieldConfig[key] || baseField;
    if (!isBaseFieldVisible(key)) return null;

    const required = key === "lookup" ? true : requiredFields.has(key);
    const disabled = disabledFields.has(key) || !canUseMainFormFields;
    const value = fieldValues[key] ?? "";
    const placeholder = config.placeholder || "";
    const error = errors[key];

    const colSpan = config.width === "full" || key === "lookup" ? 24 : 12;

    if (key === "purpose") {
      return (
        <Col key={key} xs={24} md={colSpan}>
          <FieldWrap $sectionStart>
            <FieldLabel>
              {config.label}
              {required ? <span className="req">*</span> : null}
            </FieldLabel>
            <FieldSelect
              size="large"
              value={selectedPurpose?.id || undefined}
              onChange={(nextPurposeId) => selectPurpose(nextPurposeId)}
              status={error ? "error" : ""}
              placeholder={placeholder || "Select purpose"}
              options={selectablePurposes.map((purpose) => ({
                label: purpose.name,
                value: purpose.id,
              }))}
              disabled={disabled}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </FieldWrap>
        </Col>
      );
    }

    if (isSelectField(config)) {
      return (
        <Col key={key} xs={24} md={colSpan}>
          <FieldWrap
            $sectionStart={key === "purpose" || key === "studentsCount"}
          >
            <FieldLabel>
              {config.label}
              {required ? <span className="req">*</span> : null}
            </FieldLabel>
            <FieldSelect
              size="large"
              value={value || undefined}
              onChange={(nextValue) => handleFieldValue(key, nextValue)}
              status={error ? "error" : ""}
              placeholder={placeholder}
              options={fieldOptions[key] || []}
              disabled={key === "lookup" ? lookupState.loading : disabled}
              onBlur={() => {
                if (key === "lookup") {
                  performLookup(value, { showValidationError: true });
                }
              }}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </FieldWrap>
        </Col>
      );
    }

    if (key === "note") {
      return (
        <Col key={key} xs={24} md={24}>
          <FieldWrap>
            <FieldLabel>
              {config.label}
              {required ? <span className="req">*</span> : null}
            </FieldLabel>
            <FieldInput
              type="text"
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(event) => handleFieldValue(key, event.target.value)}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </FieldWrap>
        </Col>
      );
    }

    return (
      <Col key={key} xs={24} md={colSpan}>
        <FieldWrap>
          <FieldLabel>
            {config.label}
            {required ? <span className="req">*</span> : null}
          </FieldLabel>
          <FieldInput
            type={
              key === "amount" || key === "studentsCount" ? "number" : "text"
            }
            inputMode={
              key === "amount" ||
              key === "studentsCount" ||
              key === "mobile" ||
              key === "pincode"
                ? "numeric"
                : "text"
            }
            value={value}
            placeholder={placeholder}
            disabled={key === "lookup" ? lookupState.loading : disabled}
            onChange={(event) => {
              handleFieldValue(key, event.target.value);
              if (key === "amount") {
                setAmountTouched(true);
              }
              if (key === "lookup" && isExistingDonor && lookupSettings.enabled) {
                scheduleLookup(event.target.value);
              }
            }}
            onBlur={() => {
              if (key === "lookup" && isExistingDonor && lookupSettings.enabled) {
                performLookup(value, { showValidationError: true });
              }
            }}
          />
          {error ? <FieldError>{error}</FieldError> : null}
          {key === "lookup" ? <FieldSeparator /> : null}
        </FieldWrap>
      </Col>
    );
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) ? (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle ? (
                <SubTitle
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              ) : null}
              {titleEnabled && mainTitle ? (
                <MainTitle color={titleColor}>{mainTitle}</MainTitle>
              ) : null}
            </Col>
          </Row>
        ) : null}

        <Row gutter={[20, 20]} align="top" justify="center">
          <Col xs={24} lg={16}>
            <LeftColumn>
              <FormPanel>
                <PanelTitle style={{ color: formHeadingColor }}>
                  {copy.formTitle || "Details"}
                </PanelTitle>
                {copy.formSubtitle ? (
                  <PanelSubTitle>{copy.formSubtitle}</PanelSubTitle>
                ) : null}

                {isExistingDonor &&
                lookupState.found &&
                lookupSettings.showMaskedPreview ? (
                  <LookupInfo>
                    <div className="lookup-title">
                      Returning donor recognized
                    </div>
                    <div className="lookup-line">
                      Mobile:{" "}
                      <strong>{lookupState?.masked?.mobile || "-"}</strong>
                    </div>
                    <div className="lookup-line">
                      Email:{" "}
                      <strong>{lookupState?.masked?.email || "-"}</strong>
                    </div>
                    {lookupState?.lastDonation?.amount ? (
                      <div className="lookup-line">
                        Last donation:{" "}
                        <strong>
                          {formatInr(lookupState.lastDonation.amount)} (
                          {lookupState.lastDonation.purpose || "N/A"})
                        </strong>
                      </div>
                    ) : null}
                  </LookupInfo>
                ) : null}

                <Row gutter={[20, 10]}>
                  <Col xs={24} md={24}>
                    <FieldWrap>
                      <FieldLabel>
                        Donor Type
                        <span className="req">*</span>
                      </FieldLabel>
                      <FieldSelect
                        size="large"
                        value={donorType || undefined}
                        onChange={handleDonorTypeChange}
                        status={errors.donorType ? "error" : ""}
                        placeholder="Select donor type"
                        options={DONOR_TYPE_OPTIONS}
                      />
                      {errors.donorType ? (
                        <FieldError>{errors.donorType}</FieldError>
                      ) : null}
                    </FieldWrap>
                  </Col>

                  {DONATE_NOW_BASE_FIELDS.map((fieldDef) =>
                    renderBaseField(fieldDef),
                  )}

                  {isExistingDonor && lookupState.found && !lookupState.verified ? (
                    <Col xs={24} md={24}>
                      <VerificationPanel>
                        <h4>Verify Identity to Unlock Full Details</h4>
                        <p>
                          For security, donor details are masked. Verify with
                          registered contact details to reveal and edit.
                        </p>
                        <Row gutter={[12, 8]}>
                          <Col xs={24} md={12}>
                            <FieldLabel>
                              Verification Email
                              <span className="req">*</span>
                            </FieldLabel>
                            <FieldInput
                              type="email"
                              value={verificationValues.email}
                              placeholder="Enter registered email"
                              onChange={(event) =>
                                handleVerificationValue(
                                  "email",
                                  event.target.value,
                                )
                              }
                            />
                            {errors.verifyEmail ? (
                              <FieldError>{errors.verifyEmail}</FieldError>
                            ) : null}
                          </Col>
                          <Col xs={24} md={12}>
                            <FieldLabel>
                              Verification Mobile
                              <span className="req">*</span>
                            </FieldLabel>
                            <FieldInput
                              type="text"
                              inputMode="numeric"
                              value={verificationValues.mobile}
                              placeholder="Enter registered mobile"
                              onChange={(event) =>
                                handleVerificationValue(
                                  "mobile",
                                  event.target.value,
                                )
                              }
                            />
                            {errors.verifyMobile ? (
                              <FieldError>{errors.verifyMobile}</FieldError>
                            ) : null}
                          </Col>
                          {lookupState.requiresPanLast4 ? (
                            <Col xs={24} md={12}>
                              <FieldLabel>
                                PAN Start 4
                                <span className="req">*</span>
                              </FieldLabel>
                              <FieldInput
                                type="text"
                                maxLength={4}
                                value={verificationValues.panLast4}
                                placeholder="First 4 PAN characters"
                                onChange={(event) =>
                                  handleVerificationValue(
                                    "panLast4",
                                    event.target.value.toUpperCase(),
                                  )
                                }
                              />
                              {errors.verifyPanLast4 ? (
                                <FieldError>{errors.verifyPanLast4}</FieldError>
                              ) : null}
                            </Col>
                          ) : null}
                        </Row>
                        {errors.donorVerification ? (
                          <FieldError>{errors.donorVerification}</FieldError>
                        ) : null}
                        <VerifyButton
                          type="button"
                          disabled={verifyingDonor}
                          onClick={verifyExistingDonor}
                        >
                          {verifyingDonor ? "Verifying..." : "Verify & Unlock"}
                        </VerifyButton>
                      </VerificationPanel>
                    </Col>
                  ) : null}

                  {canUseMainFormFields
                    ? additionalFields.map((extraField) => {
                        const errorKey = `additional:${extraField.key}`;
                        const error = errors[errorKey];
                        const isSelect = extraField.type === "select";
                        const currentValue =
                          additionalFieldValues[extraField.key] ??
                          extraField.defaultValue ??
                          "";
                        const options = String(extraField.optionsCsv || "")
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean);

                        return (
                          <Col key={extraField.key} xs={24} md={12}>
                            <FieldWrap>
                              <FieldLabel>
                                {extraField.label}
                                {extraField.required ? (
                                  <span className="req">*</span>
                                ) : null}
                              </FieldLabel>
                              {isSelect ? (
                                <FieldSelect
                                  size="large"
                                  value={currentValue || undefined}
                                  onChange={(nextValue) =>
                                    handleAdditionalValue(
                                      extraField.key,
                                      nextValue,
                                    )
                                  }
                                  options={options.map((option) => ({
                                    label: option,
                                    value: option,
                                  }))}
                                  placeholder={
                                    extraField.placeholder ||
                                    `Select ${extraField.label}`
                                  }
                                  disabled={extraField.disabled}
                                />
                              ) : extraField.type === "textarea" ? (
                                <FieldTextArea
                                  value={currentValue}
                                  onChange={(event) =>
                                    handleAdditionalValue(
                                      extraField.key,
                                      event.target.value,
                                    )
                                  }
                                  placeholder={extraField.placeholder}
                                  disabled={extraField.disabled}
                                />
                              ) : (
                                <FieldInput
                                  type={
                                    extraField.type === "number"
                                      ? "number"
                                      : "text"
                                  }
                                  value={currentValue}
                                  onChange={(event) =>
                                    handleAdditionalValue(
                                      extraField.key,
                                      event.target.value,
                                    )
                                  }
                                  placeholder={extraField.placeholder}
                                  disabled={extraField.disabled}
                                />
                              )}
                              {error ? <FieldError>{error}</FieldError> : null}
                            </FieldWrap>
                          </Col>
                        );
                      })
                    : null}
                </Row>

                <ButtonRow>
                  {paymentSettings.enableQrButton && qrImageUrl ? (
                    <QrButton
                      type="button"
                      style={{ color: qrBtnText, borderColor: qrBtnBorder }}
                      onClick={() => window.open(qrImageUrl, "_blank")}
                    >
                      {copy.qrButtonText || "Donate Now with QR"}
                    </QrButton>
                  ) : null}
                  <DonateButton
                    type="button"
                    style={{
                      background: donateButtonBg,
                      color: donateButtonText,
                    }}
                    disabled={
                      submitting ||
                      !isDonorTypeSelected ||
                      (isExistingDonor &&
                        (!lookupState.found || !lookupState.verified))
                    }
                    onClick={handleSubmit}
                  >
                    {submitting
                      ? copy.donateButtonProcessingText || "Processing..."
                      : copy.donateButtonText || "Donate Now"}
                  </DonateButton>
                </ButtonRow>
              </FormPanel>

              {copy.footerBannerText || copy.footerBannerImage ? (
                <FooterBanner
                  style={{
                    backgroundColor: copy.footerBannerBgColor || "#111111",
                    ...(copy.footerBannerImage
                      ? {
                          backgroundImage: `url(${copy.footerBannerImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}),
                  }}
                >
                  {copy.footerBannerText?.includes(
                    "80G of Income Tax Act 1961.",
                  ) ? (
                    <>
                      <span>Your Donation to MESCO Exempt Under Section</span>
                      <strong>80G of Income Tax Act 1961.</strong>
                    </>
                  ) : (
                    copy.footerBannerText
                  )}
                </FooterBanner>
              ) : null}
            </LeftColumn>
          </Col>

          <Col xs={24} lg={8}>
            <RightColumn>
              <PurposePanel>
                <PurposeGrid>
                  {renderedPurposes.map((purpose) => {
                    const active = selectedPurpose?.id === purpose.id;
                    return (
                      <PurposeCard
                        key={purpose.id}
                        type="button"
                        $active={active}
                        onClick={() => selectPurpose(purpose.id)}
                      >
                        {purpose.cardIcon ? (
                          <CardIconWrap $active={active}>
                            <CardIcon
                              src={purpose.cardIcon}
                              alt={
                                purpose.cardTitle ||
                                purpose.name ||
                                "Donation purpose icon"
                              }
                              loading="lazy"
                            />
                          </CardIconWrap>
                        ) : (
                          <CardDot $active={active} />
                        )}
                        <h4>{purpose.cardTitle || purpose.name}</h4>
                        <div className="amount">
                          {purpose.cardAmountText ||
                            formatInr(purpose.defaultAmount)}
                        </div>
                        {purpose.cardDescription ? (
                          <p>{purpose.cardDescription}</p>
                        ) : null}
                      </PurposeCard>
                    );
                  })}
                </PurposeGrid>
              </PurposePanel>
            </RightColumn>
          </Col>
        </Row>

        {encData ? (
          <form
            ref={gatewayFormRef}
            method="POST"
            action={encData.gatewayUrl}
            style={{ display: "none" }}
          >
            <input type="hidden" name="encRequest" value={encData.encRequest} />
            <input
              type="hidden"
              name="access_code"
              value={encData.accessCode}
            />
          </form>
        ) : null}
      </PageContainer>
    </FullWidthBackground>
  );
}

const LeftColumn = styled.div`
  width: 100%;
  margin: 0 auto;
`;

const RightColumn = styled.div`
  width: 100%;
  max-width: 409px;
  margin: 0 auto;
`;

const FormPanel = styled.div`
  background: #ffffff;
  border: 1px solid rgba(229, 231, 235, 1);
  border-radius: 10px;
  padding: 32px 40px 30px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
  @media (max-width: 767px) {
    padding: 18px 14px 16px;
    border-radius: 10px;
  }
`;

const PurposePanel = styled.div`
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  @media (max-width: 767px) {
    padding: 0;
  }
`;

const PanelTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 700;
  @media (max-width: 991px) {
    font-size: 22px;
  }
  @media (max-width: 640px) {
    font-size: 21px;
  }
`;

const PanelSubTitle = styled.p`
  margin: 0 0 18px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 1.55;
`;

const LookupInfo = styled.div`
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 105, 0, 0.18);
  background: rgba(29, 140, 23, 0.08);
  .lookup-title {
    font-size: 13px;
    font-weight: 700;
    color: #126f15;
    margin-bottom: 4px;
  }
  .lookup-line {
    font-size: 12px;
    color: #1f2920;
    line-height: 1.5;
  }
`;

const VerificationPanel = styled.div`
  margin-bottom: 16px;
  padding: 14px 14px 12px;
  border-radius: 10px;
  border: 1px solid rgba(207, 55, 47, 0.25);
  background: rgba(207, 55, 47, 0.05);
  h4 {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 700;
    color: #7f1f1b;
  }
  p {
    margin: 0 0 12px;
    color: rgba(0, 0, 0, 0.72);
    font-size: 12px;
    line-height: 1.5;
  }
`;

const VerifyButton = styled.button`
  margin-top: 10px;
  min-height: 40px;
  border-radius: 999px;
  border: 1px solid ${getColor("primary")};
  background: #ffffff;
  color: ${getColor("primary")};
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FieldWrap = styled.div`
  margin-bottom: 16px;
  ${(props) => (props.$sectionStart ? "margin-top: 16px;" : "")}
`;

const FieldSeparator = styled.hr`
  border: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
  margin: 18px 0 14px;
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 600;
  color: #1d1f21;
  .req {
    color: #cf372f;
    margin-left: 3px;
  }
`;

const FIELD_CONTROL_HEIGHT = "52px";
const FIELD_CONTROL_INNER_HEIGHT = "50px";

const FieldInput = styled.input`
  width: 100%;
  height: ${FIELD_CONTROL_HEIGHT};
  border-radius: 10px;
  border: 1px solid rgba(5, 5, 5, 0.1);
  padding: 0 13px;
  outline: none;
  font-size: 14px;
  line-height: 1.4;
  box-sizing: border-box;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &:focus {
    border-color: ${getColor("primary")};
    box-shadow: 0 0 0 2px rgba(207, 55, 47, 0.1);
  }
  &:disabled {
    background: rgba(0, 0, 0, 0.04);
    cursor: not-allowed;
  }
`;

const FieldTextArea = styled.textarea`
  width: 100%;
  min-height: 52px;
  border-radius: 10px;
  border: 1px solid rgba(5, 5, 5, 0.1);
  padding: 10px 13px;
  outline: none;
  resize: vertical;
  font-size: 14px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &:focus {
    border-color: ${getColor("primary")};
    box-shadow: 0 0 0 2px rgba(207, 55, 47, 0.1);
  }
`;

const FieldSelect = styled(Select)`
  width: 100%;
  .ant-select-single .ant-select-selector {
    height: ${FIELD_CONTROL_HEIGHT} !important;
    min-height: ${FIELD_CONTROL_HEIGHT} !important;
    border-radius: 10px !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    border: 1px solid rgba(5, 5, 5, 0.1) !important;
    padding-inline: 12px !important;
    padding-right: 36px !important;
    font-size: 14px !important;
  }
  .ant-select-single .ant-select-selector .ant-select-selection-item,
  .ant-select-single .ant-select-selector .ant-select-selection-placeholder,
  .ant-select-single .ant-select-selector .ant-select-selection-search {
    display: flex;
    align-items: center;
    height: ${FIELD_CONTROL_INNER_HEIGHT} !important;
    line-height: normal !important;
    font-size: 14px !important;
  }
  .ant-select-single:not(.ant-select-customize-input)
    .ant-select-selector
    .ant-select-selection-search-input {
    height: ${FIELD_CONTROL_INNER_HEIGHT} !important;
    line-height: ${FIELD_CONTROL_INNER_HEIGHT} !important;
    font-size: 14px !important;
  }
  .ant-select-arrow {
    height: 100%;
    top: 0;
    inset-inline-end: 12px;
    transform: none;
    display: inline-flex;
    align-items: center;
    line-height: 1;
    pointer-events: none;
  }
  .ant-select-arrow .anticon {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }
  &.ant-select-focused .ant-select-selector,
  &.ant-select-open .ant-select-selector {
    border-color: ${getColor("primary")} !important;
    box-shadow: 0 0 0 2px rgba(207, 55, 47, 0.1) !important;
  }
`;

const FieldError = styled.div`
  margin-top: 6px;
  color: #cf372f;
  font-size: 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
  @media (max-width: 575px) {
    justify-content: stretch;
    > button {
      width: 100%;
    }
  }
`;

const DonateButton = styled.button`
  border: none;
  border-radius: 28px;
  min-height: 48px;
  font-size: 14px;
  font-weight: 700;
  min-width: 135px;
  padding: 0 20px;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  &:hover {
    opacity: 0.93;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const QrButton = styled.button`
  border: 1px solid;
  border-radius: 28px;
  min-height: 48px;
  font-size: 14px;
  font-weight: 700;
  min-width: 199px;
  padding: 0 20px;
  background: transparent;
  cursor: pointer;
`;

const PurposeGrid = styled.div`
  display: grid;
  column-gap: 21px;
  row-gap: 22px;
  grid-template-columns: repeat(2, 194px);
  justify-content: space-between;
  @media (max-width: 1199px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 12px;
    row-gap: 12px;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const PurposeCard = styled.button`
  border: 1px solid rgba(207, 55, 47, 0.2);
  background: ${(props) => (props.$active ? "#fbebeb" : "#ffffff")};
  border-radius: 10px;
  text-align: center;
  padding: 17px 8px 10px;
  min-height: 190px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  box-shadow: none;
  overflow: hidden;
  position: relative;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
  &:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: #cf372f;
  }
  &:hover {
    border-color: rgba(207, 55, 47, 0.35);
    background: ${(props) => (props.$active ? "#fbebeb" : "#fff6f5")};
  }
  h4 {
    margin: 0;
    color: rgba(38, 42, 44, 0.9);
    font-size: 14px;
    line-height: 1.3;
    font-weight: 700;
    text-align: center;
  }
  .amount {
    color: #cf372f;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
    opacity: 0.9;
  }
  p {
    margin: 0;
    color: rgba(38, 42, 44, 0.9);
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
  }
`;

const CardDot = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, #a92d26 0%, #7b1c1c 100%)"
      : "#8b1a1a"};
  display: inline-block;
  position: relative;
  &:after {
    content: "";
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background-image: linear-gradient(120deg, #ffffff 0%, #ffe8e7 100%);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const CardIconWrap = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, #a92d26 0%, #7b1c1c 100%)"
      : "#8b1a1a"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CardIcon = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1);
`;

const FooterBanner = styled.div`
  margin-top: 18px;
  border-radius: 10px;
  min-height: 176px;
  color: #ffffff;
  display: flex;
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
  padding: 14px 20px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.5;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  overflow-wrap: anywhere;
  strong {
    color: #cf372f;
    width: 100%;
    display: block;
  }
  span {
    width: 100%;
    display: block;
  }
  @media (max-width: 991px) {
    min-height: 116px;
    font-size: 20px;
  }
  @media (max-width: 640px) {
    font-size: 18px;
    padding: 14px;
    min-height: 92px;
  }
`;
