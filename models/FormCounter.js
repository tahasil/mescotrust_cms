const mongoose = require("mongoose");

const formCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.FormCounter) ||
  mongoose.model("FormCounter", formCounterSchema);
