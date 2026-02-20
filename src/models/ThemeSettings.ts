import mongoose from "mongoose";

const ThemeSettingsSchema = new mongoose.Schema(
  {
    primaryColor: String,
    secondaryColor: String,
    headingFont: String,
    bodyFont: String,
    borderRadius: String,
  },
  { timestamps: true }
);

export const ThemeSettings = mongoose.models.ThemeSettings ?? mongoose.model("ThemeSettings", ThemeSettingsSchema);
