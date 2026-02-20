import mongoose from "mongoose";

const SiteSettingsSchema = new mongoose.Schema(
  {
    headerLogoUrl: String,
    headerMenuId: mongoose.Schema.Types.ObjectId,
    headerTagline: String,
    headerSticky: { type: Boolean, default: true },
    footerCopyright: String,
    footerMenuId: mongoose.Schema.Types.ObjectId,
    custom404PageId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.models.SiteSettings ?? mongoose.model("SiteSettings", SiteSettingsSchema);
