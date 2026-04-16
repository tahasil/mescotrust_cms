const mongoose = require("mongoose");

const mediaWidthsSchema = new mongoose.Schema(
  {
    thumbnail: { type: Number, default: 240 },
    medium: { type: Number, default: 640 },
    large: { type: Number, default: 1280 },
    mobile: { type: Number, default: 768 },
    desktop: { type: Number, default: 1440 },
  },
  { _id: false },
);

const mediaSettingsSchema = new mongoose.Schema(
  {
    settingsKey: { type: String, default: "default", unique: true },
    compressionMode: {
      type: String,
      enum: ["lossless", "glossy", "lossy"],
      default: "glossy",
    },
    quality: { type: Number, default: 75 },
    enableWebP: { type: Boolean, default: true },
    enableAVIF: { type: Boolean, default: true },
    enableLazyLoad: { type: Boolean, default: true },
    cropMode: {
      type: String,
      enum: ["none", "cover", "contain"],
      default: "none",
    },
    widths: { type: mediaWidthsSchema, default: () => ({}) },
    avifEffort: { type: Number, default: 4 },
    webpEffort: { type: Number, default: 4 },
    maxUploadMB: { type: Number, default: 20 },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.MediaSettings) ||
  mongoose.model("MediaSettings", mediaSettingsSchema);
