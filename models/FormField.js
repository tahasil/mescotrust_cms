const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, trim: true, index: true },
    fieldKey: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    order: { type: Number, default: 0, index: true },
    ui: { type: mongoose.Schema.Types.Mixed, default: {} },
    validation: { type: mongoose.Schema.Types.Mixed, default: {} },
    flags: {
      required: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false },
    },
    required: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    options: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);

formFieldSchema.index({ formId: 1, fieldKey: 1 }, { unique: true });
formFieldSchema.index({ formId: 1, name: 1 });
formFieldSchema.index({ formId: 1, order: 1 });

module.exports =
  (mongoose.models && mongoose.models.FormField) ||
  mongoose.model("FormField", formFieldSchema);

