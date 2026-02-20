import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema(
  {
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    label: { type: String, required: true },
    url: { type: String, required: true },
    openInNewTab: { type: Boolean, default: false },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    order: { type: Number, default: 0 },
    type: { type: String, default: "normal" },
  },
  { timestamps: true }
);

export const MenuItem = mongoose.models.MenuItem ?? mongoose.model("MenuItem", MenuItemSchema);
