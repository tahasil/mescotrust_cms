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
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";
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

const FORM_GRID_COL_PROPS = { xs: 24, sm: 12, lg: 8 };
const FORM_GRID_FULL_COL_PROPS = { xs: 24 };
const FORM_TEXTAREA_COL_PROPS = { xs: 24, sm: 24, md: 24, lg: 12 };

function getInitialLookupState() {
  return {
    loading: false,
    found: false,
    verified: false,
    verificationToken: "",
    verificationProof: "",
    requiresPanLast4: false,
    masked: null,
    matchedSubmissionId: "",
    lastDonation: null,
  };
}

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise = null;

/**
 * Load Razorpay's checkout script once per page and resolve with the global
 * constructor it installs.
 */
function loadRazorpayCheckout() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is browser only"));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`,
    );
    const script = existing || document.createElement("script");
    const onLoad = () =>
      window.Razorpay
        ? resolve(window.Razorpay)
        : reject(new Error("Razorpay checkout failed to initialise"));
    script.addEventListener("load", onLoad);
    script.addEventListener("error", () => {
      razorpayScriptPromise = null;
      reject(new Error("Razorpay checkout script failed to load"));
    });
    if (!existing) {
      script.src = RAZORPAY_CHECKOUT_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      onLoad();
    }
  });
  return razorpayScriptPromise;
}

function getInitialVerificationState() {
  return {
    email: "",
    mobile: "",
  };
}

