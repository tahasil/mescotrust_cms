import mongoose from "mongoose";

const RedirectSchema = new mongoose.Schema(
  {
    fromPath: { type: String, required: true },
    toPath: { type: String, required: true },
    statusCode: { type: Number, default: 301 },
  },
  { timestamps: true }
);

export const Redirect = mongoose.models.Redirect ?? mongoose.model("Redirect", RedirectSchema);
