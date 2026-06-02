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
  const [fieldValues, setFieldValues] = useState(() =>
    getInitialFieldValues(fieldConfig),
  );
  const [additionalFieldValues, setAdditionalFieldValues] = useState({});
  const [amountTouched, setAmountTouched] = useState(false);
  const [lookupState, setLookupState] = useState({
    loading: false,
    found: false,
    masked: null,
    matchedSubmissionId: "",
    lastDonation: null,
  });

  useEffect(() => {
    setSelectedPurposeId(
      defaultPurposeId || getDefaultPurposeValue(selectablePurposes),
    );
    setFieldValues(getInitialFieldValues(fieldConfig));
    setAdditionalFieldValues({});
    setAmountTouched(false);
    setErrors({});
    previousPurposeIdRef.current = "";
  }, [defaultPurposeId, selectablePurposes, fieldConfig]);

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

  const handleFieldValue = (fieldKey, nextValue) => {
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

  const lookupAllowed = (lookupValue) => {
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

  const performLookup = async (lookupValue) => {
    if (!lookupSettings.enabled || !lookupAllowed(lookupValue)) return;

    setLookupState((previous) => ({ ...previous, loading: true }));
    try {
      const include = Array.isArray(lookupSettings.reusableFields)
        ? lookupSettings.reusableFields.join(",")
        : "";
      const res = await fetch(
        `/api/payment/donor-lookup?q=${encodeURIComponent(
          lookupValue,
        )}&include=${encodeURIComponent(include)}`,
      );
      const data = await res.json();
      if (!res.ok || !data?.found || !data?.donor) {
        setLookupState({
          loading: false,
          found: false,
          masked: null,
          matchedSubmissionId: "",
          lastDonation: null,
        });
        return;
      }

      setLookupState({
        loading: false,
        found: true,
        masked: data.masked || null,
        matchedSubmissionId: String(data.matchedSubmissionId || ""),
        lastDonation: data.lastDonation || null,
      });

      if (lookupSettings.autoFillEnabled) {
        setFieldValues((previous) => {
          const next = { ...previous };
          lookupSettings.reusableFields.forEach((fieldKey) => {
            if (!DONATE_NOW_BASE_FIELDS.some((field) => field.key === fieldKey))
              return;
            const incoming = String(data?.donor?.[fieldKey] ?? "").trim();
            if (incoming) next[fieldKey] = incoming;
          });
          return next;
        });
      }

      if (copy.donorFoundMessage) {
        notification.success({
          message: "Returning donor found",
          description: copy.donorFoundMessage,
          placement: "bottomRight",
        });
      }
    } catch (error) {
      setLookupState({
        loading: false,
        found: false,
        masked: null,
        matchedSubmissionId: "",
        lastDonation: null,
      });
    }
  };

  const scheduleLookup = (nextLookupValue) => {
    if (lookupTimerRef.current) {
      window.clearTimeout(lookupTimerRef.current);
    }
    lookupTimerRef.current = window.setTimeout(() => {
      performLookup(nextLookupValue);
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) window.clearTimeout(lookupTimerRef.current);
    };
  }, []);

  const validateBeforeSubmit = () => {
    const nextErrors = {};

    DONATE_NOW_BASE_FIELDS.forEach((baseField) => {
      const key = baseField.key;
      const config = fieldConfig[key] || baseField;

      if (hiddenFields.has(key)) return;
      if (key === "purpose") return;

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

    const lookupRaw = normalizeText(fieldValues.lookup);
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
    if (hiddenFields.has(key)) return null;

    const required = requiredFields.has(key);
    const disabled =
      disabledFields.has(key) || (key === "lookup" && lookupState.loading);
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
              disabled={disabled}
              onBlur={() => {
                if (key === "lookup") performLookup(value);
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
            disabled={disabled}
            onChange={(event) => {
              handleFieldValue(key, event.target.value);
              if (key === "amount") {
                setAmountTouched(true);
              }
              if (key === "lookup" && lookupSettings.enabled) {
                scheduleLookup(event.target.value);
              }
            }}
            onBlur={() => {
              if (key === "lookup" && lookupSettings.enabled) {
                performLookup(value);
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

                {lookupState.found && lookupSettings.showMaskedPreview ? (
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
                  {DONATE_NOW_BASE_FIELDS.map((fieldDef) =>
                    renderBaseField(fieldDef),
                  )}

                  {additionalFields.map((extraField) => {
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
                                handleAdditionalValue(extraField.key, nextValue)
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
                                extraField.type === "number" ? "number" : "text"
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
                  })}
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
                    disabled={submitting}
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
