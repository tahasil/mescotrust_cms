const mongoose = require("mongoose");

const googleFontSchema = new mongoose.Schema(
  {
    family: { type: String, required: true },
    weights: [{ type: String }],
  },
  { _id: false }
);

const themeConfigSchema = new mongoose.Schema(
  {
    fontFamily: { type: String, default: "system-ui, sans-serif" },
    fontSize: { type: Number, default: 16 },
    headingFontFamily: { type: String, default: "" },
    headingFontSize: { type: Number, default: 0 },
    lineHeight: { type: Number, default: 1.6 },
    letterSpacing: { type: Number, default: 0 },
    fontWeight: { type: Number, default: 400 },
    headingFontWeight: { type: Number, default: 700 },
    primaryColor: { type: String, default: "#1890ff" },
    secondaryColor: { type: String, default: "#722ed1" },
    backgroundColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#333333" },
    linkColor: { type: String, default: "" },
    layoutWidth: { type: Number, default: 1200 },
    defaultLocale: { type: String, default: "en" },
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
    googleFonts: { type: [googleFontSchema], default: [] },
    customFontUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ThemeConfig || mongoose.model("ThemeConfig", themeConfigSchema);