export default function DonateNow(props = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [encData, setEncData] = useState(null);
  const gatewayFormRef = useRef(null);
  const paymentResultHandledRef = useRef(false);
  const lookupTimerRef = useRef(null);
  const lastLookedUpRef = useRef("");
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

  useEffect(() => {
    if (!encData) return;

    const failGateway = () => {
      notification.error({
        message: "Payment gateway error",
        description: "Unable to open the payment gateway. Please try again.",
        placement: "bottomRight",
      });
      setEncData(null);
      setSubmitting(false);
    };

    // Razorpay opens its own checkout overlay and, with redirect enabled,
    // posts the result to our callback route just like CCAvenue does.
    if (encData.provider === "razorpay") {
      let cancelled = false;
      loadRazorpayCheckout()
        .then((Razorpay) => {
          if (cancelled) return;
          const checkout = new Razorpay({
            key: encData.keyId,
            amount: encData.amount,
            currency: encData.currency,
            order_id: encData.razorpayOrderId,
            name: encData.name,
            description: encData.description,
            prefill: encData.prefill || {},
            notes: encData.notes || {},
            callback_url: encData.callbackUrl,
            redirect: true,
            modal: {
              ondismiss: () => {
                notification.info({
                  message: "Payment cancelled",
                  description: "You closed the payment window before completing the donation.",
                  placement: "bottomRight",
                });
                setEncData(null);
                setSubmitting(false);
              },
            },
          });
          checkout.open();
        })
        .catch(() => {
          if (!cancelled) failGateway();
        });
      return () => {
        cancelled = true;
      };
    }

    const gatewayForm = gatewayFormRef.current;
    if (!gatewayForm) {
      failGateway();
      return;
    }
    gatewayForm.submit();
  }, [encData]);

  useEffect(() => {
    if (paymentResultHandledRef.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("donation");
    if (!paymentResult) return;
    paymentResultHandledRef.current = true;

    const orderId = params.get("order") || "";
    if (paymentResult === "success") {
      notification.success({
        message: "Donation successful",
        description: orderId
          ? `Your payment was verified. Order ID: ${orderId}`
          : "Your payment was verified successfully.",
        placement: "bottomRight",
        duration: 8,
      });
    } else {
      const status = params.get("status");
      notification.error({
        message: status === "cancelled" ? "Payment cancelled" : "Payment unsuccessful",
        description: orderId
          ? `No successful payment was recorded for order ${orderId}.`
          : "The payment could not be completed or verified. Please try again.",
        placement: "bottomRight",
        duration: 8,
      });
    }

    ["donation", "order", "status", "reason"].forEach((key) => params.delete(key));
    const cleanQuery = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`,
    );
  }, []);
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
  const canUseDonationFields =
    isDonorTypeSelected && (!isExistingDonor || lookupState.found);
  const canEditProfileFields =
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
    lastLookedUpRef.current = "";
    previousPurposeIdRef.current = "";
  }, [defaultPurposeId, selectablePurposes, fieldConfig]);

  useEffect(() => {
    if (lookupTimerRef.current) {
      window.clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
    lastLookedUpRef.current = "";
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
        currentAmount:
          purposeChanged && selectedPurpose.amountMode === "custom"
            ? ""
            : previous.amount,
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
  const cardBg = resolveColor(props?.donateNowCardBgColorKey, "#ffffff");
  const cardBorder = resolveColor(
    props?.donateNowCardBorderColorKey,
    "rgba(224, 60, 51, 0.2)",
  );
  const cardTitleColor = resolveColor(
    props?.donateNowCardTitleColorKey,
    "rgba(38, 42, 44, 0.9)",
  );
  const cardAmountColor = resolveColor(
    props?.donateNowCardAmountColorKey,
    "#E03C33",
  );
  const cardDescColor = resolveColor(
    props?.donateNowCardDescriptionColorKey,
    "rgba(38, 42, 44, 0.9)",
  );
  const cardHoverBg = resolveColor(
    props?.donateNowCardHoverBgColorKey,
    "#fff6f5",
  );
  const cardHoverBorder = resolveColor(
    props?.donateNowCardHoverBorderColorKey,
    "rgba(224, 60, 51, 0.35)",
  );
  const cardHoverText = resolveColor(
    props?.donateNowCardHoverTextColorKey,
    "",
  );
  const cardHoverAmount = resolveColor(
    props?.donateNowCardHoverAmountColorKey,
    "",
  );
  const cardActiveBg = resolveColor(
    props?.donateNowCardActiveBgColorKey || props?.donateNowPkgActiveColorKey,
    "#fbebeb",
  );
  const cardActiveBorder = resolveColor(
    props?.donateNowCardActiveBorderColorKey,
    "",
  );
  const cardActiveText = resolveColor(
    props?.donateNowCardActiveTextColorKey,
    "",
  );
  const cardActiveAmount = resolveColor(
    props?.donateNowCardActiveAmountColorKey,
    "",
  );
  const pkgActiveColor = cardActiveBg;

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
    lastLookedUpRef.current = "";
    setDonorType(nextDonorType || "");
    setErrors((previous) => {
      const next = { ...previous };
      delete next.donorType;
      delete next.lookup;
      delete next.donorVerification;
      delete next.verifyEmail;
      delete next.verifyMobile;
      return next;
    });
  };

  const handleFieldValue = (fieldKey, nextValue) => {
    if (fieldKey === "lookup") {
      lastLookedUpRef.current = "";
      setLookupState(getInitialLookupState());
      setVerificationValues(getInitialVerificationState());
      setVerifyingDonor(false);
    }
    if (fieldKey === quantityFieldKey || fieldKey === "studentsCount") {
      setAmountTouched(false);
    }
    setFieldValues((previous) => ({ ...previous, [fieldKey]: nextValue }));
    if (errors[fieldKey]) {
      setErrors((previous) => ({ ...previous, [fieldKey]: "" }));
    }
  };

  const handleQuickAddAmount = (increment) => {
    setAmountTouched(true);
    setFieldValues((previous) => {
      const parsedCurrent = Number(previous.amount);
      const current =
        Number.isFinite(parsedCurrent) && parsedCurrent > 0
          ? parsedCurrent
          : Number(
              selectedPurpose?.fixedAmount ||
                selectedPurpose?.defaultAmount ||
                0,
            ) || 0;
      const nextAmount = current + increment;
      return {
        ...previous,
        amount: String(nextAmount),
      };
    });
    if (errors.amount) {
      setErrors((previous) => ({ ...previous, amount: "" }));
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
    if (lookupTimerRef.current) {
      window.clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }

    const trimmedLookup = normalizeText(lookupValue);
    if (!isExistingDonor || !lookupSettings.enabled) return;
    if (!trimmedLookup) {
      lastLookedUpRef.current = "";
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
      lastLookedUpRef.current = "";
      setLookupState(getInitialLookupState());
      if (showValidationError) {
        setErrors((previous) => ({ ...previous, lookup: lookupValidationError }));
      }
      return;
    }
    if (!lookupAllowed(trimmedLookup)) return;

    if (
      lastLookedUpRef.current === trimmedLookup &&
      (lookupState.found || lookupState.loading)
    ) {
      return;
    }
    lastLookedUpRef.current = trimmedLookup;

    setLookupState((previous) => ({ ...previous, loading: true }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.lookup;
      delete next.donorVerification;
      delete next.verifyEmail;
      delete next.verifyMobile;
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
        lastLookedUpRef.current = "";
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
        lastLookedUpRef.current = "";
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
        verificationProof: "",
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
          key: "returning-donor-lookup-notice",
          message: "Returning donor found",
          description:
            "Donor identified. You can proceed with your donation or verify identity to update personal details.",
          placement: "bottomRight",
        });
      }
    } catch (error) {
      lastLookedUpRef.current = "";
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
    const nextErrors = {};

    if (!isValidEmail(verifyEmail)) {
      nextErrors.verifyEmail = "Please enter a valid email";
    }
    if (!isValidPhone(verifyMobile)) {
      nextErrors.verifyMobile = "Please enter a valid mobile number";
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
        verificationProof: String(data?.verificationProof || ""),
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
      }
    }

    if (isExistingDonor && !lookupState.found) {
      setErrors(nextErrors);
      return false;
    }

    DONATE_NOW_BASE_FIELDS.forEach((baseField) => {
      const key = baseField.key;
      const config = fieldConfig[key] || baseField;

      if (!isBaseFieldVisible(key)) return;
      if (key === "purpose") return;
      if (key === "lookup") return;

      // When existing donor is unverified, profile fields are masked and loaded securely from DB on backend
      if (
        isExistingDonor &&
        !lookupState.verified &&
        DONOR_PROFILE_FIELD_KEYS.includes(key)
      ) {
        return;
      }

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

    if (canUseDonationFields) {
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
        verificationProof: lookupState.verificationProof || "",
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
  const amountBaseField = useMemo(
    () => DONATE_NOW_BASE_FIELDS.find((item) => item.key === "amount"),
    [],
  );
  const lookupBaseField = useMemo(
    () => DONATE_NOW_BASE_FIELDS.find((item) => item.key === "lookup"),
    [],
  );
  const orderedMainBaseFields = useMemo(() => {
    const excludedKeys = new Set(["lookup", "amount", "address", "note"]);
    return DONATE_NOW_BASE_FIELDS.filter(
      (field) => !excludedKeys.has(field.key),
    );
  }, []);
  const addressAndNoteFields = useMemo(() => {
    const baseByKey = new Map(
      DONATE_NOW_BASE_FIELDS.map((field) => [field.key, field]),
    );
    return ["address", "note"]
      .map((key) => baseByKey.get(key))
      .filter(Boolean);
  }, []);

  const renderBaseField = (baseField, options = {}) => {
    const { colPropsOverride } = options;
    const key = baseField.key;
    const config = fieldConfig[key] || baseField;
    if (!isBaseFieldVisible(key)) return null;

    const isProfileKey = DONOR_PROFILE_FIELD_KEYS.includes(key);
    const required = key === "lookup" ? true : requiredFields.has(key);
    const disabled =
      key === "lookup"
        ? lookupState.loading
        : isProfileKey
          ? disabledFields.has(key) || !canEditProfileFields
          : disabledFields.has(key) || !canUseDonationFields;
    const value = fieldValues[key] ?? "";
    const placeholder = config.placeholder || "";
    const error = errors[key];
    const isFullWidth = config.width === "full" || key === "lookup";
    const colProps =
      colPropsOverride ||
      (isFullWidth ? FORM_GRID_FULL_COL_PROPS : FORM_GRID_COL_PROPS);

    if (key === "purpose") {
      return (
        <Col key={key} {...colProps}>
          <FieldWrap>
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
        <Col key={key} {...colProps}>
          <FieldWrap>
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

    if (key === "address" || key === "note") {
      return (
        <Col key={key} {...(colPropsOverride || FORM_TEXTAREA_COL_PROPS)}>
          <FieldWrap>
            <FieldLabel>
              {config.label}
              {required ? <span className="req">*</span> : null}
            </FieldLabel>
            <AddressTextArea
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
      <Col key={key} {...colProps}>
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
              key === "amount"
                ? "decimal"
                : key === "studentsCount" ||
                    key === "mobile" ||
                    key === "pincode"
                  ? "numeric"
                  : "text"
            }
            min={key === "amount" ? "0.01" : undefined}
            step={key === "amount" ? "0.01" : undefined}
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
        </FieldWrap>
      </Col>
    );
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
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
                <MainTitle color={titleColor}>{renderHighlightedTitle(mainTitle, props)}</MainTitle>
              ) : null}
            </Col>
          </Row>
        ) : null}

        <Row gutter={[20, 20]} align="top" justify="center">
          <Col span={24}>
            <LeftColumn>
              <PurposePanel>
                <PurposeGrid>
                  {renderedPurposes.map((purpose) => {
                    const active = selectedPurpose?.id === purpose.id;
                    return (
                      <PurposeCard
                        key={purpose.id}
                        type="button"
                        $active={active}
                        $cardBg={cardBg}
                        $cardBorder={cardBorder}
                        $cardTitleColor={cardTitleColor}
                        $cardAmountColor={cardAmountColor}
                        $cardDescColor={cardDescColor}
                        $cardHoverBg={cardHoverBg}
                        $cardHoverBorder={cardHoverBorder}
                        $cardHoverText={cardHoverText}
                        $cardHoverAmount={cardHoverAmount}
                        $cardActiveBg={cardActiveBg}
                        $cardActiveBorder={cardActiveBorder}
                        $cardActiveText={cardActiveText}
                        $cardActiveAmount={cardActiveAmount}
                        $pkgActiveColor={pkgActiveColor}
                        onClick={() => selectPurpose(purpose.id)}
                      >
                        {purpose.cardIcon ? (
                          <CardIconWrap $active={active} $pkgActiveColor={cardActiveBg}>
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
                          <CardDot $active={active} $pkgActiveColor={cardActiveBg} />
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

                {/* Donor Type & Top Row */}
                <Row gutter={[20, 10]}>
                  <Col {...FORM_GRID_COL_PROPS}>
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

                  {/* Existing Donor Lookup */}
                  {isExistingDonor && lookupBaseField
                    ? renderBaseField(lookupBaseField, {
                        colPropsOverride: FORM_GRID_COL_PROPS,
                      })
                    : null}

                  {/* New Donor: Amount & Quick Add on same row */}
                  {!isExistingDonor && amountBaseField
                    ? renderBaseField(amountBaseField, {
                        colPropsOverride: FORM_GRID_COL_PROPS,
                      })
                    : null}

                  {!isExistingDonor && isBaseFieldVisible("amount") ? (
                    <Col {...FORM_GRID_COL_PROPS}>
                      <QuickAddWrap>
                        <FieldLabel className="quick-add-label" style={{ opacity: 0, userSelect: "none" }}>
                          Quick Add
                        </FieldLabel>
                        <QuickAddRow>
                          <QuickAddButton
                            type="button"
                            onClick={() => handleQuickAddAmount(500)}
                          >
                            +₹500
                          </QuickAddButton>
                          <QuickAddButton
                            type="button"
                            onClick={() => handleQuickAddAmount(1000)}
                          >
                            +₹1,000
                          </QuickAddButton>
                          <QuickAddButton
                            type="button"
                            onClick={() => handleQuickAddAmount(5000)}
                          >
                            +₹5,000
                          </QuickAddButton>
                        </QuickAddRow>
                      </QuickAddWrap>
                    </Col>
                  ) : null}
                </Row>

                {/* Existing Donor: Amount & Quick Add in their own row below Email / Mobile No. */}
                {isExistingDonor && isBaseFieldVisible("amount") ? (
                  <Row gutter={[20, 10]}>
                    {amountBaseField
                      ? renderBaseField(amountBaseField, {
                          colPropsOverride: FORM_GRID_COL_PROPS,
                        })
                      : null}
                    <Col {...FORM_GRID_COL_PROPS}>
                      <QuickAddWrap>
                        <FieldLabel className="quick-add-label" style={{ opacity: 0, userSelect: "none" }}>
                          Quick Add
                        </FieldLabel>
                        <QuickAddRow>
                          <QuickAddButton
                            type="button"
                            onClick={() => handleQuickAddAmount(500)}
                          >
                            +₹500
                          </QuickAddButton>
                          <QuickAddButton
                            type="button"
                            onClick={() => handleQuickAddAmount(1000)}
                          >
                            +₹1,000
                          </QuickAddButton>
                          <QuickAddButton
                            type="button"
                            onClick={() => handleQuickAddAmount(5000)}
                          >
                            +₹5,000
                          </QuickAddButton>
                        </QuickAddRow>
                      </QuickAddWrap>
                    </Col>
                  </Row>
                ) : null}

                <Row gutter={[20, 10]}>
                  {orderedMainBaseFields.map((fieldDef) =>
                    renderBaseField(fieldDef),
                  )}
                </Row>

                <Row gutter={[20, 10]}>
                  {addressAndNoteFields.map((fieldDef) =>
                    renderBaseField(fieldDef, {
                      colPropsOverride: FORM_TEXTAREA_COL_PROPS,
                    }),
                  )}
                </Row>

                <Row gutter={[20, 10]}>
                  {isExistingDonor && lookupState.found && !lookupState.verified ? (
                    <Col {...FORM_GRID_FULL_COL_PROPS}>
                      <VerificationPanel>
                        <h4>Verify Identity to Edit Personal Details</h4>
                        <p>
                          For security, donor details are masked. If you want to
                          update your personal or contact details, verify below.
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

                  {canUseDonationFields
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
                          <Col key={extraField.key} {...FORM_GRID_COL_PROPS}>
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
                      (isExistingDonor && !lookupState.found)
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
        </Row>

        {encData && encData.provider !== "razorpay" ? (
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
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}

const LeftColumn = styled.div`
  width: 100%;
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
  margin-bottom: 22px;
  box-shadow: none;
  @media (max-width: 767px) {
    margin-bottom: 16px;
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
  border: 1px solid rgba(224, 60, 51, 0.25);
  background: rgba(224, 60, 51, 0.05);
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

const QuickAddWrap = styled(FieldWrap)`
  @media (max-width: 767px) {
    margin-top: -6px;
    .quick-add-label {
      display: none;
    }
  }
`;

const QuickAddRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  width: 100%;
`;

const QuickAddButton = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(42, 40, 62, 0.15);
  background: #ffffff;
  color: #1d1f21;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-appearance: none;
  appearance: none;

  &:hover {
    background: #fff6f5;
    border-color: ${getColor("primary") || "#e03c33"};
    color: ${getColor("primary") || "#e03c33"};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(224, 60, 51, 0.08);
  }

  &:active {
    transform: translateY(0);
    background: #fbebeb;
    border-color: ${getColor("primary") || "#e03c33"};
    color: ${getColor("primary") || "#e03c33"};
  }

  @media (max-width: 640px) {
    font-size: 13px;
    padding: 0 4px;
  }
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 600;
  color: #1d1f21;
  .req {
    color: #E03C33;
    margin-left: 3px;
  }
`;

const FIELD_CONTROL_HEIGHT = "44px";

const FieldInput = styled.input`
  width: 100%;
  height: ${FIELD_CONTROL_HEIGHT};
  min-height: ${FIELD_CONTROL_HEIGHT};
  border-radius: 10px;
  border: 1px solid rgba(42, 40, 62, 0.1);
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
    box-shadow: 0 0 0 2px rgba(224, 60, 51, 0.1);
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
  border: 1px solid rgba(42, 40, 62, 0.1);
  padding: 10px 13px;
  outline: none;
  resize: vertical;
  font-size: 14px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &:focus {
    border-color: ${getColor("primary")};
    box-shadow: 0 0 0 2px rgba(224, 60, 51, 0.1);
  }
`;

const AddressTextArea = styled(FieldTextArea)`
  min-height: 96px;
  line-height: 1.45;
`;

const FieldSelect = styled(Select)`
  width: 100%;
  height: ${FIELD_CONTROL_HEIGHT};

  &.ant-select-single {
    height: ${FIELD_CONTROL_HEIGHT};
  }

  &.ant-select-single .ant-select-selector {
    height: ${FIELD_CONTROL_HEIGHT} !important;
    min-height: ${FIELD_CONTROL_HEIGHT} !important;
    border-radius: 10px !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    border: 1px solid rgba(42, 40, 62, 0.1) !important;
    padding-inline: 12px !important;
    padding-right: 36px !important;
    font-size: 14px !important;
  }
  &.ant-select-single .ant-select-selector .ant-select-selection-item,
  &.ant-select-single .ant-select-selector .ant-select-selection-placeholder {
    display: flex;
    align-items: center;
    height: 100% !important;
    line-height: 1.4 !important;
    font-size: 14px !important;
  }

  &.ant-select-single .ant-select-selection-search {
    display: flex;
    align-items: center;
    inset-block: 0 !important;
  }

  &.ant-select-single:not(.ant-select-customize-input)
    .ant-select-selector
    .ant-select-selection-search-input {
    height: 100% !important;
    line-height: 1.4 !important;
    font-size: 14px !important;
  }

  .ant-select-arrow {
    width: 18px;
    height: 18px;
    top: 50% !important;
    inset-inline-end: 11px !important;
    margin-top: 0 !important;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    pointer-events: none;
  }

  .ant-select-arrow .anticon,
  .ant-select-arrow svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .ant-select-clear {
    top: 50% !important;
    margin-top: 0 !important;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &.ant-select-focused .ant-select-selector,
  &.ant-select-open .ant-select-selector {
    border-color: ${getColor("primary")} !important;
    box-shadow: 0 0 0 2px rgba(224, 60, 51, 0.1) !important;
  }
`;

const FieldError = styled.div`
  margin-top: 6px;
  color: #E03C33;
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
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
  @media (max-width: 1399px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  @media (max-width: 1199px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 991px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: 767px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  @media (max-width: 575px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const PurposeCard = styled.button`
  border: 1px solid
    ${(props) =>
      props.$active
        ? props.$cardActiveBorder || props.$cardBorder || "rgba(224, 60, 51, 0.2)"
        : props.$cardBorder || "rgba(224, 60, 51, 0.2)"};
  background: ${(props) =>
    props.$active
      ? props.$cardActiveBg || props.$pkgActiveColor || "#fbebeb"
      : props.$cardBg || "#ffffff"};
  border-radius: 10px;
  text-align: center;
  padding: 14px 10px 10px;
  min-height: 170px;
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
  @media (max-width: 1199px) {
    min-height: 158px;
  }
  @media (max-width: 991px) {
    min-height: 148px;
    padding: 12px 8px 10px;
  }
  @media (max-width: 767px) {
    min-height: 138px;
    padding: 10px 8px 8px;
  }
  &:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: #E03C33;
  }
  &:hover {
    border-color: ${(props) =>
      props.$cardHoverBorder ||
      (props.$active
        ? props.$cardActiveBorder || props.$cardBorder || "rgba(224, 60, 51, 0.35)"
        : "rgba(224, 60, 51, 0.35)")};
    background: ${(props) =>
      props.$cardHoverBg ||
      (props.$active
        ? props.$cardActiveBg || props.$pkgActiveColor || "#fbebeb"
        : "#fff6f5")};
    ${(props) =>
      props.$cardHoverText
        ? `
      h4 {
        color: ${props.$cardHoverText} !important;
      }
      p {
        color: ${props.$cardHoverText} !important;
      }
    `
        : ""}
    ${(props) =>
      props.$cardHoverAmount
        ? `
      .amount {
        color: ${props.$cardHoverAmount} !important;
      }
    `
        : props.$cardHoverText
          ? `
      .amount {
        color: ${props.$cardHoverText} !important;
      }
    `
          : ""}
  }
  h4 {
    margin: 0;
    color: ${(props) =>
      props.$active
        ? props.$cardActiveText || props.$cardTitleColor || "rgba(38, 42, 44, 0.9)"
        : props.$cardTitleColor || "rgba(38, 42, 44, 0.9)"};
    font-size: 14px;
    line-height: 1.3;
    font-weight: 700;
    text-align: center;
    transition: color 0.15s ease;
    @media (max-width: 991px) {
      font-size: 13px;
      line-height: 1.25;
    }
  }
  .amount {
    color: ${(props) =>
      props.$active
        ? props.$cardActiveAmount ||
          props.$cardActiveText ||
          props.$cardAmountColor ||
          "#E03C33"
        : props.$cardAmountColor || "#E03C33"};
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
    opacity: 0.9;
    transition: color 0.15s ease;
    @media (max-width: 991px) {
      font-size: 13px;
    }
  }
  p {
    margin: 0;
    color: ${(props) =>
      props.$active
        ? props.$cardActiveText || props.$cardDescColor || "rgba(38, 42, 44, 0.9)"
        : props.$cardDescColor || "rgba(38, 42, 44, 0.9)"};
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
    transition: color 0.15s ease;
    @media (max-width: 991px) {
      font-size: 11px;
      line-height: 1.25;
    }
  }
`;

const CardDot = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: ${(props) =>
    props.$active
      ? (props.$pkgActiveColor
        ? `linear-gradient(135deg, ${props.$pkgActiveColor} 0%, #7b1c1c 100%)`
        : "linear-gradient(135deg, #a92d26 0%, #7b1c1c 100%)")
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
      ? (props.$pkgActiveColor
        ? `linear-gradient(135deg, ${props.$pkgActiveColor} 0%, #7b1c1c 100%)`
        : "linear-gradient(135deg, #a92d26 0%, #7b1c1c 100%)")
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
    color: #E03C33;
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
