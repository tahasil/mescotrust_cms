const BASE_FIELD_DEFS = [
  {
    key: "lookup",
    label: "Email / Mobile No.",
    placeholder: "Enter email / mobile to fill the data",
    required: true,
    active: true,
    width: "full",
    reusable: false,
    sensitive: true,
    validation: "lookup",
  },
  {
    key: "zakat",
    label: "Zakat",
    placeholder: "",
    required: true,
    active: true,
    width: "half",
    reusable: false,
    validation: "none",
    inputType: "select",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
  },
  {
    key: "interestMoney",
    label: "Interest Money",
    placeholder: "",
    required: false,
    active: true,
    width: "half",
    reusable: false,
    validation: "none",
    inputType: "select",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
  },
  {
    key: "purpose",
    label: "Purpose of Donation",
    placeholder: "Select purpose",
    required: true,
    active: true,
    width: "half",
    reusable: false,
    validation: "none",
  },
  {
    key: "studentsCount",
    label: "Select Student",
    placeholder: "1",
    required: false,
    active: true,
    width: "half",
    reusable: false,
    validation: "number",
    inputType: "select",
    defaultValue: "1",
    options: Array.from({ length: 20 }, (_, index) => ({
      label: String(index + 1),
      value: String(index + 1),
    })),
  },
  {
    key: "amount",
    label: "Amount",
    placeholder: "Enter amount",
    required: true,
    active: true,
    width: "half",
    reusable: false,
    validation: "amount",
  },
  {
    key: "name",
    label: "Full Name",
    placeholder: "Enter full name",
    required: true,
    active: true,
    width: "half",
    reusable: true,
    validation: "name",
  },
  {
    key: "pan",
    label: "PAN No.",
    placeholder: "PAN No.",
    required: true,
    active: true,
    width: "half",
    reusable: false,
    sensitive: true,
    // A PAN is always 10 characters (5 letters, 4 digits, 1 letter).
    validation: "pan",
    maxLength: 10,
  },
  {
    key: "email",
    label: "Email ID",
    placeholder: "Email ID",
    required: true,
    active: true,
    width: "half",
    reusable: false,
    sensitive: true,
    validation: "email",
  },
  {
    key: "mobile",
    label: "Mobile No.",
    placeholder: "Mobile No.",
    required: true,
    active: true,
    width: "half",
    reusable: false,
    sensitive: true,
    // Indian mobile numbers are exactly 10 digits; isValidPhone() defaults to
    // a 10-15 range for international forms, so the donate form narrows it.
    validation: "phone",
    maxLength: 10,
  },
  {
    key: "pincode",
    label: "Pincode",
    placeholder: "Enter 6-digit pincode",
    required: false,
    active: true,
    width: "half",
    reusable: true,
    // Was "number", which only checked that *some* digits existed. An Indian
    // PIN code is exactly 6 digits, so that let "12345" and "1234567" through.
    validation: "pincode",
    maxLength: 6,
  },
  {
    key: "address",
    label: "Address",
    placeholder: "Address",
    required: false,
    active: true,
    width: "half",
    reusable: true,
    validation: "none",
  },
  {
    key: "city",
    label: "City",
    placeholder: "City",
    required: false,
    active: true,
    width: "half",
    reusable: true,
    validation: "none",
  },
  {
    key: "state",
    label: "State",
    placeholder: "State",
    required: false,
    active: true,
    width: "half",
    reusable: true,
    validation: "none",
  },
  {
    key: "country",
    label: "Country",
    placeholder: "Country",
    required: false,
    active: true,
    width: "half",
    reusable: true,
    validation: "none",
    defaultValue: "India",
  },
  {
    key: "note",
    label: "Note",
    placeholder: "Enter note",
    required: false,
    active: true,
    width: "full",
    reusable: false,
    validation: "none",
  },
];

export const DONATE_NOW_BASE_FIELDS = BASE_FIELD_DEFS.map((item) => ({ ...item }));

export const DONATE_NOW_FIELD_KEYS = DONATE_NOW_BASE_FIELDS.map((item) => item.key);

export const DONATE_NOW_PURPOSE_AMOUNT_MODES = [
  { label: "Fixed amount", value: "fixed" },
  { label: "Custom amount", value: "custom" },
  { label: "Fixed + custom override", value: "fixed_or_custom" },
];

