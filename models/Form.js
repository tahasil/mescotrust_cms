const mongoose = require("mongoose");

const FORM_STATUSES = ["draft", "published", "archived"];
const QUESTION_TYPES = [
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

const formSectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true, trim: true, immutable: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const formQuestionOptionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const formQuestionSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true, trim: true, immutable: true },
    sectionId: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: QUESTION_TYPES },
    label: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    fieldName: { type: String, default: "", trim: true },
    required: { type: Boolean, default: false },
    span: { type: Number, required: true, default: 4, min: 1, max: 4 },
    options: { type: [formQuestionOptionSchema], default: [] },
    order: { type: Number, required: true, default: 0 },
    rules: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const formSubmissionSettingsSchema = new mongoose.Schema(
  {
    resetOnSuccess: { type: Boolean, default: true },
    notifyOnSuccess: { type: Boolean, default: true },
    notifyOnError: { type: Boolean, default: true },
  },
  { _id: false },
);

const formStyleSettingsSchema = new mongoose.Schema(
  {
    inputBorderColor: { type: String, trim: true, default: "#d9d9d9" },
    inputFocusColor: { type: String, trim: true, default: "#cf372f" },
    inputErrorColor: { type: String, trim: true, default: "#cf372f" },
    buttonBgColor: { type: String, trim: true, default: "#cf372f" },
    buttonHoverColor: { type: String, trim: true, default: "#b42f29" },
    buttonFocusColor: { type: String, trim: true, default: "#cf372f" },
    buttonTextColor: { type: String, trim: true, default: "#ffffff" },
    checkboxColor: { type: String, trim: true, default: "#cf372f" },
    radioColor: { type: String, trim: true, default: "#cf372f" },
    switchColor: { type: String, trim: true, default: "#cf372f" },
    requiredIndicatorColor: { type: String, trim: true, default: "#cf372f" },
    successMessageColor: { type: String, trim: true, default: "#126f15" },
    errorMessageColor: { type: String, trim: true, default: "#cf372f" },
  },
  { _id: false },
);

const formSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true, trim: true, immutable: true },
    name: { type: String, required: true, trim: true, default: "Untitled Form" },
    submitLabel: { type: String, required: true, trim: true, default: "Submit" },
    successMessage: {
      type: String,
      required: true,
      trim: true,
      default: "Thank you for your response.",
    },
    submissionSettings: { type: formSubmissionSettingsSchema, default: () => ({}) },
    styleSettings: { type: formStyleSettingsSchema, default: () => ({}) },
    status: { type: String, enum: FORM_STATUSES, default: "draft", index: true },
    shortcode: { type: String, required: true, unique: true, trim: true, immutable: true },
    shortcodeAlt: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      immutable: true,
      default: undefined,
    },
    formSchema: {
      sections: { type: [formSectionSchema], default: [] },
      questions: { type: [formQuestionSchema], default: [] },
    },
    schemaVersion: { type: Number, required: true, default: 1, min: 1 },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.Form) ||
  mongoose.model("Form", formSchema);
