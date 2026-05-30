const mongoose = require("mongoose");

const formConfigurationSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true, trim: true },
    submitText: { type: String, default: "Submit", trim: true },
    successMessage: {
      type: String,
      default: "Thanks! Your submission has been received.",
      trim: true,
    },
    behaviorFlags: { type: mongoose.Schema.Types.Mixed, default: {} },
    allowArchivedRender: { type: Boolean, default: false },
    schemaVersion: { type: Number, default: 1, min: 1 },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.FormConfiguration) ||
  mongoose.model("FormConfiguration", formConfigurationSchema);
