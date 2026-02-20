import mongoose from "mongoose";

const PageContentSchema = new mongoose.Schema(
  {
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, unique: true },
    contentJSON: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const PageContent = mongoose.models.PageContent ?? mongoose.model("PageContent", PageContentSchema);
