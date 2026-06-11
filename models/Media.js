const mongoose = require("mongoose");

const mediaVariantSchema = new mongoose.Schema(
  {
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    size: { type: Number, default: 0 },
    jpgUrl: { type: String, default: "" },
    webpUrl: { type: String, default: "" },
    avifUrl: { type: String, default: "" },
  },
  { _id: false },
);

const mediaUsageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["blog", "event", "page", "slider", "component", "other"],
      default: "other",
    },
    refId: { type: String, default: "" },
    field: { type: String, default: "" },
    label: { type: String, default: "" },
  },
  { _id: false },
);

const mediaSchema = new mongoose.Schema(
  {
    // Backward-compatible legacy fields
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    uploadedBy: { type: String, default: "" },

    // New media optimization fields
    title: { type: String, default: "" },
    caption: { type: String, default: "" },
    description: { type: String, default: "" },
    altText: { type: String, default: "" },
    fileName: { type: String, default: "" },
    ext: { type: String, default: "" },
    storageProvider: { type: String, default: "local" },
    storageKey: { type: String, default: "" },
    publicUrl: { type: String, default: "" },
    originalUrl: { type: String, default: "" },
    webpUrl: { type: String, default: "" },
    avifUrl: { type: String, default: "" },
    originalSize: { type: Number, default: 0 },
    optimizedSize: { type: Number, default: 0 },
    savingsPercentage: { type: Number, default: 0 },
    hash: { type: String, default: "" },
    status: {
      type: String,
      enum: ["ready", "processing", "failed"],
      default: "ready",
    },
    errorMessage: { type: String, default: "" },
    generatedSizes: {
      original: { type: mediaVariantSchema, default: () => ({}) },
      thumbnail: { type: mediaVariantSchema, default: () => ({}) },
      medium: { type: mediaVariantSchema, default: () => ({}) },
      large: { type: mediaVariantSchema, default: () => ({}) },
      mobile: { type: mediaVariantSchema, default: () => ({}) },
      desktop: { type: mediaVariantSchema, default: () => ({}) },
    },
    usedIn: { type: [mediaUsageSchema], default: [] },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

mediaSchema.pre("validate", function syncLegacyAndNew(next) {
  if (!this.fileName && this.filename) this.fileName = this.filename;
  if (!this.filename && this.fileName) this.filename = this.fileName;

  if (!this.altText && this.alt) this.altText = this.alt;
  if (!this.alt && this.altText) this.alt = this.altText;

  if (!this.originalUrl && this.url) this.originalUrl = this.url;
  if (!this.url && this.originalUrl) this.url = this.originalUrl;

  if (!this.originalSize && this.size) this.originalSize = this.size;
  if (!this.size && this.originalSize) this.size = this.originalSize;

  if (!this.title) this.title = this.originalName || this.fileName || "";
  next();
});

mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ status: 1 });
mediaSchema.index({ "usedIn.refId": 1, "usedIn.type": 1 });
mediaSchema.index({ title: "text", fileName: "text", altText: "text" });

module.exports =
  (mongoose.models && mongoose.models.Media) || mongoose.model("Media", mediaSchema);
