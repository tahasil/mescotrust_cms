const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    openInNewTab: { type: Boolean, default: false },
  },
  { _id: true }
);

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    items: { type: [menuItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Menu || mongoose.model("Menu", menuSchema);
