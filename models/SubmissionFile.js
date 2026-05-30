const mongoose = require("mongoose");

const submissionFileSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, trim: true, index: true },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormSubmission",
      default: null,
      index: true,
    },
    fieldKey: { type: String, required: true, trim: true, index: true },
    uploadToken: { type: String, required: true, trim: true, unique: true, index: true },
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, default: "", trim: true },
    size: { type: Number, default: 0 },
    storagePath: { type: String, required: true, trim: true },
    publicUrl: { type: String, default: "", trim: true },
    isLinked: { type: Boolean, default: false, index: true },
    linkedAt: { type: Date, default: null },
    uploadedByIp: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

submissionFileSchema.index({ formId: 1, fieldKey: 1, createdAt: -1 });
submissionFileSchema.index({ submissionId: 1, fieldKey: 1 });

module.exports =
  (mongoose.models && mongoose.models.SubmissionFile) ||
  mongoose.model("SubmissionFile", submissionFileSchema);

