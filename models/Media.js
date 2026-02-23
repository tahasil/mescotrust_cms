const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

mediaSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Media || mongoose.model("Media", mediaSchema);
