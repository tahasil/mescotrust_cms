const mongoose = require("mongoose");

const mediaJobErrorSchema = new mongoose.Schema(
  {
    mediaId: { type: String, default: "" },
    reason: { type: String, default: "" },
  },
  { _id: false },
);

const mediaJobSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      enum: ["bulk_optimize", "regenerate_sizes", "convert_formats"],
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
    },
    total: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errors: { type: [mediaJobErrorSchema], default: [] },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

mediaJobSchema.index({ createdAt: -1 });
mediaJobSchema.index({ status: 1, jobType: 1 });

module.exports =
  (mongoose.models && mongoose.models.MediaJob) ||
  mongoose.model("MediaJob", mediaJobSchema);
