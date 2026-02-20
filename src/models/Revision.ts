import mongoose from "mongoose";

const RevisionSchema = new mongoose.Schema(
  {
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true },
    contentJSON: { type: String, required: true },
    version: { type: Number, required: true },
    createdBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export const Revision = mongoose.models.Revision ?? mongoose.model("Revision", RevisionSchema);
