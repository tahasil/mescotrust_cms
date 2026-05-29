const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const formSubmissionSchema = new mongoose.Schema(
  {
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: { type: String, default: "", trim: true },
    page: { type: String, default: "", trim: true },
    ip: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "", trim: true },
    isRead: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { _id: true, id: false }
);

// TSUV→MESCO port (Phase 8). §2B/2C: tsuv brand colors (#00516f/#f7b733), the
// "helping startups grow" copy, and the Karnataka/Bangalore map embed are NOT
// ported — defaults below are neutral. Admins customize per-form in the editor.
const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    formKey: { type: String, required: true, trim: true, unique: true, index: true },
    shortcode: { type: String, required: true, trim: true },
    successMessage: { type: String, default: "Form submitted successfully.", trim: true },
    isActive: { type: Boolean, default: true },
    ui: {
      sectionBgGradient: { type: String, default: "" },
      cardBg: { type: String, default: "#ffffff" },
      cardBorderRadius: { type: Number, default: 16 },
      cardPadding: { type: Number, default: 24 },
      titleColor: { type: String, default: "#0b2130" },
      labelColor: { type: String, default: "#334155" },
      labelColorKey: { type: String, default: "" },
      inputBg: { type: String, default: "#ffffff" },
      inputBorderColor: { type: String, default: "#e5e7eb" },
      inputTextColor: { type: String, default: "#111827" },
      buttonBg: { type: String, default: "" },
      buttonBgColorKey: { type: String, default: "" },
      buttonTextColor: { type: String, default: "" },
      buttonTextColorKey: { type: String, default: "" },
      buttonHoverBg: { type: String, default: "" },
      buttonHoverBgColorKey: { type: String, default: "" },
      buttonHoverTextColor: { type: String, default: "" },
      buttonHoverTextColorKey: { type: String, default: "" },
      buttonRadius: { type: Number, default: 24 },
      leftContentHtml: {
        type: String,
        default:
          "<p>If you would like to get involved or collaborate with us, please register your interest here and we will get back to you.</p>",
      },
      leftContentColor: { type: String, default: "#1f2933" },
      leftContentColorKey: { type: String, default: "" },
      leftContentAlign: { type: String, default: "left" },
      leftContentFontSize: { type: Number, default: 16 },
      leftContentLineHeight: { type: Number, default: 1.6 },
      leftContentBottomSpacing: { type: Number, default: 16 },
      leftMapTopSpacing: { type: Number, default: 18 },
      mapEmbedUrl: { type: String, default: "" },
      mapHeightDesktop: { type: Number, default: 370 },
      mapHeightTablet: { type: Number, default: 300 },
      mapHeightMobile: { type: Number, default: 260 },
      mapBorderRadius: { type: Number, default: 4 },
      mapBorderColor: { type: String, default: "#edf0f3" },
      mapBorderColorKey: { type: String, default: "" },
    },
    submissions: { type: [formSubmissionSchema], default: [] },
    scaffold: {
      folderName: { type: String, default: "", trim: true },
      relativePath: { type: String, default: "", trim: true },
      generatedAt: { type: Date, default: null },
    },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "contactforms" }
);

formSchema.index({ createdAt: -1 });
formSchema.index({ "submissions.submittedAt": -1 });

formSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.Form) ||
  mongoose.model("Form", formSchema);
