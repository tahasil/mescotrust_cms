import mongoose from "mongoose";

const MenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, default: "normal" },
  },
  { timestamps: true }
);

export const Menu = mongoose.models.Menu ?? mongoose.model("Menu", MenuSchema);
