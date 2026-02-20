const mongoose = require("mongoose");

const themeConfigSchema = new mongoose.Schema(
  {
    fontFamily: { type: String, default: "system-ui, sans-serif" },
    primaryColor: { type: String, default: "#1890ff" },
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ThemeConfig || mongoose.model("ThemeConfig", themeConfigSchema);