export const DONATE_NOW_PURPOSE_CALCULATION_MODES = [
  { label: "None", value: "none" },
  { label: "Multiply by student count", value: "multiply_by_students" },
];

export const DONATE_NOW_OTHER_PURPOSE_ID = "other-donation";

const OTHER_DONATION_PURPOSE = Object.freeze({
  id: DONATE_NOW_OTHER_PURPOSE_ID,
  name: "Other Donation",
  cardTitle: "Other Donation",
  cardAmountText: "",
  cardDescription: "",
  defaultAmount: 0,
  fixedAmount: 0,
  amountMode: "custom",
  calculationMode: "multiply_by_students",
  quantityFieldKey: "studentsCount",
  defaultStudentsCount: 1,
  hiddenFields: [],
  disabledFields: [],
  requiredFields: ["studentsCount"],
  additionalFields: [],
  active: true,
  showOnCard: false,
  showStudentsCount: true,
});

export const DONATE_NOW_ADDITIONAL_FIELD_TYPES = [
  { label: "Text", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Select", value: "select" },
];

export const DONATE_NOW_FIGMA_PURPOSE_ORDER = [
  "education-adoption-scheme",
  "educational-aid",
  "educational-aid-professional",
  "educate-orphan",
  "high-cost-education-scholarship",
  "adopted-municipal-school",
  "sewing-machine",
  "ration-support",
  "life-saving-medical",
  "six-month-dialysis",
  "medical-aid",
  "nayi-roshni",
  "dialysis-support",
  "payroll-giving",
];

const PURPOSE_ID_ALIASES = {
  "educate-an-orphan": "educate-orphan",
  "adopted-municipal-schools-students": "adopted-municipal-school",
  "life-saving-medical-aid": "life-saving-medical",
  "6-months-dialysis-support-scheme": "six-month-dialysis",
  "education-adoption-scheme-eas": "education-adoption-scheme",
  "educational-aid-school-college": "educational-aid",
  "educational-aid-stvc": "educational-aid",
  "general-aid-sewing-machine": "sewing-machine",
  "general-aid-ration-support": "ration-support",
  "medical-life-saving-medical-aid": "life-saving-medical",
  "medical-medical-aid": "medical-aid",
  "medical-nayi-roshni-cataract-surgery": "nayi-roshni",
  "medical-aid-per-month-dialysis": "dialysis-support",
  "medical-aid-per-year-dialysis": "six-month-dialysis",
  "medical-aid-per-dialysis": "dialysis-support",
};

const STUDENT_PURPOSE_IDS = new Set([
  "education-adoption-scheme",
  "educational-aid",
  "educational-aid-professional",
  "educate-orphan",
  "high-cost-education-scholarship",
  "adopted-municipal-school",
  "sewing-machine",
  "ration-support",
  "life-saving-medical",
  "six-month-dialysis",
  "medical-aid",
  "nayi-roshni",
  "dialysis-support",
  "payroll-giving",
  "other-donation",
]);

const DEFAULT_PURPOSES = [
  {
    id: "education-adoption-scheme",
    name: "Education Adoption Scheme",
    cardTitle: "Education Adoption Scheme",
    cardAmountText: "₹30,000/- per student",
    cardDescription:
      "Sponsor a child to complete the Education After Std VII for a year.",
    defaultAmount: 30000,
    amountMode: "fixed",
    fixedAmount: 30000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 1,
    active: true,
  },
  {
    id: "educational-aid",
    name: "Educational Aid",
    cardTitle: "Educational AID",
    cardAmountText: "₹10,000/- per student",
    cardDescription: "Sponsor a child to complete the Education for a year.",
    defaultAmount: 10000,
    amountMode: "fixed",
    fixedAmount: 10000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 2,
    active: true,
  },
  {
    id: "educational-aid-professional",
    name: "Educational Aid Professional",
    cardTitle: "Educational AID Professional",
    cardAmountText: "₹20,000/- per student",
    cardDescription:
      "Sponsor a Professional Scholarship and support higher education.",
    defaultAmount: 20000,
    amountMode: "fixed",
    fixedAmount: 20000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 3,
    active: true,
  },
  {
    id: "educate-orphan",
    name: "Educate An Orphan",
    cardTitle: "Educate An Orphan",
    cardAmountText: "₹30,000/- per student",
    cardDescription:
      "Sponsor a Scholarship for an Orphan Child and support their future.",
    defaultAmount: 30000,
    amountMode: "fixed",
    fixedAmount: 30000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 4,
    active: true,
  },
  {
    id: "high-cost-education-scholarship",
    name: "High Cost Education Scholarship",
    cardTitle: "High Cost Education Scholarship",
    cardAmountText: "₹60,000/- per student",
    cardDescription:
      "Sponsor a child to complete their Higher Education for a year.",
    defaultAmount: 60000,
    amountMode: "fixed",
    fixedAmount: 60000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 5,
    active: true,
  },
  {
    id: "adopted-municipal-school",
    name: "Adopted Municipal Schools Students",
    cardTitle: "Adopted Municipal Schools Students",
    cardAmountText: "₹2,500/- per student",
    cardDescription:
      "Sponsor a Municipal School Child with the Essential Needs for Education.",
    defaultAmount: 2500,
    amountMode: "fixed",
    fixedAmount: 2500,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 6,
    active: true,
  },
  {
    id: "sewing-machine",
    name: "Sewing Machine Sponsorship",
    cardTitle: "Sewing Machine Sponsorship",
    cardAmountText: "₹9,000/- per machine",
    cardDescription:
      "Sponsor one Sewing Machine to needy women to become Self Sufficient.",
    defaultAmount: 9000,
    amountMode: "fixed",
    fixedAmount: 9000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 7,
    active: true,
  },
  {
    id: "ration-support",
    name: "Ration Support",
    cardTitle: "Ration Support",
    cardAmountText: "₹28,000/- per year",
    cardDescription: "Sponsor a Family for dry Ration for a year.",
    defaultAmount: 28000,
    amountMode: "fixed",
    fixedAmount: 28000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 8,
    active: true,
  },
  {
    id: "life-saving-medical",
    name: "Life Saving Medical AID",
    cardTitle: "Life Saving Medical AID",
    cardAmountText: "₹50,000/- per patient",
    cardDescription:
      "Support patients with costly life-saving surgeries at government hospitals.",
    defaultAmount: 50000,
    amountMode: "fixed",
    fixedAmount: 50000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 9,
    active: true,
  },
  {
    id: "six-month-dialysis",
    name: "6 Months Dialysis Support Scheme",
    cardTitle: "6 Months Dialysis Support Scheme",
    cardAmountText: "₹40,000/- per patient",
    cardDescription: "Sponsorship for a patient for their 6 months Dialysis cost.",
    defaultAmount: 40000,
    amountMode: "fixed",
    fixedAmount: 40000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 10,
    active: true,
  },
  {
    id: "medical-aid",
    name: "Medical AID",
    cardTitle: "Medical AID",
    cardAmountText: "₹15,000/- per patient",
    cardDescription: "Support patients for Monthly Medicines for chronic illness.",
    defaultAmount: 15000,
    amountMode: "fixed",
    fixedAmount: 15000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 11,
    active: true,
  },
  {
    id: "nayi-roshni",
    name: "Nayi Roshni (Cataract Surgery)",
    cardTitle: "Nayi Roshni (Cataract Surgery)",
    cardAmountText: "₹2,000/- per patient",
    cardDescription: "Sponsor a patient for cataract surgery and help restore clear vision.",
    defaultAmount: 2000,
    amountMode: "fixed",
    fixedAmount: 2000,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 12,
    active: true,
  },
  {
    id: "dialysis-support",
    name: "Dialysis Support",
    cardTitle: "Dialysis Support",
    cardAmountText: "₹7,200/- per month",
    cardDescription: "Sponsor a Dialysis Patient to cover Dialysis Cost for a month.",
    defaultAmount: 7200,
    amountMode: "fixed",
    fixedAmount: 7200,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 13,
    active: true,
  },
  {
    id: "payroll-giving",
    name: "Payroll Giving",
    cardTitle: "Payroll Giving",
    cardAmountText: "₹500/- per month",
    cardDescription: "Participate in Payroll giving programme per month.",
    defaultAmount: 500,
    amountMode: "fixed_or_custom",
    fixedAmount: 500,
    showStudentsCount: true,
    showOnCard: true,
    requiredFields: ["studentsCount"],
    calculationMode: "multiply_by_students",
    displayOrder: 14,
    active: true,
  },
];

const DEFAULT_COPY = {
  formTitle: "Details",
  formSubtitle:
    "If you have already donated before type your email ID or Mobile No., the remaining details will be filled automatically.",
  sectionDescription: "",
  sectionBadge: "",
  donateButtonText: "Donate Now",
  donateButtonProcessingText: "Processing...",
  qrButtonText: "Donate Now with QR",
  purposePanelTitle: "",
  successMessage: "Redirecting to payment gateway...",
  errorMessage: "Failed to initiate payment",
  donorFoundMessage: "Previous details found and filled.",
  donorNotFoundMessage: "",
  termsText: "",
  termsRequired: false,
  termsLabel: "I agree to the terms and conditions",
  footerBannerText:
    "Your Donation to MESCO Exempt Under Section 80G of Income Tax Act 1961.",
  footerBannerImage: "",
  footerBannerBgColor: "#111111",
};

const DEFAULT_LOOKUP_SETTINGS = {
  enabled: true,
  minimumCharacters: 5,
  lookupByEmail: true,
  lookupByMobile: true,
  autoFillEnabled: true,
  reusableFields: [
    "name",
    "pan",
    "email",
    "mobile",
    "address",
    "city",
    "state",
    "country",
    "pincode",
  ],
  showMaskedPreview: true,
};

const DEFAULT_PAYMENT_SETTINGS = {
  currency: "INR",
  enableQrButton: true,
  requirePaymentGateway: true,
};

function toTrimmedString(value) {
  return String(value ?? "").trim();
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return fallback;
}

function toPositiveNumber(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return num;
}

function slugify(value) {
  const base = toTrimmedString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base;
}

function uniqueList(values = []) {
  return [...new Set(values.map((item) => toTrimmedString(item)).filter(Boolean))];
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeFieldConfigEntry(raw, baseDef) {
  if (!raw || typeof raw !== "object") {
    return {
      ...baseDef,
    };
  }
  return {
    ...baseDef,
    label: toTrimmedString(raw.label || baseDef.label),
    placeholder: toTrimmedString(
      raw.placeholder !== undefined ? raw.placeholder : baseDef.placeholder,
    ),
    required: toBoolean(raw.required, baseDef.required),
    active: toBoolean(raw.active, baseDef.active),
    disabled: toBoolean(raw.disabled, false),
    width: raw.width === "full" ? "full" : "half",
    reusable: toBoolean(raw.reusable, baseDef.reusable),
    sensitive: toBoolean(raw.sensitive, baseDef.sensitive || false),
    validation: toTrimmedString(raw.validation || baseDef.validation || "none"),
    defaultValue: toTrimmedString(
      raw.defaultValue !== undefined ? raw.defaultValue : baseDef.defaultValue || "",
    ),
    options: ensureArray(raw.options).map((opt) => ({
      label: toTrimmedString(opt?.label || opt?.value || ""),
      value: toTrimmedString(opt?.value || opt?.label || ""),
    })),
    inputType: toTrimmedString(raw.inputType || baseDef.inputType || ""),
  };
}

function normalizeAdditionalField(raw = {}, index = 0) {
  const label = toTrimmedString(raw.label || raw.key || `Additional field ${index + 1}`);
  const key = slugify(raw.key || label || `additional-${index + 1}`);
  const type = DONATE_NOW_ADDITIONAL_FIELD_TYPES.some((item) => item.value === raw.type)
    ? raw.type
    : "text";
  return {
    key,
    label,
    placeholder: toTrimmedString(raw.placeholder),
    type,
    optionsCsv: toTrimmedString(raw.optionsCsv),
    required: toBoolean(raw.required, false),
    hidden: toBoolean(raw.hidden, false),
    disabled: toBoolean(raw.disabled, false),
    active: toBoolean(raw.active, true),
    displayOrder: toPositiveNumber(raw.displayOrder, index + 1),
    defaultValue: toTrimmedString(raw.defaultValue),
  };
}

function normalizePurpose(raw = {}, index = 0) {
  const name = toTrimmedString(raw.name || raw.label || "");
  const id =
    slugify(raw.id || "") ||
    slugify(name) ||
    `purpose-${String(index + 1).padStart(2, "0")}`;
  const canonicalId = PURPOSE_ID_ALIASES[id] || id;
  const isOtherDonation =
    canonicalId === DONATE_NOW_OTHER_PURPOSE_ID ||
    name.toLowerCase() === "other donation";
  const amountModeValues = DONATE_NOW_PURPOSE_AMOUNT_MODES.map((item) => item.value);
  const amountMode = isOtherDonation
    ? "custom"
    : amountModeValues.includes(raw.amountMode)
      ? raw.amountMode
      : toBoolean(raw.fixedAmountOnly, false)
        ? "fixed"
        : "custom";
  const defaultAmount = isOtherDonation
    ? 0
    : toPositiveNumber(raw.defaultAmount ?? raw.amount ?? raw.fixedAmount ?? 0, 0);
  const fixedAmount = isOtherDonation
    ? 0
    : toPositiveNumber(raw.fixedAmount ?? defaultAmount, defaultAmount);
  const requiredFields = uniqueList(raw.requiredFields);
  const cardAmountText = toTrimmedString(raw.cardAmountText || "");
  const calculationModes = DONATE_NOW_PURPOSE_CALCULATION_MODES.map(
    (item) => item.value,
  );
  const quantityFieldKey = toTrimmedString(raw.quantityFieldKey || "studentsCount");
  const amountTextSuggestsQuantity =
    /(per\s+student|per\s+child|student)/i.test(cardAmountText);
  const nameSuggestsQuantity = /(education|school|student|orphan)/i.test(
    `${name} ${toTrimmedString(raw.cardTitle || "")}`,
  );
  const inferredCalculationMode =
    (requiredFields.includes(quantityFieldKey || "studentsCount") ||
      amountTextSuggestsQuantity ||
      nameSuggestsQuantity ||
      STUDENT_PURPOSE_IDS.has(canonicalId)) &&
    fixedAmount > 0
      ? "multiply_by_students"
      : "none";
  const calculationMode = calculationModes.includes(raw?.calculationMode)
    ? raw.calculationMode
    : inferredCalculationMode;
  const rawShowStudentsCount =
    typeof raw.showStudentsCount === "boolean"
      ? raw.showStudentsCount
      : toTrimmedString(raw.showStudentsCount).toLowerCase() === "true"
        ? true
        : toTrimmedString(raw.showStudentsCount).toLowerCase() === "false"
          ? false
          : null;
  const showStudentsCount =
    rawShowStudentsCount == null ? true : rawShowStudentsCount;
  const minQuantity = Math.max(
    1,
    Math.round(
      toPositiveNumber(raw.defaultStudentsCount ?? raw.minQuantity, 1),
    ),
  );
  const hiddenFields = uniqueList(raw.hiddenFields).filter(
    (fieldKey) => fieldKey !== "studentsCount",
  );
  const requiredWithQuantity = uniqueList([
    ...requiredFields,
    quantityFieldKey || "studentsCount",
  ]);
  requiredFields.length = 0;
  requiredFields.push(...requiredWithQuantity);
  return {
    id: isOtherDonation ? DONATE_NOW_OTHER_PURPOSE_ID : canonicalId,
    name: isOtherDonation ? "Other Donation" : name,
    cardTitle: toTrimmedString(raw.cardTitle || name || "Untitled"),
    cardIcon: toTrimmedString(raw.cardIcon || raw.cardImage || raw.icon || ""),
    cardAmountText,
    cardDescription: toTrimmedString(raw.cardDescription || raw.description || ""),
    badgeText: toTrimmedString(raw.badgeText || ""),
    defaultAmount,
    fixedAmount,
    amount: defaultAmount,
    amountMode,
    hiddenFields,
    disabledFields: uniqueList(raw.disabledFields),
    requiredFields,
    calculationMode,
    quantityFieldKey: quantityFieldKey || "studentsCount",
    minQuantity,
    defaultStudentsCount: minQuantity,
    additionalFields: ensureArray(raw.additionalFields)
      .map((item, additionalIndex) => normalizeAdditionalField(item, additionalIndex))
      .sort((a, b) => a.displayOrder - b.displayOrder),
    displayOrder: toPositiveNumber(raw.displayOrder, index + 1),
    active: isOtherDonation ? true : toBoolean(raw.active, true),
    showOnCard: isOtherDonation ? false : toBoolean(raw.showOnCard, true),
    showStudentsCount,
    highlight: toBoolean(raw.highlight, false),
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

function normalizeCopy(raw = {}) {
  const normalized = { ...DEFAULT_COPY };
  for (const key of Object.keys(DEFAULT_COPY)) {
    if (key === "termsRequired") {
      normalized[key] = toBoolean(raw[key], DEFAULT_COPY[key]);
    } else {
      normalized[key] = toTrimmedString(
        raw[key] !== undefined ? raw[key] : DEFAULT_COPY[key],
      );
    }
  }
  return normalized;
}

function normalizeLookupSettings(raw = {}) {
  return {
    enabled: toBoolean(raw.enabled, DEFAULT_LOOKUP_SETTINGS.enabled),
    minimumCharacters: Math.max(
      3,
      Math.min(15, Math.round(toPositiveNumber(raw.minimumCharacters, 5))),
    ),
    lookupByEmail: toBoolean(raw.lookupByEmail, DEFAULT_LOOKUP_SETTINGS.lookupByEmail),
    lookupByMobile: toBoolean(raw.lookupByMobile, DEFAULT_LOOKUP_SETTINGS.lookupByMobile),
    autoFillEnabled: toBoolean(raw.autoFillEnabled, DEFAULT_LOOKUP_SETTINGS.autoFillEnabled),
    reusableFields: uniqueList(raw.reusableFields).filter((key) =>
      DONATE_NOW_FIELD_KEYS.includes(key),
    ),
    showMaskedPreview: toBoolean(
      raw.showMaskedPreview,
      DEFAULT_LOOKUP_SETTINGS.showMaskedPreview,
    ),
  };
}

function normalizePaymentSettings(raw = {}) {
  return {
    currency: toTrimmedString(raw.currency || DEFAULT_PAYMENT_SETTINGS.currency) || "INR",
    enableQrButton: toBoolean(raw.enableQrButton, DEFAULT_PAYMENT_SETTINGS.enableQrButton),
    requirePaymentGateway: toBoolean(
      raw.requirePaymentGateway,
      DEFAULT_PAYMENT_SETTINGS.requirePaymentGateway,
    ),
  };
}

function normalizeLegacyPurposes(rawProps = {}) {
  const legacyPurposes = toTrimmedString(rawProps?.donateNowPurposeOptions);
  const purposeNames = legacyPurposes
    ? legacyPurposes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (purposeNames.length === 0) return [];

  const legacyPackages = ensureArray(rawProps?.donateNowPackages);
  return purposeNames.map((name, index) => {
    const pkg = legacyPackages[index] || {};
    const parsedAmount = Number(String(pkg.amount || "").replace(/[^0-9.]/g, ""));
    return normalizePurpose(
      {
        id: slugify(name),
        name,
        cardTitle: name,
        cardDescription: toTrimmedString(pkg.description),
        defaultAmount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        fixedAmount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        amountMode: Number.isFinite(parsedAmount) && parsedAmount > 0 ? "fixed" : "custom",
        displayOrder: index + 1,
        active: true,
      },
      index,
    );
  });
}

function mergeLegacyWithDefaultPurposes(legacyPurposes = [], defaultPurposes = []) {
  const byId = new Map(
    ensureArray(defaultPurposes).map((purpose) => [toTrimmedString(purpose.id), purpose]),
  );
  ensureArray(legacyPurposes).forEach((purpose) => {
    const id = toTrimmedString(purpose?.id);
    if (!id) return;
    const fallback = byId.get(id);
    byId.set(id, fallback ? { ...fallback, ...purpose } : purpose);
  });
  return [...byId.values()];
}

function dedupeAndValidatePurposes(purposes = []) {
  const byId = new Map();
  purposes.forEach((purpose, index) => {
    const id = toTrimmedString(purpose?.id);
    const name = toTrimmedString(purpose?.name);
    if (!purpose?.active) return;
    if (!id || !name) return;
    if (!byId.has(id)) {
      byId.set(id, { ...purpose, __index: index });
      return;
    }
    const existing = byId.get(id);
    const existingOrder = Number(existing.displayOrder) || existing.__index + 1;
    const nextOrder = Number(purpose.displayOrder) || index + 1;
    if (nextOrder < existingOrder) {
      byId.set(id, { ...purpose, __index: index });
    }
  });

  const ordered = [...byId.values()]
    .sort((a, b) => {
      const orderA = Number(a.displayOrder) || a.__index + 1;
      const orderB = Number(b.displayOrder) || b.__index + 1;
      if (orderA !== orderB) return orderA - orderB;
      return a.__index - b.__index;
    });
  return ordered.map(({ __index, ...rest }) => rest);
}

export function normalizeDonateNowConfig(rawProps = {}) {
  const fieldConfig = {};
  for (const baseDef of DONATE_NOW_BASE_FIELDS) {
    const rawConfig = rawProps?.donateNowFieldConfig?.[baseDef.key];
    fieldConfig[baseDef.key] = normalizeFieldConfigEntry(rawConfig, baseDef);
  }

  const rawPurposes = ensureArray(rawProps?.donateNowPurposes);
  const legacyPurposes = normalizeLegacyPurposes(rawProps);
  const defaultPurposes = DEFAULT_PURPOSES.map((item, index) =>
    normalizePurpose(item, index),
  );
  let purposeSource = "default";
  let purposeCandidates = defaultPurposes;
  if (rawPurposes.length > 0) {
    purposeSource = "custom";
    purposeCandidates = rawPurposes.map((item, index) => normalizePurpose(item, index));
  } else if (legacyPurposes.length > 0) {
    purposeSource = "legacy";
    purposeCandidates = mergeLegacyWithDefaultPurposes(legacyPurposes, defaultPurposes);
  }
  const hasOtherDonation = purposeCandidates.some(
    (purpose) => purpose.id === DONATE_NOW_OTHER_PURPOSE_ID,
  );
  if (!hasOtherDonation) {
    purposeCandidates.push(
      normalizePurpose(
        { ...OTHER_DONATION_PURPOSE, displayOrder: purposeCandidates.length + 1 },
        purposeCandidates.length,
      ),
    );
  }
  const purposes = dedupeAndValidatePurposes(purposeCandidates);

  const selectedPurposeId = toTrimmedString(rawProps?.donateNowDefaultPurposeId);
  const defaultPurposeId =
    purposes.find((item) => item.id === selectedPurposeId)?.id || purposes[0]?.id || "";

  const copy = normalizeCopy(rawProps?.donateNowCopy || {});
  const lookupSettings = normalizeLookupSettings(rawProps?.donateNowLookupSettings || {});
  if (lookupSettings.reusableFields.length === 0) {
    lookupSettings.reusableFields = [...DEFAULT_LOOKUP_SETTINGS.reusableFields];
  }
  const paymentSettings = normalizePaymentSettings(
    rawProps?.donateNowPaymentSettings || {},
  );

  return {
    fieldConfig,
    purposes,
    purposeSource,
    defaultPurposeId,
    copy,
    lookupSettings,
    paymentSettings,
  };
}

export function getPurposeRuleState(selectedPurpose, fieldConfig = {}) {
  const hidden = new Set();
  const disabled = new Set();
  const required = new Set();

  DONATE_NOW_FIELD_KEYS.forEach((key) => {
    const config = fieldConfig[key];
    if (!config || config.active === false) hidden.add(key);
    if (config?.required) required.add(key);
    if (config?.disabled) disabled.add(key);
  });

  if (selectedPurpose && typeof selectedPurpose === "object") {
    ensureArray(selectedPurpose.hiddenFields).forEach((key) => {
      if (key !== "studentsCount") {
        hidden.add(key);
      }
    });
    ensureArray(selectedPurpose.disabledFields).forEach((key) => disabled.add(key));
    ensureArray(selectedPurpose.requiredFields).forEach((key) => required.add(key));

    const studentsFieldActive = fieldConfig?.studentsCount?.active !== false;
    if (studentsFieldActive) {
      hidden.delete("studentsCount");
      required.add("studentsCount");
    }

    if (selectedPurpose.amountMode === "fixed") {
      disabled.add("amount");
      required.add("amount");
      hidden.delete("amount");
    }
  }

  return { hidden, disabled, required };
}

/**
 * Dynamic label for studentsCount / quantity dropdown based on selected purpose.
 * 1. Select No. of Machine (for Machine)
 * 2. Select No. of Family (For Ration Support, Payroll Giving)
 * 3. Select No. of Patient (Medical AID, Dialysis Support Scheme, Cataract Surgery, Dialysis Support)
 * 4. Select No. of Student (for student / education / orphan / scholarship)
 * 5. Select (for Other Donation)
 */
export function getQuantityFieldLabel(purpose) {
  if (!purpose) return "Select";
  const id = String(purpose.id || "").toLowerCase();
  const name = String(purpose.name || "").toLowerCase();
  if (
    id === DONATE_NOW_OTHER_PURPOSE_ID ||
    id === "other-donation" ||
    name === "other donation" ||
    name.includes("other")
  ) {
    return "Select";
  }

  const str = `${purpose.id || ""} ${purpose.name || ""} ${purpose.cardTitle || ""} ${purpose.cardAmountText || ""} ${purpose.cardDescription || ""}`.toLowerCase();

  // 1. Machine
  if (str.includes("machine")) {
    return "Select No. of Machine";
  }

  // 2. Family (Ration Support, Payroll Giving, Family)
  if (
    str.includes("ration") ||
    str.includes("payroll") ||
    str.includes("family")
  ) {
    return "Select No. of Family";
  }

  // 3. Patient (Medical, Dialysis, Cataract, Roshni, Surgery, Patient)
  if (
    str.includes("patient") ||
    str.includes("medical") ||
    str.includes("dialysis") ||
    str.includes("cataract") ||
    str.includes("roshni") ||
    str.includes("surgery")
  ) {
    return "Select No. of Patient";
  }

  // 4. Student (Student, Education, Scholarship, School, Child, Orphan)
  if (
    str.includes("student") ||
    str.includes("education") ||
    str.includes("scholarship") ||
    str.includes("school") ||
    str.includes("child") ||
    str.includes("orphan")
  ) {
    return "Select No. of Student";
  }

  return "Select";
}

export function maskEmail(email = "") {
  const value = toTrimmedString(email).toLowerCase();
  if (!value || !value.includes("@")) return "";
  const [local, domain] = value.split("@");
  if (!local || !domain) return "";
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local.slice(-1)}@${domain}`;
}

export function maskMobile(mobile = "") {
  const digits = String(mobile ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 4) return `***${digits}`;
  return `${"*".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

export function getDefaultPurposeValue(purposes = []) {
  return purposes.find((item) => item.active !== false)?.id || "";
}

export function getDefaultDonateNowPurposes() {
  return dedupeAndValidatePurposes(
    DEFAULT_PURPOSES.map((item, index) => normalizePurpose(item, index)),
  );
}

export function computePurposeAmount({
  purpose,
  quantityValue,
  studentsCount,
  currentAmount,
  amountTouched,
}) {
  if (!purpose) return String(currentAmount || "");
  const minQuantity = Math.max(
    1,
    Number.parseInt(String(purpose.minQuantity || "1"), 10) || 1,
  );
  const parsedQuantity = Number.parseInt(
    String(quantityValue ?? studentsCount ?? ""),
    10,
  );
  const quantity = Number.isFinite(parsedQuantity)
    ? Math.max(minQuantity, parsedQuantity)
    : minQuantity;
  const baseAmount = Number(purpose.fixedAmount || purpose.defaultAmount || 0);
  const multipliedAmount = baseAmount > 0 ? baseAmount * quantity : 0;

  if (amountTouched && toTrimmedString(currentAmount)) {
    return String(currentAmount || "");
  }

  if (purpose.amountMode === "fixed") {
    return multipliedAmount > 0 ? String(multipliedAmount) : "";
  }
  if (purpose.amountMode === "fixed_or_custom") {
    return multipliedAmount > 0 ? String(multipliedAmount) : "";
  }
  if (!amountTouched && multipliedAmount > 0) {
    return String(multipliedAmount);
  }
  return String(currentAmount || "");
}


