const mongoose = require("mongoose");

const appearanceSchema = new mongoose.Schema(
  {
    moduleKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: { type: String, required: true, trim: true },
    template: { type: String, default: "appearance-default", trim: true },
    defaultProps: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    layout: { type: mongoose.Schema.Types.Mixed, default: () => [] },
    active: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "appearance" },
);

module.exports =
  (mongoose.models && mongoose.models.Appearance) ||
  mongoose.model("Appearance", appearanceSchema);
