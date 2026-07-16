export const FORM_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const FORM_STATUS_VALUES = Object.values(FORM_STATUSES);

export const FORM_QUESTION_TYPES = [
  "short_text",
  "paragraph",
  "email",
  "number",
  "phone",
  "url",
  "date",
  "single_choice",
  "multiple_choice",
  "file",
  "hidden",
  "divider",
];

export const FORM_OPTION_TYPES = new Set(["single_choice", "multiple_choice"]);

export const FORM_DEFAULTS = {
  name: "Untitled Form",
  submitLabel: "Submit",
  successMessage: "Thank you for your response.",
  submissionSettings: {
    resetOnSuccess: true,
    notifyOnSuccess: true,
    notifyOnError: true,
    submitButtonAlignment: "left",
    captchaEnabled: false,
    captchaType: "alphanumeric",
    recaptchaSiteKey: "",
    recaptchaSecretKey: "",
  },
  styleSettings: {
    inputBorderColor: "",
    inputFocusColor: "",
    inputErrorColor: "",
    buttonBgColor: "",
    buttonHoverColor: "",
    buttonFocusColor: "",
    buttonTextColor: "",
    checkboxColor: "",
    radioColor: "",
    switchColor: "",
    requiredIndicatorColor: "",
    successMessageColor: "",
    errorMessageColor: "",
  },
};

export const FORM_ID_PREFIX = "FORM_";
export const FORM_ID_PADDING = 3;
export const SHORTCODE_MAX_LENGTH = 64;
