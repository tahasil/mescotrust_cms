const mongoose = require("mongoose");

const popupSchema = new mongoose.Schema(
  {
    componentId: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, default: "" },
    defaultProps: { type: mongoose.Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "popups" },
);

popupSchema.index({ status: 1, enabled: 1, updatedAt: -1 });
popupSchema.index({ displayName: 1 });

module.exports =
  (mongoose.models && mongoose.models.Popup) ||
  mongoose.model("Popup", popupSchema);
