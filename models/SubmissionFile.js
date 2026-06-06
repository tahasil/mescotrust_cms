const mongoose = require("mongoose");

const submissionFileSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, trim: true, index: true },
    submissionId: { type: String, default: "", trim: true },
    fieldKey: { type: String, required: true, trim: true, index: true },
    filename: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    storagePath: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "linked", "deleted"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

submissionFileSchema.index({ submissionId: 1 });
submissionFileSchema.index({ status: 1, createdAt: 1 });

module.exports =
  (mongoose.models && mongoose.models.SubmissionFile) ||
  mongoose.model("SubmissionFile", submissionFileSchema);
