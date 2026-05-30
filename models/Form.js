const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true, trim: true, immutable: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    shortcode: { type: String, required: true, trim: true, immutable: true },
    shortcodeAlt: { type: String, required: true, trim: true, immutable: true },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

formSchema.index({ status: 1, createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.Form) || mongoose.model("Form", formSchema);
