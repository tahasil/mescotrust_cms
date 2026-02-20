import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    altText: String,
    folder: String,
    size: Number,
    width: Number,
    height: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Media = mongoose.models.Media ?? mongoose.model("Media", MediaSchema);
