const mongoose = require("mongoose");

const pdfSearchIndexSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true, trim: true },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    filename: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true },
    year: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["annual-report", "newsletter", "notice", "general"],
      default: "general",
      index: true,
    },
    pageCount: { type: Number, default: 0 },
    extractedText: { type: String, default: "" },
    status: {
      type: String,
      enum: ["ready", "no_text", "failed", "pending"],
      default: "pending",
      index: true,
    },
    fileSize: { type: Number, default: 0 },
    sourcePageSlug: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    lastIndexedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pdfSearchIndexSchema.index({ category: 1, status: 1 });
pdfSearchIndexSchema.index({ title: "text", extractedText: "text" });

module.exports =
  (mongoose.models && mongoose.models.PdfSearchIndex) ||
  mongoose.model("PdfSearchIndex", pdfSearchIndexSchema);
