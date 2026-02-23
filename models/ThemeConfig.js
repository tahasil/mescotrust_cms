const mongoose = require("mongoose");

const googleFontSchema = new mongoose.Schema(
  { family: { type: String, required: true }, weights: [{ type: String }] },
  { _id: false }
);

const themeColorSchema = new mongoose.Schema(
  { name: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const themeConfigSchema = new mongoose.Schema(
  {
    /* Site identity */
    siteTitle: { type: String, default: "Mesco Trust" },
    logoType: { type: String, enum: ["text", "image"], default: "text" },
    logoImageUrl: { type: String, default: "" },
    /* Theme colors: add title + value (hex, rgb, rgba, or gradient). No defaults. */
    colors: { type: [themeColorSchema], default: [] },
    /* Typography */
    fontFamily: { type: String, default: "system-ui, sans-serif" },
    fontSize: { type: Number, default: 16 },
    headingFontFamily: { type: String, default: "" },
    headingFontSize: { type: Number, default: 0 },
    lineHeight: { type: Number, default: 1.6 },
    letterSpacing: { type: Number, default: 0 },
    fontWeight: { type: Number, default: 400 },
    headingFontWeight: { type: Number, default: 700 },
    googleFonts: { type: [googleFontSchema], default: [] },
    customFontUrl: { type: String, default: "" },
    /* Layout & locale */
    layoutWidth: { type: Number, default: 1200 },
    defaultLocale: { type: String, default: "en" },
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ThemeConfig || mongoose.model("ThemeConfig", themeConfigSchema);
