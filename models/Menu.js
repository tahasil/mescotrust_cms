const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    openInNewTab: { type: Boolean, default: false },
    type: { type: String, enum: ["custom_link", "page"], default: "custom_link" },
    pageSlug: { type: String, trim: true, default: "" },
  },
  { _id: true }
);
menuItemSchema.add({ children: [menuItemSchema] });

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    items: { type: [menuItemSchema], default: [] },
    locale: { type: String, default: "en" },
  },
  { timestamps: true }
);

module.exports =
  (mongoose.models && mongoose.models.Menu) || mongoose.model("Menu", menuSchema);
